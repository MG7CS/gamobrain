import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const AUTH_KEY = 'gamo_brain_auth'
const PASSWORD_HASH = 'a142a4d70342652ed9c215ff2fbbcec846d7b924af18eaf1ec4078c394f42d2c' // SHA-256 of "admin"

// Simple SHA-256 hash function
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function AuthGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const authToken = localStorage.getItem(AUTH_KEY)
    if (authToken === PASSWORD_HASH) {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!password) {
      setError('Please enter a password')
      return
    }

    const hash = await hashPassword(password)
    
    if (hash === PASSWORD_HASH) {
      localStorage.setItem(AUTH_KEY, hash)
      setIsAuthenticated(true)
      setPassword('')
    } else {
      setError('Incorrect password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY)
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080808',
      }}>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            fontSize: 14,
            color: 'rgba(0,255,65,0.6)',
            fontFamily: '"Courier New", monospace',
          }}
        >
          Loading...
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080808',
        padding: '0 20px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: 400,
          }}
        >
          <div style={{
            textAlign: 'center',
            marginBottom: 40,
          }}>
            <h1 style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 'clamp(28px, 6vw, 48px)',
              fontWeight: 700,
              color: 'rgba(0,255,65,0.6)',
              letterSpacing: '0.12em',
              margin: 0,
              textShadow: '0 0 10px rgba(0,255,65,0.3)',
              textTransform: 'uppercase',
            }}>
              {'<GAMO_BRAIN/>'}
            </h1>
            <p style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 12,
              color: 'rgba(255,255,255,0.3)',
              marginTop: 12,
              letterSpacing: '0.05em',
            }}>
              Authentication Required
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 24,
            }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: '"Courier New", monospace',
                marginBottom: 8,
                letterSpacing: '0.05em',
              }}>
                PASSWORD
              </label>
              
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 16,
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0,255,65,0.4)'
                  e.target.style.boxShadow = '0 0 20px rgba(0,255,65,0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.target.style.boxShadow = 'none'
                }}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: 'rgba(255,80,80,0.1)',
                    border: '1px solid rgba(255,80,80,0.2)',
                    borderRadius: 8,
                    color: 'rgba(255,150,150,0.9)',
                    fontSize: 12,
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                style={{
                  width: '100%',
                  marginTop: 20,
                  padding: '12px 24px',
                  background: 'rgba(0,255,65,0.15)',
                  border: '1px solid rgba(0,255,65,0.3)',
                  borderRadius: 10,
                  color: 'rgba(0,255,65,0.9)',
                  fontSize: 14,
                  fontFamily: '"Courier New", monospace',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(0,255,65,0.2)'
                  e.target.style.boxShadow = '0 0 20px rgba(0,255,65,0.2)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(0,255,65,0.15)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                UNLOCK
              </motion.button>
            </div>
          </form>

          <p style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 11,
            color: 'rgba(255,255,255,0.2)',
            fontFamily: '"Courier New", monospace',
          }}>
            Private Access Only
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      {children}
      
      {/* Logout button - hidden by default */}
      <motion.button
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        onClick={handleLogout}
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          padding: '6px 12px',
          background: 'rgba(255,80,80,0.1)',
          border: '1px solid rgba(255,80,80,0.2)',
          borderRadius: 8,
          color: 'rgba(255,150,150,0.7)',
          fontSize: 10,
          fontFamily: '"Courier New", monospace',
          cursor: 'pointer',
          zIndex: 9999,
          opacity: 0,
          transition: 'opacity 0.2s',
        }}
      >
        LOGOUT
      </motion.button>
    </>
  )
}
