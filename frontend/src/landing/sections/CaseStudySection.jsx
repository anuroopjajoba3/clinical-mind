import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'

const IMG = 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=900&q=80&auto=format'

const STATS = [
  { value: '4 min', label: 'Avg. synthesis time', sub: 'down from 2 hrs' },
  { value: '340',   label: 'Active clinicians' },
  { value: '100%',  label: 'FHIR write-back' },
]

export default function CaseStudySection() {
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-10 bg-white overflow-hidden">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[20%] right-[-8%] w-[480px] h-[480px] rounded-full bg-accent-warm/20 blur-[130px]"
          animate={{ scale: [1, 1.1, 1], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-5%] left-[5%] w-[380px] h-[380px] rounded-full bg-sky/8 blur-[110px]"
          animate={{ scale: [1, 1.12, 1], x: [0, 25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        />
      </div>

      <div className="relative max-w-[1080px] mx-auto">
        <Reveal>
          <p className="font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-[#999] mb-4">
            Case study
          </p>
          <h2 className="font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.02em] text-ink max-w-[500px] mb-10">
            Evidence synthesis at clinical scale
          </h2>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="grid lg:grid-cols-[1.2fr_1fr] rounded-2xl overflow-hidden border border-[#E5E0D5]">
            {/* Image */}
            <div className="relative min-h-[260px] lg:min-h-[380px] bg-[#B8D0E0] overflow-hidden">
              <img
                src={IMG}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F]/70 to-[#0A1628]/40" />
              <div className="absolute bottom-8 left-8 right-8">
                <p className="font-sans text-[11px] font-bold tracking-[0.1em] uppercase text-white/50 mb-2">
                  Internal medicine
                </p>
                <p className="font-sans text-xl font-bold text-white leading-snug max-w-[280px]">
                  340 clinicians. FHIR-backed. Evidence written back to every chart.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 bg-[#FAFAF8] flex flex-col justify-between">
              <div>
                <p className="font-sans text-[14px] text-[#444] leading-[1.75] mb-8">
                  Teams running FHIR-backed workflows use ClinicalMed to connect chart context,
                  run the LangGraph pipeline, and write syntheses back as DocumentReference resources.
                  Drug interaction conflicts surface before prescribing. Every recommendation carries
                  a full evidence chain tied to the record.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-7 border-t border-[#E5E0D5]">
                {STATS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.45 }}
                  >
                    <p className="font-sans text-[20px] font-extrabold text-ink leading-none">{s.value}</p>
                    <p className="font-sans text-[11px] text-[#888] mt-1.5 leading-snug">{s.label}</p>
                    {s.sub && <p className="font-sans text-[10px] text-[#5B8F85] mt-0.5">{s.sub}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
