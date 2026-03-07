import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

const PLACEHOLDERS = [
  'Ask GAMO anything...',
  'Who are you?',
  'What would I do if...',
  'Train me...',
  'Paste a bio, notes, anything...',
]

const MAX_TEXTAREA_HEIGHT = 160

export default function ChatBar({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [placeholderVisible, setPlaceholderVisible] = useState(true)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const textareaRef = useRef(null)
  const initialViewportHeight = useRef(window.innerHeight)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false)
      setTimeout(() => {
        setPlaceholderIndex(i => (i + 1) % PLACEHOLDERS.length)
        setPlaceholderVisible(true)
      }, 300)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  // Detect keyboard open/close on mobile
  useEffect(() => {
    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDiff = initialViewportHeight.current - currentHeight
      // If viewport shrunk by more than 150px, keyboard is likely open
      setIsKeyboardOpen(heightDiff > 150)
    }

    window.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('resize', handleResize)
    }
  }, [])

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT) + 'px'
  }, [])

  useEffect(() => {
    autoResize()
  }, [value, autoResize])

  const handleSubmit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.5 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        padding: '8px',
        paddingBottom: isKeyboardOpen ? '8px' : 'max(10px, env(safe-area-inset-bottom))',
        background: isKeyboardOpen ? 'rgba(8,8,8,0.98)' : 'transparent',
        transition: 'background 0.2s ease',
      }}
    >
      <div
        className="chat-bar-container"
        style={{
          maxWidth: 720,
          margin: '0 auto',
          position: 'relative',
        }}
      >
        <div
          className={`glass-chat-bar ${focused ? 'focused' : ''}`}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${focused ? 'rgba(0,255,65,0.4)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: focused
              ? '0 0 30px rgba(0,255,65,0.15), 0 0 60px rgba(0,255,65,0.05), inset 0 0 30px rgba(0,255,65,0.03)'
              : '0 4px 30px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'rgba(0,255,65,0.8)',
            boxShadow: '0 0 8px rgba(0,255,65,0.6)',
            flexShrink: 0,
            marginBottom: 8,
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />

          <div style={{ flex: 1, position: 'relative', minHeight: 22 }}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              onFocus={() => {
                setFocused(true)
                // Scroll into view on mobile when focused
                setTimeout(() => {
                  textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }, 300)
              }}
              onBlur={() => setFocused(false)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              rows={1}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'rgba(255,255,255,0.95)',
                fontSize: 16, // Prevent zoom on iOS
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                caretColor: 'rgba(0,255,65,0.8)',
                resize: 'none',
                overflow: 'auto',
                lineHeight: 1.5,
                maxHeight: isKeyboardOpen ? 120 : MAX_TEXTAREA_HEIGHT,
                WebkitUserSelect: 'text',
                userSelect: 'text',
              }}
              placeholder=""
            />
            {!value && !focused && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 2,
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: 16, // Match textarea to prevent layout shift
                  fontFamily: 'Inter, sans-serif',
                  pointerEvents: 'none',
                  opacity: placeholderVisible ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}
              >
                {PLACEHOLDERS[placeholderIndex]}
              </span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            style={{
              background: value.trim() ? 'rgba(0,255,65,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${value.trim() ? 'rgba(0,255,65,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10,
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: value.trim() ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={value.trim() ? 'rgba(0,255,65,0.9)' : 'rgba(255,255,255,0.3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
