import { LandingHeader } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/Hero";
import { HowItWorksSection } from "@/components/landing/HowItWorks";
import { WhatIsSection } from "@/components/landing/WhatIs";
import { ForWhomSection } from "@/components/landing/ForWhom";
import { TheorySection } from "@/components/landing/Theory";
import { FeaturesSection } from "@/components/landing/Features";
import { EthicsSection } from "@/components/landing/Ethics";
import { PricingSection } from "@/components/landing/Pricing";
import { FaqSection } from "@/components/landing/Faq";
import { LandingFooter } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <LandingHeader />
      <HeroSection />
      <HowItWorksSection />
      <WhatIsSection />
      <ForWhomSection />
      <TheorySection />
      <FeaturesSection />
      <EthicsSection />
      <PricingSection />
      <FaqSection />
      <LandingFooter />
    </main>
  );
}
