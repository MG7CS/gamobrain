import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getMenuPosition, saveMenuPosition } from '../utils/storage'

const NAV_ITEMS = [
  { id: 'home', label: 'Meet GAMO', icon: '⌂' },
  { id: 'train', label: 'Teach Me', icon: '◉' },
]

export default function FloatingMenu({ activeSection, onNavigate }) {
  const [expanded, setExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 24, y: 24 })
  const [isMobile, setIsMobile] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const hasMoved = useRef(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isMobile) return
    const saved = getMenuPosition()
    if (saved) setPosition(saved)
  }, [isMobile])

  const onPointerDown = useCallback((e) => {
    if (isMobile) return
    e.preventDefault()
    setDragging(true)
    hasMoved.current = false
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y,
    }
  }, [isMobile, position])

  useEffect(() => {
    if (!dragging) return

    const onMove = (e) => {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true
      const newPos = {
        x: Math.max(0, Math.min(window.innerWidth - 60, dragStart.current.px + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 60, dragStart.current.py + dy)),
      }
      setPosition(newPos)
    }

    const onUp = () => {
      setDragging(false)
      saveMenuPosition(position)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, position])

  const handleClick = () => {
    if (!hasMoved.current) setExpanded(prev => !prev)
  }

  const handleNav = (id) => {
    onNavigate(id)
    setExpanded(false)
  }

  if (isMobile) {
    return (
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          paddingTop: 'max(8px, env(safe-area-inset-top))',
          paddingLeft: 12,
          paddingRight: 12,
          paddingBottom: 8,
          background: 'rgba(8,8,8,0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        <div className="glass-menu" style={{
          display: 'flex',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 16,
          justifyContent: 'center',
        }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                background: activeSection === item.id ? 'rgba(0,255,65,0.15)' : 'transparent',
                border: 'none',
                color: activeSection === item.id ? 'rgba(0,255,65,0.9)' : 'rgba(255,255,255,0.5)',
                padding: '8px 18px',
                borderRadius: 10,
                fontSize: 12,
                fontFamily: '"Courier New", monospace',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.05em',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={dragRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
    >
      <motion.div
        className="glass-menu"
        layout
        style={{
          borderRadius: expanded ? 16 : 20,
          padding: expanded ? '12px 16px' : '10px 20px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: expanded ? 12 : 0,
        }}
        onMouseEnter={() => !dragging && setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <motion.div
          onClick={handleClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.8)',
            fontFamily: '"Space Mono", monospace',
            letterSpacing: '0.1em',
          }}>
            GAMO BRAIN
          </span>
        </motion.div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {NAV_ITEMS.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleNav(item.id)}
                    style={{
                      background: activeSection === item.id ? 'rgba(0,212,255,0.15)' : 'transparent',
                      border: 'none',
                      color: activeSection === item.id ? '#00D4FF' : 'rgba(255,255,255,0.6)',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => {
                      if (activeSection !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }}
                    onMouseOut={e => {
                      if (activeSection !== item.id) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
