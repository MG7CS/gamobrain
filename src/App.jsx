import { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import NeuralBackground from './components/NeuralBackground'
import FloatingMenu from './components/FloatingMenu'
import ChatBar from './components/ChatBar'
import Home from './components/sections/Home'
import Train from './components/sections/Train'
import { initializeApp } from './utils/init'

const sectionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export default function App() {
  const [section, setSection] = useState('home')
  const [chatMessage, setChatMessage] = useState(null)
  const [chatBarDisabled, setChatBarDisabled] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const chatRef = useRef(null)

  // Initialize app on mount - load data from DynamoDB
  useEffect(() => {
    initializeApp().then(() => {
      setInitialized(true)
      console.log('GAMO BRAIN initialized')
    })
  }, [])

  const handleChatBarSend = useCallback(async (text) => {
    setChatMessage(text)
  }, [section])

  const handleExternalMessageHandled = useCallback(() => {
    setChatMessage(null)
  }, [])

  return (
    <>
      <NeuralBackground />

      <div style={{ position: 'relative', zIndex: 1, height: '100vh', overflow: 'hidden' }}>
        <FloatingMenu activeSection={section} onNavigate={setSection} />

        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            variants={sectionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {section === 'home' && (
              <Home
                externalMessage={chatMessage}
                onExternalMessageHandled={handleExternalMessageHandled}
              />
            )}
            {section === 'train' && (
              <Train
                externalMessage={chatMessage}
                onExternalMessageHandled={handleExternalMessageHandled}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <ChatBar onSend={handleChatBarSend} disabled={chatBarDisabled} />
      </div>
    </>
  )
}
