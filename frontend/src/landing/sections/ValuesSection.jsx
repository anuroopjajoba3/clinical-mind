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
    <section id="values" className="py-28 md:py-32 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#EDE8DA]" />
      <div className="absolute inset-0 bg-grain opacity-[0.55] pointer-events-none" />

      <div className="max-w-[1080px] mx-auto relative">
        <Reveal>
          <h2 className="text-center max-w-[700px] mx-auto leading-[1.05] tracking-[-0.03em]">
            <span className="block font-serif text-[clamp(2.5rem,5.5vw,4.25rem)] font-black text-ink">
              Built for clarity.
            </span>
            <span className="block font-sans text-[clamp(2.5rem,5.5vw,4.25rem)] font-extrabold text-ink mt-1">
              Designed for action.
            </span>
          </h2>
        </Reveal>

        <div className="mt-16 grid md:grid-cols-3 gap-5">
          {VALUES.map((v, i) => {
            const Icon = v.icon
            return (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="bg-white rounded-lg p-9">
                  <div className="w-11 h-11 rounded-full border-[1.5px] border-[#D8D4CC] flex items-center justify-center mb-6">
                    <Icon className="w-5 h-5 text-ink" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-sans text-[17px] font-bold text-ink mb-2.5">{v.title}</h3>
                  <p className="font-serif text-sm text-[#666666] leading-[1.65]">{v.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
