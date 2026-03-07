import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getProfile, saveProfile, TRAINING_QUESTIONS, CATEGORY_LABELS,
} from '../../utils/storage'
import { sendMessage } from '../../utils/claudeAPI'

const ALL_QUESTIONS = Object.entries(TRAINING_QUESTIONS).flatMap(([category, questions]) =>
  questions.map(q => ({ ...q, category }))
)

export default function Train({ externalMessage, onExternalMessageHandled }) {
  const [messages, setMessages] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [waitingForAnswer, setWaitingForAnswer] = useState(false)
  const scrollRef = useRef(null)
  const processedRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const getInitialGreeting = async () => {
        setWaitingForAnswer(true)
        try {
          const reply = await sendMessage([{ role: 'user', content: 'Greet me and explain that you need to learn about me through questions.' }], 'train')
          const greeting = {
            role: 'assistant',
            content: reply,
            timestamp: Date.now(),
          }
          setMessages([greeting])
          setTimeout(() => {
            askNextQuestion()
          }, 1500)
        } catch (err) {
          const errorMsg = {
            role: 'assistant',
            content: err.message === 'API_KEY_MISSING'
              ? 'I need a Claude API key to think. Check the .env file.'
              : `Something went wrong: ${err.message}`,
            timestamp: Date.now(),
            isError: true,
          }
          setMessages([errorMsg])
          setWaitingForAnswer(false)
        }
      }
      getInitialGreeting()
    }
  }, [])

  useEffect(() => {
    if (externalMessage && externalMessage !== processedRef.current) {
      processedRef.current = externalMessage
      handleAnswer(externalMessage)
      onExternalMessageHandled?.()
    }
  }, [externalMessage, onExternalMessageHandled])

  const askNextQuestion = async () => {
    if (currentQuestionIndex >= ALL_QUESTIONS.length) {
      try {
        const reply = await sendMessage([{ role: 'user', content: 'Thank me for completing the training and tell me I can now talk to you in "Meet GAMO".' }], 'train')
        const completion = {
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, completion])
      } catch (err) {
        const errorMsg = {
          role: 'assistant',
          content: 'Training complete! Go to "Meet GAMO" to talk to me.',
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, errorMsg])
      }
      setWaitingForAnswer(false)
      return
    }

    const q = ALL_QUESTIONS[currentQuestionIndex]
    const profile = await getProfile()
    const existingAnswer = profile[q.category]?.[q.key]

    let questionPrompt = `Ask this question naturally: "${q.question}"`
    if (existingAnswer) {
      questionPrompt += ` The user previously answered: "${existingAnswer}". Mention this and ask if they want to update it.`
    }

    try {
      const reply = await sendMessage([{ role: 'user', content: questionPrompt }], 'train')
      const questionMsg = {
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, questionMsg])
    } catch (err) {
      const questionMsg = {
        role: 'assistant',
        content: q.question,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, questionMsg])
    }
    
    setWaitingForAnswer(true)
  }

  const handleAnswer = async (text) => {
    if (!waitingForAnswer) return

    const userMsg = { role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])

    const q = ALL_QUESTIONS[currentQuestionIndex]
    const profile = await getProfile()
    if (!profile[q.category]) profile[q.category] = {}
    profile[q.category][q.key] = text
    await saveProfile(profile)

    setWaitingForAnswer(false)
    setCurrentQuestionIndex(prev => prev + 1)

    try {
      const reply = await sendMessage([
        { role: 'user', content: `I just told you: "${text}". Acknowledge this briefly and naturally.` }
      ], 'train')
      const ack = {
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, ack])
    } catch (err) {
      const ack = {
        role: 'assistant',
        content: 'Got it.',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, ack])
    }

    setTimeout(() => {
      askNextQuestion()
    }, 800)
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
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    msg.role === 'user'
                      ? 'rgba(0,212,255,0.2)'
                      : 'rgba(255,255,255,0.06)'
                  }`,
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.role === 'assistant' && (
                    <span style={{
                      fontSize: 11,
                      color: '#00D4FF',
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
      </div>
    </div>
  )
}
