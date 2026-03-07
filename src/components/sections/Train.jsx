import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getProfile, saveProfile, TRAINING_QUESTIONS, CATEGORY_LABELS,
} from '../../utils/storage'
import { sendMessage, extractProfileFromText } from '../../utils/claudeAPI'
import { saveDocument } from '../../utils/api'

const ALL_QUESTIONS = Object.entries(TRAINING_QUESTIONS).flatMap(([category, questions]) =>
  questions.map(q => ({ ...q, category }))
)

export default function Train({ externalMessage, onExternalMessageHandled }) {
  const [messages, setMessages] = useState([])
  const [phase, setPhase] = useState('dump') // 'dump' | 'questions' | 'done'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [waitingForAnswer, setWaitingForAnswer] = useState(false)
  const [dumpCount, setDumpCount] = useState(0)
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
      setMessages([{
        role: 'assistant',
        content: 'Paste anything about yourself — bio, notes, journal entries, LinkedIn, documents, whatever you have. I\'ll extract what matters.\n\nYou can paste multiple things one after another. When you\'re done, type "done" to start questions.',
        timestamp: Date.now(),
      }])
      setWaitingForAnswer(true)
    }
  }, [])

  useEffect(() => {
    if (externalMessage && externalMessage !== processedRef.current) {
      processedRef.current = externalMessage
      handleAnswer(externalMessage)
      onExternalMessageHandled?.()
    }
  }, [externalMessage, onExternalMessageHandled])

  const startQuestions = async () => {
    setPhase('questions')
    setCurrentQuestionIndex(0)
    await askNextQuestion(0)
  }

  const handleDump = async (text) => {
    const lower = text.trim().toLowerCase()

    if (lower === 'done' || lower === 'skip') {
      const userMsg = { role: 'user', content: text, timestamp: Date.now() }
      setMessages(prev => [...prev, userMsg])
      setWaitingForAnswer(false)

      if (dumpCount === 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'No problem. Let\'s go straight to questions.',
          timestamp: Date.now(),
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Got it — absorbed ${dumpCount} ${dumpCount === 1 ? 'entry' : 'entries'}. Now let me fill in the gaps.`,
          timestamp: Date.now(),
        }])
      }
      setTimeout(() => startQuestions(), 600)
      return
    }

    const userMsg = { role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setWaitingForAnswer(false)

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'Processing document and generating embeddings...',
      timestamp: Date.now(),
      isThinking: true,
    }])

    const profile = await getProfile()
    let documentSaved = false
    let chunks = 0
    
    try {
      // 1. Save as full document (with embeddings)
      const docResult = await saveDocument(text, 'training_dump', {
        source: 'manual_paste',
        category: 'training',
        timestamp: Date.now()
      })
      documentSaved = true
      chunks = docResult.chunks || 0
      console.log('Document saved:', docResult)

      // 2. Extract to profile for quick facts
      const enriched = await extractProfileFromText(text, profile)
      await saveProfile(enriched)

      const newFields = []
      for (const [cat, fields] of Object.entries(enriched)) {
        for (const [key, val] of Object.entries(fields || {})) {
          if (val && (!profile[cat]?.[key] || profile[cat][key] !== val)) {
            newFields.push(key)
          }
        }
      }

      setMessages(prev => prev.filter(m => !m.isThinking))
      const summary = documentSaved
        ? `Document saved (${chunks} chunks, embeddings generated).\nLearned: ${newFields.length > 0 ? newFields.slice(0, 6).join(', ') + (newFields.length > 6 ? ` (+${newFields.length - 6} more)` : '') : 'processing'}.\n\nPaste more, or type "done" to start questions.`
        : 'Got it. Paste more, or type "done" to start questions.'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: summary,
        timestamp: Date.now(),
      }])
    } catch (err) {
      console.error('Document processing error:', err)
      setMessages(prev => prev.filter(m => !m.isThinking))
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Saved locally. Paste more, or type "done" to start questions.',
        timestamp: Date.now(),
      }])
    }

    setDumpCount(prev => prev + 1)
    setWaitingForAnswer(true)
  }

  const askNextQuestion = async (indexOverride) => {
    const index = indexOverride !== undefined ? indexOverride : currentQuestionIndex

    if (index >= ALL_QUESTIONS.length) {
      setPhase('done')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Training complete. Go to "Meet GAMO" to talk.',
        timestamp: Date.now(),
      }])
      setWaitingForAnswer(false)
      return
    }

    const q = ALL_QUESTIONS[index]
    const profile = await getProfile()
    const existingAnswer = profile[q.category]?.[q.key]
    const catLabel = CATEGORY_LABELS[q.category] || q.category

    let questionText = q.question
    if (existingAnswer) {
      questionText = `[${catLabel}] ${q.question}\n(Current: "${existingAnswer}" — press enter to keep, or type new answer)`
    } else {
      questionText = `[${catLabel}] ${q.question}`
    }

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: questionText,
      timestamp: Date.now(),
    }])
    setWaitingForAnswer(true)
  }

  const handleAnswer = async (text) => {
    if (!waitingForAnswer) return

    if (phase === 'dump') {
      handleDump(text)
      return
    }

    const userMsg = { role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])

    const q = ALL_QUESTIONS[currentQuestionIndex]
    const profile = await getProfile()

    const trimmed = text.trim()
    if (trimmed) {
      if (!profile[q.category]) profile[q.category] = {}
      profile[q.category][q.key] = trimmed
      await saveProfile(profile)
    }

    setWaitingForAnswer(false)
    const nextIndex = currentQuestionIndex + 1
    setCurrentQuestionIndex(nextIndex)

    setTimeout(() => {
      askNextQuestion(nextIndex)
    }, 300)
  }

  const progress = phase === 'questions'
    ? Math.round((currentQuestionIndex / ALL_QUESTIONS.length) * 100)
    : phase === 'done' ? 100 : 0

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      maxWidth: 760,
      margin: '0 auto',
      padding: '0 12px',
    }}>
      {phase === 'questions' && (
        <div style={{
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          paddingBottom: 8,
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 4px',
          }}>
            <div style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'rgba(0,255,65,0.5)',
                borderRadius: 2,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <span style={{
              fontSize: 11,
              fontFamily: '"Courier New", monospace',
              color: 'rgba(0,255,65,0.5)',
              flexShrink: 0,
            }}>
              {currentQuestionIndex}/{ALL_QUESTIONS.length}
            </span>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingTop: phase !== 'questions' ? 70 : 8,
          paddingBottom: 90,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
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
                maxWidth: msg.role === 'user' ? '85%' : '90%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user'
                    ? 'rgba(0,212,255,0.1)'
                    : msg.isThinking
                      ? 'rgba(0,255,65,0.04)'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    msg.role === 'user'
                      ? 'rgba(0,212,255,0.2)'
                      : msg.isThinking
                        ? 'rgba(0,255,65,0.15)'
                        : 'rgba(255,255,255,0.06)'
                  }`,
                  color: msg.isThinking ? 'rgba(0,255,65,0.6)' : 'rgba(255,255,255,0.85)',
                  fontFamily: msg.isThinking ? '"Courier New", monospace' : 'Inter, sans-serif',
                  fontSize: msg.isThinking ? 12 : 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.role === 'assistant' && !msg.isThinking && (
                    <span style={{
                      fontSize: 10,
                      color: '#00D4FF',
                      fontFamily: '"Courier New", monospace',
                      fontWeight: 700,
                      display: 'block',
                      marginBottom: 3,
                      opacity: 0.6,
                    }}>GAMO</span>
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
      </div>
    </div>
  )
}
