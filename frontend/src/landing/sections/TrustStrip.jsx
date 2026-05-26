const ITEMS = [
  'FHIR R4 Native',
  'HIPAA Ready',
  '36M+ PubMed',
  '8 Orchestrated Agents',
  'LangGraph Pipeline',
  'Real-Time SSE',
]

export default function TrustStrip() {
  return (
    <div className="bg-white border-y border-sand py-5 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
        {ITEMS.map(item => (
          <span
            key={item}
            className="font-sans text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
