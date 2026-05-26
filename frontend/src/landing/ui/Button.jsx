import { motion } from 'framer-motion'

function SquareIcon({ filled = true }) {
  return (
    <span
      className={`inline-block w-[7px] h-[7px] flex-shrink-0 ${filled ? 'bg-white' : 'border border-current'}`}
    />
  )
}

export function BtnPrimary({ href, children, className = '', onClick }) {
  const cls = `inline-flex items-center gap-2.5 bg-ink text-white font-sans text-[13px] font-semibold tracking-wide px-6 py-3 rounded transition-opacity hover:opacity-[0.82] ${className}`

  const inner = (
    <>
      <SquareIcon />
      {children}
    </>
  )

  if (href) {
    return (
      <motion.a href={href} className={cls} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        {inner}
      </motion.a>
    )
  }
  return (
    <motion.button type="button" onClick={onClick} className={cls} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      {inner}
    </motion.button>
  )
}

export function BtnOutline({ href, children, className = '' }) {
  return (
    <motion.a
      href={href}
      className={`inline-flex items-center gap-2.5 bg-ink text-white font-sans text-[13px] font-semibold tracking-wide px-6 py-3 rounded transition-opacity hover:opacity-[0.82] ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <SquareIcon />
      {children}
    </motion.a>
  )
}

export function BtnLight({ href, children, className = '' }) {
  return (
    <motion.a
      href={href}
      className={`inline-flex items-center gap-2.5 bg-white text-ink font-sans text-[13px] font-semibold tracking-wide px-6 py-3 rounded transition-opacity hover:opacity-90 ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <SquareIcon filled={false} />
      {children}
    </motion.a>
  )
}
