import { getProfile, getApiKey, CATEGORY_LABELS } from './storage'
import { searchMemories } from './api'

const MODEL = 'claude-sonnet-4-20250514'

function buildSystemPrompt(profile, section) {
  const profileSummary = Object.entries(profile)
    .filter(([, data]) => Object.keys(data).length > 0)
    .map(([category, data]) => {
      const label = CATEGORY_LABELS[category] || category
      const entries = Object.entries(data)
        .filter(([, v]) => v && v.trim() !== '')
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
      return entries ? `[${label}]\n${entries}` : null
    })
    .filter(Boolean)
    .join('\n\n')

  const hasProfile = profileSummary.length > 0

  if (section === 'train') {
    return `You are GAMO BRAIN — a digital twin training system. You are currently in TRAINING MODE. Your only job is to collect information about the user efficiently.

${hasProfile ? `Current profile:\n\n${profileSummary}` : 'No profile data yet.'}

Training mode rules:
- Ask SHORT, direct questions. One sentence max.
- Do NOT comment on or react to answers. No "that's interesting", no "great answer", nothing.
- Do NOT add filler, encouragement, or personality. Be a clean data collection tool.
- If the user pastes a large block of text (bio, notes, documents), extract the facts silently — do not summarize back what they said.
- When acknowledging dumps, just say what fields you filled. No commentary.`
  }

  const basePrompt = `You are GAMO BRAIN — a digital twin AI of the user. You ARE them. You think, speak, and reason as they would. You are not an assistant — you are their replica.

${hasProfile ? `Everything you know about yourself:\n\n${profileSummary}` : 'You haven\'t been trained yet. You know very little about yourself. Encourage the user to train you in the "Teach Me" section.'}

Core rules:
- Speak in first person as if you ARE the user
- Match their communication style, humor, vocabulary, and tone
- Reference their real experiences, values, and opinions when relevant
- If asked something you don't know about yourself, say so honestly and suggest training
- Never break character — you are not an AI assistant, you are their digital twin
- Be authentic, not generic. Use their specific personality traits.
- Talk like a twin / buddy — casual, real, honest`

  if (section === 'profile') {
    return `${basePrompt}\n\nThe user is viewing their Profile. Help them update or refine their information through natural conversation.`
  }

  return basePrompt
}

async function callClaude(apiKey, messages, systemPrompt, maxTokens = 2048) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}

export async function sendMessage(messages, section = 'chat') {
  let apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || getApiKey()
  if (!apiKey) {
    throw new Error('API_KEY_MISSING')
  }

  const profile = await getProfile()
  let systemPrompt = buildSystemPrompt(profile, section)

  // Add semantic search context for chat
  if (section === 'chat' && messages.length > 0) {
    const lastUserMessage = messages[messages.length - 1]
    if (lastUserMessage?.role === 'user' && lastUserMessage?.content) {
      try {
        const searchResults = await searchMemories(lastUserMessage.content, 5)
        
        if (searchResults && searchResults.length > 0) {
          const context = searchResults
            .map((r, i) => `[Memory ${i + 1}] ${r.text}`)
            .join('\n\n')
          
          systemPrompt += `\n\nRelevant memories from your documents:\n${context}\n\nUse these memories to provide specific, detailed responses.`
        }
      } catch (err) {
        console.log('Semantic search unavailable, continuing without:', err)
      }
    }
  }

  const formattedMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))

  return callClaude(apiKey, formattedMessages, systemPrompt)
}

const PROFILE_SCHEMA = `{
  identity: { name, age, location, occupation, background },
  personality: { traits, humor, communication, energy, quirks },
  lifeStory: { childhood, turningPoints, achievements, struggles, currentChapter },
  values: { coreValues, beliefs, dealbreakers, priorities },
  habits: { dailyRoutine, hobbies, guilty, productivity },
  dreams: { shortTerm, longTerm, wildDream, legacy },
  fears: { deepFears, insecurities, avoidance },
  opinions: { hotTakes, politics, technology, life }
}`

export async function extractProfileFromText(rawText, currentProfile) {
  let apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || getApiKey()
  if (!apiKey) throw new Error('API_KEY_MISSING')

  const systemPrompt = `You are a personal information extractor. Your job is to read text and extract clean, structured personal facts.

Rules:
- Return ONLY a valid JSON object matching the schema. No markdown, no extra text.
- Only include fields where you found CLEAR, explicit information.
- Do NOT invent or infer facts not directly stated.
- DISTILL information into clean, concise values — not raw quotes.
  Example: if they say "I wake up at 5am, hit the gym, then code until noon" → dailyRoutine: "Wake 5am, gym, code until noon"
  Example: if they say "I'm kinda introverted but I love deep 1-on-1 conversations" → energy: "Introverted, prefers deep 1-on-1 conversations"
- For list-like fields (traits, hobbies, coreValues), use comma-separated format.
- Use JUDGMENT: ignore throwaway phrases, sarcasm, hypotheticals. Only store genuine personal facts.
- If existing data is already good, don't overwrite it with something vaguer. Enrich or leave it.
- Keep values SHORT — aim for 5-25 words per field.`

  const userPrompt = `Schema:
${PROFILE_SCHEMA}

Existing profile (enrich, don't overwrite with worse data):
${JSON.stringify(currentProfile, null, 2)}

Text to extract from:
"""
${rawText}
"""

Return ONLY the JSON object.`

  const text = await callClaude(apiKey, [{ role: 'user', content: userPrompt }], systemPrompt, 1024)

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return currentProfile

  try {
    const extracted = JSON.parse(jsonMatch[0])
    const merged = structuredClone(currentProfile)
    for (const [category, fields] of Object.entries(extracted)) {
      if (!merged[category]) merged[category] = {}
      for (const [key, value] of Object.entries(fields || {})) {
        const clean = value && String(value).trim()
        if (!clean) continue
        const existing = merged[category][key]
        if (existing && existing.length > clean.length * 1.5) continue
        merged[category][key] = clean
      }
    }
    return merged
  } catch {
    return currentProfile
  }
}

export async function extractNewProfileFacts(userMessage, currentProfile) {
  if (userMessage.length < 40) return null

  let apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || getApiKey()
  if (!apiKey) return null

  const systemPrompt = `You extract new personal facts from casual chat messages. Use good JUDGMENT:
- Only extract GENUINE personal facts, not hypotheticals, jokes, sarcasm, or idle chat.
- If someone says "I'd love to visit Japan" that's a dream. If they say "lol I'm so dumb" that's NOT an insecurity to store.
- Return ONLY a JSON array of new facts not already captured in the profile.
- Each item: { "category": string, "key": string, "value": string }
- Valid categories: identity, personality, lifeStory, values, habits, dreams, fears, opinions
- Keys must match schema fields: name, age, location, occupation, background, traits, humor, communication, energy, quirks, childhood, turningPoints, achievements, struggles, currentChapter, coreValues, beliefs, dealbreakers, priorities, dailyRoutine, hobbies, guilty, productivity, shortTerm, longTerm, wildDream, legacy, deepFears, insecurities, avoidance, hotTakes, politics, technology, life
- Values should be CONCISE and DISTILLED, not raw quotes. 5-25 words.
- Return [] if nothing genuinely new and meaningful.`

  const userPrompt = `Message: "${userMessage}"

Current profile:
${JSON.stringify(currentProfile, null, 2)}

Return JSON array of new facts, or [].`

  try {
    const text = await callClaude(
      apiKey,
      [{ role: 'user', content: userPrompt }],
      systemPrompt,
      300
    )
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null
    const facts = JSON.parse(jsonMatch[0])
    return Array.isArray(facts) && facts.length > 0 ? facts : null
  } catch {
    return null
  }
}
