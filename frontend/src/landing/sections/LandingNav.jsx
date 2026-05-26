import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 inset-x-0 z-50 h-[68px] px-6 md:px-12 flex items-center justify-between transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-sand'
          : 'border-b border-transparent'
      }`}
    >
      <a href="#" className="font-sans text-[21px] font-extrabold tracking-tight text-ink">
        ClinicalMed
      </a>
      <a
        href="/app"
        className="font-sans text-sm font-medium text-ink hover:opacity-70 transition-opacity"
      >
        Open platform &rarr;
      </a>
    </motion.nav>
  )
}
