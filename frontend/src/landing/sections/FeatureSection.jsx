import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, Circle } from 'lucide-react'
import Reveal from '../ui/Reveal'

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

function PipelineMockup() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step < PIPELINE.length) {
      const t = setTimeout(() => setStep(s => s + 1), step === 6 ? 1800 : 620)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => setStep(0), 2400)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6">
      {/* Query chip */}
      <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3">
        <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">Clinical query</p>
        <p className="font-sans text-sm font-semibold text-white leading-snug">
          SGLT2 inhibitors in HFrEF with CKD stage 3
        </p>
      </div>

      {/* Agent steps */}
      <div className="space-y-1.5 my-4">
        {PIPELINE.map((agent, i) => {
          const isDone    = i < step
          const isRunning = i === step
          const isIdle    = i > step
          return (
            <motion.div
              key={agent.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: isIdle ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              className="flex items-center gap-2.5"
            >
              <span className="flex-shrink-0">
                {isDone    && <CheckCircle size={13} className="text-emerald-300" strokeWidth={2.5} />}
                {isRunning && (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={13} className="text-white" strokeWidth={2} />
                  </motion.span>
                )}
                {isIdle    && <Circle size={13} className="text-white/30" strokeWidth={1.5} />}
              </span>
              <p className={`font-sans text-[11px] font-semibold flex-1 ${isDone ? 'text-emerald-200' : isRunning ? 'text-white' : 'text-white/30'}`}>
                {agent.label}
              </p>
              {(isDone || isRunning) && (
                <AnimatePresence>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-sans text-[10px] text-white/45 flex-shrink-0"
                  >
                    {isDone ? agent.desc : agent.desc}
                  </motion.p>
                </AnimatePresence>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Evidence grading badge */}
      <div className="bg-white/92 backdrop-blur-sm border border-white/70 rounded-lg p-4">
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
  )
}

export default function FeatureSection() {
  return (
    <section id="features" className="relative py-28 md:py-32 px-6 md:px-12 bg-white overflow-hidden">

      {/* Ambient gradient drift */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-sky-light/40 blur-[140px]"
          animate={{ scale: [1, 1.1, 1], x: [0, -35, 0], y: [0, 25, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[5%] left-[-5%] w-[400px] h-[400px] rounded-full bg-teal/8 blur-[110px]"
          animate={{ scale: [1, 1.14, 1], y: [0, -20, 0] }}
          transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
        />
      </div>

      <div className="relative max-w-[1200px] mx-auto">
        <Reveal>
          <p className="font-sans text-xs font-semibold tracking-[0.1em] uppercase text-teal mb-4">
            LangGraph clinical pipeline
          </p>
          <h2 className="font-sans text-[clamp(2.25rem,4vw,3.25rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-slate-900 max-w-[600px]">
            From FHIR context to evidence written back to the EMR.
          </h2>
        </Reveal>

        <div className="mt-16 grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <Reveal delay={0.08}>
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#0A1628]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0E2A4A] via-[#0A1F3A] to-[#060E1A]" />
              <PipelineMockup />
            </div>
          </Reveal>

          <div>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.num}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-start justify-between gap-5 py-6 border-b border-slate-100 first:pt-0 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans text-[16px] font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="font-sans text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
                <motion.span
                  className="font-sans text-xs font-semibold text-slate-300 tracking-wide flex-shrink-0 pt-0.5"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
                >
                  {f.num}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
