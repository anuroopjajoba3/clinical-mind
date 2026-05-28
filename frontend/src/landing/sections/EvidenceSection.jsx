import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'
import SectionHeader from '../ui/SectionHeader'

const SOURCES = [
  { title: 'EMPEROR-Reduced', journal: 'NEJM 2020', grade: '1A', confidence: 94, relevance: 'High' },
  { title: 'DAPA-CKD Trial', journal: 'NEJM 2020', grade: '1A', confidence: 91, relevance: 'High' },
  { title: 'CREDENCE Subgroup', journal: 'Lancet 2019', grade: '2B', confidence: 72, relevance: 'Moderate' },
]

export default function EvidenceSection() {
  return (
    <section id="evidence" className="relative py-24 md:py-32 px-6 md:px-10 bg-white overflow-hidden">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-5%] left-[30%] w-[600px] h-[600px] rounded-full bg-teal/6 blur-[150px]"
          animate={{ scale: [1, 1.12, 1], x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[0%] right-[-10%] w-[450px] h-[450px] rounded-full bg-sky/10 blur-[120px]"
          animate={{ scale: [1, 1.1, 1], x: [0, 25, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        />
      </div>

      <div className="relative max-w-[1080px] mx-auto">
        <Reveal>
          <div className="mb-14">
            <SectionHeader
              eyebrow="Evidence synthesis"
              title="From 36 million papers to one patient-specific report."
              subtitle="PubMed and ClinicalTrials.gov queried in parallel. Every abstract summarized, scored, and ranked for clinical relevance."
            />
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-5 gap-5">
          <Reveal className="lg:col-span-2">
            <div className="h-full min-h-[260px] bg-gradient-to-b from-[#E8F4F1] to-[#F4F0E8] border border-[#D8E8E4] rounded-2xl p-7 flex flex-col justify-end">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5B8F85] mb-2">
                Streaming synthesis
              </p>
              <p className="font-sans text-[18px] font-bold text-ink leading-snug mb-3">
                Clinical bottom line arrives before the pipeline completes.
              </p>
              <p className="font-sans text-[13px] text-[#666] leading-relaxed">
                PICO framing, drug interaction checks, and follow-up questions — in one structured DocumentReference.
              </p>
            </div>
          </Reveal>

          <div className="lg:col-span-3 space-y-3">
            {SOURCES.map((src, i) => (
              <Reveal key={src.title} delay={i * 0.07}>
                <div className="bg-[#FAFAF8] border border-[#E8E4DC] rounded-xl p-5 hover:border-[#5B8F85]/30 transition-colors duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-sans text-[15px] font-bold text-ink">{src.title}</p>
                      <p className="font-sans text-[12px] text-[#888] mt-0.5">{src.journal}</p>
                    </div>
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-[#5B8F85]/10 text-[#5B8F85] flex-shrink-0">
                      Grade {src.grade}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-5">
                    <div className="flex-1">
                      <div className="flex justify-between font-sans text-[10px] text-[#aaa] mb-1.5">
                        <span>Confidence</span>
                        <span className="font-semibold text-ink">{src.confidence}%</span>
                      </div>
                      <div className="h-1 bg-[#E8E4DC] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#5B8F85] rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${src.confidence}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 + i * 0.08, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                        />
                      </div>
                    </div>
                    <span className="font-sans text-[12px] text-[#888] flex-shrink-0">{src.relevance} relevance</span>
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
