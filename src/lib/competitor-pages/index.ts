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
  MortgageFeature,
  MortgageSectionConfig,
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
} from "./schema-generators";
