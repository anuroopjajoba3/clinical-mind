import { motion } from 'framer-motion'
import { Database, GitBranch, Radio, FileOutput, Users, GitCompare, Stethoscope, FileText } from 'lucide-react'

const STACK = ['FastAPI', 'LangGraph', 'PostgreSQL', 'Redis', 'Celery', 'HAPI FHIR R4']

const CAPABILITIES = [
  { tag: 'FHIR R4',   title: 'Patient sync from your EMR',      desc: 'Full resync per patient — conditions, medications, labs, and risk flags ready before any run.',  icon: Database,    accent: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  { tag: 'LangGraph', title: 'Eight-agent evidence pipeline',    desc: 'FHIR → PICO → Search → Grade → Contradiction → Drug → Synthesis → Follow-up. Streamed over SSE.',  icon: GitBranch,   accent: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { tag: 'Live',      title: 'Real-time job streaming',          desc: 'POST /research starts a Celery job. SSE stream pushes agent status and partial report per node.', icon: Radio,       accent: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { tag: 'EMR',       title: 'DocumentReference write-back',     desc: 'Finished reports persist as FHIR DocumentReference — auditable synthesis tied to the record.', icon: FileOutput,  accent: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { tag: 'Memory',    title: 'Per-patient insight history',      desc: 'GET /patients/{fhir_id}/insights returns prior runs. Session memory passes prior Q&A forward.', icon: Users,       accent: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  { tag: 'Compare',   title: 'Side-by-side evidence comparison', desc: 'POST /compare runs two clinical questions in parallel — dual pipelines, independent status.',    icon: GitCompare,  accent: '#9333EA', bg: '#FAF5FF', border: '#E9D5FF' },
  { tag: 'CDS Hooks', title: 'EHR decision support hooks',       desc: 'CDS Hooks service surfaces prior ClinicalMind runs and interaction alerts at point of care.',    icon: Stethoscope, accent: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
  { tag: 'Export',    title: 'PDF clinical report',              desc: 'GET /report/{job_id}/pdf generates a downloadable formatted evidence report.',                    icon: FileText,    accent: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
]

export default function PlatformSection() {
  return (
    <section id="platform" className="py-24 md:py-32 px-6 md:px-14 bg-[#F8FAFC]">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-[#0891B2] mb-3">
              Backend platform
            </p>
            <h2 className="font-sans text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.08] max-w-[440px]">
              Every layer wired end-to-end.
            </h2>
            <p className="mt-3 font-sans text-[15px] text-slate-500 max-w-[400px] leading-relaxed">
              No glue code, no manual orchestration. One repo, production-ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STACK.map((s, i) => (
              <motion.span key={s}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.35 }}
                className="font-sans text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                {s}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Clean grid — white cards separated by gap (not border) */}
        <div className="grid md:grid-cols-2 gap-3">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon
            return (
              <motion.div key={cap.title}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.4 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="rounded-xl border border-slate-200 bg-white p-5 flex gap-4"
                style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: cap.bg, border: `1px solid ${cap.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: cap.accent }} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: cap.accent }}>{cap.tag}</p>
                  </div>
                  <p className="font-sans text-[14px] font-bold text-slate-800 leading-snug mb-1">{cap.title}</p>
                  <p className="font-sans text-[12px] text-slate-500 leading-relaxed">{cap.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
