import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'

export default function CtaSection() {
  return (
    <section id="cta" className="relative py-28 md:py-36 px-6 md:px-10 overflow-hidden bg-[#060E1A] text-white text-center">

      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=1800&q=80&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover object-center opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060E1A] via-[#060E1A]/80 to-[#060E1A]/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060E1A]/40 via-transparent to-[#060E1A]/40" />
      </div>

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] rounded-full bg-teal/10 blur-[140px]"
          animate={{ scale: [1, 1.18, 1], x: [0, 35, 0], y: [0, -25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-5%] right-[20%] w-[400px] h-[400px] rounded-full bg-clinical-blue/8 blur-[110px]"
          animate={{ scale: [1, 1.12, 1], x: [0, -28, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Reveal>
          <span className="inline-flex items-center gap-2 bg-teal/15 border border-teal/25 text-teal-muted font-sans text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-light animate-pulse" />
            Early access open
          </span>
          <h2 className="font-sans text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.06] tracking-[-0.025em]">
            The future of clinical intelligence<br />
            <span className="text-teal-muted">starts here.</span>
          </h2>
          <p className="mt-5 font-sans text-[15px] text-white/50 leading-relaxed max-w-md mx-auto">
            Join clinical teams on the waitlist. Early access includes dedicated onboarding, custom FHIR integration, and direct access to the engineering team.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <form
            className="mt-10 flex flex-col sm:flex-row gap-2 max-w-[420px] mx-auto"
            onSubmit={e => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="your@hospital.org"
              className="flex-1 px-4 py-3 rounded-lg bg-white/[0.07] border border-white/10 text-white font-sans text-sm placeholder:text-white/25 outline-none focus:border-teal/40 transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-teal hover:bg-teal/90 text-white font-sans text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
            >
              Get access
            </button>
          </form>
          <p className="mt-4 font-sans text-xs text-white/25">
            No commitment · HIPAA BAA available · Setup in 48 hours
          </p>
        </Reveal>

        {/* Trust logos row */}
        <Reveal delay={0.22}>
          <div className="mt-14 pt-10 border-t border-white/[0.08] flex flex-wrap justify-center gap-8">
            {['HIPAA Ready', 'SOC 2 Type II', 'FHIR R4 Native', 'HL7 Compliant'].map(label => (
              <span key={label} className="font-sans text-[11px] font-semibold text-white/20 tracking-wider uppercase">{label}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
