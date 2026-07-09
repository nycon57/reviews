"use client";

// Import new components
import { FloatingAvatarsHero } from "@/components/marketing/floating-avatars-hero";
import { FeatureTabsShowcase } from "@/components/marketing/feature-tabs-showcase";
import { TabNavigationSection } from "@/components/marketing/tab-navigation-section";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { IntegrationsGrid } from "@/components/marketing/integrations-grid";
import { VideoSection } from "@/components/marketing/video-section";
import { StatsSectionDark } from "@/components/marketing/stats-section-dark";
import { CTASection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <div className="bg-background">
      {/* Section 1: Floating Avatars Hero */}
      <FloatingAvatarsHero
        badge="Review management for client-facing teams"
        title={
          <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl block">
            <span className="text-repwell-teal-400 block">Reputation</span>
            <span className="text-repwell-sage-200 block">Done Well</span>
          </span>
        }
        description="Collect reviews, track satisfaction metrics, and gain AI-powered insights to deliver exceptional customer experiences. Built for client-facing professionals."
        cta={[
          { label: "Start Free Trial", href: "/signup", variant: "default" },
          { label: "Watch Demo", href: "/demo", variant: "outline" },
        ]}
      />

      {/* Section 2: Feature Tabs Showcase */}
      <FeatureTabsShowcase />

      {/* Section 4: Tab Navigation Section */}
      <TabNavigationSection
        badge="Built for Every Role"
        heading="One Platform, Every Team"
        subheading="RepWell adapts to the needs of each role in your organization."
      />

      {/* Section 5: Feature Showcase */}
      <FeatureShowcase
        badge="How It Works"
        heading="From Survey to Five-Star Review"
        subheading="See how RepWell transforms customer feedback into reputation growth."
      />

      {/* Section 6: Integrations Grid */}
      <IntegrationsGrid
        badge="Integrations"
        heading="Connect Your Existing Tools"
        subheading="RepWell integrates seamlessly with the platforms your team already uses."
      />

      {/* Section 7: Video Section */}
      <VideoSection
        badge="Product Demo"
        heading="See RepWell in Action"
        subheading="Watch how leading service companies use RepWell to transform their review collection and reputation management."
        ctaText="Schedule a Live Demo"
        ctaHref="/demo"
      />

      {/* Section 8: Dark Stats Section */}
      <StatsSectionDark
        heading="Reputation Workflows in One Place"
        stats={[
          { value: "AI", label: "Feedback Insights" },
          { value: "NPS", label: "Survey Builder" },
          { value: "GBP", label: "Review Monitoring" },
          { value: "Teams", label: "Profile Management" },
        ]}
      />

      {/* Section 10: Final CTA Section */}
      <CTASection variant="enterprise" />
    </div>
  );
}
