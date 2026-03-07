# GAMO BRAIN Lambda API

Backend API for GAMO BRAIN using AWS Lambda and DynamoDB.

## Setup

### 1. Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name gamo-brain \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-2
```

### 2. Create Lambda Function

1. **Create deployment package:**
```bash
cd lambda
pip install -r requirements.txt -t .
zip -r gamo-brain-api.zip .
```

2. **Create Lambda function:**
```bash
aws lambda create-function \
  --function-name gamo-brain-api \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-dynamodb-role \
  --handler gamo-brain-api.lambda_handler \
  --zip-file fileb://gamo-brain-api.zip \
  --environment Variables={TABLE_NAME=gamo-brain} \
  --region us-east-2
```

3. **Create IAM Role** (if not exists):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:DeleteItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-2:*:table/gamo-brain"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### 3. Create API Gateway

1. Create REST API
2. Create POST method
3. Enable CORS
4. Deploy to stage (e.g., `prod`)

### 4. Update Frontend

Set the API endpoint in your frontend:

```javascript
const API_ENDPOINT = 'https://YOUR_API_ID.execute-api.us-east-2.amazonaws.com/prod'
```

## API Operations

### Save Profile
```json
POST /
{
  "action": "save_profile",
  "profile": {
    "identity": {...},
    "personality": {...}
  }
}
```

### Get Profile
```json
POST /
{
  "action": "get_profile"
}
```

### Save Chat Message
```json
POST /
{
  "action": "save_chat",
  "role": "user",
  "content": "Hello GAMO",
  "timestamp": 1234567890
}
```

### Get Chat History
```json
POST /
{
  "action": "get_chat"
}
```

### Clear Chat History
```json
POST /
{
  "action": "clear_chat"
}
```

## Testing Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Test with Python
python -c "
import json
from gamo_brain_api import lambda_handler

event = {
    'httpMethod': 'POST',
    'body': json.dumps({'action': 'get_profile'})
}
result = lambda_handler(event, None)
print(result)
"
```

## Deployment

To update the Lambda function:

```bash
cd lambda
zip -r gamo-brain-api.zip .
aws lambda update-function-code \
  --function-name gamo-brain-api \
  --zip-file fileb://gamo-brain-api.zip \
  --region us-east-2
```

## Monitoring

View logs:
```bash
aws logs tail /aws/lambda/gamo-brain-api --follow --region us-east-2
```

## Cost Estimation

- DynamoDB: Pay per request (very cheap for low traffic)
- Lambda: First 1M requests/month free
- API Gateway: First 1M requests/month free

Expected cost for personal use: **~$0-2/month**
