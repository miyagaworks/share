import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import AffinitySection from './components/AffinitySection';
import IndustrySection from './components/IndustrySection';
import SolutionSection from './components/SolutionSection';
import BusinessModel from './components/BusinessModel';
import Differentiator from './components/Differentiator';
import EasyStart from './components/EasyStart';
import SocialProof from './components/SocialProof';
import OfferSection from './components/OfferSection';
import ScarcitySection from './components/ScarcitySection';
import CtaSection from './components/CtaSection';
import PostScript from './components/PostScript';
import FloatingCta from './components/FloatingCta';
import AnalyticsTracker from './components/AnalyticsTracker';

export default function PartnerPage() {
  return (
    <>
      <AnalyticsTracker />
      <HeroSection />
      <ProblemSection />
      <AffinitySection />
      <IndustrySection />
      <SolutionSection />
      <BusinessModel />
      <Differentiator />
      <EasyStart />
      <SocialProof />
      <OfferSection />
      <ScarcitySection />
      <CtaSection />
      <PostScript />
      <FloatingCta />
    </>
  );
}
