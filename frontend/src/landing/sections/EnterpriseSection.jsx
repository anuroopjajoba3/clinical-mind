import Reveal from '../ui/Reveal'
import SectionHeader from '../ui/SectionHeader'
import { Shield, Lock, FileCheck, Server } from 'lucide-react'

const TRUST = [
  { icon: Shield, label: 'HIPAA BAA', desc: 'Enterprise agreements available' },
  { icon: Lock, label: 'SOC 2 path', desc: 'Security controls in progress' },
  { icon: FileCheck, label: 'Audit trails', desc: 'Full LangGraph run history' },
  { icon: Server, label: 'Self-hosted', desc: 'Docker · Postgres · Redis' },
]

export default function EnterpriseSection() {
  return (
    <section id="enterprise" className="py-28 md:py-32 px-6 md:px-12 bg-white border-t border-sand">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <SectionHeader
            eyebrow="Enterprise trust"
            title="Infrastructure your compliance team can stand behind."
            subtitle="FHIR-native write-back, deterministic agent graphs, and deployment on your stack — not a black-box API."
          />
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST.map(t => {
              const Icon = t.icon
              return (
                <div
                  key={t.label}
                  className="p-6 rounded-xl border border-sand bg-ivory hover:border-teal/30 transition-colors"
                >
                  <Icon className="w-5 h-5 text-teal mb-4" strokeWidth={1.5} />
                  <p className="font-sans text-sm font-semibold text-ink">{t.label}</p>
                  <p className="font-sans text-xs text-slate-500 mt-1">{t.desc}</p>
                </div>
              )
            })}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 grid lg:grid-cols-2 gap-0 border border-sand rounded-2xl overflow-hidden">
            <div className="min-h-[280px] bg-gradient-to-br from-navy-mid to-ink p-10 flex flex-col justify-end">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-ivory/50 mb-2">
                Case study
              </p>
              <p className="font-serif text-2xl font-bold text-ivory leading-snug">
                Evidence synthesis dropped from 2 hours to about 60 seconds per case.
              </p>
            </div>
            <div className="p-10 bg-cream flex flex-col justify-center">
              <p className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                Internal medicine · 340 clinicians
              </p>
              <p className="font-sans text-sm text-slate-600 leading-relaxed mb-6">
                Fragmented EMR data and growing literature volume made point-of-care evidence impossible at scale.
                ClinicalMind unified FHIR context, agent search, and DocumentReference write-back — with full
                contradiction and drug-interaction surfacing before prescribing.
              </p>
              <a href="#cta" className="font-sans text-sm font-semibold text-ink inline-flex items-center gap-1 hover:gap-2 transition-all">
                Request case study
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
