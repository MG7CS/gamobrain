# 🧠 GAMO BRAIN

Your personal AI twin - trained on your life, thoughts, and experiences.

---

## 🚀 Quick Start

**Live Site:** gamobrain.com

### **First Time Setup:**
1. Visit your site
2. Enter password: `admin` (default)
3. Go to "Teach Me" and paste your bio/documents
4. Chat with your twin in "Meet GAMO"

---

## 📚 Documentation

All documentation is in the `docs/` folder:

- **[QUICK_START.md](docs/QUICK_START.md)** - Get started in 5 minutes
- **[SECURITY.md](docs/SECURITY.md)** - Password setup & authentication
- **[DATA_BACKUP.md](docs/DATA_BACKUP.md)** - Backup & export your data

---

## 🔒 Security

Your site is **password-protected**. Nobody can access your data without the password.

**Change the default password:**
1. See [docs/SECURITY.md](docs/SECURITY.md)
2. Generate new password hash
3. Update `src/components/AuthGate.jsx`
4. Deploy

---

## 💾 Data Backup

**Backup everything locally:**
```bash
node backup-data.js
```

**Export for migration:**
```bash
node export-for-migration.js
```

See [docs/DATA_BACKUP.md](docs/DATA_BACKUP.md) for details.

---

## 🎯 Features

✅ **Password Protected** - Secure authentication  
✅ **Document Storage** - Unlimited text storage  
✅ **Semantic Search** - AI finds relevant memories  
✅ **Context-Aware Chat** - Twin knows your full context  
✅ **Mobile Optimized** - Perfect on all devices  
✅ **Data Ownership** - Export & backup everything  
✅ **Scalable** - Handles millions of words  

---

## 💰 Cost

**~$6-23/month**
- Claude API: $5-20 (usage-based)
- DynamoDB: $1-3 (storage)
- OpenAI Embeddings: ~$0.10 per document
- Pinecone: $0 (free tier)

---

## 🛠️ Tech Stack

**Frontend:** React + Vite + Framer Motion  
**Backend:** AWS Lambda + API Gateway  
**Database:** DynamoDB  
**Vector DB:** Pinecone  
**AI:** Claude (Anthropic) + OpenAI Embeddings  

---

## 📱 Mobile Support

✅ Perfect mobile experience  
✅ No zoom on input focus  
✅ Smooth keyboard handling  
✅ Works on all screen sizes  
✅ PWA-ready  

---

## 🔧 Development

**Install:**
```bash
npm install
```

**Run locally:**
```bash
npm run dev
```

**Deploy:**
```bash
git push
```
(Auto-deploys via GitHub)

---

## 📖 How It Works

1. **Training:** You paste documents → AI extracts facts + generates embeddings
2. **Storage:** Documents in DynamoDB, vectors in Pinecone
3. **Chat:** Your message → semantic search → relevant context → Claude response
4. **Learning:** AI continuously learns from conversations

---

## 🎉 You're Ready!

1. **Change password** (see docs/SECURITY.md)
2. **Train your AI** (paste your bio)
3. **Chat with your twin**
4. **Backup your data** (run backup-data.js)

**Questions?** Check the docs/ folder!

---

**Built with ❤️ for lifetime use**
