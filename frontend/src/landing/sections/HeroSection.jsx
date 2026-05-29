import { motion } from 'framer-motion'
import { Shield, Zap, FileCheck } from 'lucide-react'
import { BtnPrimary, BtnOutline } from '../ui/Button'
import HeroMockup from './HeroMockup'

// Swap this URL with your own uploaded image path when ready
const HERO_IMG = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1800&q=85&auto=format&fit=crop'

const TRUST_BADGES = [
  { icon: Shield,    label: 'HIPAA Ready' },
  { icon: FileCheck, label: 'FHIR R4 Native' },
  { icon: Zap,       label: 'Real-Time SSE' },
]

const STATS = [
  { value: '36M+',  label: 'PubMed papers indexed' },
  { value: '8',     label: 'Orchestrated agents' },
  { value: '< 4min', label: 'Full synthesis time' },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-navy-deep">

      {/* Background clinical image */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt=""
          className="w-full h-full object-cover object-center opacity-40"
        />
        {/* Gradient overlays — left heavy for text legibility, right lets image breathe */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060E1A]/95 via-[#060E1A]/75 to-[#060E1A]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060E1A]/80 via-transparent to-[#060E1A]/20" />
      </div>

      {/* Ambient motion on top of image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 right-[15%] w-[500px] h-[500px] rounded-full bg-teal/8 blur-[140px]"
          animate={{ scale: [1, 1.15, 1], x: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 left-[30%] w-[400px] h-[400px] rounded-full bg-clinical-blue/6 blur-[120px]"
          animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center px-6 md:px-14 lg:px-20 pt-28 pb-16 max-w-[1200px] mx-auto w-full">

        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 bg-teal/15 border border-teal/25 text-teal-muted font-sans text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-light animate-pulse-slow" />
            AI Clinical Evidence Platform · FHIR R4
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="font-sans text-[clamp(2.75rem,6vw,5.25rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white max-w-[780px]"
        >
          Clinical intelligence
          <br />
          <span className="text-teal-muted">built for medicine.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.18 }}
          className="mt-6 font-sans text-[1.0625rem] text-white/55 max-w-[520px] leading-[1.75]"
        >
          Eight AI agents connect live FHIR patient context, investigate
          36 million papers, surface contradictions, and synthesize
          evidence-graded reports — written back to the EMR in minutes.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <BtnPrimary href="#cta">Request a demo</BtnPrimary>
          <BtnOutline href="#features">Explore the pipeline</BtnOutline>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="mt-10 flex flex-wrap gap-4"
        >
          {TRUST_BADGES.map((b, i) => {
            const Icon = b.icon
            return (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.07, duration: 0.4 }}
                className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3.5 py-2"
              >
                <Icon className="w-3.5 h-3.5 text-teal-muted" strokeWidth={2} />
                <span className="font-sans text-xs font-semibold text-white/70 tracking-wide">{b.label}</span>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.62 }}
          className="mt-14 pt-10 border-t border-white/[0.08] flex flex-wrap gap-10"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.68 + i * 0.08, duration: 0.4 }}
            >
              <p className="font-sans text-[2rem] font-extrabold text-white leading-none tracking-tight">{s.value}</p>
              <p className="font-sans text-xs text-white/40 mt-1.5 tracking-wide">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Dashboard mockup */}
      <HeroMockup />
    </section>
  )
}
