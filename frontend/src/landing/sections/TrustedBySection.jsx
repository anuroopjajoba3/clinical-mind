import { motion } from 'framer-motion'
import { useScrollReveal } from '../hooks/useScrollReveal'

const SYSTEMS = [
  'Mayo Clinic',
  'Johns Hopkins',
  'Cleveland Clinic',
  'Mass General',
  'UCSF Health',
  'Stanford Medicine',
  'NYU Langone',
]

export default function TrustedBySection() {
  const { ref, visible } = useScrollReveal()
  return (
    <div ref={ref} className="bg-slate-50 border-y border-slate-200 py-10 px-6 md:px-14 overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          animate={visible ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-slate-400 text-center mb-7"
        >
          Designed for teams at leading health systems
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {SYSTEMS.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0, y: 6 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="font-sans text-[13px] font-bold text-slate-300 tracking-wide select-none"
            >
              {name}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  )
}
