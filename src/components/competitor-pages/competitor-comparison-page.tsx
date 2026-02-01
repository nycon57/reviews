import dynamic from "next/dynamic";
import { Suspense } from "react";
import type {
  CompetitorPageConfig,
  TransitionSection,
} from "@/lib/competitor-pages";

import type { SectionBackground } from "./section-wrapper";
import { SectionWrapper } from "./section-wrapper";
import { SectionSkeleton } from "./section-skeleton";
import { ScrollProgress } from "./scroll-progress";
import { SwitchingFromProvider } from "./switching-from-provider";

// ---------------------------------------------------------------------------
// Above-the-fold sections (eagerly imported for fast LCP)
// ---------------------------------------------------------------------------
import { HeroSection } from "./sections/hero-section";
import { LogoBarSection } from "./sections/logo-bar-section";

// ---------------------------------------------------------------------------
// Below-the-fold sections (lazy-loaded via next/dynamic)
// ---------------------------------------------------------------------------
const PricingTabsSection = dynamic(
  () =>
    import("./sections/pricing-tabs-section").then(
      (m) => m.PricingTabsSection,
    ),
  { loading: () => <SectionSkeleton height="lg" /> },
);

const SmoothTransitionSection = dynamic(
  () =>
    import("./sections/smooth-transition-section").then(
      (m) => m.SmoothTransitionSection,
    ),
  { loading: () => <SectionSkeleton height="sm" /> },
);

const TestimonialsSection = dynamic(
  () =>
    import("./sections/testimonials-section").then(
      (m) => m.TestimonialsSection,
    ),
  { loading: () => <SectionSkeleton /> },
);

const DifferentiatorsSection = dynamic(
  () =>
    import("./sections/differentiators-section").then(
      (m) => m.DifferentiatorsSection,
    ),
  { loading: () => <SectionSkeleton /> },
);

const FeatureShowcaseSection = dynamic(
  () =>
    import("./sections/feature-showcase-section").then(
      (m) => m.FeatureShowcaseSection,
    ),
  { loading: () => <SectionSkeleton height="lg" /> },
);

const AIFeatureTabsSection = dynamic(
  () =>
    import("./sections/ai-feature-tabs-section").then(
      (m) => m.AIFeatureTabsSection,
    ),
  { loading: () => <SectionSkeleton /> },
);

const IntegrationLogosSection = dynamic(
  () =>
    import("./sections/integration-logos-section").then(
      (m) => m.IntegrationLogosSection,
    ),
  { loading: () => <SectionSkeleton height="sm" /> },
);

const MortgageSpecificSection = dynamic(
  () =>
    import("./sections/mortgage-specific-section").then(
      (m) => m.MortgageSpecificSection,
    ),
  { loading: () => <SectionSkeleton /> },
);

const MigrationStepsSection = dynamic(
  () =>
    import("./sections/migration-steps-section").then(
      (m) => m.MigrationStepsSection,
    ),
  { loading: () => <SectionSkeleton /> },
);

const RatingComparisonSection = dynamic(
  () =>
    import("./sections/rating-comparison-section").then(
      (m) => m.RatingComparisonSection,
    ),
  { loading: () => <SectionSkeleton height="sm" /> },
);

const CaseStudiesSection = dynamic(
  () =>
    import("./sections/case-studies-section").then(
      (m) => m.CaseStudiesSection,
    ),
  { loading: () => <SectionSkeleton /> },
);

const FAQSectionComponent = dynamic(
  () =>
    import("./sections/faq-section").then((m) => m.FAQSectionComponent),
  { loading: () => <SectionSkeleton /> },
);

const SocialProofSection = dynamic(
  () =>
    import("./sections/social-proof-section").then(
      (m) => m.SocialProofSection,
    ),
  { loading: () => <SectionSkeleton /> },
);

const FooterCTASection = dynamic(
  () =>
    import("./sections/footer-cta-section").then((m) => m.FooterCTASection),
  { loading: () => <SectionSkeleton height="sm" /> },
);

const CrossLinksSection = dynamic(
  () =>
    import("./sections/cross-links-section").then(
      (m) => m.CrossLinksSection,
    ),
  { loading: () => <SectionSkeleton height="sm" /> },
);

/** Maps a TransitionSection variant to the corresponding SectionWrapper background. */
function getTransitionBackground(
  variant: TransitionSection["variant"],
): SectionBackground {
  switch (variant) {
    case "dark":
      return "dark";
    case "gradient":
      return "gradient";
    default:
      return "muted";
  }
}

interface CompetitorComparisonPageProps {
  config: CompetitorPageConfig;
  /** Show scroll progress indicator at the top of the page */
  showScrollProgress?: boolean;
}

/**
 * Main template component for competitor comparison pages.
 *
 * Accepts a `CompetitorPageConfig` and renders all 16 sections in order
 * with consistent spacing, alternating backgrounds, and lazy loading
 * for below-the-fold content.
 *
 * This is a server component — interactive sub-sections use "use client".
 */
export function CompetitorComparisonPage({
  config,
  showScrollProgress = true,
}: CompetitorComparisonPageProps) {
  return (
    <Suspense fallback={null}>
      <SwitchingFromProvider>
      {showScrollProgress && <ScrollProgress />}

      {/* Section 1: Hero */}
      <SectionWrapper id="hero" background="white">
        <HeroSection
          config={config.hero}
          competitorName={config.competitorName}
        />
      </SectionWrapper>

      {/* Section 2: Logo Bar */}
      <SectionWrapper id="logo-bar" background="subtle" flush>
        <LogoBarSection logos={config.logoBar} />
      </SectionWrapper>

      {/* Section 3: Pricing Tabs */}
      <SectionWrapper id="pricing" background="white">
        <PricingTabsSection tabs={config.pricingTabs} />
      </SectionWrapper>

      {/* Section 4: Smooth Transition */}
      <SectionWrapper
        id="transition"
        background={getTransitionBackground(config.transitionSection.variant)}
      >
        <SmoothTransitionSection config={config.transitionSection} />
      </SectionWrapper>

      {/* Section 5: Testimonials */}
      <SectionWrapper id="testimonials" background="white">
        <TestimonialsSection testimonials={config.testimonials} />
      </SectionWrapper>

      {/* Section 6: Differentiators */}
      <SectionWrapper id="differentiators" background="subtle" lazyRender estimatedHeight="800px">
        <DifferentiatorsSection
          differentiators={config.differentiators}
          competitorName={config.competitorName}
        />
      </SectionWrapper>

      {/* Section 7: Feature Showcase */}
      <SectionWrapper id="features" background="white" lazyRender estimatedHeight="900px">
        <FeatureShowcaseSection features={config.featureCards} />
      </SectionWrapper>

      {/* Section 8: AI Feature Tabs */}
      <SectionWrapper id="ai-capabilities" background="subtle" lazyRender estimatedHeight="700px">
        <AIFeatureTabsSection capabilities={config.aiCapabilities} />
      </SectionWrapper>

      {/* Section 9: Integration Logos */}
      <SectionWrapper id="integrations" background="white" lazyRender estimatedHeight="400px">
        <IntegrationLogosSection integrations={config.integrations} />
      </SectionWrapper>

      {/* Section 10: Mortgage-Specific Features */}
      <SectionWrapper id="mortgage-features" background="subtle" lazyRender estimatedHeight="900px">
        <MortgageSpecificSection
          features={config.mortgageFeatures}
          headline={config.mortgageSectionConfig?.headline}
          description={config.mortgageSectionConfig?.description}
          cta={config.mortgageSectionConfig?.cta}
          stat={config.mortgageSectionConfig?.stat}
        />
      </SectionWrapper>

      {/* Section 11: Migration Steps */}
      <SectionWrapper id="migration" background="white" lazyRender estimatedHeight="600px">
        <MigrationStepsSection config={config.migration} />
      </SectionWrapper>

      {/* Section 12: Rating Comparison */}
      <SectionWrapper id="ratings" background="subtle" lazyRender estimatedHeight="500px">
        <RatingComparisonSection
          config={config.ratingComparison}
          competitorName={config.competitorName}
        />
      </SectionWrapper>

      {/* Section 13: Case Studies */}
      <SectionWrapper id="case-studies" background="white" lazyRender estimatedHeight="800px">
        <CaseStudiesSection caseStudies={config.caseStudies} />
      </SectionWrapper>

      {/* Section 14: FAQ */}
      <SectionWrapper id="faq" background="subtle" lazyRender estimatedHeight="600px">
        <FAQSectionComponent
          config={config.faq}
          competitorName={config.competitorName}
        />
      </SectionWrapper>

      {/* Section 15: Social Proof Wall */}
      <SectionWrapper id="social-proof" background="white" lazyRender estimatedHeight="1200px">
        <SocialProofSection cards={config.socialProof} />
      </SectionWrapper>

      {/* Section 17: Cross-Links to Other Comparisons */}
      <SectionWrapper id="cross-links" background="subtle" lazyRender estimatedHeight="250px">
        <CrossLinksSection currentSlug={config.slug} />
      </SectionWrapper>

      {/* Section 18: Footer CTA */}
      <SectionWrapper id="footer-cta" background="gradient" lazyRender estimatedHeight="350px">
        <FooterCTASection config={config.footerCta} />
      </SectionWrapper>
      </SwitchingFromProvider>
    </Suspense>
  );
}
