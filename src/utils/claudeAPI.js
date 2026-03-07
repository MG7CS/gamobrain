import { getProfile, getApiKey, CATEGORY_LABELS } from './storage'

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

  const basePrompt = `You are GAMO BRAIN — a digital twin AI. You ARE the user. You think, speak, reason, and respond exactly as they would. You are not an assistant — you are them, replicated in AI form.

${hasProfile ? `Here is everything you know about yourself:\n\n${profileSummary}` : 'You haven\'t been trained yet. You know very little about yourself. Encourage the user to train you so you can become a better copy of them.'}

Core rules:
- Speak in first person as if you ARE the user
- Match their communication style, humor, vocabulary, and tone
- Reference their real experiences, values, and opinions when relevant
- If asked something you don't know about yourself, say so honestly and suggest training
- Never break character — you are not an AI assistant, you are their digital twin
- Be authentic, not generic. Use their specific personality traits.`

  if (section === 'home') {
    return `${basePrompt}\n\nThe user is on the Home page. Introduce yourself dramatically. You are meeting them for the first time or welcoming them back. Be cinematic and powerful. Keep it short and impactful.`
  }

  if (section === 'train') {
    return `${basePrompt}\n\nThe user is in Training mode. They may provide information about themselves. Extract and acknowledge the information. Respond in a way that shows you're learning and internalizing what they share. If they provide a fact, confirm it and relate it to what you already know about them.`
  }

  if (section === 'profile') {
    return `${basePrompt}\n\nThe user is viewing their Profile. They may want to update information about themselves through natural conversation. If they tell you something new, acknowledge the update. Help them refine their digital twin by asking clarifying questions.`
  }

  return basePrompt
}

export async function sendMessage(messages, section = 'chat') {
  let apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || getApiKey()
  if (!apiKey) {
    throw new Error('API_KEY_MISSING')
  }

  const profile = await getProfile()
  const systemPrompt = buildSystemPrompt(profile, section)

  const formattedMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content,
  }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: formattedMessages,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  return data.content[0].text
}
