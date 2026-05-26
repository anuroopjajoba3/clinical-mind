import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import Reveal from '../ui/Reveal'
import SectionHeader from '../ui/SectionHeader'

const CONFLICTS = [
  {
    severity: 'major',
    claimA: 'SGLT2 inhibitors reduce HF hospitalization in HFrEF (EMPEROR-Reduced)',
    claimB: 'Subgroup analysis shows no benefit in eGFR under 30 without albuminuria',
    resolution: 'Agents flag population mismatch — relevance downgraded for this patient',
  },
  {
    severity: 'moderate',
    claimA: 'Metformin remains first-line in T2DM guidelines',
    claimB: 'Recent cohort data suggests caution below eGFR 45 in elderly CKD',
    resolution: 'Contradiction explained with dosing context from FHIR meds',
  },
]

export default function ContradictionSection() {
  return (
    <section className="py-28 md:py-32 px-6 md:px-12 bg-cream relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-40 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <Reveal>
          <SectionHeader
            eyebrow="Contradiction engine"
            title="When trials disagree, clinicians need to know why."
            subtitle="Not a single answer — a ranked analysis of conflicting evidence with severity, mechanism, and patient-specific relevance."
            align="center"
            className="max-w-2xl mx-auto text-center [&_p]:mx-auto"
          />
        </Reveal>

        <div className="mt-16 grid md:grid-cols-2 gap-6">
          {CONFLICTS.map((c, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <motion.div
                className="bg-white border border-sand rounded-2xl p-7 shadow-editorial"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <Zap className={`w-4 h-4 ${c.severity === 'major' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span
                    className={`font-sans text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                      c.severity === 'major' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.severity}
                  </span>
                </div>
                <div className="space-y-3 mb-5">
                  <p className="font-sans text-sm text-ink leading-relaxed border-l-2 border-teal pl-3">
                    {c.claimA}
                  </p>
                  <p className="font-sans text-sm text-slate-600 leading-relaxed border-l-2 border-lavender pl-3">
                    {c.claimB}
                  </p>
                </div>
                <p className="font-sans text-xs text-teal font-medium leading-relaxed bg-teal/5 rounded-lg px-3 py-2">
                  {c.resolution}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
