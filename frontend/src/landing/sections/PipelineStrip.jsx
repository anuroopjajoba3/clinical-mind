import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const STEPS = [
  'FHIR R4 Context',
  'PICO Extraction',
  'PubMed Search',
  'Evidence Grading',
  'Contradiction Check',
  'Drug Interaction',
  'Synthesis',
  'EMR Write-back',
]

export default function PipelineStrip() {
  return (
    <div className="bg-[#F8FAFC] border-b border-slate-100 py-5 px-6 md:px-14 overflow-x-auto">
      <div className="max-w-[1100px] mx-auto flex items-center gap-0 min-w-max mx-auto">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-0">
            <motion.div
              initial={{ opacity: 0, y: 4 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex flex-col items-center gap-1.5 px-3">
              <div className="w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center">
                <span className="font-sans text-[9px] font-bold text-slate-400">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <span className="font-sans text-[10px] font-medium text-slate-500 whitespace-nowrap">{step}</span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
