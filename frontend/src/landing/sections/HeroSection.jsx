import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Loader2, Circle } from 'lucide-react'
import { useState, useEffect } from 'react'

const PIPELINE = [
  { label: 'FHIR Context',     desc: 'Patient EMR loaded' },
  { label: 'PICO Extraction',  desc: 'Question structured' },
  { label: 'Evidence Search',  desc: 'PubMed + Trials' },
  { label: 'Summarizer',       desc: '14 abstracts graded' },
  { label: 'Contradiction',    desc: 'Conflicts checked' },
  { label: 'Drug Interaction', desc: 'Medications verified' },
  { label: 'Synthesize',       desc: 'Report generating...' },
  { label: 'Follow-up',        desc: 'Evidence gaps' },
]

const SOURCES = [
  { title: 'EMPEROR-Reduced', journal: 'NEJM 2020', grade: '1A', confidence: 94 },
  { title: 'DAPA-CKD Trial',  journal: 'NEJM 2020', grade: '1A', confidence: 91 },
  { title: 'CREDENCE Subgroup', journal: 'Lancet 2019', grade: '2B', confidence: 72 },
]

function LivePipelineMockup() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (step < PIPELINE.length) {
      const t = setTimeout(() => setStep(s => s + 1), step === 6 ? 1600 : 520)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setStep(0), 2200)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <div className="flex h-full">
      {/* Left panel — pipeline */}
      <div className="w-[44%] border-r border-slate-100 p-5 flex flex-col gap-3">
        <div className="mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Clinical Query</p>
          <p className="text-[12px] font-semibold text-slate-700 mt-1 leading-snug">
            SGLT2 inhibitors in HFrEF + CKD Stage 3
          </p>
        </div>
        <div className="h-px bg-slate-100" />
        <div className="space-y-2 flex-1">
          {PIPELINE.map((agent, i) => {
            const isDone = i < step, isRunning = i === step, isIdle = i > step
            return (
              <motion.div key={agent.label}
                animate={{ opacity: isIdle ? 0.35 : 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2">
                <span className="flex-shrink-0 w-3.5">
                  {isDone && <CheckCircle size={12} className="text-emerald-500" strokeWidth={2.5} />}
                  {isRunning && (
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 size={12} className="text-[#0891B2]" strokeWidth={2.5} />
                    </motion.span>
                  )}
                  {isIdle && <Circle size={12} className="text-slate-200" strokeWidth={1.5} />}
                </span>
                <span className={`text-[10px] font-medium flex-1 ${isDone ? 'text-emerald-600' : isRunning ? 'text-slate-800' : 'text-slate-300'}`}>
                  {agent.label}
                </span>
                {(isDone || isRunning) && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[9px] text-slate-400 flex-shrink-0">{agent.desc}</motion.span>
                )}
              </motion.div>
            )
          })}
        </div>
        {step >= PIPELINE.length && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-2 rounded-lg bg-[#ECFEFF] border border-[#A5F3FC] p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#0891B2]">Complete</p>
            <p className="text-[11px] font-semibold text-slate-700 mt-0.5">Level 1A · 94% confidence</p>
          </motion.div>
        )}
      </div>

      {/* Right panel — evidence rows */}
      <div className="flex-1 p-5 flex flex-col gap-3">
        <div className="mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evidence Results</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ranked for Sarah K. · MRN-00421</p>
        </div>
        <div className="h-px bg-slate-100" />

        {/* Patient context strip */}
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[10px]">
          <div className="flex gap-3 flex-wrap">
            {[['Conditions','HFrEF · CKD3'], ['Meds','Empagliflozin'], ['eGFR','41 mL/min']].map(([k,v]) => (
              <div key={k}>
                <span className="text-slate-400">{k}: </span>
                <span className="text-slate-700 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence table */}
        <div className="flex-1 space-y-1.5">
          {SOURCES.map((src, i) => (
            <motion.div key={src.title}
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.35 }}
              className="rounded-lg border border-slate-100 bg-white p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div>
                  <p className="text-[11px] font-semibold text-slate-700 leading-none">{src.title}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{src.journal}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  src.grade === '1A'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {src.grade}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[#0891B2]"
                    initial={{ width: 0 }} animate={{ width: `${src.confidence}%` }}
                    transition={{ delay: 0.5 + i * 0.12, duration: 0.7, ease: 'easeOut' }} />
                </div>
                <span className="text-[9px] text-slate-500 flex-shrink-0">{src.confidence}%</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FHIR write-back badge */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <p className="text-[10px] font-semibold text-emerald-700">DocumentReference written to EMR</p>
        </div>
      </div>
    </div>
  )
}

export default function HeroSection() {
  return (
    <section className="relative bg-white overflow-hidden" style={{ minHeight: '100svh' }}>

      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.5,
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 90%)',
        }} />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 md:px-12 pt-32 pb-16 flex flex-col items-center text-center">

        {/* Eyebrow */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#0891B2] tracking-[0.12em] uppercase bg-[#ECFEFF] border border-[#A5F3FC] px-3.5 py-1.5 rounded-full">
            <motion.span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
            AI Clinical Evidence Platform · FHIR R4
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="mt-7 font-sans font-black text-slate-900 tracking-[-0.04em] leading-[1.04]"
          style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
          Clinical intelligence<br />
          <span className="text-[#0891B2]">built for medicine.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-6 font-sans text-[17px] text-slate-500 leading-relaxed max-w-[520px]"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}>
          Eight AI agents search 36 million papers, grade evidence, check drug interactions,
          and write structured reports back to your EMR — in under 4 minutes.
        </motion.p>

        {/* CTAs */}
        <motion.div className="mt-8 flex flex-col sm:flex-row gap-3 items-center"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34 }}>
          <a href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0891B2] hover:bg-[#0E7490] text-white font-sans text-[14px] font-semibold rounded-lg transition-colors shadow-sm">
            Open platform
            <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#features"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 font-sans text-[14px] font-semibold rounded-lg hover:bg-slate-50 transition-colors">
            View pipeline
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.div className="mt-6 flex items-center gap-6 flex-wrap justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
          {['FHIR R4 Native', 'LangGraph Agents', 'HIPAA Ready', 'EMR Write-back'].map((t, i) => (
            <span key={t} className="flex items-center gap-1.5 font-sans text-[12px] text-slate-400">
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              {t}
            </span>
          ))}
        </motion.div>

        {/* Dashboard mockup card */}
        <motion.div
          className="mt-14 w-full rounded-2xl border border-slate-200 overflow-hidden bg-white"
          style={{ boxShadow: '0 8px 40px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.05)' }}
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}>

          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-[#FAFAFA]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            <div className="ml-4 flex-1 h-5 rounded-md bg-slate-100 flex items-center px-2.5">
              <span className="font-sans text-[10px] text-slate-400">clinicalmind.ai/app</span>
            </div>
          </div>

          {/* App layout */}
          <div className="flex" style={{ height: '380px' }}>
            {/* Sidebar */}
            <div className="w-44 border-r border-slate-100 flex flex-col p-3 gap-1 flex-shrink-0">
              <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                <div className="w-6 h-6 rounded bg-[#0891B2] flex items-center justify-center">
                  <span className="text-white font-bold text-[9px]">CM</span>
                </div>
                <span className="font-semibold text-[11px] text-slate-800">ClinicalMind</span>
              </div>
              {[
                { label: 'Dashboard', active: false },
                { label: 'Evidence Run', active: true },
                { label: 'Patients', active: false },
                { label: 'Reports', active: false },
                { label: 'FHIR Sync', active: false },
              ].map(({ label, active }) => (
                <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium ${active ? 'bg-[#ECFEFF] text-[#0891B2]' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-[#0891B2]' : 'bg-transparent'}`} />
                  {label}
                </div>
              ))}
              <div className="mt-auto border-t border-slate-100 pt-2 px-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">DC</div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-700">Dr. Chen</p>
                  <p className="text-[9px] text-slate-400">Internal Med.</p>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header bar */}
              <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">Evidence Run</p>
                  <p className="text-[10px] text-slate-400">Patient: Sarah K. · MRN-00421</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <LivePipelineMockup />
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
