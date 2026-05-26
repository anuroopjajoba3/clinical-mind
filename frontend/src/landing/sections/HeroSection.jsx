import { motion } from 'framer-motion'
import { BtnPrimary, BtnOutline } from '../ui/Button'
import HeroMockup from './HeroMockup'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-hero-aether flex flex-col pt-[68px] overflow-hidden">
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
