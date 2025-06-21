import boto3
import json
from botocore.exceptions import ClientError
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

# OpenSearch domain configuration
OPENSEARCH_DOMAIN = 'vpc-study-assistant-opensearch-by3zxpc2hy3dstazokqvb2qv3q.us-east-1.es.amazonaws.com'
EMBEDDING_ENDPOINT = 'StudyAssistantEmbeddingEndpoint'

# Configure IAM authentication for OpenSearch
region = boto3.Session().region_name
service = 'es'
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)

# Initialize OpenSearch client
client = OpenSearch(
    hosts=[{'host': OPENSEARCH_DOMAIN, 'port': 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

# Initialize SageMaker client
sagemaker_client = boto3.client('sagemaker-runtime')
T5_ENDPOINT = 'StudyAssistantSageMakerEndpoint-JJpEJKvvEV0c'  # Replace with your T5 SageMaker endpoint name

def generate_embeddings(text):
    print(f"sagemaker_client: {sagemaker_client}")
    if not sagemaker_client:
        return [0.1] * 384  # Dummy embedding if endpoint not set
    response = sagemaker_client.invoke_endpoint(
        EndpointName=EMBEDDING_ENDPOINT,
        ContentType='application/json',
        Body=json.dumps({'inputs': text})
    )
    result = json.loads(response['Body'].read().decode())
    return result[0][0]  # Adjust based on model output

def generate_response(query_text, context):
    """
    Generate a response using the T5 model via SageMaker.
    """
    prompt = f"query: {query_text} context: {context}"
    response = sagemaker_client.invoke_endpoint(
        EndpointName=T5_ENDPOINT,
        ContentType='application/json',
        Body=json.dumps({"inputs": prompt})
    )
    result = json.loads(response['Body'].read().decode())
    return result['generated_text']  # Adjust based on T5 output format

def lambda_handler(event, context):
    try:
        # Extract user ID from API Gateway authorizer claims
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        user_id = claims.get('sub', 'unknown_user')
        print(f"event: {event}")

        # Parse request body
        body = event.get('body', {})
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Invalid JSON in request body'})
                }
        print(f"body: {body}")
        query_text = body.get('query')
        if not query_text:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing query parameter'})}

        # Generate embedding for the query text (for k-NN search)
        query_embedding = generate_embeddings(query_text)
        print(f"Query embedding: {query_embedding[:10]}...")  # Log first 10 elements of embedding
        # Build OpenSearch query
        search_query = {
            "size": 3,  # Retrieve top 3 relevant chunks
            "query": {
                "bool": {
                    "must": [
                        {
                            "knn": {
                                "embedding": {
                                    "vector": query_embedding,
                                    "k": 3
                                }
                            }
                        },
                        {
                            "match": {
                                "content": query_text
                            }
                        }
                    ],
                    "filter": [
                        {
                            "term": {
                                "user_id": user_id
                            }
                        }
                    ]
                }
            }
        }

        # Execute the search
        print(f"Executing search query: {json.dumps(search_query)}")
        response = client.search(
            index='study-assistant-index',
            body=search_query
        )

        # Process the results
        hits = response['hits']['hits']
        if not hits:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'No relevant documents found'})
            }

        # Concatenate retrieved content as context
        retrieved_context = " ".join([hit['_source']['content'] for hit in hits])
        print(f"Retrieved context: {retrieved_context[:200]}...")  # Log first 200 chars

        # Generate response using T5 model
        generated_response = generate_response(query_text, retrieved_context)
        print(f"Generated response: {generated_response}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Query processed with RAG',
                'query': query_text,
                'response': generated_response,
                'context_length': len(retrieved_context)
            })
        }

    except ClientError as e:
        return {'statusCode': 500, 'body': json.dumps({'error': f'OpenSearch error: {str(e)}'})}
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}