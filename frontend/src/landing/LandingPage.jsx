import LandingNav from './sections/LandingNav'
import HeroSection from './sections/HeroSection'
import PipelineStrip from './sections/PipelineStrip'
import FeatureSection from './sections/FeatureSection'
import ValuesSection from './sections/ValuesSection'
import CaseStudySection from './sections/CaseStudySection'
import PlatformSection from './sections/PlatformSection'
import CtaSection from './sections/CtaSection'
import LandingFooter from './sections/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-ink antialiased">
      <LandingNav />
      <main>
        <HeroSection />
        <PipelineStrip />
        <FeatureSection />
        <ValuesSection />
        <CaseStudySection />
        <PlatformSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
