import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

/*
  MagneticText
  ─────────────
  Splits text into individual characters. Each character repels away from
  the cursor when it gets within `radius` pixels. The closer the cursor,
  the stronger the push. Characters spring back when cursor leaves.

  Props:
    text      — string
    className — applied to each <span> wrapper
    style     — applied to each <span> wrapper
    radius    — pixel distance at which repulsion kicks in (default 80)
    strength  — max displacement in px (default 20)
    as        — wrapper element tag (default 'span')
    split     — 'char' | 'word' (default 'char')
*/
export default function MagneticText({
  text,
  className = '',
  style = {},
  radius = 80,
  strength = 18,
  as: Tag = 'span',
  split = 'char',
  children,
}) {
  const content = text || (typeof children === 'string' ? children : '')
  const tokens = split === 'word'
    ? content.split(' ').map((w, i, arr) => (i < arr.length - 1 ? w + ' ' : w))
    : content.split('')

  return (
    <Tag style={{ display: 'inline', lineHeight: 'inherit' }}>
      {tokens.map((token, i) => (
        <MagneticChar
          key={i}
          char={token}
          className={className}
          style={style}
          radius={radius}
          strength={strength}
        />
      ))}
    </Tag>
  )
}

function MagneticChar({ char, className, style, radius, strength }) {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const onMove = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < radius) {
      // Repel: push away from cursor, stronger when closer
      const force = (1 - dist / radius) * strength
      setOffset({ x: -(dx / dist) * force, y: -(dy / dist) * force })
    } else {
      setOffset({ x: 0, y: 0 })
    }
  }, [radius, strength])

  const onLeave = useCallback(() => setOffset({ x: 0, y: 0 }), [])

  return (
    <motion.span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.4 }}
      style={{
        display: 'inline-block',
        whiteSpace: 'pre',
        ...style,
      }}
      className={className}
    >
      {char === ' ' ? ' ' : char}
    </motion.span>
  )
}
