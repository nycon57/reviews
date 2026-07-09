// Solution page types for solution-focused landing pages
// Following pain-solution-impact framework

/**
 * Solution page slug identifiers
 */
export type SolutionSlug =
  | "review-growth"
  | "reputation-management"
  | "customer-intelligence"
  | "team-performance";

/**
 * Current state/challenge item
 */
export interface SolutionChallenge {
  /** Icon name (Lucide) */
  icon: string;
  /** Challenge title */
  title: string;
  /** Challenge description */
  description: string;
  /** Stat emphasizing the problem */
  stat?: {
    value: string;
    label: string;
  };
}

/**
 * How the solution addresses the challenge
 */
export interface SolutionApproach {
  /** Icon name (Lucide) */
  icon: string;
  /** Approach title */
  title: string;
  /** Approach description */
  description: string;
  /** Features that enable this */
  features?: string[];
}

/**
 * Impact/outcome item
 */
export interface SolutionImpact {
  /** Metric value (e.g., "3x", "94%") */
  value: string;
  /** Metric label */
  label: string;
  /** Description of the impact */
  description: string;
  /** Icon name (Lucide) */
  icon?: string;
}

/**
 * Feature that powers the solution
 */
export interface SolutionFeature {
  /** Feature slug for linking */
  slug: string;
  /** Feature title */
  title: string;
  /** How it contributes to the solution */
  contribution: string;
  /** Icon name (Lucide) */
  icon: string;
}

/**
 * Industry application
 */
export interface SolutionIndustryApp {
  /** Industry name */
  industry: string;
  /** Industry slug */
  slug: string;
  /** How the solution applies */
  application: string;
  /** Icon name (Lucide) */
  icon: string;
}

/**
 * Success story/testimonial
 */
export interface SolutionSuccessStory {
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
  /** Quantified result */
  result: {
    value: string;
    label: string;
  };
  /** Industry */
  industry?: string;
}

/**
 * Getting started step
 */
export interface SolutionStep {
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
 * SEO configuration for solution page
 */
export interface SolutionSEO {
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
 * Complete solution page configuration
 * Following pain-solution-impact framework
 */
export interface SolutionPageConfig {
  /** Solution slug for URL */
  slug: SolutionSlug;
  /** Solution display title */
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
    /** Headline accent */
    titleAccent?: string;
    /** Description */
    description: string;
    /** Primary CTA */
    primaryCta: string;
    /** Secondary CTA */
    secondaryCta: string;
    /** Key stat highlight */
    stat?: {
      value: string;
      label: string;
    };
    /** Hero image */
    image?: string;
  };

  /** Current state/pain section - empathetic challenges */
  challenges: SolutionChallenge[];

  /** The solution - how RepWell solves it */
  approaches: SolutionApproach[];

  /** Impact - metrics and outcomes */
  impacts: SolutionImpact[];

  /** Features that power this solution */
  features: SolutionFeature[];

  /** Industry applications */
  industryApps: SolutionIndustryApp[];

  /** Success stories with results */
  successStories: SolutionSuccessStory[];

  /** Getting started steps */
  gettingStarted: SolutionStep[];

  /** Final CTA */
  cta: {
    headline: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };

  /** SEO metadata */
  seo: SolutionSEO;
}
