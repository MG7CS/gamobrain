#!/usr/bin/env node
/**
 * GAMO BRAIN - Export for Migration
 * 
 * Creates a portable export package that can be imported into ANY system:
 * - Standard JSON format
 * - Plain text versions
 * - CSV for spreadsheet import
 * - Markdown for human reading
 * 
 * Perfect for migrating to a different service or keeping offline archives
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE_URL = 'https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo'

async function exportForMigration() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const exportDir = path.join(__dirname, 'exports', timestamp)
  
  fs.mkdirSync(exportDir, { recursive: true })
  
  console.log(`📦 Creating portable export in: ${exportDir}\n`)
  
  try {
    // Fetch all data
    console.log('📥 Downloading all data...\n')
    
    const [profileRes, chatRes] = await Promise.all([
      fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_profile' })
      }),
      fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_chat' })
      })
    ])
    
    const profileData = await profileRes.json()
    const chatData = await chatRes.json()
    
    const profile = profileData.body ? JSON.parse(profileData.body).profile : profileData.profile
    const messages = chatData.body ? JSON.parse(chatData.body).messages : chatData.messages || []
    
    // 1. Standard JSON (for programmatic import)
    console.log('💾 Creating JSON export...')
    const jsonExport = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      userId: 'moise',
      profile,
      chatHistory: messages,
      documents: [], // Will be populated when implemented
      embeddings: []  // Will be populated when implemented
    }
    
    fs.writeFileSync(
      path.join(exportDir, 'gamo_brain_export.json'),
      JSON.stringify(jsonExport, null, 2)
    )
    console.log('✅ JSON export created\n')
    
    // 2. Markdown (human-readable)
    console.log('📝 Creating Markdown export...')
    let markdown = `# GAMO BRAIN Export\n\n`
    markdown += `**Export Date:** ${new Date().toISOString()}\n\n`
    markdown += `---\n\n## Profile\n\n`
    
    for (const [category, fields] of Object.entries(profile)) {
      const filledFields = Object.entries(fields).filter(([k, v]) => v && v.trim())
      if (filledFields.length > 0) {
        markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`
        for (const [key, value] of filledFields) {
          markdown += `**${key}:** ${value}\n\n`
        }
      }
    }
    
    markdown += `---\n\n## Chat History\n\n`
    markdown += `Total messages: ${messages.length}\n\n`
    
    messages.forEach((msg, i) => {
      const date = new Date(msg.timestamp).toLocaleString()
      markdown += `### Message ${i + 1} - ${msg.role.toUpperCase()} (${date})\n\n`
      markdown += `${msg.content}\n\n`
      markdown += `---\n\n`
    })
    
    fs.writeFileSync(path.join(exportDir, 'gamo_brain_export.md'), markdown)
    console.log('✅ Markdown export created\n')
    
    // 3. Plain text (ultra-portable)
    console.log('📄 Creating plain text export...')
    let plainText = `GAMO BRAIN EXPORT\n`
    plainText += `=================\n\n`
    plainText += `Export Date: ${new Date().toISOString()}\n\n`
    plainText += `PROFILE\n-------\n\n`
    
    for (const [category, fields] of Object.entries(profile)) {
      const filledFields = Object.entries(fields).filter(([k, v]) => v && v.trim())
      if (filledFields.length > 0) {
        plainText += `[${category.toUpperCase()}]\n`
        for (const [key, value] of filledFields) {
          plainText += `${key}: ${value}\n`
        }
        plainText += `\n`
      }
    }
    
    plainText += `\nCHAT HISTORY\n------------\n\n`
    messages.forEach((msg, i) => {
      const date = new Date(msg.timestamp).toLocaleString()
      plainText += `[${i + 1}] ${msg.role.toUpperCase()} - ${date}\n`
      plainText += `${msg.content}\n\n`
    })
    
    fs.writeFileSync(path.join(exportDir, 'gamo_brain_export.txt'), plainText)
    console.log('✅ Plain text export created\n')
    
    // 4. CSV (for spreadsheet import)
    console.log('📊 Creating CSV exports...')
    
    // Profile CSV
    let profileCSV = 'Category,Field,Value\n'
    for (const [category, fields] of Object.entries(profile)) {
      for (const [key, value] of Object.entries(fields)) {
        if (value && value.trim()) {
          const escapedValue = `"${value.replace(/"/g, '""')}"`
          profileCSV += `${category},${key},${escapedValue}\n`
        }
      }
    }
    fs.writeFileSync(path.join(exportDir, 'profile.csv'), profileCSV)
    
    // Chat CSV
    let chatCSV = 'Timestamp,Date,Role,Content\n'
    messages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleString()
      const escapedContent = `"${msg.content.replace(/"/g, '""')}"`
      chatCSV += `${msg.timestamp},"${date}",${msg.role},${escapedContent}\n`
    })
    fs.writeFileSync(path.join(exportDir, 'chat_history.csv'), chatCSV)
    
    console.log('✅ CSV exports created\n')
    
    // 5. Create import instructions
    const instructions = `GAMO BRAIN - Import Instructions
==================================

This export package contains your GAMO BRAIN data in multiple formats:

FILES:
------
1. gamo_brain_export.json - Complete data in JSON format
2. gamo_brain_export.md - Human-readable Markdown
3. gamo_brain_export.txt - Plain text (most portable)
4. profile.csv - Profile data for spreadsheets
5. chat_history.csv - Chat messages for spreadsheets

IMPORT TO DIFFERENT SERVICES:
------------------------------

→ Import to new GAMO BRAIN instance:
  node restore-data.js [backup-name]

→ Import to Pinecone (embeddings):
  1. Generate embeddings from documents
  2. Use Pinecone API to upsert vectors
  3. See: https://docs.pinecone.io/docs/upsert-data

→ Import to Weaviate:
  1. Create schema matching profile structure
  2. Use Weaviate client to import JSON
  3. See: https://weaviate.io/developers/weaviate/manage-data/import

→ Import to Qdrant:
  1. Create collection
  2. Upload points with payloads
  3. See: https://qdrant.tech/documentation/concepts/points/

→ Import to custom database:
  Use gamo_brain_export.json and write custom import script

MANUAL REVIEW:
--------------
Open gamo_brain_export.md in any text editor or Markdown viewer
for a complete human-readable version of your data.

SPREADSHEET ANALYSIS:
---------------------
Import profile.csv and chat_history.csv into Excel, Google Sheets,
or any spreadsheet software for analysis and visualization.

OFFLINE ARCHIVE:
----------------
Keep gamo_brain_export.txt as a permanent offline archive.
It's plain text and will be readable on any system forever.
`
    
    fs.writeFileSync(path.join(exportDir, 'IMPORT_INSTRUCTIONS.txt'), instructions)
    
    // Summary
    console.log('═══════════════════════════════════════════════════════')
    console.log('✅ Export complete!\n')
    console.log(`📦 Location: ${exportDir}\n`)
    console.log('Files created:')
    console.log('  • gamo_brain_export.json (programmatic import)')
    console.log('  • gamo_brain_export.md (human-readable)')
    console.log('  • gamo_brain_export.txt (ultra-portable)')
    console.log('  • profile.csv (spreadsheet)')
    console.log('  • chat_history.csv (spreadsheet)')
    console.log('  • IMPORT_INSTRUCTIONS.txt (how to use)\n')
    console.log('Your data is now portable and can be imported anywhere!')
    console.log('═══════════════════════════════════════════════════════')
    
  } catch (error) {
    console.error('❌ Export failed:', error.message)
    throw error
  }
}

exportForMigration().catch(console.error)
