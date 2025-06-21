# 📚 AskDocs

## 🧠 Overview  
**AskDocs** transforms how users interact with their documents by enabling conversational, AI-powered querying through an intuitive chat interface. Users can upload documents and receive accurate, context-based answers powered by Retrieval-Augmented Generation (RAG) techniques combining vector search and natural language generation. The platform leverages AWS services to ensure scalable, secure, and low-latency performance.

---

## ✨ Features  
- **Conversational Document Q&A** — Ask questions in natural language and receive contextual answers  
- **Semantic Search** — Retrieve relevant document sections using vector-based similarity search  
- **Secure File Upload** — Supports uploading and processing of various document types  
- **Persistent Chat History** — View and continue past interactions with documents  

---

## 🙋‍♂️ User Story  
**As a** user with large or complex documents,  
**I want** to ask natural language questions and quickly find relevant answers,  
**So that** I can save time and improve understanding without reading the full document.

---

## 🗺️ Architecture Diagram  

![image](https://github.com/user-attachments/assets/78930b08-e42d-45c1-8a7e-49ffaa791d7e)


---

## 🏗️ Architecture Overview

### 🔐 1. Network & Security  
- **Amazon VPC** (private + public subnets): Isolated network for secure service communication  
- **Application Load Balancer**: Routes traffic to React frontend hosted on EC2  
- **AWS Secrets Manager**: Manages API keys and secure credentials  

### ⚙️ 2. Compute & Scaling  
- **EC2 Auto Scaling Group** — Hosts the React-based chat UI with Nginx (Dockerized)  
- **AWS Lambda (x3)** — Serverless functions for:  
  1. Document upload and processing  
  2. Query embedding generation and vector search  
  3. Response generation and chat history management  

### 💾 3. Storage & Database  
- **Amazon S3** — Secure storage for uploaded documents  
- **Amazon DynamoDB** — Stores user chat history and query metadata  

### 🔗 4. API Layer  
- **Amazon API Gateway (REST)** — Authenticated API layer for frontend-backend communication  
- **Amazon Cognito** — User authentication with JWT tokens and MFA  

### 🤖 5. AI/ML Services  
- **Amazon SageMaker** — Hosts:  
  - **Sentence-BERT** for generating embeddings  
  - **T5-small** for natural language response generation  
- **Amazon OpenSearch (k-NN Vector Index)** — Provides fast, semantic vector search over document content  

### 📈 6. Monitoring & Alerts  
- **AWS CloudWatch** — Centralized logging, performance metrics, and error tracking  
- **VPC Endpoints** — Secure private access to DynamoDB and S3

---

## 🔄 Workflow

1. **Document Upload**  
   Users upload documents (PDF, DOCX, etc.) through the web UI. Lambda functions process the content and generate embeddings.

2. **Document Indexing**  
   Embeddings are stored in **OpenSearch Vector DB**, enabling fast semantic retrieval.

3. **Conversational Querying**  
   Users ask questions through the chat UI. Lambda functions retrieve relevant document sections using k-NN search and generate contextual responses.

4. **Chat History**  
   All interactions and responses are stored in **DynamoDB**, allowing users to revisit previous conversations.

---

## 🚀 Future Enhancements  
- **Multi-Document Querying** — Cross-document context and comparison  
- **Advanced Analytics** — Visualize document insights and trends  
- **Multi-Language Support** — Enable non-English document querying  
