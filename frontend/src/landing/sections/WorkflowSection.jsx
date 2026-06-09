import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Database, Brain, Search, AlertTriangle, FileText, Upload } from 'lucide-react'

const STEPS = [
  {
    num: '01', icon: Database, title: 'Connect patient context',
    desc: 'FHIR R4 pulls live labs, meds, diagnoses, and encounters directly from your EMR. No copy-paste. No stale exports.',
    detail: [
      { k: 'Conditions', v: 'HFrEF · CKD Stage 3 · T2DM' },
      { k: 'Medications', v: 'Empagliflozin · Metformin · Furosemide' },
      { k: 'Last eGFR', v: '41 mL/min/1.73m²' },
      { k: 'NT-proBNP', v: '1,840 pg/mL (elevated)' },
    ],
    tag: 'FHIR R4',
  },
  {
    num: '02', icon: Brain, title: 'AI structures the clinical question',
    desc: 'PICO agent extracts Patient, Intervention, Comparison, and Outcome from the free-text query, then builds targeted PubMed MeSH and ClinicalTrials queries.',
    detail: [
      { k: 'Population', v: 'HFrEF + CKD Stage 3' },
      { k: 'Intervention', v: 'SGLT2 inhibitors' },
      { k: 'Comparison', v: 'Standard of care' },
      { k: 'Outcome', v: 'Hospitalization, eGFR decline' },
    ],
    tag: 'PICO',
  },
  {
    num: '03', icon: Search, title: 'Parallel evidence search',
    desc: 'PubMed E-utilities and ClinicalTrials.gov API queried simultaneously. Each abstract summarized and graded Level 1A–4 for clinical relevance.',
    detail: [
      { k: 'PubMed results', v: '14 relevant abstracts' },
      { k: 'ClinicalTrials', v: '3 matching trials' },
      { k: 'Top grade', v: 'Level 1A (EMPEROR-Reduced)' },
      { k: 'Avg confidence', v: '87%' },
    ],
    tag: 'PubMed + Trials',
  },
  {
    num: '04', icon: AlertTriangle, title: 'Contradictions surfaced',
    desc: "Conflicting RCT conclusions detected, explained, and ranked by clinical severity — before they reach the chart. You see the conflict, not just the winner.",
    detail: [
      { k: 'Trial A', v: 'EMPEROR: benefit in HFrEF (NNT 19)' },
      { k: 'Trial B', v: 'DAPA-CKD subgroup: reversed in CKD4+' },
      { k: 'Severity', v: 'High — affects prescribing decision' },
      { k: 'Resolution', v: 'Patient CKD Stage 3 — benefit likely' },
    ],
    tag: 'Contradiction',
  },
  {
    num: '05', icon: FileText, title: 'Structured synthesis streamed',
    desc: 'Bottom line, ranked interventions, drug interaction results, and follow-up gaps stream in real time. Report is complete when the full object arrives — not on status string.',
    detail: [
      { k: 'Bottom line', v: 'SGLT2i — Level 1A benefit' },
      { k: 'Drug check', v: 'No interactions detected' },
      { k: 'Confidence', v: '94%' },
      { k: 'Run time', v: '3m 42s' },
    ],
    tag: 'Synthesis',
  },
  {
    num: '06', icon: Upload, title: 'Report written to EMR',
    desc: 'FHIR DocumentReference created on the patient record. Auditable, reproducible, and available in the chart immediately after the run completes.',
    detail: [
      { k: 'Resource type', v: 'DocumentReference' },
      { k: 'Patient', v: 'MRN-00421 · Sarah K.' },
      { k: 'Status', v: 'final' },
      { k: 'Date', v: new Date().toISOString().split('T')[0] },
    ],
    tag: 'FHIR Write-back',
  },
]

export default function WorkflowSection() {
  const [active, setActive] = useState(0)
  const step = STEPS[active]
  const Icon = step.icon

  return (
    <section id="workflow" className="py-24 md:py-32 px-6 md:px-14 bg-white">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="mb-14">
          <p className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-[#0891B2] mb-3">
            How it works
          </p>
          <h2 className="text-slate-900 leading-[1.06] max-w-[480px]"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 800 }}>
            From EMR to{' '}
            <em style={{ fontStyle: 'italic', color: '#1a56db' }}>written-back synthesis.</em>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-start">

          {/* Left — step list */}
          <div className="space-y-0">
            {STEPS.map((s, i) => {
              const SIcon = s.icon
              const isActive = i === active
              return (
                <motion.button
                  type="button"
                  key={s.num}
                  onClick={() => setActive(i)}
                  initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
                  className={`w-full text-left flex items-start gap-4 py-5 border-b border-slate-100 last:border-0 transition-all duration-200 group`}>

                  {/* Number circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0891B2] text-white'
                      : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}>
                    <span className="font-sans text-[11px] font-bold">{s.num}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SIcon className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-[#0891B2]' : 'text-slate-400'}`} strokeWidth={2} />
                      <h3 className={`font-sans text-[14px] font-bold transition-colors duration-200 ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                        {s.title}
                      </h3>
                    </div>
                    {isActive && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
                        className="font-sans text-[13px] text-slate-500 leading-relaxed">
                        {s.desc}
                      </motion.p>
                    )}
                  </div>

                  {isActive && (
                    <span className="text-[10px] font-bold text-[#0891B2] bg-[#ECFEFF] border border-[#A5F3FC] px-2 py-0.5 rounded-full flex-shrink-0 mt-1">
                      {s.tag}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Right — detail card */}
          <div className="lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                style={{ boxShadow: '0 4px 20px rgba(15,23,42,0.07)' }}>

                {/* Card header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ECFEFF] border border-[#A5F3FC] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#0891B2]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#0891B2]">Step {step.num}</p>
                    <p className="font-sans text-[14px] font-bold text-slate-800">{step.title}</p>
                  </div>
                </div>

                {/* Data rows — Notion property view */}
                <div className="divide-y divide-slate-50">
                  {step.detail.map(({ k, v }) => (
                    <div key={k} className="flex items-start justify-between gap-4 px-6 py-3.5">
                      <span className="font-sans text-[12px] text-slate-400 flex-shrink-0 min-w-[100px]">{k}</span>
                      <span className="font-sans text-[12px] font-medium text-slate-700 text-right">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Progress indicator */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-[10px] text-slate-400">Pipeline progress</span>
                    <span className="font-sans text-[10px] font-semibold text-slate-600">Step {active + 1} of {STEPS.length}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#0891B2] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
}
