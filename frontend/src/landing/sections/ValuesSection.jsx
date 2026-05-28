import { motion } from 'framer-motion'
import { Circle, Globe, ArrowUpRight } from 'lucide-react'
import Reveal from '../ui/Reveal'

const VALUES = [
  {
    icon: Circle,
    title: 'Clarity drives action',
    desc: 'Every recommendation carries its evidence chain. Contradictions are explained before they reach the chart — not buried in a chat transcript.',
  },
  {
    icon: Globe,
    title: 'Evidence that keeps pace',
    desc: 'PubMed indexes thousands of new papers daily. ClinicalMed searches in real time — not from a static database frozen at training time.',
  },
  {
    icon: ArrowUpRight,
    title: 'Infrastructure, not a chatbot',
    desc: 'LangGraph orchestration means consistent outputs, full audit trails, and reproducible reasoning your compliance team can audit.',
  },
]

export default function ValuesSection() {
  return (
    <section id="values" className="relative py-24 md:py-32 px-6 md:px-10 bg-[#F0EBE1] overflow-hidden">

      {/* Soft ambient warmth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 right-[-10%] w-[550px] h-[550px] rounded-full bg-accent-warm/20 blur-[130px]"
          animate={{ scale: [1, 1.12, 1], x: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-teal/10 blur-[100px]"
          animate={{ scale: [1, 1.1, 1], y: [0, -25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        />
      </div>

      <div className="relative max-w-[1080px] mx-auto">
        <Reveal>
          <h2 className="text-center max-w-[640px] mx-auto font-sans text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold text-ink tracking-[-0.02em] leading-[1.1] mb-16">
            Built for clarity.
            <span className="text-[#888]"> Designed for action.</span>
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4">
          {VALUES.map((v, i) => {
            const Icon = v.icon
            return (
              <Reveal key={v.title} delay={i * 0.07}>
                <div className="bg-white rounded-xl p-8 h-full border border-[#E5E0D5]">
                  <div className="w-9 h-9 rounded-full border border-[#DDD8CE] flex items-center justify-center mb-5">
                    <Icon className="w-4 h-4 text-ink" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-sans text-[16px] font-bold text-ink mb-2">{v.title}</h3>
                  <p className="font-sans text-[13px] text-[#666] leading-[1.7]">{v.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
