// Industry system types for RepWell multi-vertical support

/**
 * Supported industry verticals
 */
export type IndustryType =
  | "mortgage"
  | "real_estate"
  | "insurance"
  | "financial_advisory"
  | "healthcare"
  | "home_services"
  | "legal"
  | "consulting";

/**
 * Role labels for professionals and customers within each industry
 */
export interface IndustryRoleLabels {
  /** Label for individual professionals (e.g., "Loan Officer", "Agent", "Advisor") */
  professional: string;
  /** Plural form of professional label */
  professionalPlural: string;
  /** Label for customers (e.g., "borrower", "client", "patient") */
  customer: string;
  /** Plural form of customer label */
  customerPlural: string;
  /** Label for transactions (e.g., "loan", "sale", "policy", "case") */
  transaction: string;
  /** Plural form of transaction label */
  transactionPlural: string;
}

/**
 * Credential types specific to each industry
 */
export interface IndustryCredential {
  /** Unique identifier for the credential type */
  id: string;
  /** Display label for the credential */
  label: string;
  /** Placeholder text for input fields */
  placeholder: string;
  /** Whether this credential is required */
  required: boolean;
  /** Validation pattern (regex) */
  pattern?: string;
  /** Help text for users */
  helpText?: string;
  /** URL for verification (if applicable) */
  verificationUrl?: string;
}

/**
 * Review sources relevant to each industry
 */
export interface IndustryReviewSource {
  /** Source identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon name (Lucide icon) */
  icon: string;
  /** Whether this source can be synced automatically */
  canSync: boolean;
  /** URL pattern for profile pages */
  profileUrlPattern?: string;
  /** Help text for connecting */
  helpText?: string;
}

/**
 * Integration/CRM relevant to each industry
 */
export interface IndustryIntegration {
  /** Integration identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Logo URL or path */
  logoUrl: string;
  /** Whether this integration is available */
  available: boolean;
  /** Category of integration */
  category: "crm" | "los" | "marketing" | "communication" | "data";
}

/**
 * Industry-specific benchmarks and defaults
 */
export interface IndustryBenchmarks {
  /** Average NPS score for the industry */
  averageNps: number;
  /** Average star rating for the industry */
  averageRating: number;
  /** Target response rate for surveys */
  targetResponseRate: number;
  /** Average reviews per professional per month */
  averageReviewsPerMonth: number;
}

/**
 * Complete industry configuration
 */
export interface IndustryConfig {
  /** Industry type identifier */
  type: IndustryType;
  /** Display name for the industry */
  name: string;
  /** Short description */
  description: string;
  /** Role labels */
  labels: IndustryRoleLabels;
  /** Available credentials */
  credentials: IndustryCredential[];
  /** Relevant review sources */
  reviewSources: IndustryReviewSource[];
  /** Available integrations */
  integrations: IndustryIntegration[];
  /** Industry benchmarks */
  benchmarks: IndustryBenchmarks;
  /** Default survey questions tailored to the industry */
  defaultSurveyQuestions: string[];
  /** Common themes/topics for AI analysis */
  analysisThemes: string[];
  /** Icon name (Lucide) for the industry */
  icon: string;
  /** Color associated with the industry (for marketing) */
  accentColor: string;
}

/**
 * Landing page content configuration
 */
export interface IndustryPageHero {
  /** Badge text above headline */
  badge: string;
  /** Main headline */
  title: string;
  /** Headline accent word (styled differently) */
  titleAccent?: string;
  /** Subheadline description */
  description: string;
  /** Primary CTA text */
  primaryCta: string;
  /** Secondary CTA text */
  secondaryCta: string;
}

export interface IndustryPainPoint {
  /** Icon name (Lucide) */
  icon: string;
  /** Pain point title */
  title: string;
  /** Description of the problem */
  description: string;
  /** Associated stat/metric (optional) */
  stat?: {
    value: string;
    label: string;
  };
}

export interface IndustryRoleTab {
  /** Role identifier */
  role: "professional" | "manager" | "enterprise";
  /** Tab label */
  label: string;
  /** Description of features for this role */
  description: string;
  /** List of features */
  features: string[];
}

export interface IndustryTimelineStep {
  /** Step number */
  step: number;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Icon name (Lucide) */
  icon: string;
}

export interface IndustryTestimonial {
  /** Testimonial quote */
  quote: string;
  /** Person's name */
  name: string;
  /** Person's title/role */
  title: string;
  /** Company name */
  company: string;
  /** Avatar image URL */
  avatarUrl?: string;
  /** Rating given (1-5) */
  rating?: number;
}

export interface IndustryGuarantee {
  /** Icon name (Lucide) */
  icon: string;
  /** Guarantee title */
  title: string;
  /** Guarantee description */
  description: string;
}

export interface IndustryCTA {
  /** Section headline */
  headline: string;
  /** Section description */
  description: string;
  /** Primary button text */
  primaryCta: string;
  /** Secondary button text */
  secondaryCta: string;
  /** Urgency/scarcity element (optional) */
  urgencyText?: string;
}

export interface IndustrySEO {
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** Keywords */
  keywords: string[];
  /** Open Graph image */
  ogImage?: string;
}

export interface IndustryStat {
  /** Stat value (e.g., "94%", "3x", "500+") */
  value: string;
  /** Stat label */
  label: string;
  /** Optional description */
  description?: string;
}

/**
 * Complete landing page configuration for an industry
 */
export interface IndustryPageConfig {
  /** Industry slug for URL (e.g., "mortgage", "real-estate") */
  slug: string;
  /** Industry type */
  industry: IndustryType;
  /** Hero section content */
  hero: IndustryPageHero;
  /** Pain points section */
  painPoints: IndustryPainPoint[];
  /** Trust stats bar */
  stats: IndustryStat[];
  /** Role-based features */
  roleTabs: IndustryRoleTab[];
  /** How it works timeline */
  howItWorks: IndustryTimelineStep[];
  /** Customer testimonials */
  testimonials: IndustryTestimonial[];
  /** Integrations to highlight */
  integrations: Array<{
    name: string;
    logoUrl: string;
    category: string;
  }>;
  /** Guarantees/risk reversal */
  guarantees: IndustryGuarantee[];
  /** Final CTA section */
  cta: IndustryCTA;
  /** SEO metadata */
  seo: IndustrySEO;
}
