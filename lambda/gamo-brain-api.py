import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table_name = os.environ.get('TABLE_NAME', 'gamo-brain')
table = dynamodb.Table(table_name)

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
    # Handle preflight OPTIONS request
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if not action:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Missing action field'})
            }
        
        # Route to appropriate handler
        if action == 'save_profile':
            return save_profile(body)
        elif action == 'get_profile':
            return get_profile()
        elif action == 'save_chat':
            return save_chat(body)
        elif action == 'get_chat':
            return get_chat()
        elif action == 'clear_chat':
            return clear_chat()
        else:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': f'Unknown action: {action}'})
            }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def save_profile(body):
    """Save profile data to DynamoDB"""
    try:
        profile_data = body.get('profile')
        if not profile_data:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Missing profile data'})
            }
        
        # Save to DynamoDB
        table.put_item(
            Item={
                'pk': 'profile',
                'sk': 'data',
                'profile': profile_data,
                'updated_at': datetime.utcnow().isoformat()
            }
        )
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': True,
                'message': 'Profile saved successfully'
            })
        }
    
    except Exception as e:
        print(f"Error saving profile: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Failed to save profile: {str(e)}'})
        }

def get_profile():
    """Retrieve profile data from DynamoDB"""
    try:
        response = table.get_item(
            Key={
                'pk': 'profile',
                'sk': 'data'
            }
        )
        
        if 'Item' not in response:
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': json.dumps({
                    'profile': None,
                    'message': 'No profile found'
                })
            }
        
        profile = decimal_to_native(response['Item'].get('profile', {}))
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'profile': profile
            })
        }
    
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Failed to get profile: {str(e)}'})
        }

def save_chat(body):
    """Save a chat message to DynamoDB"""
    try:
        role = body.get('role')
        content = body.get('content')
        timestamp = body.get('timestamp')
        
        if not all([role, content, timestamp]):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Missing required fields: role, content, timestamp'})
            }
        
        # Save message to DynamoDB
        table.put_item(
            Item={
                'pk': 'chat',
                'sk': str(timestamp),
                'role': role,
                'content': content,
                'timestamp': timestamp
            }
        )
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': True,
                'message': 'Chat message saved successfully'
            })
        }
    
    except Exception as e:
        print(f"Error saving chat: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Failed to save chat: {str(e)}'})
        }

def get_chat():
    """Retrieve last 50 chat messages from DynamoDB"""
    try:
        response = table.query(
            KeyConditionExpression=Key('pk').eq('chat'),
            ScanIndexForward=False,  # Sort descending (newest first)
            Limit=50
        )
        
        messages = response.get('Items', [])
        
        # Convert to native types and reverse to get chronological order
        messages = [decimal_to_native(msg) for msg in messages]
        messages.reverse()
        
        # Extract just the message data
        chat_messages = [
            {
                'role': msg.get('role'),
                'content': msg.get('content'),
                'timestamp': msg.get('timestamp')
            }
            for msg in messages
        ]
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'messages': chat_messages,
                'count': len(chat_messages)
            })
        }
    
    except Exception as e:
        print(f"Error getting chat: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Failed to get chat: {str(e)}'})
        }

def clear_chat():
    """Delete all chat history from DynamoDB"""
    try:
        # Query all chat messages
        response = table.query(
            KeyConditionExpression=Key('pk').eq('chat')
        )
        
        messages = response.get('Items', [])
        
        # Delete each message
        with table.batch_writer() as batch:
            for msg in messages:
                batch.delete_item(
                    Key={
                        'pk': msg['pk'],
                        'sk': msg['sk']
                    }
                )
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'success': True,
                'message': f'Deleted {len(messages)} chat messages'
            })
        }
    
    except Exception as e:
        print(f"Error clearing chat: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'Failed to clear chat: {str(e)}'})
        }
