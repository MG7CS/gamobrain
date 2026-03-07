import { getProfile, getChatHistory } from './storage'

let initialized = false

/**
 * Initialize app by loading data from DynamoDB
 * Call this once on app mount
 */
export async function initializeApp() {
  if (initialized) return
  
  console.log('Initializing GAMO BRAIN...')
  
  try {
    // Load profile and chat history in parallel
    const [profile, chatHistory] = await Promise.all([
      getProfile(),
      getChatHistory()
    ])
    
    console.log('Profile loaded:', Object.keys(profile).filter(k => Object.keys(profile[k]).length > 0))
    console.log('Chat history loaded:', chatHistory.length, 'messages')
    
    initialized = true
    return { profile, chatHistory }
  } catch (error) {
    console.error('Failed to initialize app:', error)
    // App will fallback to localStorage
    initialized = true
    return { profile: null, chatHistory: [] }
  }
}

export function isInitialized() {
  return initialized
}
