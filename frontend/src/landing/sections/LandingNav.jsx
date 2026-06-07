import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const LINKS = [
  { label: 'Pipeline',  href: '#features' },
  { label: 'Evidence',  href: '#evidence' },
  { label: 'Workflow',  href: '#workflow' },
  { label: 'Platform',  href: '#platform' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 inset-x-0 z-50 h-[64px] px-6 md:px-14 flex items-center justify-between transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_12px_rgba(0,0,0,0.06)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <a href="#" className="font-sans text-[15px] font-bold tracking-tight text-slate-900">
        ClinicalMind
      </a>

      <div className="hidden md:flex items-center gap-8">
        {LINKS.map(l => (
          <a
            key={l.label}
            href={l.href}
            className="font-sans text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors duration-200"
          >
            {l.label}
          </a>
        ))}
      </div>

      <a
        href="/app"
        className="font-sans text-[13px] font-semibold px-4 py-2 rounded-lg bg-[#0891B2] text-white hover:bg-[#0E7490] transition-all duration-200 shadow-sm"
      >
        Open platform
      </a>
    </motion.nav>
  )
}
