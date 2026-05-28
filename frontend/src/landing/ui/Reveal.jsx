import { motion } from 'framer-motion'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Reveal({ children, className = '', delay = 0, variant = 'up', duration = 0.5 }) {
  const { ref, visible } = useScrollReveal()

  const initial =
    variant === 'left'  ? { opacity: 0, x: -16 } :
    variant === 'right' ? { opacity: 0, x: 16 }  :
    variant === 'fade'  ? { opacity: 0 }           :
                          { opacity: 0, y: 10 }

  const animate = variant === 'left'  ? { opacity: 1, x: 0 } :
                  variant === 'right' ? { opacity: 1, x: 0 } :
                  variant === 'fade'  ? { opacity: 1 }        :
                                        { opacity: 1, y: 0 }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={visible ? animate : {}}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}
