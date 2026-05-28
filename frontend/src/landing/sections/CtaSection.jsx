import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'
import { BtnLight } from '../ui/Button'

export default function CtaSection() {
  return (
    <section id="cta" className="relative py-28 md:py-36 px-6 md:px-10 bg-ink text-white text-center overflow-hidden">

      {/* Ambient background motion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-teal/10 blur-[130px]"
          animate={{ scale: [1, 1.18, 1], x: [0, 35, 0], y: [0, -25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-5%] right-[20%] w-[400px] h-[400px] rounded-full bg-sky/8 blur-[110px]"
          animate={{ scale: [1, 1.12, 1], x: [0, -28, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
        <motion.div
          className="absolute top-1/2 left-[55%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-[90px]"
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Reveal>
          <h2 className="font-sans text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.06] tracking-[-0.025em]">
            The future of clinical intelligence starts here.
          </h2>
          <p className="mt-5 font-sans text-[15px] text-white/50 leading-relaxed max-w-md mx-auto">
            Join clinical teams on the waitlist. Early access includes dedicated onboarding,
            custom FHIR integration, and direct access to the engineering team.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <form
            className="mt-10 flex flex-col sm:flex-row gap-2 max-w-[400px] mx-auto"
            onSubmit={e => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="your@hospital.org"
              className="flex-1 px-4 py-3 rounded-md bg-white/[0.07] border border-white/10 text-white font-sans text-sm placeholder:text-white/25 outline-none focus:border-white/30 transition-colors"
            />
            <BtnLight href="/app">Get access</BtnLight>
          </form>
          <p className="mt-4 font-sans text-xs text-white/25">
            No commitment · HIPAA BAA available · Setup in 48 hours
          </p>
        </Reveal>
      </div>
    </section>
  )
}
