import * as api from './api'

const KEYS = {
  PROFILE: 'gamo_profile',
  CHAT_HISTORY: 'gamo_chat_history',
  MENU_POSITION: 'gamo_menu_position',
  TRAINING_PROGRESS: 'gamo_training_progress',
  API_KEY: 'gamo_api_key',
}

// Profile cache
let profileCache = null
let chatHistoryCache = null

export async function getProfile() {
  // Return cache if available
  if (profileCache) return profileCache
  
  // Try API first, fallback to localStorage
  try {
    const profile = await api.getProfile()
    profileCache = profile
    return profile
  } catch (error) {
    console.error('Error getting profile:', error)
    const data = localStorage.getItem(KEYS.PROFILE)
    const profile = data ? JSON.parse(data) : getDefaultProfile()
    profileCache = profile
    return profile
  }
}

export async function saveProfile(profile) {
  profileCache = profile
  try {
    await api.saveProfile(profile)
  } catch (error) {
    console.error('Error saving profile to API:', error)
    // localStorage fallback is handled in api.js
  }
}

export async function updateProfileField(category, key, value) {
  const profile = await getProfile()
  if (!profile[category]) profile[category] = {}
  profile[category][key] = value
  await saveProfile(profile)
  return profile
}

export async function getChatHistory() {
  // Return cache if available
  if (chatHistoryCache) return chatHistoryCache
  
  // Try API first, fallback to localStorage
  try {
    const history = await api.getChatHistory()
    chatHistoryCache = history
    return history
  } catch (error) {
    console.error('Error getting chat history:', error)
    const data = localStorage.getItem(KEYS.CHAT_HISTORY)
    const history = data ? JSON.parse(data) : []
    chatHistoryCache = history
    return history
  }
}

export async function saveChatHistory(history) {
  chatHistoryCache = history
  // Save each new message to API
  const existingHistory = await getChatHistory()
  const newMessages = history.slice(existingHistory.length)
  
  for (const msg of newMessages) {
    try {
      await api.saveMessage(msg.role, msg.content, msg.timestamp)
    } catch (error) {
      console.error('Error saving message to API:', error)
    }
  }
}

export function getMenuPosition() {
  try {
    const data = localStorage.getItem(KEYS.MENU_POSITION)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function saveMenuPosition(position) {
  localStorage.setItem(KEYS.MENU_POSITION, JSON.stringify(position))
}

export function getTrainingProgress() {
  try {
    const data = localStorage.getItem(KEYS.TRAINING_PROGRESS)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

export function saveTrainingProgress(progress) {
  localStorage.setItem(KEYS.TRAINING_PROGRESS, JSON.stringify(progress))
}

export function getApiKey() {
  return localStorage.getItem(KEYS.API_KEY) || ''
}

export function saveApiKey(key) {
  localStorage.setItem(KEYS.API_KEY, key)
}

export function getDefaultProfile() {
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

export function getProfileCompleteness(profile) {
  const categories = Object.keys(getDefaultProfile())
  let filled = 0
  let total = 0

  categories.forEach(cat => {
    const questions = TRAINING_QUESTIONS[cat] || []
    total += questions.length
    questions.forEach(q => {
      if (profile[cat] && profile[cat][q.key] && profile[cat][q.key].trim() !== '') {
        filled++
      }
    })
  })

  return total === 0 ? 0 : Math.round((filled / total) * 100)
}

export const TRAINING_QUESTIONS = {
  identity: [
    { key: 'name', question: 'What is your name?', placeholder: 'Your full name...' },
    { key: 'age', question: 'How old are you?', placeholder: 'Your age...' },
    { key: 'location', question: 'Where do you live?', placeholder: 'City, Country...' },
    { key: 'occupation', question: 'What do you do for work?', placeholder: 'Your profession...' },
    { key: 'background', question: 'Describe your background in a few sentences.', placeholder: 'Where you come from, your story...' },
  ],
  personality: [
    { key: 'traits', question: 'What are your dominant personality traits?', placeholder: 'e.g. Ambitious, curious, introverted...' },
    { key: 'humor', question: 'How would you describe your sense of humor?', placeholder: 'Dry, sarcastic, dark, goofy...' },
    { key: 'communication', question: 'How do you communicate? Formal? Casual? Blunt?', placeholder: 'Your communication style...' },
    { key: 'energy', question: 'Are you introverted or extroverted? How do you recharge?', placeholder: 'Your social energy...' },
    { key: 'quirks', question: 'What are your quirks or unique habits?', placeholder: 'Things that make you, you...' },
  ],
  lifeStory: [
    { key: 'childhood', question: 'Tell me about your childhood.', placeholder: 'Where you grew up, key memories...' },
    { key: 'turningPoints', question: 'What were the biggest turning points in your life?', placeholder: 'Moments that changed everything...' },
    { key: 'achievements', question: 'What are you most proud of?', placeholder: 'Your greatest achievements...' },
    { key: 'struggles', question: 'What struggles have shaped you?', placeholder: 'Challenges you\'ve overcome...' },
    { key: 'currentChapter', question: 'What chapter of life are you in right now?', placeholder: 'Where you are today...' },
  ],
  values: [
    { key: 'coreValues', question: 'What are your core values?', placeholder: 'e.g. Freedom, honesty, loyalty...' },
    { key: 'beliefs', question: 'What do you deeply believe in?', placeholder: 'Your fundamental beliefs...' },
    { key: 'dealbreakers', question: 'What are your absolute dealbreakers in life and relationships?', placeholder: 'Lines you won\'t cross...' },
    { key: 'priorities', question: 'What matters most to you right now?', placeholder: 'Your current priorities...' },
  ],
  habits: [
    { key: 'dailyRoutine', question: 'Describe your typical day.', placeholder: 'Morning to night routine...' },
    { key: 'hobbies', question: 'What are your hobbies and interests?', placeholder: 'How you spend free time...' },
    { key: 'guilty', question: 'What are your guilty pleasures?', placeholder: 'Things you enjoy but maybe shouldn\'t...' },
    { key: 'productivity', question: 'How do you stay productive?', placeholder: 'Your work habits and systems...' },
  ],
  dreams: [
    { key: 'shortTerm', question: 'What are your goals for the next year?', placeholder: 'Near-term ambitions...' },
    { key: 'longTerm', question: 'Where do you see yourself in 10 years?', placeholder: 'Long-term vision...' },
    { key: 'wildDream', question: 'What\'s your wildest dream?', placeholder: 'If nothing could stop you...' },
    { key: 'legacy', question: 'What legacy do you want to leave behind?', placeholder: 'How you want to be remembered...' },
  ],
  fears: [
    { key: 'deepFears', question: 'What are your deepest fears?', placeholder: 'What keeps you up at night...' },
    { key: 'insecurities', question: 'What are you insecure about?', placeholder: 'Your vulnerabilities...' },
    { key: 'avoidance', question: 'What do you avoid and why?', placeholder: 'Things you stay away from...' },
  ],
  opinions: [
    { key: 'hotTakes', question: 'What are your strongest/most controversial opinions?', placeholder: 'Your hot takes...' },
    { key: 'politics', question: 'Where do you stand politically? (optional)', placeholder: 'Your political views...' },
    { key: 'technology', question: 'What do you think about AI and technology?', placeholder: 'Your tech philosophy...' },
    { key: 'life', question: 'What\'s your philosophy on life?', placeholder: 'How you see the world...' },
  ],
}

export const CATEGORY_LABELS = {
  identity: 'Identity',
  personality: 'Personality',
  lifeStory: 'Life Story',
  values: 'Values',
  habits: 'Habits',
  dreams: 'Dreams',
  fears: 'Fears',
  opinions: 'Opinions',
}

export const CATEGORY_ICONS = {
  identity: '👤',
  personality: '🧠',
  lifeStory: '📖',
  values: '💎',
  habits: '⚡',
  dreams: '🚀',
  fears: '🌑',
  opinions: '💬',
}
