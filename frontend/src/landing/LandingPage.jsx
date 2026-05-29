import CursorFX from '../components/CursorFX'
import LandingNav from './sections/LandingNav'
import HeroSection from './sections/HeroSection'
import TrustedBySection from './sections/TrustedBySection'
import PipelineStrip from './sections/PipelineStrip'
import FeatureSection from './sections/FeatureSection'
import EvidenceSection from './sections/EvidenceSection'
import WorkflowSection from './sections/WorkflowSection'
import ValuesSection from './sections/ValuesSection'
import CaseStudySection from './sections/CaseStudySection'
import PlatformSection from './sections/PlatformSection'
import CtaSection from './sections/CtaSection'
import LandingFooter from './sections/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <CursorFX />
      <LandingNav />
      <main>
        <HeroSection />
        <TrustedBySection />
        <PipelineStrip />
        <FeatureSection />
        <EvidenceSection />
        <WorkflowSection />
        <ValuesSection />
        <CaseStudySection />
        <PlatformSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
