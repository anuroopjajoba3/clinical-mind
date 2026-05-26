import { motion } from 'framer-motion'

export default function AppLoader() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col items-center justify-center gap-6">
      <motion.div
        className="font-sans text-xl font-extrabold text-ink"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        ClinicalMed
      </motion.div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-[#5B8F85]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}
