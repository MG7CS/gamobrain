const API_BASE_URL = 'https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo'

async function apiCall(action, data = {}) {
  try {
    const body = JSON.stringify({ action, ...data })
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body,
    })

    const text = await response.text()
    console.log(`Raw response for ${action}:`, text)

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${text}`)
    }

    const parsed = JSON.parse(text)
    
    // API Gateway wraps response in a body string sometimes
    if (parsed.body && typeof parsed.body === 'string') {
      return JSON.parse(parsed.body)
    }
    
    return parsed

  } catch (error) {
    console.error(`API call failed for ${action}:`, error)
    throw error
  }
}

// Profile operations
export async function saveProfile(data) {
  try {
    const result = await apiCall('save_profile', { profile: data })
    localStorage.setItem('gamo_profile', JSON.stringify(data))
    return result
  } catch (error) {
    console.error('Failed to save profile to API, using localStorage only:', error)
    localStorage.setItem('gamo_profile', JSON.stringify(data))
  }
}

export async function getProfile() {
  try {
    const result = await apiCall('get_profile')
    if (result.profile) {
      localStorage.setItem('gamo_profile', JSON.stringify(result.profile))
      return result.profile
    }
    const cached = localStorage.getItem('gamo_profile')
    return cached ? JSON.parse(cached) : getDefaultProfile()
  } catch (error) {
    console.error('Failed to get profile from API, using localStorage:', error)
    const cached = localStorage.getItem('gamo_profile')
    return cached ? JSON.parse(cached) : getDefaultProfile()
  }
}

// Chat operations
export async function saveMessage(role, content, timestamp = Date.now()) {
  try {
    await apiCall('save_chat', { role, content, timestamp: timestamp.toString() })
    const history = JSON.parse(localStorage.getItem('gamo_chat_history') || '[]')
    history.push({ role, content, timestamp })
    localStorage.setItem('gamo_chat_history', JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save message to API, using localStorage only:', error)
    const history = JSON.parse(localStorage.getItem('gamo_chat_history') || '[]')
    history.push({ role, content, timestamp })
    localStorage.setItem('gamo_chat_history', JSON.stringify(history))
  }
}

export async function getChatHistory() {
  try {
    const result = await apiCall('get_chat')
    if (result.messages && result.messages.length > 0) {
      localStorage.setItem('gamo_chat_history', JSON.stringify(result.messages))
      return result.messages
    }
    const cached = localStorage.getItem('gamo_chat_history')
    return cached ? JSON.parse(cached) : []
  } catch (error) {
    console.error('Failed to get chat history from API, using localStorage:', error)
    const cached = localStorage.getItem('gamo_chat_history')
    return cached ? JSON.parse(cached) : []
  }
}

export async function clearChatHistory() {
  try {
    await apiCall('clear_chat')
    localStorage.removeItem('gamo_chat_history')
  } catch (error) {
    console.error('Failed to clear chat history from API:', error)
    localStorage.removeItem('gamo_chat_history')
  }
}

function getDefaultProfile() {
  return {
    identity: {},
    personality: {},
    lifeStory: {},
    values: {},
    habits: {},
    dreams: {},
    fears: {},
    opinions: {},
  }
}