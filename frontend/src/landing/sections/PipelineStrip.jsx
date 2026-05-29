import { motion } from 'framer-motion'
import { useScrollReveal } from '../hooks/useScrollReveal'

const ITEMS = [
  'FHIR R4 Native', '8 LangGraph Agents', 'PubMed + ClinicalTrials',
  'SSE Streaming', 'Drug Interactions', 'EMR Write-Back', 'Patient Insights', 'Evidence Compare',
]

export default function PipelineStrip() {
  const { ref, visible } = useScrollReveal()
  return (
    <div ref={ref} className="bg-white border-y border-slate-100 py-5 px-6 md:px-14">
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {ITEMS.map((item, i) => (
          <motion.div
            key={item}
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex items-center gap-2"
          >
            <span className="w-1 h-1 rounded-full bg-teal flex-shrink-0" />
            <span className="font-sans text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-400">{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
