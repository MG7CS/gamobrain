# API Integration - GAMO BRAIN

## Overview

GAMO BRAIN now uses AWS Lambda + DynamoDB as the backend, with localStorage as a cache fallback.

## API Endpoint

```
https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo
```

## Architecture

```
Frontend (React)
    ↓
src/utils/storage.js (async wrapper)
    ↓
src/utils/api.js (API calls)
    ↓
AWS API Gateway
    ↓
Lambda Function (gamo-brain-api)
    ↓
DynamoDB (gamo-brain table)
```

## Files Modified

### New Files:
- `src/utils/api.js` - API client with fetch calls
- `src/utils/init.js` - App initialization logic
- `lambda/gamo-brain-api.py` - Lambda function
- `lambda/requirements.txt` - Python dependencies
- `lambda/README.md` - Deployment guide

### Modified Files:
- `src/utils/storage.js` - Now async, calls API first, falls back to localStorage
- `src/utils/claudeAPI.js` - Updated to use async getProfile()
- `src/components/sections/Train.jsx` - Updated to use async storage
- `src/App.jsx` - Added initializeApp() on mount

## How It Works

### On App Load:
1. `App.jsx` calls `initializeApp()`
2. Loads profile and chat history from DynamoDB
3. Caches in localStorage for offline access
4. App is ready to use

### When Saving Data:
1. User trains GAMO or sends messages
2. Data saved to DynamoDB via API
3. Also cached in localStorage as backup
4. If API fails, localStorage is used

### When Loading Data:
1. Try to load from memory cache first
2. If not in cache, call API
3. If API fails, fall back to localStorage
4. Cache the result for next time

## API Operations

### Save Profile
```javascript
import { saveProfile } from './utils/storage'
await saveProfile(profileData)
```

### Get Profile
```javascript
import { getProfile } from './utils/storage'
const profile = await getProfile()
```

### Save Message
```javascript
import { saveMessage } from './utils/api'
await saveMessage('user', 'Hello GAMO', Date.now())
```

### Get Chat History
```javascript
import { getChatHistory } from './utils/storage'
const history = await getChatHistory()
```

## Error Handling

All API calls have try-catch blocks:
- If API fails, localStorage is used
- Errors are logged to console
- App continues to function offline

## Cache Strategy

**Memory Cache:**
- Profile and chat history cached in memory
- Reduces API calls during session
- Cleared on page refresh

**localStorage Cache:**
- Persistent across sessions
- Used as fallback if API fails
- Synced with API on success

## Testing

### Test API Connection:
```javascript
// Open browser console
import { getProfile } from './utils/storage'
const profile = await getProfile()
console.log(profile)
```

### Test Offline Mode:
1. Disconnect from internet
2. App should still work using localStorage
3. Reconnect - data syncs to API

## Deployment Checklist

✅ Lambda function deployed
✅ DynamoDB table created
✅ API Gateway configured
✅ CORS enabled
✅ Frontend updated to use API
✅ localStorage fallback working
✅ Build succeeds

## Next Steps

1. Deploy frontend to hosting (Vercel/Netlify)
2. Test API in production
3. Monitor Lambda logs for errors
4. Set up CloudWatch alarms

## Cost Estimation

**Current Setup:**
- Lambda: Free tier (1M requests/month)
- DynamoDB: Pay per request (~$0.25/million)
- API Gateway: Free tier (1M requests/month)

**Expected Cost:** $0-2/month for personal use
