import { motion } from 'framer-motion'
import { BtnPrimary, BtnOutline } from '../ui/Button'
import HeroMockup from './HeroMockup'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-hero-aether flex flex-col pt-[68px] overflow-hidden">

      {/* Ambient background drift */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-40 w-[700px] h-[700px] rounded-full bg-sky/25 blur-[140px]"
          animate={{ x: [0, 60, 0], y: [0, -50, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-accent-warm/35 blur-[120px]"
          animate={{ x: [0, -45, 0], y: [0, 35, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-teal/15 blur-[100px]"
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center text-center px-6 md:px-12 pt-16 md:pt-20 pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-serif text-[clamp(3rem,7vw,5.75rem)] font-black leading-[1] tracking-[-0.03em] text-ink max-w-[1000px]"
        >
          Clinical intelligence,
          <br />
          built for medicine.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-6 font-sans text-lg text-[#4A4A44] max-w-[540px] leading-relaxed"
        >
          Connect patient context, investigate evidence, surface contradictions, and synthesize
          clinical reports — with AI that reasons like a clinician.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="mt-11 flex flex-wrap gap-3 justify-center"
        >
          <BtnPrimary href="#cta">Request a demo</BtnPrimary>
          <BtnOutline href="#features">Explore the platform</BtnOutline>
        </motion.div>
      </div>

      <HeroMockup />
    </section>
  )
}
