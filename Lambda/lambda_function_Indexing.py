import boto3
import json
import os
from botocore.exceptions import ClientError
from PyPDF2 import PdfReader
from opensearchpy import OpenSearch, RequestsHttpConnection
from urllib.parse import urlparse
from urllib.parse import urlparse, unquote
import io
from requests_aws4auth import AWS4Auth

# OPENSEARCH_DOMAIN = os.environ['OPENSEARCH_DOMAIN']
OPENSEARCH_DOMAIN = 'vpc-study-assistant-opensearch-by3zxpc2hy3dstazokqvb2qv3q.us-east-1.es.amazonaws.com'
# EMBEDDING_ENDPOINT = os.environ.get('EMBEDDING_ENDPOINT')  # If using embedding model
EMBEDDING_ENDPOINT = 'StudyAssistantEmbeddingEndpoint'

region = boto3.Session().region_name
service = 'es'
credentials = boto3.Session().get_credentials()
awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, region, service, session_token=credentials.token)
print(f"awsauth: {awsauth}")
print(f"credentials: {credentials}")
s3_client = boto3.client('s3')
sagemaker_client = boto3.client('sagemaker-runtime') if EMBEDDING_ENDPOINT else None
client = OpenSearch(
    hosts=[{'host': OPENSEARCH_DOMAIN, 'port': 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection
)

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

def extract_bucket_and_key(presigned_url):
    parsed_url = urlparse(presigned_url)
    # Check if it's a virtual-hosted-style URL (bucket in hostname)
    if parsed_url.hostname.endswith('.s3.us-east-1.amazonaws.com'):
        bucket_name = parsed_url.hostname.split('.s3.us-east-1.amazonaws.com')[0]
        key = unquote(parsed_url.path.lstrip('/'))  # Decode the key
    else:
        # Fallback for path-style URL (bucket in path)
        path = parsed_url.path.lstrip('/')
        bucket_name = path.split('/')[0]
        key = unquote('/'.join(path.split('/')[1:]))  # Decode the key
    return bucket_name, key

def chunk_text(text, chunk_size=500, overlap=50):
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start = end - overlap if end < len(text) else end
    return chunks

def lambda_handler(event, context):
    try:
        # Extract user ID from API Gateway authorizer claims
        claims = event.get('requestContext', {}).get('authorizer', {}).get('claims', {})
        user_id = claims.get('sub', 'unknown_user')  # 'sub' is the user ID
        print(f"event: {event}")
        # body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event
        body = event.get('body', {})
        print(f"body: {body}")
        
        if isinstance(body, str):
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Invalid JSON in request body'})
                }
        
        presigned_url = body.get('presigned_url')

        if not presigned_url:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing presigned URL'})}

        bucket_name, key = extract_bucket_and_key(presigned_url)

        print(f"bucket_name: {bucket_name}")
        print(f"key: {key}")
       
        pdf_response = s3_client.get_object(Bucket=bucket_name, Key=key)
        pdf_file = pdf_response['Body'].read()  # This is a bytes object
        pdf_file_stream = io.BytesIO(pdf_file)  # Wrap in BytesIO to make it file-like

        pdf_reader = PdfReader(pdf_file_stream)  # Pass the file-like object
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() or ""

        # print(f"text: {text}")

        if not text:
            return {'statusCode': 400, 'body': json.dumps({'error': 'No text extracted from PDF'})}

        chunks = chunk_text(text)
        print(f"Created {len(chunks)} chunks")

        # Create index if it doesn't exist
        if not client.indices.exists(index='study-assistant-index-knn'):
            client.indices.create(
                index='study-assistant-index',
                body={
                    "settings": {"index": {"number_of_shards": 1, "number_of_replicas": 1, "knn": true}},
                    "mappings": {
                        "properties": {
                            "content": {"type": "text"},
                            "embedding": {
                                "type": "knn_vector",
                                "dimension": 384,
                                "method": {
                                    "name": "hnsw",
                                    "space_type": "l2",
                                    "engine": "nmslib"
                                }
                            },
                            "chunk_id": {"type": "integer"},
                            "user_id": {"type": "keyword"}
                        }
                    }
                }
            )
        print("Created index study-assistant-index")

        for i, chunk in enumerate(chunks):
            embedding = generate_embeddings(chunk)
            document = {'content': chunk, 'embedding': embedding, 'chunk_id': i, 'user_id': user_id}
            print(f"Indexing chunk {document}...")
            client.index(index='study-assistant-index-knn', body=document, refresh=True)

        return {'statusCode': 200, 'body': json.dumps({'message': f'Indexed {len(chunks)} chunks', 'chunks': len(chunks)})}

    except ClientError as e:
        return {'statusCode': 500, 'body': json.dumps({'error': f'S3 error: {str(e)}'})}
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}