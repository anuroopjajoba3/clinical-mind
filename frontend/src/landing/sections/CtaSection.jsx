import Reveal from '../ui/Reveal'
import { BtnLight } from '../ui/Button'

export default function CtaSection() {
  return (
    <section id="cta" className="py-28 md:py-36 px-6 md:px-12 bg-ink text-white text-center">
      <Reveal>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-[clamp(2.75rem,5.5vw,4.25rem)] font-black leading-[1.05] tracking-[-0.03em]">
            The future of clinical
            <br />
            intelligence starts here.
          </h2>
          <p className="mt-5 font-sans text-[17px] text-white/48 leading-relaxed max-w-md mx-auto">
            Join clinical teams on the waitlist. Early access includes dedicated onboarding, custom FHIR
            integration, and direct access to the engineering team.
          </p>

          <form
            className="mt-11 flex flex-col sm:flex-row gap-2.5 max-w-[440px] mx-auto"
            onSubmit={e => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="your@hospital.org"
              className="flex-1 px-4 py-3.5 rounded bg-white/[0.07] border-[1.5px] border-white/12 text-white font-sans text-sm placeholder:text-white/30 outline-none focus:border-white/40 transition-colors"
            />
            <BtnLight href="/app">Open platform</BtnLight>
          </form>

          <p className="mt-3.5 font-sans text-xs text-white/28">
            No commitment required · HIPAA BAA available · Setup in under 48 hours
          </p>
        </div>
      </Reveal>
    </section>
  )
}
