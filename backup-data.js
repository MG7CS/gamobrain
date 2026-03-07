#!/usr/bin/env node
/**
 * GAMO BRAIN - Complete Data Backup
 * 
 * Downloads all your data from DynamoDB and Pinecone:
 * - Raw documents (text)
 * - Embeddings (vectors)
 * - Profile metadata
 * - Chat history
 * 
 * Saves to: ./backups/YYYY-MM-DD_HH-MM-SS/
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE_URL = 'https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo'

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const backupDir = path.join(__dirname, 'backups', timestamp)
  
  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  console.log(`🗄️  Creating backup in: ${backupDir}\n`)
  
  try {
    // 1. Backup Profile
    console.log('📥 Downloading profile...')
    const profileResponse = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_profile' })
    })
    const profileData = await profileResponse.json()
    const profile = profileData.body ? JSON.parse(profileData.body).profile : profileData.profile
    
    fs.writeFileSync(
      path.join(backupDir, 'profile.json'),
      JSON.stringify(profile, null, 2)
    )
    console.log('✅ Profile saved\n')
    
    // 2. Backup Chat History
    console.log('📥 Downloading chat history...')
    const chatResponse = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_chat' })
    })
    const chatData = await chatResponse.json()
    const messages = chatData.body ? JSON.parse(chatData.body).messages : chatData.messages || []
    
    fs.writeFileSync(
      path.join(backupDir, 'chat_history.json'),
      JSON.stringify(messages, null, 2)
    )
    console.log(`✅ Chat history saved (${messages.length} messages)\n`)
    
    // 3. Backup Documents (when implemented)
    console.log('📥 Downloading documents...')
    try {
      const docsResponse = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_documents' })
      })
      const docsData = await docsResponse.json()
      const documents = docsData.body ? JSON.parse(docsData.body).documents : docsData.documents || []
      
      // Save all documents
      fs.writeFileSync(
        path.join(backupDir, 'documents.json'),
        JSON.stringify(documents, null, 2)
      )
      
      // Also save each document as separate text file for easy reading
      const docsDir = path.join(backupDir, 'documents_text')
      fs.mkdirSync(docsDir, { recursive: true })
      
      documents.forEach((doc, i) => {
        const filename = `${doc.documentId || `doc_${i}`}.txt`
        fs.writeFileSync(
          path.join(docsDir, filename),
          `Type: ${doc.type}\nTimestamp: ${new Date(doc.timestamp).toISOString()}\n\n${doc.content}`
        )
      })
      
      console.log(`✅ Documents saved (${documents.length} documents)\n`)
    } catch (err) {
      console.log('⚠️  Documents table not yet implemented (skip)\n')
      fs.writeFileSync(path.join(backupDir, 'documents.json'), '[]')
    }
    
    // 4. Backup Embeddings (when implemented)
    console.log('📥 Downloading embeddings...')
    try {
      const embeddingsResponse = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_embeddings' })
      })
      const embeddingsData = await embeddingsResponse.json()
      const embeddings = embeddingsData.body ? JSON.parse(embeddingsData.body).embeddings : embeddingsData.embeddings || []
      
      fs.writeFileSync(
        path.join(backupDir, 'embeddings.json'),
        JSON.stringify(embeddings, null, 2)
      )
      console.log(`✅ Embeddings saved (${embeddings.length} vectors)\n`)
    } catch (err) {
      console.log('⚠️  Embeddings not yet implemented (skip)\n')
      fs.writeFileSync(path.join(backupDir, 'embeddings.json'), '[]')
    }
    
    // 5. Create backup manifest
    const manifest = {
      backupDate: new Date().toISOString(),
      userId: 'moise',
      version: '1.0',
      contents: {
        profile: profile ? Object.keys(profile).length : 0,
        chatMessages: messages.length,
        documents: 0, // Will be updated when implemented
        embeddings: 0  // Will be updated when implemented
      }
    }
    
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    )
    
    // 6. Create human-readable summary
    const summary = `GAMO BRAIN Backup Summary
========================

Backup Date: ${manifest.backupDate}
Backup Location: ${backupDir}

Contents:
- Profile: ${manifest.contents.profile} categories
- Chat History: ${manifest.contents.chatMessages} messages
- Documents: ${manifest.contents.documents} documents
- Embeddings: ${manifest.contents.embeddings} vectors

Files:
- profile.json - Your profile data (structured)
- chat_history.json - All chat messages
- documents.json - All uploaded documents
- documents_text/ - Each document as readable .txt file
- embeddings.json - Vector embeddings for semantic search
- manifest.json - Backup metadata

To restore this backup, run:
  node restore-data.js ${timestamp}
`
    
    fs.writeFileSync(path.join(backupDir, 'README.txt'), summary)
    
    console.log('═══════════════════════════════════════════════════════')
    console.log('✅ Backup complete!\n')
    console.log(summary)
    console.log('═══════════════════════════════════════════════════════')
    
    return backupDir
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    throw error
  }
}

// Run backup
createBackup().catch(console.error)
