import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/*
  CursorFX — three layers:
  1. DOT      — tiny 6px dot, snaps instantly to cursor
  2. RING     — 36px ring, follows with spring lag (feels like it's "chasing")
  3. SPOTLIGHT — large 500px radial glow that lazily drifts behind the cursor
  Also hides the OS cursor everywhere inside the app.
*/

export default function CursorFX() {
  const dotX   = useMotionValue(-100)
  const dotY   = useMotionValue(-100)

  const ringX  = useSpring(dotX, { stiffness: 160, damping: 20, mass: 0.6 })
  const ringY  = useSpring(dotY, { stiffness: 160, damping: 20, mass: 0.6 })

  const glowX  = useSpring(dotX, { stiffness: 40,  damping: 18, mass: 1.2 })
  const glowY  = useSpring(dotY, { stiffness: 40,  damping: 18, mass: 1.2 })

  // Track whether cursor is over a clickable element to morph the ring
  const ringRef      = useRef(null)
  const isHovering   = useRef(false)

  useEffect(() => {
    const move = (e) => {
      dotX.set(e.clientX)
      dotY.set(e.clientY)
    }

    const over = (e) => {
      const el = e.target
      const clickable = el.closest('button, a, input, textarea, select, [role="button"], [tabindex]')
      if (clickable && !isHovering.current) {
        isHovering.current = true
        if (ringRef.current) {
          ringRef.current.style.width  = '52px'
          ringRef.current.style.height = '52px'
          ringRef.current.style.marginLeft = '-26px'
          ringRef.current.style.marginTop  = '-26px'
          ringRef.current.style.borderColor = 'rgba(6,182,212,0.7)'
          ringRef.current.style.background  = 'rgba(6,182,212,0.08)'
        }
      } else if (!clickable && isHovering.current) {
        isHovering.current = false
        if (ringRef.current) {
          ringRef.current.style.width  = '36px'
          ringRef.current.style.height = '36px'
          ringRef.current.style.marginLeft = '-18px'
          ringRef.current.style.marginTop  = '-18px'
          ringRef.current.style.borderColor = 'rgba(6,182,212,0.35)'
          ringRef.current.style.background  = 'transparent'
        }
      }
    }

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [dotX, dotY])

  return (
    <>
      {/* ── SPOTLIGHT GLOW ── large lazy blob */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 500, height: 500,
          marginLeft: -250, marginTop: -250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, rgba(14,116,144,0.05) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 9990,
          x: glowX,
          y: glowY,
        }}
      />

      {/* ── RING ── medium spring-lagged circle */}
      <motion.div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 36, height: 36,
          marginLeft: -18, marginTop: -18,
          borderRadius: '50%',
          border: '1.5px solid rgba(6,182,212,0.35)',
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 9998,
          x: ringX,
          y: ringY,
          transition: 'width 0.2s ease, height 0.2s ease, border-color 0.2s ease, background 0.2s ease, margin 0.2s ease',
        }}
      />

      {/* ── DOT ── instant snap */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 6, height: 6,
          marginLeft: -3, marginTop: -3,
          borderRadius: '50%',
          background: 'rgba(6,182,212,0.9)',
          pointerEvents: 'none',
          zIndex: 9999,
          x: dotX,
          y: dotY,
        }}
      />
    </>
  )
}
