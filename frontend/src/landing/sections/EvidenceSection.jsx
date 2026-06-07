import { motion } from 'framer-motion'

const SOURCES = [
  { title: 'EMPEROR-Reduced', journal: 'NEJM', year: '2020', grade: '1A', confidence: 94, relevance: 'High', type: 'RCT', n: '3,730' },
  { title: 'DAPA-CKD Trial',  journal: 'NEJM', year: '2020', grade: '1A', confidence: 91, relevance: 'High', type: 'RCT', n: '4,304' },
  { title: 'CREDENCE Subgroup', journal: 'Lancet', year: '2019', grade: '2B', confidence: 72, relevance: 'Moderate', type: 'Sub-analysis', n: '1,040' },
  { title: 'EMPEROR-Preserved', journal: 'NEJM', year: '2021', grade: '2A', confidence: 68, relevance: 'Low', type: 'RCT', n: '5,988' },
]

const COLS = ['Study', 'Journal', 'Type', 'N', 'Grade', 'Confidence', 'Relevance']

export default function EvidenceSection() {
  return (
    <section id="evidence" className="py-24 md:py-32 px-6 md:px-14 bg-[#F8FAFC]">
      <div className="max-w-[1100px] mx-auto">

        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase text-[#0891B2] mb-3">
              Evidence synthesis
            </p>
            <h2 className="font-sans text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-[-0.03em] text-slate-900 leading-[1.08] max-w-[520px]">
              36 million papers, ranked for one patient.
            </h2>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-right">
              <p className="font-sans text-[32px] font-extrabold text-slate-900 leading-none">17</p>
              <p className="font-sans text-[11px] text-slate-400 mt-1">sources retrieved</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-right">
              <p className="font-sans text-[32px] font-extrabold text-[#0891B2] leading-none">94%</p>
              <p className="font-sans text-[11px] text-slate-400 mt-1">confidence score</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-right">
              <p className="font-sans text-[32px] font-extrabold text-slate-900 leading-none">1A</p>
              <p className="font-sans text-[11px] text-slate-400 mt-1">evidence grade</p>
            </div>
          </div>
        </motion.div>

        {/* Notion-style database table */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.08 }}
          className="rounded-2xl border border-slate-200 overflow-hidden bg-white"
          style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.05)' }}>

          {/* Table header */}
          <div className="grid border-b border-slate-100 bg-slate-50 px-5 py-3"
            style={{ gridTemplateColumns: '2fr 1fr 1.2fr 0.8fr 0.8fr 1.4fr 1fr' }}>
            {COLS.map(col => (
              <span key={col} className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {col}
              </span>
            ))}
          </div>

          {/* Table rows */}
          {SOURCES.map((src, i) => (
            <motion.div key={src.title}
              initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
              className="grid border-b border-slate-50 last:border-0 px-5 py-4 hover:bg-slate-50/60 transition-colors duration-150 items-center"
              style={{ gridTemplateColumns: '2fr 1fr 1.2fr 0.8fr 0.8fr 1.4fr 1fr' }}>

              {/* Study name */}
              <div>
                <p className="font-sans text-[13px] font-semibold text-slate-800">{src.title}</p>
              </div>

              {/* Journal + year */}
              <div>
                <p className="font-sans text-[12px] text-slate-500">{src.journal}</p>
                <p className="font-sans text-[10px] text-slate-400">{src.year}</p>
              </div>

              {/* Type */}
              <span className="font-sans text-[11px] text-slate-500">{src.type}</span>

              {/* N */}
              <span className="font-sans text-[12px] font-medium text-slate-600">{src.n}</span>

              {/* Grade badge */}
              <span className={`font-sans text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                src.grade === '1A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                src.grade === '2A' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {src.grade}
              </span>

              {/* Confidence bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${src.confidence >= 90 ? 'bg-emerald-500' : src.confidence >= 70 ? 'bg-[#0891B2]' : 'bg-amber-400'}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${src.confidence}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <span className="font-sans text-[11px] text-slate-500 w-8 text-right">{src.confidence}%</span>
              </div>

              {/* Relevance */}
              <span className={`font-sans text-[11px] font-semibold ${
                src.relevance === 'High' ? 'text-emerald-600' :
                src.relevance === 'Moderate' ? 'text-amber-600' : 'text-slate-400'
              }`}>
                {src.relevance}
              </span>
            </motion.div>
          ))}

          {/* Footer row */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="font-sans text-[11px] text-slate-400">Showing top 4 of 17 retrieved sources · Ranked by patient relevance</p>
            <span className="font-sans text-[11px] font-semibold text-[#0891B2]">View all →</span>
          </div>
        </motion.div>

        {/* Bottom callout */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            { label: 'Streaming synthesis', desc: 'Bottom line arrives while agents are still running. No waiting for the full pipeline.' },
            { label: 'Drug interaction check', desc: 'Every recommendation cross-referenced against the live FHIR medication list.' },
            { label: 'Contradiction detection', desc: 'Conflicting RCT conclusions surfaced and explained before reaching the chart.' },
          ].map((item, i) => (
            <motion.div key={item.label}
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="font-sans text-[13px] font-bold text-slate-800 mb-1.5">{item.label}</p>
              <p className="font-sans text-[12px] text-slate-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
