import { motion } from 'framer-motion'
import { Database, GitBranch, FileOutput } from 'lucide-react'

const STEPS = [
  { icon: Database, label: 'Connect FHIR patient' },
  { icon: GitBranch, label: 'Run evidence agents' },
  { icon: FileOutput, label: 'Synthesis to EMR' },
]

export default function WorkflowStrip() {
  return (
    <motion.div
      className="grid grid-cols-3 gap-3 mb-8"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {STEPS.map((step, i) => {
        const Icon = step.icon
        return (
          <motion.div
            key={step.label}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/80 border border-[#E8E4DC]"
            whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(10,22,40,0.06)' }}
          >
            <span className="font-sans text-[10px] font-bold text-[#C8C4BA]">{String(i + 1).padStart(2, '0')}</span>
            <Icon className="w-3.5 h-3.5 text-[#5B8F85]" strokeWidth={1.75} />
            <span className="font-sans text-[11px] font-medium text-[#444] leading-tight">{step.label}</span>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
