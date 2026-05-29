import { motion } from 'framer-motion'
import { ShieldCheck, FlaskConical, GitMerge } from 'lucide-react'
import Reveal from '../ui/Reveal'

const VALUES = [
  {
    icon: ShieldCheck,
    tag: 'Compliance',
    title: 'Clarity drives action',
    desc: 'Every recommendation carries its evidence chain. Contradictions are explained before they reach the chart — not buried in a chat transcript.',
    accent: 'text-teal-light bg-teal/12 border-teal/20',
  },
  {
    icon: FlaskConical,
    tag: 'Evidence',
    title: 'Evidence that keeps pace',
    desc: 'PubMed indexes thousands of new papers daily. ClinicalMed searches in real time — not from a static database frozen at training time.',
    accent: 'text-clinical-blue bg-clinical-blue/10 border-clinical-blue/20',
  },
  {
    icon: GitMerge,
    tag: 'Infrastructure',
    title: 'Infrastructure, not a chatbot',
    desc: 'LangGraph orchestration means consistent outputs, full audit trails, and reproducible reasoning your compliance team can audit.',
    accent: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  },
]

export default function ValuesSection() {
  return (
    <section id="values" className="relative py-24 md:py-32 px-6 md:px-14 bg-white overflow-hidden">

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-20 right-[-10%] w-[550px] h-[550px] rounded-full bg-teal/5 blur-[140px]"
          animate={{ scale: [1, 1.12, 1], x: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] rounded-full bg-clinical-blue/5 blur-[110px]"
          animate={{ scale: [1, 1.1, 1], y: [0, -25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        />
      </div>

      <div className="relative max-w-[1200px] mx-auto">
        <Reveal>
          <p className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-teal mb-4 text-center">
            Why ClinicalMed
          </p>
          <h2 className="text-center max-w-[600px] mx-auto font-sans text-[clamp(2rem,4.5vw,3rem)] font-extrabold text-slate-900 tracking-[-0.025em] leading-[1.1] mb-16">
            Built for clarity.
            <span className="text-slate-400"> Designed for action.</span>
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-5">
          {VALUES.map((v, i) => {
            const Icon = v.icon
            return (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-8 h-full border border-slate-100 shadow-clinical hover:shadow-clinical-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-1.5 mb-6 ${v.accent}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="font-sans text-[11px] font-bold tracking-wide uppercase">{v.tag}</span>
                  </div>
                  <h3 className="font-sans text-[17px] font-bold text-slate-900 mb-3">{v.title}</h3>
                  <p className="font-sans text-[13px] text-slate-500 leading-[1.75]">{v.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
