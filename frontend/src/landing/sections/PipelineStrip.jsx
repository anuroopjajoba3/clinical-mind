const ITEMS = [
  'FHIR R4',
  '8 LangGraph agents',
  'PubMed + Trials',
  'SSE streaming',
  'Drug interactions',
  'EMR write-back',
  'Patient insights',
  'Evidence compare',
]

export default function PipelineStrip() {
  return (
    <div className="bg-white border-y border-[#E8E4DC] py-5 px-6 md:px-12">
      <div className="max-w-[1080px] mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
        {ITEMS.map(item => (
          <span
            key={item}
            className="font-sans text-[10px] font-bold tracking-[0.12em] uppercase text-[#A8A49C]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
