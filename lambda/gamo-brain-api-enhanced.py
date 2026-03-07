import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key
import requests
from typing import List, Dict, Any

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table_name = os.environ.get('TABLE_NAME', 'gamo-brain')
table = dynamodb.Table(table_name)

# API keys from environment
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
PINECONE_ENVIRONMENT = os.environ.get('PINECONE_ENVIRONMENT', 'us-east-1')
PINECONE_INDEX = os.environ.get('PINECONE_INDEX', 'gamo-brain')

# Helper to convert Decimal to native Python types for JSON serialization
def decimal_to_native(obj):
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
}

def lambda_handler(event, context):
    """Main Lambda handler with routing"""
    # Handle preflight OPTIONS request
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if not action:
            return error_response('Missing action field', 400)
        
        # Route to appropriate handler
        handlers = {
            # Existing endpoints
            'save_profile': lambda: save_profile(body),
            'get_profile': get_profile,
            'save_chat': lambda: save_chat(body),
            'get_chat': get_chat,
            'clear_chat': clear_chat,
            
            # New document endpoints
            'save_document': lambda: save_document(body),
            'get_document': lambda: get_document(body),
            'list_documents': list_documents,
            'get_documents': get_documents,
            
            # New embedding endpoints
            'save_embedding': lambda: save_embedding(body),
            'get_embeddings': get_embeddings,
            'search_memories': lambda: search_memories(body),
        }
        
        handler = handlers.get(action)
        if not handler:
            return error_response(f'Unknown action: {action}', 400)
        
        return handler()
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return error_response(str(e), 500)

def error_response(message: str, status_code: int = 500):
    """Helper to return error response"""
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps({'error': message})
    }

def success_response(data: Dict[str, Any], status_code: int = 200):
    """Helper to return success response"""
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps(data)
    }

# ============================================================================
# EXISTING ENDPOINTS (unchanged)
# ============================================================================

def save_profile(body):
    """Save profile data to DynamoDB"""
    try:
        profile_data = body.get('profile')
        if not profile_data:
            return error_response('Missing profile data', 400)
        
        table.put_item(
            Item={
                'pk': 'profile',
                'sk': 'data',
                'profile': profile_data,
                'updated_at': datetime.utcnow().isoformat()
            }
        )
        
        return success_response({
            'success': True,
            'message': 'Profile saved successfully'
        })
    
    except Exception as e:
        print(f"Error saving profile: {str(e)}")
        return error_response(f'Failed to save profile: {str(e)}')

def get_profile():
    """Retrieve profile data from DynamoDB"""
    try:
        response = table.get_item(
            Key={'pk': 'profile', 'sk': 'data'}
        )
        
        if 'Item' not in response:
            return success_response({
                'profile': None,
                'message': 'No profile found'
            })
        
        profile = decimal_to_native(response['Item'].get('profile', {}))
        
        return success_response({'profile': profile})
    
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        return error_response(f'Failed to get profile: {str(e)}')

def save_chat(body):
    """Save a chat message to DynamoDB"""
    try:
        role = body.get('role')
        content = body.get('content')
        timestamp = body.get('timestamp')
        
        if not all([role, content, timestamp]):
            return error_response('Missing required fields: role, content, timestamp', 400)
        
        table.put_item(
            Item={
                'pk': 'chat',
                'sk': str(timestamp),
                'role': role,
                'content': content,
                'timestamp': timestamp
            }
        )
        
        return success_response({
            'success': True,
            'message': 'Chat message saved successfully'
        })
    
    except Exception as e:
        print(f"Error saving chat: {str(e)}")
        return error_response(f'Failed to save chat: {str(e)}')

def get_chat():
    """Retrieve last 50 chat messages from DynamoDB"""
    try:
        response = table.query(
            KeyConditionExpression=Key('pk').eq('chat'),
            ScanIndexForward=False,
            Limit=50
        )
        
        messages = response.get('Items', [])
        messages = [decimal_to_native(msg) for msg in messages]
        messages.reverse()
        
        chat_messages = [
            {
                'role': msg.get('role'),
                'content': msg.get('content'),
                'timestamp': msg.get('timestamp')
            }
            for msg in messages
        ]
        
        return success_response({
            'messages': chat_messages,
            'count': len(chat_messages)
        })
    
    except Exception as e:
        print(f"Error getting chat: {str(e)}")
        return error_response(f'Failed to get chat: {str(e)}')

def clear_chat():
    """Delete all chat history from DynamoDB"""
    try:
        response = table.query(
            KeyConditionExpression=Key('pk').eq('chat')
        )
        
        messages = response.get('Items', [])
        
        with table.batch_writer() as batch:
            for msg in messages:
                batch.delete_item(
                    Key={'pk': msg['pk'], 'sk': msg['sk']}
                )
        
        return success_response({
            'success': True,
            'message': f'Deleted {len(messages)} chat messages'
        })
    
    except Exception as e:
        print(f"Error clearing chat: {str(e)}")
        return error_response(f'Failed to clear chat: {str(e)}')

# ============================================================================
# NEW DOCUMENT ENDPOINTS
# ============================================================================

def save_document(body):
    """Save a document to DynamoDB and generate embeddings"""
    try:
        content = body.get('content')
        doc_type = body.get('type', 'upload')
        metadata = body.get('metadata', {})
        
        if not content:
            return error_response('Missing content', 400)
        
        # Generate document ID
        timestamp = datetime.utcnow().isoformat()
        document_id = f"{timestamp}_{doc_type}"
        
        # Save document to DynamoDB
        table.put_item(
            Item={
                'pk': 'document',
                'sk': document_id,
                'documentId': document_id,
                'type': doc_type,
                'content': content,
                'contentLength': len(content),
                'timestamp': timestamp,
                'metadata': metadata
            }
        )
        
        # Generate and store embeddings (async in production)
        try:
            chunks = chunk_text(content)
            embedding_ids = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{document_id}_chunk_{i}"
                embedding = generate_embedding(chunk)
                
                # Save to DynamoDB
                table.put_item(
                    Item={
                        'pk': 'embedding',
                        'sk': chunk_id,
                        'chunkId': chunk_id,
                        'documentId': document_id,
                        'text': chunk,
                        'embedding': embedding,
                        'category': metadata.get('category', 'general'),
                        'timestamp': timestamp
                    }
                )
                
                # Also save to Pinecone if configured
                if PINECONE_API_KEY:
                    upsert_to_pinecone(chunk_id, embedding, {
                        'text': chunk,
                        'documentId': document_id,
                        'category': metadata.get('category', 'general')
                    })
                
                embedding_ids.append(chunk_id)
            
            return success_response({
                'success': True,
                'documentId': document_id,
                'chunks': len(chunks),
                'embeddingIds': embedding_ids
            })
        
        except Exception as embed_error:
            # Document saved but embeddings failed
            print(f"Embedding error: {str(embed_error)}")
            return success_response({
                'success': True,
                'documentId': document_id,
                'warning': 'Document saved but embeddings failed',
                'error': str(embed_error)
            })
    
    except Exception as e:
        print(f"Error saving document: {str(e)}")
        return error_response(f'Failed to save document: {str(e)}')

def get_document(body):
    """Retrieve a specific document by ID"""
    try:
        document_id = body.get('documentId')
        if not document_id:
            return error_response('Missing documentId', 400)
        
        response = table.get_item(
            Key={'pk': 'document', 'sk': document_id}
        )
        
        if 'Item' not in response:
            return error_response('Document not found', 404)
        
        document = decimal_to_native(response['Item'])
        
        return success_response({'document': document})
    
    except Exception as e:
        print(f"Error getting document: {str(e)}")
        return error_response(f'Failed to get document: {str(e)}')

def list_documents():
    """List all documents (metadata only)"""
    try:
        response = table.query(
            KeyConditionExpression=Key('pk').eq('document'),
            ProjectionExpression='documentId, #t, contentLength, #ts, metadata',
            ExpressionAttributeNames={'#t': 'type', '#ts': 'timestamp'}
        )
        
        documents = response.get('Items', [])
        documents = [decimal_to_native(doc) for doc in documents]
        
        return success_response({
            'documents': documents,
            'count': len(documents)
        })
    
    except Exception as e:
        print(f"Error listing documents: {str(e)}")
        return error_response(f'Failed to list documents: {str(e)}')

def get_documents():
    """Get all documents with full content"""
    try:
        response = table.query(
            KeyConditionExpression=Key('pk').eq('document')
        )
        
        documents = response.get('Items', [])
        documents = [decimal_to_native(doc) for doc in documents]
        
        return success_response({
            'documents': documents,
            'count': len(documents)
        })
    
    except Exception as e:
        print(f"Error getting documents: {str(e)}")
        return error_response(f'Failed to get documents: {str(e)}')

# ============================================================================
# NEW EMBEDDING ENDPOINTS
# ============================================================================

def save_embedding(body):
    """Manually save an embedding (for restore/import)"""
    try:
        embedding_data = body.get('embedding')
        if not embedding_data:
            return error_response('Missing embedding data', 400)
        
        chunk_id = embedding_data.get('chunkId')
        if not chunk_id:
            return error_response('Missing chunkId', 400)
        
        table.put_item(Item={
            'pk': 'embedding',
            'sk': chunk_id,
            **embedding_data
        })
        
        # Also save to Pinecone if configured
        if PINECONE_API_KEY and 'embedding' in embedding_data:
            upsert_to_pinecone(
                chunk_id,
                embedding_data['embedding'],
                {
                    'text': embedding_data.get('text', ''),
                    'documentId': embedding_data.get('documentId', ''),
                    'category': embedding_data.get('category', 'general')
                }
            )
        
        return success_response({
            'success': True,
            'message': 'Embedding saved successfully'
        })
    
    except Exception as e:
        print(f"Error saving embedding: {str(e)}")
        return error_response(f'Failed to save embedding: {str(e)}')

def get_embeddings():
    """Get all embeddings"""
    try:
        response = table.query(
            KeyConditionExpression=Key('pk').eq('embedding')
        )
        
        embeddings = response.get('Items', [])
        embeddings = [decimal_to_native(emb) for emb in embeddings]
        
        return success_response({
            'embeddings': embeddings,
            'count': len(embeddings)
        })
    
    except Exception as e:
        print(f"Error getting embeddings: {str(e)}")
        return error_response(f'Failed to get embeddings: {str(e)}')

def search_memories(body):
    """Semantic search using embeddings"""
    try:
        query = body.get('query')
        top_k = body.get('topK', 5)
        
        if not query:
            return error_response('Missing query', 400)
        
        # Generate embedding for query
        query_embedding = generate_embedding(query)
        
        # Search in Pinecone if available
        if PINECONE_API_KEY:
            results = query_pinecone(query_embedding, top_k)
            return success_response({
                'results': results,
                'count': len(results)
            })
        
        # Fallback: search in DynamoDB (less efficient)
        response = table.query(
            KeyConditionExpression=Key('pk').eq('embedding')
        )
        
        embeddings = response.get('Items', [])
        embeddings = [decimal_to_native(emb) for emb in embeddings]
        
        # Calculate cosine similarity
        results = []
        for emb in embeddings:
            similarity = cosine_similarity(query_embedding, emb.get('embedding', []))
            results.append({
                'text': emb.get('text', ''),
                'similarity': similarity,
                'category': emb.get('category', ''),
                'documentId': emb.get('documentId', '')
            })
        
        # Sort by similarity and return top K
        results.sort(key=lambda x: x['similarity'], reverse=True)
        results = results[:top_k]
        
        return success_response({
            'results': results,
            'count': len(results)
        })
    
    except Exception as e:
        print(f"Error searching memories: {str(e)}")
        return error_response(f'Failed to search memories: {str(e)}')

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks"""
    chunks = []
    words = text.split()
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    
    return chunks if chunks else [text]

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using OpenAI API"""
    if not OPENAI_API_KEY:
        raise Exception('OPENAI_API_KEY not configured')
    
    response = requests.post(
        'https://api.openai.com/v1/embeddings',
        headers={
            'Authorization': f'Bearer {OPENAI_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'text-embedding-3-small',
            'input': text
        }
    )
    
    if response.status_code != 200:
        raise Exception(f'OpenAI API error: {response.text}')
    
    data = response.json()
    return data['data'][0]['embedding']

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    return dot_product / (magnitude1 * magnitude2)

def upsert_to_pinecone(vector_id: str, embedding: List[float], metadata: Dict[str, Any]):
    """Upsert vector to Pinecone"""
    if not PINECONE_API_KEY:
        return
    
    try:
        url = f'https://{PINECONE_INDEX}-{PINECONE_ENVIRONMENT}.svc.pinecone.io/vectors/upsert'
        
        response = requests.post(
            url,
            headers={
                'Api-Key': PINECONE_API_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'vectors': [{
                    'id': vector_id,
                    'values': embedding,
                    'metadata': metadata
                }]
            }
        )
        
        if response.status_code != 200:
            print(f'Pinecone upsert error: {response.text}')
    
    except Exception as e:
        print(f'Pinecone upsert exception: {str(e)}')

def query_pinecone(embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
    """Query Pinecone for similar vectors"""
    if not PINECONE_API_KEY:
        return []
    
    try:
        url = f'https://{PINECONE_INDEX}-{PINECONE_ENVIRONMENT}.svc.pinecone.io/query'
        
        response = requests.post(
            url,
            headers={
                'Api-Key': PINECONE_API_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'vector': embedding,
                'topK': top_k,
                'includeMetadata': True
            }
        )
        
        if response.status_code != 200:
            print(f'Pinecone query error: {response.text}')
            return []
        
        data = response.json()
        matches = data.get('matches', [])
        
        return [
            {
                'text': match.get('metadata', {}).get('text', ''),
                'similarity': match.get('score', 0),
                'category': match.get('metadata', {}).get('category', ''),
                'documentId': match.get('metadata', {}).get('documentId', '')
            }
            for match in matches
        ]
    
    except Exception as e:
        print(f'Pinecone query exception: {str(e)}')
        return []
