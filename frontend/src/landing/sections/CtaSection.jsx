import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CtaSection() {
  return (
    <section id="cta" className="py-24 md:py-32 px-6 md:px-14 bg-white">
      <div className="max-w-[1100px] mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="rounded-3xl border border-slate-200 overflow-hidden"
          style={{ boxShadow: '0 4px 32px rgba(15,23,42,0.08)' }}>

          <div className="grid lg:grid-cols-[1.1fr_1fr]">

            {/* Left: clinical photo with overlay content */}
            <div className="relative min-h-[420px] lg:min-h-0 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=900&q=80"
                alt="Clinical team using ClinicalMind"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(26,86,219,0.55) 100%)'
              }} />

              {/* Overlay content */}
              <div className="relative z-10 p-10 md:p-14 h-full flex flex-col justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 font-sans text-[11px] font-semibold text-blue-200 tracking-[0.12em] uppercase bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full mb-8">
                    <motion.span className="w-1.5 h-1.5 rounded-full bg-blue-300"
                      animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
                    Early access open
                  </span>

                  <h2 className="text-white leading-[1.06] mb-6"
                    style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.8rem,3.2vw,2.6rem)', fontWeight: 800 }}>
                    The future of clinical intelligence{' '}
                    <em style={{ fontStyle: 'italic', color: '#93C5FD' }}>starts here.</em>
                  </h2>

                  <p className="font-sans text-[15px] text-slate-300 leading-relaxed max-w-[360px]">
                    Join clinical teams on the waitlist. Early access includes dedicated onboarding,
                    custom FHIR integration, and direct access to the engineering team.
                  </p>
                </div>

                {/* Compliance badges */}
                <div className="mt-10 flex flex-wrap gap-3">
                  {['HIPAA Ready', 'SOC 2 Type II', 'FHIR R4 Native', 'HL7 Compliant'].map(label => (
                    <span key={label} className="flex items-center gap-1.5 font-sans text-[11px] font-semibold text-white/60 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div className="bg-[#F8FAFC] p-10 md:p-14 flex flex-col justify-center">
              <p className="font-sans text-[22px] font-bold text-slate-800 mb-1">Request early access</p>
              <p className="font-sans text-[13px] text-slate-400 mb-8">No commitment · Setup in 48 hours</p>

              <form onSubmit={e => e.preventDefault()} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-sans text-[13px] placeholder:text-slate-300 outline-none focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/10 transition-all"
                />
                <input
                  type="email"
                  placeholder="your@hospital.org"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-sans text-[13px] placeholder:text-slate-300 outline-none focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/10 transition-all"
                />
                <input
                  type="text"
                  placeholder="Hospital / health system"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 font-sans text-[13px] placeholder:text-slate-300 outline-none focus:border-[#1a56db] focus:ring-2 focus:ring-[#1a56db]/10 transition-all"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#1a56db] hover:bg-[#1648c2] text-white font-sans text-[14px] font-semibold rounded-xl transition-colors shadow-sm mt-1">
                  Get access
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-7 pt-6 border-t border-slate-200 space-y-2.5">
                {['HIPAA BAA available', 'Custom FHIR integration', 'Direct engineering support'].map(f => (
                  <div key={f} className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-sans text-[12px] text-slate-500">{f}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  )
}
