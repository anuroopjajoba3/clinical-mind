import { motion } from 'framer-motion'
import { ShieldCheck, FlaskConical, GitMerge, Clock } from 'lucide-react'

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Clarity drives action',
    desc: 'Every recommendation carries its evidence chain. Contradictions are explained before they reach the chart — not buried in a transcript.',
    stat: '100%', statLabel: 'evidence-backed',
    accent: '#0891B2', lightBg: '#ECFEFF', border: '#A5F3FC',
  },
  {
    icon: FlaskConical,
    title: 'Evidence that keeps pace',
    desc: 'PubMed indexes thousands of new papers daily. ClinicalMind searches in real time — not from a static training snapshot.',
    stat: '35M', statLabel: 'papers indexed',
    accent: '#2563EB', lightBg: '#EFF6FF', border: '#BFDBFE',
  },
  {
    icon: Clock,
    title: 'Synthesis in minutes, not hours',
    desc: 'The full eight-agent pipeline completes in about 60 seconds. Clinical teams previously spending hours on literature review reclaim that time.',
    stat: '60 sec', statLabel: 'avg. run time',
    accent: '#059669', lightBg: '#ECFDF5', border: '#A7F3D0',
  },
  {
    icon: GitMerge,
    title: 'Infrastructure, not a chatbot',
    desc: 'LangGraph orchestration means reproducible outputs, full audit trails, and deterministic reasoning your compliance team can verify.',
    stat: '8', statLabel: 'specialized agents',
    accent: '#9333EA', lightBg: '#FAF5FF', border: '#E9D5FF',
  },
]

export default function ValuesSection() {
  return (
    <section id="values" className="py-24 md:py-32 px-6 md:px-14 bg-[#F8FAFC]">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="mb-14 text-center">
          <p className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-[#0891B2] mb-3">
            Why ClinicalMind
          </p>
          <h2 className="text-slate-900 leading-[1.06] max-w-[480px] mx-auto"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 800 }}>
            Built for clinical reality,{' '}
            <em style={{ fontStyle: 'italic', color: '#1a56db' }}>not demos.</em>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map((v, i) => {
            const Icon = v.icon
            return (
              <motion.div key={v.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col gap-5 cursor-default"
                style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>

                {/* Stat */}
                <div>
                  <p className="font-sans text-[32px] font-extrabold leading-none" style={{ color: v.accent }}>
                    {v.stat}
                  </p>
                  <p className="font-sans text-[11px] text-slate-400 mt-1">{v.statLabel}</p>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Icon + title */}
                <div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: v.lightBg, border: `1px solid ${v.border}` }}>
                    <Icon className="w-4 h-4" style={{ color: v.accent }} strokeWidth={1.75} />
                  </div>
                  <h3 className="font-sans text-[14px] font-bold text-slate-800 mb-2">{v.title}</h3>
                  <p className="font-sans text-[12px] text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
