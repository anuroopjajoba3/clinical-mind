import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'

import caseImg from '../../assets/case-study.jpg'
const CASE_IMG = caseImg

const STATS = [
  { value: '4 min',  label: 'Avg. synthesis time', sub: 'down from 2+ hours' },
  { value: '340',    label: 'Active clinicians' },
  { value: '100%',   label: 'FHIR write-back rate' },
]

export default function CaseStudySection() {
  return (
    <section className="relative py-24 md:py-32 px-6 md:px-14 bg-slate-50 overflow-hidden">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[20%] right-[-8%] w-[480px] h-[480px] rounded-full bg-teal/5 blur-[130px]"
          animate={{ scale: [1, 1.1, 1], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-5%] left-[5%] w-[380px] h-[380px] rounded-full bg-clinical-blue/5 blur-[110px]"
          animate={{ scale: [1, 1.12, 1], x: [0, 25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
        />
      </div>

      <div className="relative max-w-[1200px] mx-auto">
        <Reveal>
          <p className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-teal mb-3">
            Case study
          </p>
          <h2 className="font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.02em] text-slate-900 max-w-[520px] mb-10">
            Evidence synthesis at clinical scale
          </h2>
        </Reveal>

        <Reveal delay={0.07}>
          <div className="grid lg:grid-cols-[1.25fr_1fr] rounded-2xl overflow-hidden border border-slate-200 shadow-clinical-lg">

            {/* Image panel */}
            <div className="relative min-h-[280px] lg:min-h-[420px] overflow-hidden bg-navy">
              <img
                src={CASE_IMG}
                alt="Clinical team reviewing evidence synthesis"
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/80 via-[#0A1628]/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0A1628]/30" />
              <div className="absolute bottom-8 left-8 right-8">
                <span className="inline-block font-sans text-[10px] font-bold tracking-[0.12em] uppercase text-teal-muted bg-teal/15 border border-teal/20 rounded-full px-3 py-1 mb-3">
                  Internal medicine
                </span>
                <p className="font-sans text-xl font-bold text-white leading-snug max-w-[300px]">
                  340 clinicians. FHIR-backed synthesis written to every chart.
                </p>
              </div>
            </div>

            {/* Content panel */}
            <div className="p-8 md:p-10 bg-white flex flex-col justify-between">
              <div>
                <p className="font-sans text-[14px] text-slate-600 leading-[1.8] mb-8">
                  Teams running FHIR-backed workflows use ClinicalMed to connect chart context,
                  run the full LangGraph pipeline, and write evidence syntheses back as
                  DocumentReference resources. Drug interaction conflicts surface before
                  prescribing. Every recommendation carries a full evidence chain tied to the record.
                </p>

                <div className="space-y-3">
                  {[
                    'FHIR R4 patient context pulled before every run',
                    'Drug interaction checks against live medication list',
                    'Full audit trail written back to the EMR',
                  ].map((point, i) => (
                    <motion.div
                      key={point}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-1 w-4 h-4 rounded-full bg-teal/15 border border-teal/30 flex-shrink-0 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal" />
                      </span>
                      <p className="font-sans text-[13px] text-slate-600 leading-snug">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-8 mt-8 border-t border-slate-100">
                {STATS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.45 }}
                  >
                    <p className="font-sans text-[22px] font-extrabold text-slate-900 leading-none">{s.value}</p>
                    <p className="font-sans text-[11px] text-slate-500 mt-1.5 leading-snug">{s.label}</p>
                    {s.sub && <p className="font-sans text-[10px] text-teal mt-0.5 font-semibold">{s.sub}</p>}
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
