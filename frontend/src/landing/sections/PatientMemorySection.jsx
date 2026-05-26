import { motion } from 'framer-motion'
import { Network, Clock } from 'lucide-react'
import Reveal from '../ui/Reveal'
import SectionHeader from '../ui/SectionHeader'

const MEMORY_NODES = [
  { id: 'patient', label: 'Patient', x: 50, y: 50, r: 28 },
  { id: 'ckd', label: 'CKD Stage 3', x: 22, y: 28, r: 18 },
  { id: 't2dm', label: 'T2DM', x: 78, y: 30, r: 18 },
  { id: 'egfr', label: 'eGFR ↓', x: 18, y: 72, r: 16 },
  { id: 'sglt2', label: 'SGLT2 evidence', x: 82, y: 68, r: 20 },
]

const EDGES_MEM = [['patient', 'ckd'], ['patient', 't2dm'], ['ckd', 'egfr'], ['t2dm', 'sglt2'], ['egfr', 'sglt2']]

const TIMELINE_EVENTS = [
  { date: 'Mar 2022', event: 'Metformin initiated', type: 'med' },
  { date: 'Aug 2023', event: 'eGFR 44 — CKD flagged', type: 'lab' },
  { date: 'Jan 2024', event: 'Evidence run: SGLT2 in CKD', type: 'ai' },
  { date: 'Feb 2024', event: 'DocumentReference written', type: 'emr' },
]

export default function PatientMemorySection() {
  return (
    <section id="memory" className="py-28 md:py-32 px-6 md:px-12 bg-ivory">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <SectionHeader
              eyebrow="FHIR patient memory"
              title="Longitudinal context that compounds."
              subtitle="Every evidence run enriches a patient-specific memory layer — trajectories, risk signals, and prior syntheses inform the next investigation."
            />

            <Reveal delay={0.12}>
              <div className="relative aspect-[4/3] bg-white border border-sand rounded-2xl shadow-editorial overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {EDGES_MEM.map(([a, b]) => {
                    const na = MEMORY_NODES.find(n => n.id === a)
                    const nb = MEMORY_NODES.find(n => n.id === b)
                    return (
                      <line
                        key={`${a}-${b}`}
                        x1={na.x}
                        y1={na.y}
                        x2={nb.x}
                        y2={nb.y}
                        stroke="#5B8F85"
                        strokeOpacity="0.35"
                        strokeWidth="0.4"
                      />
                    )
                  })}
                </svg>
                {MEMORY_NODES.map((node, i) => (
                  <motion.div
                    key={node.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border border-teal/30 bg-teal/5 font-sans text-[9px] font-semibold text-teal text-center px-1"
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      width: node.r * 2,
                      height: node.r * 2,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 200 }}
                  >
                    {node.label}
                  </motion.div>
                ))}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-teal" />
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Memory graph
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-20 grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-sand rounded-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-lavender" />
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Patient timeline
                </span>
              </div>
              <div className="space-y-0">
                {TIMELINE_EVENTS.map((ev, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b border-sand last:border-0">
                    <div className="w-16 flex-shrink-0 font-sans text-[11px] text-slate-400">{ev.date}</div>
                    <div className="flex-1">
                      <p className="font-sans text-sm text-ink">{ev.event}</p>
                      <span
                        className={`inline-block mt-1 font-sans text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          ev.type === 'ai'
                            ? 'bg-lavender-soft text-lavender'
                            : ev.type === 'lab'
                              ? 'bg-teal/10 text-teal'
                              : 'bg-cream text-slate-500'
                        }`}
                      >
                        {ev.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-cream to-lavender-soft/30 border border-sand rounded-2xl p-8 flex flex-col justify-center">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-teal mb-3">
                Confidence indicators
              </p>
              <p className="font-serif text-3xl font-bold text-ink mb-2">94%</p>
              <p className="font-sans text-sm text-slate-600 mb-6">
                EMPEROR-Reduced · Level 1A · High patient relevance
              </p>
              <div className="h-2 bg-white rounded-full overflow-hidden border border-sand">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal to-teal-muted rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: '94%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="font-sans text-xs text-slate-500 mt-4 leading-relaxed">
                Evidence graded per source — not a single model confidence score.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
