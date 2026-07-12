import { motion } from 'framer-motion'

export default function AppLoader() {
  return (
    <div className="min-h-screen bg-[#060E1A] flex flex-col items-center justify-center gap-8 relative overflow-hidden">

      {/* Ambient blobs */}
      <motion.div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#0E7490]/10 blur-[150px] pointer-events-none"
        animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-sky-500/5 blur-[120px] pointer-events-none"
        animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />

      {/* Logo */}
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-14 h-14 rounded-2xl bg-[#0E7490]/20 border border-[#0E7490]/30 flex items-center justify-center"
        >
          <span className="font-sans text-[22px] font-extrabold text-[#67C5D5]">CM</span>
        </motion.div>
        <div className="text-center">
          <p className="font-sans text-[18px] font-bold text-white tracking-tight">ClinicalMind</p>
          <p className="font-sans text-[12px] text-white/30 mt-1">Loading your workspace…</p>
        </div>
      </motion.div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <motion.span key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#0E7490]"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}
