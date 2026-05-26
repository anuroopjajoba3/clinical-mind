import Reveal from '../ui/Reveal'
import { BtnPrimary } from '../ui/Button'
import {
  Database, GitBranch, Radio, FileOutput, Users, GitCompare, Stethoscope, FileText,
} from 'lucide-react'

const CAPABILITIES = [
  {
    tag: 'FHIR R4',
    title: 'Patient sync from your EMR',
    desc: 'Pull Patient, Condition, Medication, and Observation resources from HAPI FHIR. Full resync per patient — labs, meds, and risk flags ready for evidence runs.',
    icon: Database,
    tone: 'bg-[#E4F0EE]',
  },
  {
    tag: 'LangGraph',
    title: 'Eight-agent evidence pipeline',
    desc: 'FHIR context → PICO → PubMed + ClinicalTrials.gov → summarizer → contradictions → drug interactions → synthesis → follow-up questions. Streamed over SSE.',
    icon: GitBranch,
    tone: 'bg-[#EEE9F6]',
  },
  {
    tag: 'Live',
    title: 'Real-time job streaming',
    desc: 'POST /research starts a Celery job; GET /stream/{job_id} pushes agent_status and partial reports as each node completes.',
    icon: Radio,
    tone: 'bg-[#FEF9E8]',
  },
  {
    tag: 'EMR',
    title: 'DocumentReference write-back',
    desc: 'Finished reports persist as FHIR DocumentReference on the patient chart — auditable synthesis tied to the record, not a chat log.',
    icon: FileOutput,
    tone: 'bg-[#E8EEF8]',
  },
  {
    tag: 'Memory',
    title: 'Per-patient insight history',
    desc: 'GET /patients/{fhir_id}/insights returns prior evidence runs for that patient. Session memory also passes prior Q&A into the next research job.',
    icon: Users,
    tone: 'bg-[#F4F0E8]',
  },
  {
    tag: 'Compare',
    title: 'Side-by-side evidence comparison',
    desc: 'POST /compare runs two clinical questions in parallel — dual pipelines with independent agent status for treatment A vs B.',
    icon: GitCompare,
    tone: 'bg-[#FCE8EC]',
  },
  {
    tag: 'CDS Hooks',
    title: 'EHR decision support hooks',
    desc: 'CDS Hooks service for medication-order and patient-view cards — surfaces prior ClinicalMed runs and interaction alerts at point of care.',
    icon: Stethoscope,
    tone: 'bg-[#E4F0EE]',
  },
  {
    tag: 'Export',
    title: 'PDF clinical report',
    desc: 'GET /report/{job_id}/pdf generates a downloadable evidence report from the completed synthesis.',
    icon: FileText,
    tone: 'bg-[#F4F0E8]',
  },
]

export default function PlatformSection() {
  return (
    <section id="platform" className="py-28 md:py-32 px-6 md:px-12 bg-white border-t border-[#E8E4DC]">
      <div className="max-w-[1080px] mx-auto grid lg:grid-cols-[1fr_1.65fr] gap-16 lg:gap-20 items-start">
        <Reveal>
          <div className="relative w-[140px] h-[140px] mb-8">
            <div
              className="absolute inset-0 border-[1.5px] border-[#5B8F85] rotate-45 rounded-sm"
              aria-hidden
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-sans text-base font-extrabold text-ink leading-tight">Clinical</span>
              <span className="font-sans text-base font-extrabold text-ink leading-tight">Med</span>
              <span className="font-sans text-[10px] font-semibold tracking-[0.08em] uppercase text-[#888888] mt-1">
                Platform
              </span>
            </div>
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 font-sans text-[9px] text-[#5B8F85]">FHIR</span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 font-sans text-[9px] text-[#5B8F85]">PubMed</span>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 font-sans text-[9px] text-[#5B8F85]">agents</span>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 font-sans text-[9px] text-[#5B8F85]">SSE</span>
          </div>
          <h2 className="font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold text-ink tracking-[-0.02em]">
            Built on your
            <br />
            backend stack
          </h2>
          <p className="font-sans text-sm text-[#666666] mt-3 leading-relaxed max-w-xs">
            FastAPI, LangGraph, PostgreSQL, Redis, Celery, and HAPI FHIR R4 — wired end-to-end in this repo.
          </p>
          <div className="mt-7">
            <BtnPrimary href="/app">Open ClinicalMed</BtnPrimary>
          </div>
        </Reveal>

        <div className="divide-y divide-[#E8E4DC]">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon
            return (
              <Reveal key={cap.title} delay={i * 0.03}>
                <div className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <div
                    className={`w-20 h-[60px] rounded-md flex-shrink-0 flex items-center justify-center ${cap.tone}`}
                  >
                    <Icon className="w-5 h-5 text-ink/70" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-[#888888]">
                      {cap.tag}
                    </p>
                    <p className="font-sans text-[15px] font-bold text-ink mt-1 leading-snug">{cap.title}</p>
                    <p className="font-serif text-sm text-[#666666] mt-1.5 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
