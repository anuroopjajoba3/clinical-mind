import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Database, Brain, Search, AlertTriangle, FileText, Upload } from 'lucide-react'
import Reveal from '../ui/Reveal'
import SectionHeader from '../ui/SectionHeader'
import { BtnPrimary } from '../ui/Button'

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
    desc: 'Eight specialized agents query PubMed and ClinicalTrials.gov in parallel. Every source is graded for this patient.',
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
    desc: 'Structured reports stream in real time: bottom line, grading, drug checks, and follow-up evidence gaps.',
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
      <div className="p-6 space-y-3">
        {['eGFR', 'HbA1c', 'NT-proBNP'].map((lab, i) => (
          <div key={lab} className="flex items-center gap-3">
            <div className="w-20 font-sans text-xs text-slate-500">{lab}</div>
            <div className="flex-1 h-8 flex items-end gap-1">
              {[30, 45, 40, 55, 48].map((h, j) => (
                <div
                  key={j}
                  className={`flex-1 rounded-t ${j === 4 ? 'bg-teal' : 'bg-ink/10'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (type === 'agents') {
    return (
      <div className="p-6 grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className={`aspect-square rounded-lg border flex items-center justify-center font-sans text-[10px] font-bold ${
              i < 5 ? 'bg-teal/10 border-teal/30 text-teal' : 'bg-cream border-sand text-slate-400'
            }`}
            animate={i === 4 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {String(i + 1).padStart(2, '0')}
          </motion.div>
        ))}
      </div>
    )
  }
  if (type === 'contradiction') {
    return (
      <div className="p-6 space-y-3">
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/80">
          <p className="font-sans text-xs font-semibold text-amber-900">Trial A · Benefit reported</p>
          <p className="font-sans text-[11px] text-amber-800/80 mt-1">SGLT2 · cardiovascular outcome neutral</p>
        </div>
        <div className="p-3 rounded-lg bg-red-50/80 border border-red-200/60">
          <p className="font-sans text-xs font-semibold text-red-900">Trial B · Conflicting signal</p>
          <p className="font-sans text-[11px] text-red-800/80 mt-1">Primary endpoint · opposite direction</p>
        </div>
      </div>
    )
  }
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="w-full max-w-xs aspect-square rounded-full border border-dashed border-teal/40 flex items-center justify-center">
        <span className="font-serif text-4xl text-teal/60">FHIR</span>
      </div>
    </div>
  )
}

export default function WorkflowSection() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]

  return (
    <section id="workflow" className="py-28 md:py-32 px-6 md:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <SectionHeader
            eyebrow="Clinical workflow"
            title="Evidence infrastructure, not a chatbot."
            subtitle="Six deterministic stages from EMR context to written-back synthesis. Every step auditable. Every output reproducible."
          />
        </Reveal>

        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <Reveal delay={0.08}>
            <div className="bg-cream border border-sand rounded-2xl overflow-hidden min-h-[320px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.visual}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
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
                    className={`w-full text-left flex gap-5 py-6 border-b border-sand transition-colors ${
                      isActive ? 'opacity-100' : 'opacity-60 hover:opacity-90'
                    }`}
                  >
                    <span className="font-sans text-xs font-semibold text-slate-300 pt-1">{s.num}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <StepIcon className={`w-4 h-4 ${isActive ? 'text-teal' : 'text-slate-400'}`} strokeWidth={1.75} />
                        <h3 className="font-serif text-lg font-bold text-ink">{s.title}</h3>
                      </div>
                      <p className="font-sans text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                    </div>
                    {isActive && (
                      <motion.span layoutId="workflow-arrow" className="text-teal pt-1">
                        <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    )}
                  </button>
                </Reveal>
              )
            })}
            <Reveal delay={0.2}>
              <div className="pt-8">
                <BtnPrimary href="/app">Launch platform</BtnPrimary>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
