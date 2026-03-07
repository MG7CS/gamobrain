import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProfile, updateProfileField } from '../../utils/storage'
import { sendMessage, extractNewProfileFacts } from '../../utils/claudeAPI'

const CHAT_STORAGE_KEY = 'gamo_chat_history'
const MAX_HISTORY = 50

function loadStoredHistory() {
  try {
    const data = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!data) return []
    const history = JSON.parse(data)
    return Array.isArray(history) ? history.slice(-MAX_HISTORY) : []
  } catch {
    return []
  }
}

function saveHistory(messages) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // localStorage full or unavailable
  }
}

export default function Home({ externalMessage, onExternalMessageHandled }) {
  const [messages, setMessages] = useState(() => loadStoredHistory())
  const [loading, setLoading] = useState(false)
  const [learnedFact, setLearnedFact] = useState(null)
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  const scrollRef = useRef(null)
  const processedRef = useRef(null)
  const learnedFactTimer = useRef(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Handle viewport height changes (keyboard open/close)
  useEffect(() => {
    const updateHeight = () => {
      // Use visualViewport if available (better for mobile)
      const height = window.visualViewport?.height || window.innerHeight
      setViewportHeight(height)
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('resize', updateHeight)
    }
  }, [])

  useEffect(() => {
    if (externalMessage && externalMessage !== processedRef.current) {
      processedRef.current = externalMessage
      handleSend(externalMessage)
      onExternalMessageHandled?.()
    }
  }, [externalMessage, onExternalMessageHandled])

  const showLearnedToast = (label) => {
    if (learnedFactTimer.current) clearTimeout(learnedFactTimer.current)
    setLearnedFact(label)
    learnedFactTimer.current = setTimeout(() => setLearnedFact(null), 4000)
  }

  const extractAndLearn = async (userText) => {
    try {
      const profile = await getProfile()
      const newFacts = await extractNewProfileFacts(userText, profile)
      if (!newFacts) return
      for (const { category, key, value } of newFacts) {
        await updateProfileField(category, key, value)
      }
      const label = newFacts.length === 1
        ? `${newFacts[0].key}: ${newFacts[0].value}`
        : `${newFacts.length} new things`
      showLearnedToast(label)
    } catch {
      // Silent fail
    }
  }

  const handleSend = async (text) => {
    const userMsg = { role: 'user', content: text, timestamp: Date.now() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    extractAndLearn(text)

    try {
      const reply = await sendMessage(updated, 'chat')
      const assistantMsg = { role: 'assistant', content: reply, timestamp: Date.now() }
      const final = [...updated, assistantMsg]
      setMessages(final)
      saveHistory(final)
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: err.message === 'API_KEY_MISSING'
          ? 'I need a Claude API key to think. Check the .env file.'
          : `Something went wrong: ${err.message}`,
        timestamp: Date.now(),
        isError: true,
      }
      const final = [...updated, errorMsg]
      setMessages(final)
      saveHistory(final)
    } finally {
      setLoading(false)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{
      height: `${viewportHeight}px`,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      maxWidth: 760,
      margin: '0 auto',
      padding: '0 12px',
      overflow: 'hidden',
    }}>
      <AnimatePresence>
        {!hasMessages && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 0,
              width: '90%',
              maxWidth: '500px',
            }}
          >
            <h1 style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 'clamp(22px, 5vw, 42px)',
              fontWeight: 700,
              color: 'rgba(0,255,65,0.5)',
              letterSpacing: '0.12em',
              lineHeight: 1.2,
              margin: 0,
              textShadow: '0 0 10px rgba(0,255,65,0.3), 0 0 20px rgba(0,255,65,0.1)',
              textTransform: 'uppercase',
            }}>
              {'<GAMO_BRAIN/>'}
            </h1>
            <p style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 'clamp(10px, 2vw, 12px)',
              color: 'rgba(255,255,255,0.2)',
              fontWeight: 400,
              marginTop: 12,
              letterSpacing: '0.03em',
              lineHeight: 1.4,
            }}>
              I am Moise Gasana's virtual Brain. Created 3/6/2026 at 7:33pm
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingTop: hasMessages ? 70 : 0,
          paddingBottom: 80,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          position: 'relative',
          zIndex: 1,
          WebkitOverflowScrolling: 'touch',
          WebkitUserSelect: 'text',
          userSelect: 'text',
          minHeight: 0,
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.timestamp + '-' + i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user'
                    ? 'rgba(0,212,255,0.1)'
                    : msg.isError
                      ? 'rgba(255,80,80,0.08)'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    msg.role === 'user'
                      ? 'rgba(0,212,255,0.2)'
                      : msg.isError
                        ? 'rgba(255,80,80,0.15)'
                        : 'rgba(255,255,255,0.06)'
                  }`,
                  color: msg.isError ? 'rgba(255,150,150,0.9)' : 'rgba(255,255,255,0.85)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.role === 'assistant' && (
                    <span style={{
                      fontSize: 10,
                      color: msg.isError ? 'rgba(255,150,150,0.7)' : '#00D4FF',
                      fontFamily: '"Courier New", monospace',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 3,
                      opacity: 0.6,
                    }}>GAMO BRAIN</span>
                  )}
                  {msg.content}
                </div>
                <span style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.15)',
                  fontFamily: '"Courier New", monospace',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  paddingLeft: msg.role === 'user' ? 0 : 4,
                  paddingRight: msg.role === 'user' ? 4 : 0,
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <div style={{
              padding: '10px 16px',
              borderRadius: '12px 12px 12px 4px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 5,
              alignItems: 'center',
            }}>
              <span style={{
                fontSize: 10,
                color: '#00D4FF',
                fontFamily: '"Courier New", monospace',
                fontWeight: 700,
                marginRight: 4,
                opacity: 0.6,
              }}>GAMO</span>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#00D4FF',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {learnedFact && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,255,65,0.08)',
              border: '1px solid rgba(0,255,65,0.2)',
              borderRadius: 8,
              padding: '5px 12px',
              fontFamily: '"Courier New", monospace',
              fontSize: 10,
              color: 'rgba(0,255,65,0.6)',
              whiteSpace: 'nowrap',
              zIndex: 100,
              pointerEvents: 'none',
            }}
          >
            GAMO learned: {learnedFact}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
