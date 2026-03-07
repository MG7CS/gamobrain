#!/usr/bin/env node

const API_BASE_URL = 'https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo'

async function checkProfile() {
  try {
    console.log('Fetching profile from DynamoDB...\n')
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_profile' })
    })

    const data = await response.json()
    
    // Handle API Gateway response wrapping
    const profile = data.body ? JSON.parse(data.body).profile : data.profile
    
    if (!profile) {
      console.log('❌ No profile found in database')
      return
    }

    console.log('✅ Profile found!\n')
    console.log('═══════════════════════════════════════════════════════')
    
    for (const [category, fields] of Object.entries(profile)) {
      const fieldCount = Object.keys(fields || {}).length
      if (fieldCount > 0) {
        console.log(`\n📁 ${category.toUpperCase()} (${fieldCount} fields)`)
        console.log('───────────────────────────────────────────────────────')
        for (const [key, value] of Object.entries(fields)) {
          console.log(`  ${key}: ${value}`)
        }
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════')
    
    // Calculate completeness
    const totalFields = Object.values(profile).reduce((sum, cat) => 
      sum + Object.keys(cat || {}).length, 0
    )
    console.log(`\n📊 Total fields filled: ${totalFields}`)
    
  } catch (error) {
    console.error('❌ Error fetching profile:', error.message)
  }
}

// Also check chat history
async function checkChatHistory() {
  try {
    console.log('\n\nFetching chat history from DynamoDB...\n')
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_chat' })
    })

    const data = await response.json()
    const messages = data.body ? JSON.parse(data.body).messages : data.messages
    
    if (!messages || messages.length === 0) {
      console.log('❌ No chat history found in database')
      return
    }

    console.log(`✅ Found ${messages.length} messages\n`)
    console.log('Last 5 messages:')
    console.log('═══════════════════════════════════════════════════════')
    
    messages.slice(-5).forEach((msg, i) => {
      const time = new Date(msg.timestamp).toLocaleString()
      console.log(`\n[${msg.role.toUpperCase()}] ${time}`)
      console.log(msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : ''))
    })
    
    console.log('\n═══════════════════════════════════════════════════════')
    
  } catch (error) {
    console.error('❌ Error fetching chat history:', error.message)
  }
}

console.log('🧠 GAMO BRAIN - Database Check\n')
checkProfile().then(() => checkChatHistory())
