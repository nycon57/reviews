"use client";

import { FloatingAvatarsHero } from "@/components/marketing/floating-avatars-hero";
import { FeatureTabsShowcase } from "@/components/marketing/feature-tabs-showcase";
import { TabNavigationSection } from "@/components/marketing/tab-navigation-section";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { IntegrationsGrid } from "@/components/marketing/integrations-grid";
import { VideoSection } from "@/components/marketing/video-section";
import { StatsSectionDark } from "@/components/marketing/stats-section-dark";
import { CTASection } from "@/components/marketing/cta-section";
import { MARKETING_TRIAL_FACTS } from "@/lib/marketing/pricing-facts";

export function HomePageClient() {
  return (
    <div className="bg-background">
      <FloatingAvatarsHero
        badge="Review management for client-facing teams"
        title={
          <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl">
            <span className="block text-repwell-teal-400">Reputation</span>
            <span className="block text-repwell-sage-200">Done Well</span>
          </span>
        }
        description="Collect reviews, track satisfaction metrics, and turn customer feedback into better reputation workflows."
        cta={[
          { label: "Start Free Trial", href: "/signup", variant: "default" },
          { label: "Book a Demo", href: "/demo", variant: "outline" },
        ]}
        microcopy={MARKETING_TRIAL_FACTS.shortCopy}
      />

      <FeatureTabsShowcase />

      <TabNavigationSection
        badge="Built for Every Role"
        heading="One Platform, Every Team"
        subheading="RepWell adapts to the needs of each role in your organization."
      />

      <FeatureShowcase
        badge="How It Works"
        heading="From Survey to Review Workflow"
        subheading="See how RepWell turns customer feedback into review collection, insights, and follow-up."
      />

      <IntegrationsGrid
        badge="Integrations"
        heading="Connect Your Existing Tools"
        subheading="RepWell integrates with the platforms your team already uses."
      />

      <VideoSection
        badge="Product Demo"
        heading="See RepWell in Action"
        subheading="Book a live walkthrough of RepWell's review collection, analytics, and feedback workflows."
        ctaText="Book a Demo"
        ctaHref="/demo"
        thumbnailSrc="/images/product/dashboard-home.png"
        thumbnailAlt="RepWell dashboard showing review totals, average rating, response rate, and NPS score"
      />

      <StatsSectionDark
        heading="Reputation Workflows in One Place"
        stats={[
          { value: "AI", label: "Feedback Insights" },
          { value: "NPS", label: "Survey Builder" },
          { value: "GBP", label: "Review Monitoring" },
          { value: "Teams", label: "Profile Management" },
        ]}
      />

      <CTASection
        title="Start building stronger customer feedback loops"
        description="Try RepWell for 14 days, then decide whether it fits your team's review and reputation workflow."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Book a Demo", href: "/demo" }}
        variant="gradient"
        withDecoration={false}
        microcopy={MARKETING_TRIAL_FACTS.shortCopy}
      />
    </div>
  );
}
