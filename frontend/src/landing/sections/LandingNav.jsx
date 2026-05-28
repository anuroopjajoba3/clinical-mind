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
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 inset-x-0 z-50 h-[60px] px-6 md:px-10 flex items-center justify-between transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-[#E8E4DC]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <a href="#" className="font-sans text-[15px] font-bold tracking-tight text-ink">
        ClinicalMed
      </a>

      <div className="hidden md:flex items-center gap-8">
        {LINKS.map(l => (
          <a
            key={l.label}
            href={l.href}
            className="font-sans text-[13px] font-medium text-[#555] hover:text-ink transition-colors duration-200"
          >
            {l.label}
          </a>
        ))}
      </div>

      <a
        href="/app"
        className="font-sans text-[13px] font-semibold text-ink bg-ink text-white px-4 py-2 rounded hover:opacity-85 transition-opacity"
      >
        Open platform
      </a>
    </motion.nav>
  )
}
