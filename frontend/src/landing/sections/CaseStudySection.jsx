import Reveal from '../ui/Reveal'
import { BtnPrimary } from '../ui/Button'

const IMG =
  'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=900&q=80&auto=format'

export default function CaseStudySection() {
  return (
    <section className="py-28 md:py-32 px-6 md:px-12 bg-white">
      <div className="max-w-[1080px] mx-auto">
        <Reveal>
          <p className="font-sans text-xs font-semibold tracking-[0.08em] uppercase text-[#888888] mb-6">
            Case study
          </p>
          <h2 className="font-sans text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-ink max-w-[560px] mb-12">
            Evidence synthesis at clinical scale
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="grid lg:grid-cols-[5fr_4fr] border-[1.5px] border-[#E8E4DC] rounded-xl overflow-hidden">
            <div className="relative min-h-[280px] lg:min-h-[360px] bg-[#B8D0E0] overflow-hidden">
              <img
                src={IMG}
                alt=""
                className="w-full h-full object-cover grayscale brightness-[0.85] contrast-[1.1] mix-blend-multiply"
                onError={e => { e.currentTarget.style.display = 'none' }}
              />
              <div className="absolute inset-0 bg-[#1E508C]/45" />
            </div>
            <div className="p-10 md:p-11 flex flex-col justify-center bg-[#F8F6F2]">
              <p className="font-sans text-[11px] font-bold tracking-[0.1em] uppercase text-[#888888] mb-5">
                Internal medicine · 340 clinicians
              </p>
              <p className="font-serif text-2xl font-extrabold text-ink leading-[1.25] mb-4">
                Teams running FHIR-backed workflows use ClinicalMed to connect chart context,
                run the LangGraph pipeline, and write syntheses back as DocumentReference resources.
              </p>
              <p className="font-serif text-sm text-[#555555] leading-[1.7] mb-7">
                Evidence synthesis time dropped from 2 hours to under 4 minutes per patient case.
                Drug interaction conflicts surfaced before prescribing. Every recommendation now carries
                a full evidence chain written back to the FHIR record.
              </p>
              <BtnPrimary href="#cta">Read case study</BtnPrimary>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
