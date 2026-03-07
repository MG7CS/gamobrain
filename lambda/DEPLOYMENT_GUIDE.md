# Lambda Deployment Guide

## 🚀 Deploy Enhanced Lambda Function

### Step 1: Set Up Pinecone (Free Tier)

1. Go to [https://www.pinecone.io/](https://www.pinecone.io/)
2. Sign up for free account
3. Create a new index:
   - **Name:** `gamo-brain`
   - **Dimensions:** `1536` (for OpenAI text-embedding-3-small)
   - **Metric:** `cosine`
   - **Region:** Choose closest to you (e.g., `us-east-1`)
4. Copy your API key from the dashboard

### Step 2: Get OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy the key (starts with `sk-`)

### Step 3: Update Lambda Environment Variables

Go to AWS Lambda Console → Your function → Configuration → Environment variables

Add these:
```
OPENAI_API_KEY = sk-...your-key...
PINECONE_API_KEY = ...your-key...
PINECONE_ENVIRONMENT = us-east-1  (or your region)
PINECONE_INDEX = gamo-brain
```

### Step 4: Deploy New Lambda Code

#### Option A: AWS Console (Easy)

1. Go to AWS Lambda Console
2. Find your function (the one at the API endpoint)
3. Click "Code" tab
4. Replace code with `gamo-brain-api-enhanced.py`
5. Click "Deploy"
6. Wait for deployment to complete

#### Option B: AWS CLI (Faster)

```bash
cd lambda

# Create deployment package
zip -r function.zip gamo-brain-api-enhanced.py

# Upload to Lambda
aws lambda update-function-code \
  --function-name gamo-brain-api \
  --zip-file fileb://function.zip \
  --region us-east-2

# Update environment variables
aws lambda update-function-configuration \
  --function-name gamo-brain-api \
  --environment Variables="{
    TABLE_NAME=gamo-brain,
    OPENAI_API_KEY=sk-your-key,
    PINECONE_API_KEY=your-key,
    PINECONE_ENVIRONMENT=us-east-1,
    PINECONE_INDEX=gamo-brain
  }" \
  --region us-east-2
```

### Step 5: Increase Lambda Timeout

Document processing + embeddings can take time:

1. Go to Lambda → Configuration → General configuration
2. Click "Edit"
3. Set **Timeout** to `60 seconds` (from default 3s)
4. Set **Memory** to `512 MB` (for faster processing)
5. Click "Save"

### Step 6: Test the New Endpoints

```bash
# Test document storage
curl -X POST https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo \
  -H "Content-Type: application/json" \
  -d '{
    "action": "save_document",
    "content": "I grew up in Kigali, Rwanda. My father passed away when I was 2.",
    "type": "training",
    "metadata": {"category": "childhood"}
  }'

# Test semantic search
curl -X POST https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search_memories",
    "query": "Tell me about your childhood",
    "topK": 5
  }'

# Test list documents
curl -X POST https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo \
  -H "Content-Type: application/json" \
  -d '{"action": "list_documents"}'
```

### Step 7: Verify Pinecone

1. Go to Pinecone dashboard
2. Click on your `gamo-brain` index
3. You should see vectors appearing as documents are uploaded
4. Check the "Stats" tab to see vector count

---

## 🔧 Troubleshooting

### Error: "OPENAI_API_KEY not configured"
- Check Lambda environment variables
- Make sure the key starts with `sk-`
- Verify the key is active in OpenAI dashboard

### Error: "Pinecone connection failed"
- Check PINECONE_API_KEY is set
- Verify PINECONE_ENVIRONMENT matches your index region
- Check PINECONE_INDEX name is correct

### Timeout errors
- Increase Lambda timeout to 60s
- Increase memory to 512 MB
- Consider processing embeddings asynchronously

### Embeddings not appearing in Pinecone
- Check Pinecone dashboard for errors
- Verify dimensions are 1536
- Check Lambda logs in CloudWatch

---

## 📊 Cost Estimates

### With New System:
- **Lambda:** ~$0.20/month (free tier covers most)
- **DynamoDB:** ~$1-3/month (document storage)
- **OpenAI Embeddings:** ~$0.10/month (one-time per document)
- **Pinecone:** **$0/month** (free tier: 1M vectors)
- **Claude API:** ~$5-20/month (unchanged)

**Total: ~$6-25/month** (same as before with Pinecone free tier!)

---

## ✅ Verification Checklist

- [ ] Pinecone account created
- [ ] Pinecone index created (1536 dimensions, cosine metric)
- [ ] OpenAI API key obtained
- [ ] Lambda environment variables set
- [ ] Lambda code updated to enhanced version
- [ ] Lambda timeout increased to 60s
- [ ] Lambda memory increased to 512 MB
- [ ] Test document save endpoint
- [ ] Test semantic search endpoint
- [ ] Verify vectors in Pinecone dashboard
- [ ] Check CloudWatch logs for errors

---

## 🎯 Next Steps

Once Lambda is deployed:
1. Update frontend to use new endpoints
2. Test training flow with document dumps
3. Test chat with semantic search
4. Run backups to verify data portability
5. Deploy to production

See `FRONTEND_INTEGRATION.md` for frontend updates.
