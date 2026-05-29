import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'
import SectionHeader from '../ui/SectionHeader'

const SOURCES = [
  { title: 'EMPEROR-Reduced', journal: 'NEJM 2020', grade: '1A', confidence: 94, relevance: 'High', color: 'bg-emerald-500' },
  { title: 'DAPA-CKD Trial',  journal: 'NEJM 2020', grade: '1A', confidence: 91, relevance: 'High', color: 'bg-emerald-500' },
  { title: 'CREDENCE Subgroup', journal: 'Lancet 2019', grade: '2B', confidence: 72, relevance: 'Moderate', color: 'bg-amber-500' },
]

export default function EvidenceSection() {
  return (
    <section id="evidence" className="relative py-24 md:py-32 px-6 md:px-14 bg-slate-50 overflow-hidden">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-5%] left-[30%] w-[600px] h-[600px] rounded-full bg-teal/5 blur-[150px]"
          animate={{ scale: [1, 1.12, 1], x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[0%] right-[-10%] w-[450px] h-[450px] rounded-full bg-clinical-blue/5 blur-[120px]"
          animate={{ scale: [1, 1.1, 1], x: [0, 25, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
      </div>

      <div className="relative max-w-[1200px] mx-auto">
        <Reveal>
          <div className="mb-14">
            <p className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-teal mb-3">
              Evidence synthesis
            </p>
            <h2 className="font-sans text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.025em] text-slate-900 max-w-[560px] leading-tight">
              From 36 million papers to one patient-specific report.
            </h2>
            <p className="font-sans text-[14px] text-slate-500 mt-4 max-w-[480px] leading-relaxed">
              PubMed and ClinicalTrials.gov queried in parallel. Every abstract summarized, scored, and ranked for clinical relevance.
            </p>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-5 gap-5">

          <Reveal className="lg:col-span-2">
            <div className="h-full min-h-[280px] bg-gradient-to-br from-[#0A1628] to-[#0E2A45] border border-white/[0.08] rounded-2xl p-7 flex flex-col justify-end relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-teal/10 rounded-full blur-3xl" />
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-teal mb-3 relative">
                Streaming synthesis
              </p>
              <p className="font-sans text-[18px] font-bold text-white leading-snug mb-3 relative">
                Clinical bottom line arrives before the pipeline completes.
              </p>
              <p className="font-sans text-[13px] text-white/40 leading-relaxed relative">
                PICO framing, drug interaction checks, and follow-up questions — in one structured DocumentReference.
              </p>
              <div className="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 gap-4 relative">
                <div>
                  <p className="font-sans text-[22px] font-extrabold text-white">Level 1A</p>
                  <p className="font-sans text-[11px] text-white/30 mt-1">Evidence grade</p>
                </div>
                <div>
                  <p className="font-sans text-[22px] font-extrabold text-teal-muted">94%</p>
                  <p className="font-sans text-[11px] text-white/30 mt-1">Confidence score</p>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="lg:col-span-3 space-y-3">
            {SOURCES.map((src, i) => (
              <Reveal key={src.title} delay={i * 0.07}>
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-teal/30 hover:shadow-clinical transition-all duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-sans text-[15px] font-bold text-slate-900">{src.title}</p>
                      <p className="font-sans text-[12px] text-slate-400 mt-0.5">{src.journal}</p>
                    </div>
                    <span className={`font-sans text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0 ${
                      src.grade === '1A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      Grade {src.grade}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-5">
                    <div className="flex-1">
                      <div className="flex justify-between font-sans text-[10px] text-slate-400 mb-1.5">
                        <span>Confidence</span>
                        <span className="font-semibold text-slate-700">{src.confidence}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${src.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${src.confidence}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + i * 0.08, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                      </div>
                    </div>
                    <span className={`font-sans text-[11px] font-semibold flex-shrink-0 ${
                      src.relevance === 'High' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>{src.relevance} relevance</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
