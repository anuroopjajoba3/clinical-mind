import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-6"
    >
      <motion.nav
        animate={{
          boxShadow: scrolled
            ? '0 4px 32px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.06)'
            : '0 2px 16px rgba(15,23,42,0.06)',
          backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
        }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-8 px-5 py-2.5 rounded-full border border-slate-200/80 backdrop-blur-md"
      >
        <a href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-md bg-[#1a56db] flex items-center justify-center">
            <span className="font-sans text-[9px] font-extrabold text-white">CM</span>
          </div>
          <span className="font-sans text-[13px] font-bold text-slate-900 tracking-tight">ClinicalMind</span>
        </a>

        <div className="hidden sm:flex items-center gap-6">
          {[
            { label: 'How it works', href: '#features' },
            { label: 'Evidence',     href: '#evidence' },
            { label: 'Platform',     href: '#platform' },
          ].map(({ label, href }) => (
            <a key={label} href={href}
              className="font-sans text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">
              {label}
            </a>
          ))}
        </div>

        <a href="#cta"
          className="flex-shrink-0 px-4 py-1.5 rounded-full bg-[#1a56db] hover:bg-[#1648c2] text-white font-sans text-[13px] font-semibold transition-colors whitespace-nowrap">
          Request access
        </a>
      </motion.nav>
    </motion.header>
  )
}
