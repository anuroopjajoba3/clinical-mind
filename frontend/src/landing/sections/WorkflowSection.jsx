import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Database, Brain, Search, AlertTriangle, FileText, Upload } from 'lucide-react'
import Reveal from '../ui/Reveal'

const STEPS = [
  {
    num: '01',
    title: 'Connect patient context',
    desc: 'FHIR R4 pulls live labs, meds, diagnoses, and encounters from your EMR. No copy-paste. No stale exports.',
    icon: Database,
    visual: 'fhir',
  },
  {
    num: '02',
    title: 'AI builds longitudinal memory',
    desc: 'Each run enriches persistent patient memory — trajectories, risk flags, and context that changes which evidence matters.',
    icon: Brain,
    visual: 'memory',
  },
  {
    num: '03',
    title: 'Agents investigate evidence',
    desc: 'Eight specialized agents query PubMed and ClinicalTrials.gov in parallel. Every source graded for this patient.',
    icon: Search,
    visual: 'agents',
  },
  {
    num: '04',
    title: 'Contradictions are surfaced',
    desc: 'Conflicting RCT conclusions are detected, explained, and ranked by severity — before they reach the clinician.',
    icon: AlertTriangle,
    visual: 'contradiction',
  },
  {
    num: '05',
    title: 'Clinical synthesis generated',
    desc: 'Structured reports stream in real time: bottom line, evidence grading, drug checks, and follow-up gaps.',
    icon: FileText,
    visual: 'synthesis',
  },
  {
    num: '06',
    title: 'Reports written back to EMR',
    desc: 'DocumentReference resources land in the FHIR record — auditable, reproducible, and ready for the chart.',
    icon: Upload,
    visual: 'emr',
  },
]

function StepVisual({ type }) {
  if (type === 'memory') {
    return (
      <div className="p-7 space-y-4">
        <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-white/30 mb-5">Patient longitudinal trends</p>
        {[
          { lab: 'eGFR', vals: [38, 42, 36, 44, 41], color: 'bg-teal' },
          { lab: 'HbA1c', vals: [55, 60, 58, 65, 62], color: 'bg-clinical-blue' },
          { lab: 'NT-proBNP', vals: [45, 50, 42, 55, 48], color: 'bg-emerald-400' },
        ].map(({ lab, vals, color }) => (
          <div key={lab} className="flex items-center gap-4">
            <div className="w-20 font-sans text-xs text-white/50 flex-shrink-0">{lab}</div>
            <div className="flex-1 h-9 flex items-end gap-1">
              {vals.map((h, j) => (
                <motion.div
                  key={j}
                  className={`flex-1 rounded-t ${j === vals.length - 1 ? color : 'bg-white/10'}`}
                  style={{ height: `${h}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: j * 0.06, duration: 0.5, ease: 'easeOut' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (type === 'agents') {
    const labels = ['FHIR', 'PICO', 'Search', 'Grade', 'Contra', 'Drug', 'Synth', 'Write']
    return (
      <div className="p-7 grid grid-cols-4 gap-2.5">
        <p className="col-span-4 font-sans text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">8 agents — parallel execution</p>
        {labels.map((label, i) => (
          <motion.div
            key={i}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 ${
              i < 5 ? 'bg-teal/10 border-teal/30' : 'bg-white/[0.04] border-white/10'
            }`}
            animate={i === 4 ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <span className={`font-sans text-[9px] font-bold ${i < 5 ? 'text-teal' : 'text-white/25'}`}>{label}</span>
            {i < 5 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </motion.div>
        ))}
      </div>
    )
  }
  if (type === 'contradiction') {
    return (
      <div className="p-7 space-y-3">
        <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-white/30 mb-4">Conflict detection</p>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <p className="font-sans text-xs font-semibold text-amber-300">Trial A · EMPEROR-Reduced</p>
          <p className="font-sans text-[11px] text-amber-200/70 mt-1">SGLT2i reduces HF hospitalization — NNT 19</p>
        </div>
        <div className="flex items-center justify-center py-1">
          <span className="font-sans text-[10px] font-bold text-red-400 uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">⚠ Conflicting signal</span>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="font-sans text-xs font-semibold text-red-300">Trial B · DAPA-CKD subgroup</p>
          <p className="font-sans text-[11px] text-red-200/70 mt-1">Primary endpoint direction reversed in CKD4+</p>
        </div>
      </div>
    )
  }
  if (type === 'synthesis') {
    return (
      <div className="p-7 space-y-3">
        <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-white/30 mb-4">Streaming synthesis</p>
        <div className="bg-teal/10 border border-teal/20 rounded-xl p-4">
          <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-teal mb-2">Clinical bottom line</p>
          <p className="font-sans text-[12px] text-white/70 leading-snug">SGLT2 inhibitors show Level 1A benefit in HFrEF with CKD Stage 3 — drug interaction check cleared.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['Grade', '1A'], ['Sources', '17'], ['Conflicts', '1']].map(([k, v]) => (
            <div key={k} className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 text-center">
              <p className="font-sans text-[18px] font-extrabold text-white">{v}</p>
              <p className="font-sans text-[10px] text-white/30 mt-0.5">{k}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (type === 'emr') {
    return (
      <div className="p-7 space-y-3">
        <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-white/30 mb-4">FHIR write-back</p>
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <p className="font-sans text-xs font-semibold text-emerald-300">DocumentReference created</p>
          </div>
          {[['Patient', 'MRN-00421 · Sarah K.'], ['Type', 'Clinical Evidence Report'], ['Status', 'final'], ['Date', new Date().toISOString().split('T')[0]]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[11px] py-1 border-b border-white/[0.05]">
              <span className="text-white/30">{k}</span>
              <span className="text-white/60 font-mono">{v}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  // fhir default
  return (
    <div className="p-7 space-y-3">
      <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-white/30 mb-4">FHIR R4 patient context</p>
      {[
        { label: 'Conditions', val: 'HFrEF · CKD Stage 3 · T2DM', color: 'text-teal' },
        { label: 'Medications', val: 'Empagliflozin · Metformin · Furosemide', color: 'text-clinical-blue' },
        { label: 'Last eGFR', val: '41 mL/min/1.73m²', color: 'text-emerald-400' },
        { label: 'NT-proBNP', val: '1,840 pg/mL (elevated)', color: 'text-amber-400' },
      ].map(({ label, val, color }) => (
        <div key={label} className="flex justify-between items-start text-[11px] py-2 border-b border-white/[0.06]">
          <span className="text-white/35 flex-shrink-0 mr-4">{label}</span>
          <span className={`${color} text-right`}>{val}</span>
        </div>
      ))}
    </div>
  )
}

export default function WorkflowSection() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]

  return (
    <section id="workflow" className="relative py-28 md:py-32 px-6 md:px-12 bg-white overflow-hidden">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 right-[10%] w-[550px] h-[550px] rounded-full bg-teal/5 blur-[150px]"
          animate={{ scale: [1, 1.1, 1], x: [0, -35, 0], y: [0, 20, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-clinical-blue/5 blur-[120px]"
          animate={{ scale: [1, 1.08, 1], y: [0, -25, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
        />
      </div>

      <div className="relative max-w-[1200px] mx-auto">
        <Reveal>
          <p className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-teal mb-3">
            Clinical workflow
          </p>
          <h2 className="font-sans text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.025em] text-slate-900 max-w-[560px] leading-tight">
            Evidence infrastructure, not a chatbot.
          </h2>
          <p className="font-sans text-[14px] text-slate-500 mt-4 max-w-[480px] leading-relaxed">
            Six deterministic stages from EMR context to written-back synthesis. Every step auditable. Every output reproducible.
          </p>
        </Reveal>

        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <Reveal delay={0.08}>
            <div className="bg-gradient-to-br from-[#0A1628] to-[#0E2A45] border border-white/[0.08] rounded-2xl overflow-hidden min-h-[340px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.visual}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <StepVisual type={step.visual} />
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>

          <div className="space-y-0">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon
              const isActive = i === active
              return (
                <Reveal key={s.num} delay={i * 0.04}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={`w-full text-left flex gap-5 py-5 border-b border-slate-100 transition-all duration-200 ${
                      isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                    }`}
                  >
                    <span className="font-sans text-xs font-semibold text-slate-300 pt-0.5 flex-shrink-0">{s.num}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StepIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal' : 'text-slate-400'}`} strokeWidth={1.75} />
                        <h3 className="font-sans text-[15px] font-bold text-slate-900">{s.title}</h3>
                      </div>
                      <p className="font-sans text-[13px] text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                    {isActive && (
                      <motion.span layoutId="workflow-arrow" className="text-teal pt-0.5 flex-shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    )}
                  </button>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
