import { motion } from 'framer-motion'
import { useScrollReveal } from '../hooks/useScrollReveal'

const ITEMS = [
  'FHIR R4', '8 LangGraph agents', 'PubMed + Trials', 'SSE streaming',
  'Drug interactions', 'EMR write-back', 'Patient insights', 'Evidence compare',
]

export default function PipelineStrip() {
  const { ref, visible } = useScrollReveal()
  return (
    <div ref={ref} className="bg-white border-y border-[#E8E4DC] py-4 px-6 md:px-10 overflow-hidden">
      <div className="max-w-[1080px] mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {ITEMS.map((item, i) => (
          <motion.span
            key={item}
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="font-sans text-[10px] font-bold tracking-[0.1em] uppercase text-[#B0ABA3]"
          >
            {item}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
