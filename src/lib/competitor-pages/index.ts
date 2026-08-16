// Competitor comparison pages — public API
// Data contract for all "[Competitor] vs RepWell" pages (Epic E19)

export type {
  // Shared primitives
  CtaLink,
  StatItem,
  TrustBadge,

  // SEO
  CompetitorSEO,

  // Section types
  CompetitorHero,
  LogoBarItem,
  PricingComparisonRow,
  PricingTab,
  TransitionBullet,
  TransitionSection,
  TestimonialCard,
  DifferentiatorCard,
  FeatureCard,
  AICapabilityTab,
  IntegrationItem,
  IndustryFeature,
  IndustrySectionConfig,
  MigrationStep,
  MigrationSection,
  PlatformRatings,
  RatingComparison,
  CaseStudyMetric,
  CaseStudy,
  FAQItem,
  FAQSection,
  SocialProofCard,
  FooterCta,
  FeatureComparisonItem,
  FeatureComparisonCategory,

  // Root config
  CompetitorPageConfig,
} from "./types";

// Schema generators
export {
  generateFAQPageSchema,
  generateFAQPageJsonLd,
  generateBreadcrumbListSchema,
} from "./schema-generators";

// All configs indexed by slug for route lookup
import { experienceComConfig } from "./configs/experience-com";
import { birdeyeConfig } from "./configs/birdeye";
import { trustpilotConfig } from "./configs/trustpilot";
import type { CompetitorPageConfig } from "./types";

// Competitor page configs — re-export for direct imports
export {
  experienceComConfig,
  birdeyeConfig,
  trustpilotConfig,
};

/** All competitor page configs, keyed by slug. */
export const competitorConfigs: Record<string, CompetitorPageConfig> = {
  [experienceComConfig.slug]: experienceComConfig,
  [birdeyeConfig.slug]: birdeyeConfig,
  [trustpilotConfig.slug]: trustpilotConfig,
};

/** All competitor slugs for static generation. */
export const competitorSlugs: string[] = Object.keys(competitorConfigs);
