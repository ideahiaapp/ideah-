import { LandingHeader } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/Hero";
import { TransitionQuoteSection } from "@/components/landing/TransitionQuote";
import { ProductStoriesSection } from "@/components/landing/ProductStories";
import { ProblemStatementSection } from "@/components/landing/ProblemStatement";
import { HowItWorksSection } from "@/components/landing/HowItWorks";
import { DialogicIntelligenceSection } from "@/components/landing/DialogicIntelligence";
import { FeaturesSection } from "@/components/landing/Features";
import { BenefitsSection } from "@/components/landing/Benefits";
import { MetricsSection } from "@/components/landing/Metrics";
import { TrainingProgressSection } from "@/components/landing/TrainingProgress";
import { EthicsSection } from "@/components/landing/Ethics";
import { PricingSection } from "@/components/landing/Pricing";
import { FaqSection } from "@/components/landing/Faq";
import { LandingFooter } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <LandingHeader />
      <HeroSection />
      <TransitionQuoteSection />
      <ProductStoriesSection />
      <ProblemStatementSection />
      <HowItWorksSection />
      <DialogicIntelligenceSection />
      <FeaturesSection />
      <BenefitsSection />
      <MetricsSection />
      <TrainingProgressSection />
      <EthicsSection />
      <PricingSection />
      <FaqSection />
      <LandingFooter />
    </main>
  );
}
