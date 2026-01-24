// Feature page types for individual feature landing pages

/**
 * Feature page slug identifiers
 */
export type FeatureSlug =
  | "reviews"
  | "analytics"
  | "ai-insights"
  | "amplification"
  | "surveys"
  | "testimonials";

/**
 * Capability item within a feature
 */
export interface FeatureCapability {
  /** Icon name (Lucide) */
  icon: string;
  /** Capability title */
  title: string;
  /** Capability description */
  description: string;
  /** Optional image */
  image?: string;
}

/**
 * Problem that the feature solves
 */
export interface FeatureProblem {
  /** Icon name (Lucide) */
  icon: string;
  /** Problem title */
  title: string;
  /** Problem description */
  description: string;
  /** Stat to emphasize the problem */
  stat?: {
    value: string;
    label: string;
  };
}

/**
 * How it works step
 */
export interface FeatureHowItWorksStep {
  /** Step number */
  step: number;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Icon name (Lucide) */
  icon: string;
}

/**
 * Use case for a specific role
 */
export interface FeatureUseCase {
  /** Role identifier */
  role: "user" | "manager" | "enterprise";
  /** Role display label */
  label: string;
  /** Use case description */
  description: string;
  /** List of use case benefits */
  benefits: string[];
}

/**
 * Integration relevant to the feature
 */
export interface FeatureIntegration {
  /** Integration name */
  name: string;
  /** Logo URL */
  logoUrl: string;
  /** Category */
  category: string;
  /** Description of how it integrates */
  description?: string;
}

/**
 * Testimonial for the feature
 */
export interface FeatureTestimonial {
  /** Quote text */
  quote: string;
  /** Person's name */
  name: string;
  /** Person's title */
  title: string;
  /** Company name */
  company: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Rating (1-5) */
  rating?: number;
  /** Result/outcome achieved */
  result?: string;
}

/**
 * Related feature for cross-linking
 */
export interface RelatedFeature {
  /** Feature slug */
  slug: FeatureSlug;
  /** Feature title */
  title: string;
  /** Short description */
  description: string;
  /** Icon name (Lucide) */
  icon: string;
}

/**
 * SEO configuration for feature page
 */
export interface FeatureSEO {
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** Keywords */
  keywords: string[];
  /** Open Graph image */
  ogImage?: string;
}

/**
 * Complete feature page configuration
 */
export interface FeaturePageConfig {
  /** Feature slug for URL */
  slug: FeatureSlug;
  /** Feature display title */
  title: string;
  /** Short title for navigation */
  shortTitle: string;
  /** Icon name (Lucide) */
  icon: string;

  /** Hero section */
  hero: {
    /** Badge text */
    badge: string;
    /** Main headline */
    title: string;
    /** Headline accent (styled differently) */
    titleAccent?: string;
    /** Description */
    description: string;
    /** Primary CTA text */
    primaryCta: string;
    /** Secondary CTA text */
    secondaryCta: string;
    /** Hero image/mockup */
    image?: string;
    /** Key stat to highlight */
    stat?: {
      value: string;
      label: string;
    };
  };

  /** Problems the feature solves (dark section) */
  problems: FeatureProblem[];

  /** Feature capabilities */
  capabilities: FeatureCapability[];

  /** How it works steps */
  howItWorks: FeatureHowItWorksStep[];

  /** Use cases by role */
  useCases: FeatureUseCase[];

  /** Relevant integrations */
  integrations: FeatureIntegration[];

  /** Testimonials */
  testimonials: FeatureTestimonial[];

  /** Related features for cross-linking */
  relatedFeatures: FeatureSlug[];

  /** Final CTA */
  cta: {
    headline: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };

  /** SEO metadata */
  seo: FeatureSEO;
}
