import Reveal from '../ui/Reveal'
import { BtnPrimary } from '../ui/Button'

const FEATURES = [
  {
    num: '001',
    title: 'Sync FHIR patient context',
    desc: 'POST /patients/{fhir_id}/sync ingests live EMR data — conditions, medications, labs, and risk flags — before any evidence run starts.',
  },
  {
    num: '002',
    title: 'PICO extraction with patient context',
    desc: 'The PICO agent structures the clinical question and builds PubMed MeSH and ClinicalTrials.gov queries, informed by FHIR context when a patient is selected.',
  },
  {
    num: '003',
    title: 'Parallel evidence retrieval',
    desc: 'Search agent queries PubMed E-utilities and ClinicalTrials.gov API v2 in one step. Summarizer grades each source Level 1A through 4.',
  },
  {
    num: '004',
    title: 'Safety and contradiction checks',
    desc: 'Contradiction agent flags conflicting trial conclusions. Drug interaction agent checks recommendations against the patient medication list from FHIR.',
  },
  {
    num: '005',
    title: 'Streaming clinical synthesis',
    desc: 'Synthesize agent produces bottom line, ranked interventions, and follow-up evidence gaps. Results stream over SSE; completion when the full report object arrives.',
  },
  {
    num: '006',
    title: 'Write-back to the chart',
    desc: 'POST /fhir/write-report stores the synthesis as a FHIR DocumentReference on the patient record for audit and continuity of care.',
  },
]

export default function FeatureSection() {
  return (
    <section id="features" className="py-28 md:py-32 px-6 md:px-12 bg-white">
      <div className="max-w-[1080px] mx-auto">
        <Reveal>
          <p className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-[#888888] mb-6">
            LangGraph clinical pipeline
          </p>
          <h2 className="font-sans text-[clamp(2.25rem,4vw,3.5rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-ink max-w-[640px]">
            From FHIR context to evidence written back to the EMR.
          </h2>
        </Reveal>

        <div className="mt-16 grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <Reveal delay={0.08}>
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-[#B8D0E0]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9EC8E0] via-[#7BA89E] to-[#5B8F85] opacity-90" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/92 backdrop-blur-sm border border-white/70 rounded-lg p-4">
                <p className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase text-[#888888] mb-1.5">
                  Evidence grading
                </p>
                <p className="font-display text-[22px] font-bold text-ink">
                  Level 1A{' '}
                  <span className="text-sm font-sans font-medium text-[#555555]">
                    · PubMed + ClinicalTrials.gov
                  </span>
                </p>
                <p className="font-sans text-xs text-[#555555] mt-1">Ranked for the selected FHIR patient</p>
              </div>
            </div>
          </Reveal>

          <div>
            {FEATURES.map((f, i) => (
              <Reveal key={f.num} delay={i * 0.05}>
                <div className="flex items-start justify-between gap-5 py-6 border-b border-[#E8E4DC] first:pt-0 last:border-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans text-[17px] font-bold text-ink mb-1.5">{f.title}</h3>
                    <p className="font-serif text-sm text-[#666666] leading-relaxed">{f.desc}</p>
                  </div>
                  <span className="font-sans text-xs font-semibold text-[#C8C4BA] tracking-wide flex-shrink-0 pt-0.5">
                    {f.num}
                  </span>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.2}>
              <div className="mt-10">
                <BtnPrimary href="/app">Open platform</BtnPrimary>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
