import { motion } from 'framer-motion'

const SYSTEMS = ['Mayo Clinic', 'Johns Hopkins', 'Cleveland Clinic', 'Mass General', 'UCSF Health', 'Stanford Medicine', 'NYU Langone', 'Kaiser Permanente']

export default function TrustedBySection() {
  const doubled = [...SYSTEMS, ...SYSTEMS]
  return (
    <div className="border-y border-slate-100 py-7 overflow-hidden bg-white">
      <p className="font-sans text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-300 text-center mb-5">
        Designed for clinical teams at
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #ffffff, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #ffffff, transparent)' }} />
        <motion.div className="flex gap-14 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}>
          {doubled.map((name, i) => (
            <span key={i} className="font-sans text-[13px] font-semibold text-slate-200 tracking-wide select-none flex-shrink-0">
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
