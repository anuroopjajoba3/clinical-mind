import { motion } from 'framer-motion'
import { Shield, Zap, FileCheck } from 'lucide-react'
import { BtnPrimary, BtnOutline } from '../ui/Button'
import MagneticText from '../../components/MagneticText'

// Place your uploaded image at: frontend/src/assets/hero-doctor.jpg
// Then replace the URL below with: import heroBg from '../../assets/hero-doctor.jpg'
import heroBg from '../../assets/hero-doctor.jpg'
const HERO_BG = heroBg

const TRUST_BADGES = [
  { icon: Shield,    label: 'HIPAA Ready' },
  { icon: FileCheck, label: 'FHIR R4 Native' },
  { icon: Zap,       label: 'Real-Time SSE' },
]

const STATS = [
  { value: '36M+',   label: 'PubMed papers' },
  { value: '8',      label: 'AI agents' },
  { value: '< 4min', label: 'Full synthesis' },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#060E1A]">

      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt=""
          className="w-full h-full object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060E1A]/95 via-[#060E1A]/70 to-[#060E1A]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060E1A]/70 via-transparent to-[#060E1A]/30" />
      </div>

      {/* Ambient motion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-teal/8 blur-[140px]"
          animate={{ scale: [1, 1.15, 1], x: [0, -25, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-clinical-blue/6 blur-[120px]"
          animate={{ scale: [1, 1.1, 1], y: [0, -20, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
      </div>

      {/* Main content — split layout */}
      <div className="relative flex-1 flex items-center px-6 md:px-14 lg:px-20 pt-24 pb-12 max-w-[1280px] mx-auto w-full">

        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left — text content */}
          <div>
            {/* Badge */}
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
              className="font-sans text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[1.06] tracking-[-0.03em] text-white"
            >
              <MagneticText text="Clinical intelligence" radius={90} strength={20} />
              <br />
              <span className="text-teal-muted"><MagneticText text="built for medicine." radius={90} strength={20} /></span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-6 font-sans text-[1rem] text-white/50 max-w-[480px] leading-[1.8]"
            >
              Eight AI agents connect live FHIR patient context, investigate
              36 million papers, surface contradictions, and synthesize
              evidence-graded reports — written back to the EMR in minutes.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.27 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <BtnPrimary href="#cta">Request a demo</BtnPrimary>
              <BtnOutline href="#features">Explore the pipeline</BtnOutline>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.38 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {TRUST_BADGES.map((b, i) => {
                const Icon = b.icon
                return (
                  <motion.div
                    key={b.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42 + i * 0.07, duration: 0.35 }}
                    className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5"
                  >
                    <Icon className="w-3.5 h-3.5 text-teal-muted" strokeWidth={2} />
                    <span className="font-sans text-[11px] font-semibold text-white/65 tracking-wide">{b.label}</span>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.58 }}
              className="mt-12 pt-8 border-t border-white/[0.08] flex gap-10"
            >
              {STATS.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62 + i * 0.08 }}>
                  <p className="font-sans text-[1.85rem] font-extrabold text-white leading-none tracking-tight">{s.value}</p>
                  <p className="font-sans text-[11px] text-white/35 mt-1.5 tracking-wide">{s.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right — clinical dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <ClinicalMockup />
          </motion.div>

        </div>
      </div>
    </section>
  )
}

function ClinicalMockup() {
  return (
    <div className="relative">
      {/* Glow behind card */}
      <div className="absolute inset-0 bg-teal/10 blur-3xl rounded-3xl scale-95" />

      {/* Main card */}
      <div className="relative bg-[#0D1B2E]/90 border border-white/[0.1] rounded-2xl overflow-hidden backdrop-blur-sm shadow-[0_32px_80px_rgba(0,0,0,0.5)]">

        {/* Window bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.05] border-b border-white/[0.07]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 font-sans text-[11px] text-white/30">ClinicalMed · Dr. Chen · MRN-00421</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Header */}
          <div>
            <p className="font-sans text-[15px] font-bold text-white">Good morning, Dr. Chen</p>
            <p className="font-sans text-[12px] text-white/35 mt-0.5">Evidence pipeline for Sarah K. is ready</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Confidence', value: '94%', sub: 'Level 1A', color: 'text-emerald-400' },
              { label: 'Sources', value: '17', sub: '14 PubMed · 3 Trials', color: 'text-clinical-blue' },
              { label: 'Synthesis', value: '3.8m', sub: 'Completed', color: 'text-teal-light' },
            ].map(card => (
              <div key={card.label} className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-3">
                <p className="font-sans text-[10px] text-white/35 mb-1.5">{card.label}</p>
                <p className={`font-sans text-[22px] font-extrabold leading-none ${card.color}`}>{card.value}</p>
                <p className="font-sans text-[10px] text-white/30 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Agent pipeline status */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 space-y-2.5">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-3">Agent pipeline</p>
            {[
              { label: 'FHIR Context', status: 'done' },
              { label: 'PICO Extraction', status: 'done' },
              { label: 'Evidence Search', status: 'done' },
              { label: 'Contradiction Check', status: 'done' },
              { label: 'Drug Interactions', status: 'done' },
              { label: 'Synthesize', status: 'done' },
            ].map(agent => (
              <div key={agent.label} className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
                <p className="font-sans text-[11px] text-emerald-300/80 flex-1">{agent.label}</p>
                <p className="font-sans text-[10px] text-white/20">✓</p>
              </div>
            ))}
          </div>

          {/* Bottom insight */}
          <div className="bg-teal/10 border border-teal/20 rounded-xl p-3.5">
            <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-teal mb-1.5">Clinical insight</p>
            <p className="font-sans text-[12px] text-white/70 leading-snug">
              SGLT2 inhibitors show Level 1A benefit in HFrEF with CKD Stage 3 — drug interaction check cleared against current med list.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
