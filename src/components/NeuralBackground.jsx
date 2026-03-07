import { useEffect, useRef } from 'react'

const NODE_COUNT = 150
const CONNECTION_DISTANCE = 180
const MOUSE_RADIUS = 180
const MOUSE_STRENGTH = 0.08
const RETURN_SPEED = 0.02
const NODE_SPEED = 1.2

export default function NeuralBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const nodesRef = useRef([])
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = window.innerWidth
    let h = window.innerHeight

    function resize() {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * devicePixelRatio
      canvas.height = h * devicePixelRatio
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
    }

    function createNodes() {
      nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        ox: 0,
        oy: 0,
        vx: (Math.random() - 0.5) * NODE_SPEED,
        vy: (Math.random() - 0.5) * NODE_SPEED,
        radius: Math.random() * 1.5 + 1,
        brightness: Math.random() * 0.5 + 0.5,
      }))
      nodesRef.current.forEach(n => { n.ox = n.x; n.oy = n.y })
    }

    function handleMouseMove(e) {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }

    function handleMouseLeave() {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }

    function handleTouchMove(e) {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX
        mouseRef.current.y = e.touches[0].clientY
      }
    }

    function handleTouchEnd() {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }

    function animate() {
      ctx.clearRect(0, 0, w, h)
      const nodes = nodesRef.current
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]

        n.ox += n.vx
        n.oy += n.vy

        if (n.ox < 0 || n.ox > w) n.vx *= -1
        if (n.oy < 0 || n.oy > h) n.vy *= -1
        n.ox = Math.max(0, Math.min(w, n.ox))
        n.oy = Math.max(0, Math.min(h, n.oy))

        const dx = mx - n.ox
        const dy = my - n.oy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS
          n.x += (dx * force * MOUSE_STRENGTH - (n.x - n.ox)) * 0.1
          n.y += (dy * force * MOUSE_STRENGTH - (n.y - n.oy)) * 0.1
          n.x = n.ox + (n.x - n.ox) * 0.95 + dx * force * MOUSE_STRENGTH
          n.y = n.oy + (n.y - n.oy) * 0.95 + dy * force * MOUSE_STRENGTH
        } else {
          n.x += (n.ox - n.x) * RETURN_SPEED
          n.y += (n.oy - n.y) * RETURN_SPEED
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.35
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.stroke()
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const dx = mx - n.x
        const dy = my - n.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const proximity = dist < MOUSE_RADIUS ? 1 + (1 - dist / MOUSE_RADIUS) * 2 : 1

        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius * proximity, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${n.brightness * 0.8})`
        ctx.fill()

        if (proximity > 1) {
          const glowRadius = n.radius * proximity * 3
          const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowRadius)
          gradient.addColorStop(0, `rgba(0, 212, 255, ${0.3 * (proximity - 1)})`)
          gradient.addColorStop(1, 'rgba(0, 212, 255, 0)')
          ctx.beginPath()
          ctx.arc(n.x, n.y, glowRadius, 0, Math.PI * 2)
          ctx.fillStyle = gradient
          ctx.fill()
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    resize()
    createNodes()
    animate()

    window.addEventListener('resize', () => { resize(); createNodes() })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'auto',
        background: '#080808',
      }}
    />
  )
}
