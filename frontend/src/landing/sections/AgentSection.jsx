import { motion } from 'framer-motion'
import { GitBranch, Loader2 } from 'lucide-react'
import Reveal from '../ui/Reveal'
import SectionHeader from '../ui/SectionHeader'

const AGENTS = [
  { key: 'fhir', label: 'FHIR Context', desc: 'EMR patient load' },
  { key: 'pico', label: 'PICO', desc: 'Question framing' },
  { key: 'search', label: 'Search', desc: 'PubMed + Trials' },
  { key: 'summarizer', label: 'Summarizer', desc: 'Abstract analysis' },
  { key: 'contradiction', label: 'Contradiction', desc: 'Conflict detection' },
  { key: 'drug', label: 'Drug Check', desc: 'Interaction safety' },
  { key: 'synthesize', label: 'Synthesize', desc: 'Clinical report' },
  { key: 'followup', label: 'Follow-up', desc: 'Evidence gaps' },
]

export default function AgentSection() {
  return (
    <section id="agents" className="py-28 md:py-32 px-6 md:px-12 bg-ink text-ivory relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <Reveal>
          <SectionHeader
            dark
            eyebrow="Multi-agent orchestration"
            title="Eight agents. One deterministic graph."
            subtitle="LangGraph routes every clinical run through the same auditable pipeline — with live SSE streaming to your team."
          />
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-16 grid lg:grid-cols-[1fr_280px] gap-10 items-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-8">
                <GitBranch className="w-4 h-4 text-teal-muted" />
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-ivory/50">
                  Live orchestration
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AGENTS.map((agent, i) => (
                  <motion.div
                    key={agent.key}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`rounded-xl p-4 border ${
                      i === 3
                        ? 'border-teal/50 bg-teal/10'
                        : i < 3
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sans text-[10px] font-bold text-ivory/40">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {i === 3 && (
                        <Loader2 className="w-3 h-3 text-teal-muted animate-spin" strokeWidth={2} />
                      )}
                    </div>
                    <p className="font-sans text-sm font-semibold text-ivory">{agent.label}</p>
                    <p className="font-sans text-[11px] text-ivory/45 mt-0.5">{agent.desc}</p>
                  </motion.div>
                ))}
              </div>

              <svg className="w-full h-8 mt-4 opacity-20" viewBox="0 0 400 8">
                <path d="M0 4 H400" stroke="currentColor" strokeDasharray="4 4" className="text-teal-muted" />
              </svg>
              <p className="font-sans text-xs text-ivory/40 mt-4">
                Conditional routing after search, contradiction, and synthesis nodes — no linear prompt chains.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="font-sans text-[10px] uppercase tracking-wider text-ivory/40 mb-2">Stream status</p>
                <p className="font-serif text-2xl font-bold text-ivory">SSE · Live</p>
                <p className="font-sans text-xs text-ivory/50 mt-2">agent_status on every publish event</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <p className="font-sans text-[10px] uppercase tracking-wider text-ivory/40 mb-2">Completion signal</p>
                <p className="font-sans text-sm text-ivory/70 leading-relaxed">
                  Full report presence — not status string alone. Reconnect-safe synthesis UI.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
