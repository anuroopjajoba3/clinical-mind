import { motion } from 'framer-motion'

const STATS = [
  { value: '4 min',  label: 'Avg. synthesis time', sub: 'down from 2+ hours' },
  { value: '340',    label: 'Active clinicians' },
  { value: '100%',   label: 'FHIR write-back rate' },
]

const POINTS = [
  'FHIR R4 patient context pulled before every run',
  'Drug interaction checks against live medication list',
  'Full audit trail written back to the EMR',
]

export default function CaseStudySection() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-14 bg-white">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="mb-14">
          <p className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-[#0891B2] mb-3">
            Case study
          </p>
          <h2 className="text-slate-900 leading-[1.06] max-w-[480px]"
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 800 }}>
            Evidence synthesis{' '}
            <em style={{ fontStyle: 'italic', color: '#1a56db' }}>at clinical scale.</em>
          </h2>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.06 }}
          className="grid grid-cols-3 gap-4 mb-8">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-6"
              style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
              <p className="font-sans text-[38px] font-extrabold text-slate-900 leading-none">{s.value}</p>
              <p className="font-sans text-[12px] text-slate-500 mt-2">{s.label}</p>
              {s.sub && <p className="font-sans text-[11px] font-semibold text-[#0891B2] mt-1">{s.sub}</p>}
            </div>
          ))}
        </motion.div>

        {/* Main content card */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }}
          className="rounded-2xl border border-slate-200 overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>
          <div className="grid lg:grid-cols-[1fr_1.2fr]">

            {/* Left: quote / narrative */}
            <div className="relative p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-between gap-8 overflow-hidden">
              {/* Background clinical photo */}
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=700&q=80"
                  alt="Clinical team"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(248,250,252,0.92) 0%, rgba(248,250,252,0.97) 100%)' }} />
              </div>

              <div className="relative z-10">
                <span className="inline-block font-sans text-[10px] font-bold tracking-[0.12em] uppercase text-[#0891B2] bg-[#ECFEFF] border border-[#A5F3FC] rounded-full px-3 py-1 mb-5">
                  Internal medicine team
                </span>
                <p className="font-sans text-[16px] text-slate-700 leading-[1.7]">
                  "We went from spending 2+ hours on literature review per complex case
                  to a structured, evidence-graded synthesis in under 4 minutes —
                  with the report automatically in the chart."
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-slate-200">
                {/* Real doctor photo */}
                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2 border-white" style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.15)' }}>
                  <img
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=80&h=80&q=80"
                    alt="Dr. Chen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-sans text-[13px] font-bold text-slate-800">Dr. Chen</p>
                  <p className="font-sans text-[11px] text-slate-400">Internal Medicine · 340-clinician team</p>
                </div>
              </div>
            </div>

            {/* Right: checklist */}
            <div className="p-8 md:p-10 flex flex-col justify-center bg-white">
              <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">What they use it for</p>
              <div className="space-y-4">
                {POINTS.map((point, i) => (
                  <motion.div key={point}
                    initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
                    className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-[#ECFEFF] border border-[#A5F3FC] flex-shrink-0 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2]" />
                    </span>
                    <p className="font-sans text-[14px] text-slate-700 leading-snug">{point}</p>
                  </motion.div>
                ))}
              </div>

              {/* FHIR write-back indicator */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-sans text-[11px] font-bold uppercase tracking-widest text-slate-400">FHIR write-back rate</p>
                  <p className="font-sans text-[13px] font-bold text-emerald-600">100%</p>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }} whileInView={{ width: '100%' }}
                    viewport={{ once: true }} transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }} />
                </div>
                <p className="font-sans text-[11px] text-slate-400 mt-2">Every completed synthesis written to the patient record.</p>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
