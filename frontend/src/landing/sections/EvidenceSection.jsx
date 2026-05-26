import Reveal from '../ui/Reveal'
import SectionHeader from '../ui/SectionHeader'
import { BtnOutline } from '../ui/Button'

const SOURCES = [
  { title: 'EMPEROR-Reduced', journal: 'NEJM 2020', grade: '1A', confidence: 94, relevance: 'High' },
  { title: 'DAPA-CKD Trial', journal: 'NEJM 2020', grade: '1A', confidence: 91, relevance: 'High' },
  { title: 'CREDENCE Subgroup', journal: 'Lancet 2019', grade: '2B', confidence: 72, relevance: 'Moderate' },
]

export default function EvidenceSection() {
  return (
    <section id="evidence" className="py-28 md:py-32 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
            <SectionHeader
              eyebrow="Evidence synthesis"
              title="From 36 million papers to one patient-specific report."
              subtitle="PubMed and ClinicalTrials.gov queried in parallel. Every abstract summarized, scored, and ranked for clinical relevance."
            />
            <BtnOutline href="/app" className="self-start lg:self-auto flex-shrink-0">
              Try evidence search
            </BtnOutline>
          </div>
        </Reveal>

        <div className="grid lg:grid-cols-5 gap-6">
          <Reveal className="lg:col-span-2">
            <div className="h-full min-h-[280px] bg-gradient-to-b from-teal/10 to-cream border border-sand rounded-2xl p-8 flex flex-col justify-end">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-teal mb-2">
                Streaming synthesis
              </p>
              <p className="font-serif text-2xl font-bold text-ink leading-snug">
                Clinical bottom line arrives before the pipeline completes.
              </p>
              <p className="font-sans text-sm text-slate-600 mt-4 leading-relaxed">
                PICO framing, drug interaction checks, and follow-up questions — in one structured DocumentReference.
              </p>
            </div>
          </Reveal>

          <div className="lg:col-span-3 space-y-3">
            {SOURCES.map((src, i) => (
              <Reveal key={src.title} delay={i * 0.06}>
                <div className="bg-ivory border border-sand rounded-xl p-5 hover:border-teal/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-lg font-bold text-ink">{src.title}</p>
                      <p className="font-sans text-xs text-slate-500 mt-0.5">{src.journal}</p>
                    </div>
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded bg-teal/10 text-teal">
                      Grade {src.grade}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-6">
                    <div className="flex-1">
                      <div className="flex justify-between font-sans text-[10px] text-slate-400 mb-1">
                        <span>Confidence</span>
                        <span className="font-semibold text-ink">{src.confidence}%</span>
                      </div>
                      <div className="h-1.5 bg-sand rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal rounded-full transition-all"
                          style={{ width: `${src.confidence}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-sans text-xs text-slate-500">{src.relevance} relevance</span>
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
