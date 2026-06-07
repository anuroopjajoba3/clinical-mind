import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CtaSection() {
  return (
    <section id="cta" className="py-24 md:py-32 px-6 md:px-14 bg-white">
      <div className="max-w-[1100px] mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="rounded-3xl border border-slate-200 bg-[#F8FAFC] p-10 md:p-16 flex flex-col md:flex-row md:items-center md:justify-between gap-10"
          style={{ boxShadow: '0 2px 16px rgba(15,23,42,0.06)' }}>

          {/* Left */}
          <div className="max-w-[460px]">
            <span className="inline-flex items-center gap-2 font-sans text-[11px] font-semibold text-[#0891B2] tracking-[0.12em] uppercase bg-[#ECFEFF] border border-[#A5F3FC] px-3.5 py-1.5 rounded-full mb-6">
              <motion.span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"
                animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
              Early access open
            </span>
            <h2 className="font-sans text-[clamp(1.9rem,3.8vw,3rem)] font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.07]">
              The future of clinical intelligence starts here.
            </h2>
            <p className="mt-4 font-sans text-[15px] text-slate-500 leading-relaxed">
              Join clinical teams on the waitlist. Early access includes dedicated onboarding,
              custom FHIR integration, and direct access to the engineering team.
            </p>
            <div className="mt-6 flex flex-wrap gap-5">
              {['HIPAA Ready', 'SOC 2 Type II', 'FHIR R4 Native', 'HL7 Compliant'].map(label => (
                <span key={label} className="flex items-center gap-1.5 font-sans text-[11px] font-semibold text-slate-400">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="w-full md:w-auto md:min-w-[320px]">
            <div className="bg-white rounded-2xl border border-slate-200 p-7"
              style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
              <p className="font-sans text-[14px] font-bold text-slate-800 mb-1">Request early access</p>
              <p className="font-sans text-[12px] text-slate-400 mb-5">No commitment · Setup in 48 hours</p>
              <form onSubmit={e => e.preventDefault()} className="space-y-3">
                <input
                  type="email"
                  placeholder="your@hospital.org"
                  className="w-full px-4 py-3 rounded-lg bg-[#F8FAFC] border border-slate-200 text-slate-800 font-sans text-[13px] placeholder:text-slate-300 outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/10 transition-all"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#0891B2] hover:bg-[#0E7490] text-white font-sans text-[13px] font-semibold rounded-lg transition-colors shadow-sm">
                  Get access
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                {['HIPAA BAA available', 'Custom FHIR integration', 'Direct engineering support'].map(f => (
                  <div key={f} className="flex items-center gap-2">
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
