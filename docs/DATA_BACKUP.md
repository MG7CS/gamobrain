# GAMO BRAIN - Data Ownership & Portability Guide

## 🎯 Your Data, Your Control

You have **complete ownership** of all your data. Here's how to backup, export, and migrate it anywhere.

---

## 📦 Three Types of Exports

### 1. **Backup** (for disaster recovery)
```bash
node backup-data.js
```
- Creates timestamped backup in `./backups/YYYY-MM-DD_HH-MM-SS/`
- Includes: profile, chat, documents, embeddings
- Can be restored to GAMO BRAIN with one command

### 2. **Export** (for migration to other services)
```bash
node export-for-migration.js
```
- Creates portable export in `./exports/YYYY-MM-DD_HH-MM-SS/`
- Multiple formats: JSON, Markdown, Plain Text, CSV
- Can be imported into ANY system

### 3. **Check** (view current data)
```bash
node check-profile.js
```
- Shows what's currently stored
- No files created, just displays data

---

## 📁 What Gets Backed Up

### Current Implementation:
✅ **Profile data** (identity, personality, life story, etc.)  
✅ **Chat history** (all conversations)  
⏳ **Documents** (when implemented)  
⏳ **Embeddings** (when implemented)  

### Future (with document storage):
✅ **Raw documents** (full text, preserved exactly as uploaded)  
✅ **Vector embeddings** (for semantic search)  
✅ **Metadata** (timestamps, sources, tags)  

---

## 🔄 Backup & Restore Flow

### Backup
```bash
# Create backup
node backup-data.js

# Output:
# ✅ Backup complete!
# Location: ./backups/2026-03-07_14-30-00/
```

### Restore
```bash
# List available backups
node restore-data.js

# Restore specific backup
node restore-data.js 2026-03-07_14-30-00

# Output:
# ✅ Restore complete!
```

---

## 🌐 Migration to Other Services

### Scenario 1: Migrate to Different Vector DB

**From Pinecone to Weaviate:**

1. Export current data:
```bash
node export-for-migration.js
```

2. Read embeddings from `exports/.../gamo_brain_export.json`

3. Import to Weaviate:
```javascript
const weaviate = require('weaviate-client')
const data = require('./exports/.../gamo_brain_export.json')

const client = weaviate.client({ scheme: 'http', host: 'localhost:8080' })

for (const embedding of data.embeddings) {
  await client.data.creator()
    .withClassName('Memory')
    .withProperties({
      text: embedding.text,
      category: embedding.category,
      timestamp: embedding.timestamp
    })
    .withVector(embedding.embedding)
    .do()
}
```

### Scenario 2: Migrate to Self-Hosted Solution

1. Export data:
```bash
node export-for-migration.js
```

2. Set up your own server (e.g., PostgreSQL + pgvector)

3. Import using the JSON export:
```sql
-- Create tables
CREATE TABLE profile (
  user_id TEXT,
  category TEXT,
  field TEXT,
  value TEXT
);

CREATE TABLE embeddings (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  text TEXT,
  embedding vector(1536)
);
```

4. Write import script using `gamo_brain_export.json`

### Scenario 3: Migrate to Different AI Provider

**From Claude to GPT-4:**

1. Export chat history:
```bash
node export-for-migration.js
```

2. Convert format:
```javascript
const data = require('./exports/.../gamo_brain_export.json')

const gptFormat = data.chatHistory.map(msg => ({
  role: msg.role === 'assistant' ? 'assistant' : 'user',
  content: msg.content
}))

// Use with OpenAI API
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: gptFormat
})
```

---

## 💾 Local Storage Formats

### Backup Structure
```
backups/
└── 2026-03-07_14-30-00/
    ├── manifest.json          # Backup metadata
    ├── profile.json           # Structured profile data
    ├── chat_history.json      # All messages
    ├── documents.json         # Raw documents
    ├── documents_text/        # Human-readable .txt files
    │   ├── doc_001.txt
    │   ├── doc_002.txt
    │   └── ...
    ├── embeddings.json        # Vector embeddings
    └── README.txt             # Backup summary
```

### Export Structure
```
exports/
└── 2026-03-07_14-30-00/
    ├── gamo_brain_export.json # Complete JSON (import anywhere)
    ├── gamo_brain_export.md   # Human-readable Markdown
    ├── gamo_brain_export.txt  # Plain text (most portable)
    ├── profile.csv            # Spreadsheet format
    ├── chat_history.csv       # Spreadsheet format
    └── IMPORT_INSTRUCTIONS.txt # How to use
```

---

## 🔒 Data Security

### Storing Backups Securely

1. **Encrypt backups:**
```bash
# Create backup
node backup-data.js

# Encrypt with password
zip -er gamo_backup_encrypted.zip backups/2026-03-07_14-30-00/
```

2. **Store in multiple locations:**
- Local drive (fast access)
- External hard drive (offline backup)
- Cloud storage (encrypted): Google Drive, Dropbox, iCloud
- USB drive (air-gapped backup)

3. **Automated backups:**
```bash
# Add to crontab (runs daily at 2am)
0 2 * * * cd /path/to/GAMO\ TWIN && node backup-data.js
```

---

## 🚀 Pinecone Backup (Specific)

### Export from Pinecone
```javascript
const { Pinecone } = require('@pinecone-database/pinecone')

const pc = new Pinecone({ apiKey: 'your-key' })
const index = pc.index('gamo-brain')

// Fetch all vectors
const queryResponse = await index.query({
  vector: new Array(1536).fill(0), // dummy vector
  topK: 10000,
  includeMetadata: true,
  includeValues: true
})

// Save to file
const fs = require('fs')
fs.writeFileSync(
  'pinecone_backup.json',
  JSON.stringify(queryResponse.matches, null, 2)
)
```

### Import to Pinecone
```javascript
const backupData = require('./pinecone_backup.json')

// Upsert in batches
const batchSize = 100
for (let i = 0; i < backupData.length; i += batchSize) {
  const batch = backupData.slice(i, i + batchSize)
  await index.upsert(batch.map(item => ({
    id: item.id,
    values: item.values,
    metadata: item.metadata
  })))
}
```

---

## 📊 Data Analysis

### View in Spreadsheet
```bash
node export-for-migration.js
# Open profile.csv in Excel/Google Sheets
```

### Query with SQL (if using PostgreSQL)
```sql
-- Find all facts about childhood
SELECT * FROM profile WHERE category = 'lifeStory' AND field = 'childhood';

-- Count messages per day
SELECT DATE(timestamp), COUNT(*) 
FROM chat_history 
GROUP BY DATE(timestamp);
```

### Analyze with Python
```python
import json
import pandas as pd

# Load export
with open('exports/.../gamo_brain_export.json') as f:
    data = json.load(f)

# Convert to DataFrame
messages = pd.DataFrame(data['chatHistory'])
messages['date'] = pd.to_datetime(messages['timestamp'], unit='ms')

# Analyze
print(messages.groupby(messages['date'].dt.date).size())
```

---

## ✅ Data Ownership Checklist

- [ ] Run `node backup-data.js` at least weekly
- [ ] Store backups in 2+ locations (local + cloud)
- [ ] Test restore process once (verify backups work)
- [ ] Export to portable format monthly (`node export-for-migration.js`)
- [ ] Keep at least 3 historical backups
- [ ] Encrypt backups if storing in cloud
- [ ] Document any custom modifications to export scripts

---

## 🆘 Emergency Recovery

### Lost access to AWS/Pinecone?

1. **Check local backups:**
```bash
ls -la backups/
```

2. **Restore to new service:**
```bash
# Set up new DynamoDB/Pinecone
# Update API_BASE_URL in restore script
node restore-data.js [backup-name]
```

3. **Or use export to migrate completely:**
```bash
# Use JSON export to import into any new system
cat exports/.../gamo_brain_export.json
```

### Corrupted data?

1. **Restore from last good backup:**
```bash
node restore-data.js [last-good-backup]
```

2. **Merge with current data if needed:**
```javascript
// Custom merge script
const oldData = require('./backups/old/profile.json')
const newData = require('./backups/new/profile.json')
const merged = { ...oldData, ...newData }
```

---

## 📝 Summary

**You have complete control:**
- ✅ All data can be exported locally
- ✅ Multiple portable formats (JSON, CSV, TXT, MD)
- ✅ Can migrate to any service
- ✅ Can restore from backups
- ✅ No vendor lock-in
- ✅ Embeddings are just numbers - portable everywhere

**Best practices:**
1. Backup weekly: `node backup-data.js`
2. Export monthly: `node export-for-migration.js`
3. Store in 2+ locations
4. Test restore once to verify

**Your data is yours forever.** 🎯
