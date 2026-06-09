import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, Circle, Database, Brain, FileText, ShieldCheck } from 'lucide-react'

const PIPELINE = [
  { label: 'FHIR Context',    desc: 'Patient EMR loaded' },
  { label: 'PICO Extraction', desc: 'Question structured' },
  { label: 'Evidence Search', desc: 'PubMed + Trials' },
  { label: 'Summarizer',      desc: '14 abstracts graded' },
  { label: 'Contradiction',   desc: 'Conflicts checked' },
  { label: 'Drug Interaction',desc: 'Medications verified' },
  { label: 'Synthesize',      desc: 'Report generating...' },
  { label: 'Follow-up',       desc: 'Evidence gaps' },
]

const BENTO = [
  {
    icon: Database,
    tag: 'FHIR R4',
    title: 'Live patient context',
    desc: 'Pulls conditions, medications, labs, and encounters before any evidence run. No copy-paste, no stale snapshots.',
    size: 'md:col-span-1',
    accent: 'text-[#0891B2]',
    bg: 'bg-[#ECFEFF]',
    border: 'border-[#BAE6FD]',
  },
  {
    icon: Brain,
    tag: 'LangGraph',
    title: 'Deterministic 8-agent pipeline',
    desc: 'Every run follows the same graph: FHIR → PICO → search → grade → contradiction → drug check → synthesis → follow-up. No surprises, full audit trail.',
    size: 'md:col-span-2',
    accent: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    icon: ShieldCheck,
    tag: 'Safety',
    title: 'Drug interaction check against live meds',
    desc: "Flags conflicts between evidence recommendations and the patient's current medication list pulled from FHIR.",
    size: 'md:col-span-2',
    accent: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  {
    icon: FileText,
    tag: 'EMR Write-back',
    title: 'Synthesis written to the chart',
    desc: 'FHIR DocumentReference created on every run. Auditable, reproducible, tied to the record.',
    size: 'md:col-span-1',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
]

function PipelineMockup() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step < PIPELINE.length) {
      const t = setTimeout(() => setStep(s => s + 1), step === 6 ? 1800 : 600)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setStep(0), 2400)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Active query</p>
        <p className="text-[13px] font-semibold text-slate-700 leading-snug">
          SGLT2 inhibitors in HFrEF with CKD stage 3
        </p>
      </div>
      <div className="flex-1 space-y-2.5">
        {PIPELINE.map((agent, i) => {
          const isDone = i < step, isRunning = i === step, isIdle = i > step
          return (
            <motion.div key={agent.label}
              animate={{ opacity: isIdle ? 0.3 : 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3">
              <span className="flex-shrink-0">
                {isDone && <CheckCircle size={14} className="text-emerald-500" strokeWidth={2.5} />}
                {isRunning && (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={14} className="text-[#0891B2]" strokeWidth={2} />
                  </motion.span>
                )}
                {isIdle && <Circle size={14} className="text-slate-200" strokeWidth={1.5} />}
              </span>
              <p className={`font-sans text-[12px] font-medium flex-1 ${isDone ? 'text-emerald-600' : isRunning ? 'text-slate-800' : 'text-slate-300'}`}>
                {agent.label}
              </p>
              {(isDone || isRunning) && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="font-sans text-[11px] text-slate-400 flex-shrink-0">
                  {agent.desc}
                </motion.p>
              )}
            </motion.div>
          )
        })}
      </div>
      {step >= PIPELINE.length && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-lg bg-[#ECFEFF] border border-[#A5F3FC] p-4 flex items-center justify-between">
          <div>
            <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#0891B2]">Synthesis complete</p>
            <p className="font-sans text-[15px] font-bold text-slate-800 mt-0.5">Level 1A · 94% confidence</p>
          </div>
          <div className="text-right">
            <p className="font-sans text-[10px] text-slate-400">Sources</p>
            <p className="font-sans text-[20px] font-extrabold text-slate-800">17</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function FeatureSection() {
  return (
    <section id="features" className="py-24 md:py-32 px-6 md:px-14 bg-white">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="mb-14">
          <p className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-[#0891B2] mb-3">
            LangGraph clinical pipeline
          </p>
          <h2 className="text-slate-900 leading-[1.06] max-w-[540px]"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 800 }}>
            Every run follows the{' '}
            <em style={{ fontStyle: 'italic', color: '#1a56db' }}>same deterministic path.</em>
          </h2>
          <p className="mt-4 font-sans text-[15px] text-slate-500 max-w-[480px] leading-relaxed">
            Eight specialized agents. No hallucination risk from skipped steps. Full audit trail on every evidence report.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Pipeline live mockup — spans 1 col on md, full width left side */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.55 }}
            className="md:col-span-1 rounded-2xl border border-slate-200 overflow-hidden bg-white min-h-[460px]"
            style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.06)' }}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="font-sans text-[12px] font-semibold text-slate-700">Live pipeline</p>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Running
              </span>
            </div>
            <PipelineMockup />
          </motion.div>

          {/* Bento grid — 2 cols */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENTO.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div key={item.title}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col gap-4"
                  style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                  <div className={`w-9 h-9 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${item.accent}`} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className={`font-sans text-[10px] font-bold uppercase tracking-widest mb-2 ${item.accent}`}>{item.tag}</p>
                    <h3 className="font-sans text-[15px] font-bold text-slate-800 leading-snug mb-2">{item.title}</h3>
                    <p className="font-sans text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              )
            })}

            {/* Full-width photo card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.32 }}
              className="sm:col-span-2 rounded-2xl overflow-hidden relative"
              style={{ height: 220, boxShadow: '0 2px 12px rgba(15,23,42,0.07)' }}>
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&h=440&q=80"
                alt="Physicians using ClinicalMind at point of care"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(15,23,42,0.70) 0%, rgba(15,23,42,0.20) 55%, transparent 100%)' }} />
              <div className="absolute inset-0 flex items-center px-8">
                <div className="max-w-[380px]">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-2">Real-world deployment</p>
                  <p className="font-sans text-[18px] font-bold text-white leading-snug">
                    Built for the point of care, not a conference demo.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  )
}
