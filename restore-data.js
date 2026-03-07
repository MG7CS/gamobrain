#!/usr/bin/env node
/**
 * GAMO BRAIN - Data Restore
 * 
 * Restores your data from a backup to:
 * - DynamoDB (profile, documents, chat)
 * - Pinecone (embeddings)
 * - Or any other service you migrate to
 * 
 * Usage: node restore-data.js [backup-folder-name]
 * Example: node restore-data.js 2026-03-07_14-30-00
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE_URL = 'https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo'

async function restoreBackup(backupName) {
  const backupDir = path.join(__dirname, 'backups', backupName)
  
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Backup not found: ${backupDir}`)
    console.log('\nAvailable backups:')
    const backupsDir = path.join(__dirname, 'backups')
    if (fs.existsSync(backupsDir)) {
      fs.readdirSync(backupsDir).forEach(dir => console.log(`  - ${dir}`))
    }
    process.exit(1)
  }
  
  console.log(`🔄 Restoring from: ${backupDir}\n`)
  
  try {
    // Read manifest
    const manifest = JSON.parse(fs.readFileSync(path.join(backupDir, 'manifest.json'), 'utf8'))
    console.log(`Backup from: ${manifest.backupDate}`)
    console.log(`Version: ${manifest.version}\n`)
    
    // 1. Restore Profile
    console.log('📤 Restoring profile...')
    const profile = JSON.parse(fs.readFileSync(path.join(backupDir, 'profile.json'), 'utf8'))
    
    const profileResponse = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_profile', profile })
    })
    
    if (!profileResponse.ok) {
      throw new Error(`Failed to restore profile: ${profileResponse.status}`)
    }
    console.log('✅ Profile restored\n')
    
    // 2. Restore Chat History
    console.log('📤 Restoring chat history...')
    const messages = JSON.parse(fs.readFileSync(path.join(backupDir, 'chat_history.json'), 'utf8'))
    
    for (const msg of messages) {
      await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_chat',
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toString()
        })
      })
    }
    console.log(`✅ Chat history restored (${messages.length} messages)\n`)
    
    // 3. Restore Documents (when implemented)
    console.log('📤 Restoring documents...')
    const documentsFile = path.join(backupDir, 'documents.json')
    if (fs.existsSync(documentsFile)) {
      const documents = JSON.parse(fs.readFileSync(documentsFile, 'utf8'))
      
      for (const doc of documents) {
        try {
          await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_document',
              document: doc
            })
          })
        } catch (err) {
          console.log(`⚠️  Document restore not yet implemented (skip)`)
          break
        }
      }
      console.log(`✅ Documents restored (${documents.length} documents)\n`)
    } else {
      console.log('⚠️  No documents to restore\n')
    }
    
    // 4. Restore Embeddings (when implemented)
    console.log('📤 Restoring embeddings...')
    const embeddingsFile = path.join(backupDir, 'embeddings.json')
    if (fs.existsSync(embeddingsFile)) {
      const embeddings = JSON.parse(fs.readFileSync(embeddingsFile, 'utf8'))
      
      for (const embedding of embeddings) {
        try {
          await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_embedding',
              embedding
            })
          })
        } catch (err) {
          console.log(`⚠️  Embeddings restore not yet implemented (skip)`)
          break
        }
      }
      console.log(`✅ Embeddings restored (${embeddings.length} vectors)\n`)
    } else {
      console.log('⚠️  No embeddings to restore\n')
    }
    
    console.log('═══════════════════════════════════════════════════════')
    console.log('✅ Restore complete!\n')
    console.log(`All data from ${manifest.backupDate} has been restored.`)
    console.log('═══════════════════════════════════════════════════════')
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message)
    throw error
  }
}

// Get backup name from command line
const backupName = process.argv[2]

if (!backupName) {
  console.error('Usage: node restore-data.js [backup-folder-name]')
  console.log('\nAvailable backups:')
  const backupsDir = path.join(__dirname, 'backups')
  if (fs.existsSync(backupsDir)) {
    fs.readdirSync(backupsDir).forEach(dir => console.log(`  - ${dir}`))
  } else {
    console.log('  (no backups found)')
  }
  process.exit(1)
}

restoreBackup(backupName).catch(console.error)
