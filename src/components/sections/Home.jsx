import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProfile } from '../../utils/storage'
import { sendMessage } from '../../utils/claudeAPI'

export default function Home({ externalMessage, onExternalMessageHandled }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const processedRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // No initial greeting - user sends first message

  useEffect(() => {
    if (externalMessage && externalMessage !== processedRef.current) {
      processedRef.current = externalMessage
      handleSend(externalMessage)
      onExternalMessageHandled?.()
    }
  }, [externalMessage, onExternalMessageHandled])

  const handleSend = async (text) => {
    const userMsg = { role: 'user', content: text, timestamp: Date.now() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    try {
      const reply = await sendMessage(updated, 'chat')
      const assistantMsg = { role: 'assistant', content: reply, timestamp: Date.now() }
      const final = [...updated, assistantMsg]
      setMessages(final)
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
    } finally {
      setLoading(false)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{
      minHeight: '100vh',
      padding: '60px 16px 140px',
      maxWidth: 760,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: hasMessages ? 0.08 : 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 0,
          width: '90%',
          maxWidth: '600px',
        }}
      >
        <h1 style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: 'clamp(24px, 6vw, 48px)',
          fontWeight: 700,
          color: 'rgba(0,255,65,0.5)',
          letterSpacing: '0.15em',
          lineHeight: 1.2,
          margin: 0,
          textShadow: '0 0 10px rgba(0,255,65,0.3), 0 0 20px rgba(0,255,65,0.1)',
          textTransform: 'uppercase',
          wordBreak: 'break-all',
        }}>
          {'<GAMO_BRAIN/>'}
        </h1>
        <p style={{
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: 'clamp(10px, 2vw, 13px)',
          color: 'rgba(255,255,255,0.25)',
          fontWeight: 400,
          marginTop: 16,
          letterSpacing: '0.03em',
          lineHeight: 1.4,
          padding: '0 8px',
        }}>
          I am Moise Gasana's virtual Brain. Created 3/6/2026 at 7:33pm
        </p>
      </motion.div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingBottom: 20,
          paddingTop: hasMessages ? 60 : 0,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.timestamp + '-' + i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
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
                      fontSize: 11,
                      color: msg.isError ? 'rgba(255,150,150,0.7)' : '#00D4FF',
                      fontFamily: 'Space Mono',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 4,
                      opacity: 0.7,
                    }}>GAMO BRAIN</span>
                  )}
                  {msg.content}
                </div>
                <span style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.2)',
                  fontFamily: 'Courier New, monospace',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  paddingLeft: msg.role === 'user' ? 0 : 4,
                  paddingRight: msg.role === 'user' ? 4 : 0,
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true 
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', justifyContent: 'flex-start' }}
          >
            <div style={{
              padding: '12px 20px',
              borderRadius: '14px 14px 14px 4px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}>
              <span style={{
                fontSize: 11,
                color: '#00D4FF',
                fontFamily: 'Space Mono',
                fontWeight: 700,
                marginRight: 4,
                opacity: 0.7,
              }}>GAMO BRAIN</span>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#00D4FF',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
