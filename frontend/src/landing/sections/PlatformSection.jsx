import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'
import {
  Database, GitBranch, Radio, FileOutput, Users, GitCompare, Stethoscope, FileText,
} from 'lucide-react'

const STACK = ['FastAPI', 'LangGraph', 'PostgreSQL', 'Redis', 'Celery', 'HAPI FHIR R4']

const CAPABILITIES = [
  { tag: 'FHIR R4',    title: 'Patient sync from your EMR',       desc: 'Pull Patient, Condition, Medication, and Observation resources. Full resync per patient — labs, meds, and risk flags ready before any evidence run.',  icon: Database,     tone: 'bg-[#E4F0EE]' },
  { tag: 'LangGraph',  title: 'Eight-agent evidence pipeline',     desc: 'FHIR → PICO → PubMed + ClinicalTrials → summarizer → contradictions → drug interactions → synthesis → follow-ups. Streamed over SSE.',             icon: GitBranch,    tone: 'bg-[#EEE9F6]' },
  { tag: 'Live',       title: 'Real-time job streaming',           desc: 'POST /research starts a Celery job; GET /stream/{job_id} pushes agent_status and partial report data as each node completes.',                         icon: Radio,        tone: 'bg-[#FEF9E8]' },
  { tag: 'EMR',        title: 'DocumentReference write-back',      desc: 'Finished reports persist as FHIR DocumentReference on the patient chart — auditable synthesis tied to the record, not a chat log.',                     icon: FileOutput,   tone: 'bg-[#E8EEF8]' },
  { tag: 'Memory',     title: 'Per-patient insight history',       desc: 'GET /patients/{fhir_id}/insights returns prior evidence runs. Session memory passes prior Q&A into the next job automatically.',                       icon: Users,        tone: 'bg-[#F4F0E8]' },
  { tag: 'Compare',    title: 'Side-by-side evidence comparison',  desc: 'POST /compare runs two clinical questions in parallel — dual pipelines with independent agent status for treatment A vs B.',                           icon: GitCompare,   tone: 'bg-[#FCE8EC]' },
  { tag: 'CDS Hooks',  title: 'EHR decision support hooks',        desc: 'CDS Hooks service for medication-order and patient-view cards — surfaces prior ClinicalMed runs and interaction alerts at point of care.',             icon: Stethoscope,  tone: 'bg-[#E4F0EE]' },
  { tag: 'Export',     title: 'PDF clinical report',               desc: 'GET /report/{job_id}/pdf generates a downloadable, formatted evidence report from the completed synthesis.',                                            icon: FileText,     tone: 'bg-[#F4F0E8]' },
]

export default function PlatformSection() {
  return (
    <section id="platform" className="relative py-28 md:py-32 px-6 md:px-12 bg-white border-t border-[#E8E4DC] overflow-hidden">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 left-[-5%] w-[500px] h-[500px] rounded-full bg-lavender-soft/60 blur-[140px]"
          animate={{ scale: [1, 1.1, 1], x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full bg-teal/7 blur-[120px]"
          animate={{ scale: [1, 1.14, 1], x: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        />
      </div>

      <div className="relative max-w-[1080px] mx-auto">

        {/* Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-[#888888] mb-3">
                Backend platform
              </p>
              <h2 className="font-sans text-[clamp(1.75rem,3.5vw,2.75rem)] font-extrabold text-ink tracking-[-0.02em] leading-tight">
                Built on your backend stack
              </h2>
              <p className="font-sans text-sm text-[#666666] mt-3 leading-relaxed max-w-lg">
                Every layer wired end-to-end — no glue code, no manual orchestration. One repo, production-ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end md:max-w-[260px]">
              {STACK.map((s, i) => (
                <motion.span
                  key={s}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="font-sans text-[11px] font-semibold text-[#444444] bg-[#F3F0EB] border border-[#E5E1D8] rounded px-2.5 py-1"
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* 2-column grid */}
        <div className="grid md:grid-cols-2 gap-px bg-[#E8E4DC] border border-[#E8E4DC] rounded-xl overflow-hidden">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white flex gap-4 p-6 h-full"
              >
                <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${cap.tone}`}>
                  <Icon className="w-4 h-4 text-ink/70" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#999999] mb-1">
                    {cap.tag}
                  </p>
                  <p className="font-sans text-[14px] font-bold text-ink leading-snug mb-1.5">{cap.title}</p>
                  <p className="font-sans text-[13px] text-[#666666] leading-relaxed">{cap.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
