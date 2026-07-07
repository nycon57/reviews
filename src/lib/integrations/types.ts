// Integration page types for integration directory and detail pages

/**
 * Integration category identifiers
 */
export type IntegrationCategory =
  | "crm"
  | "reviews"
  | "social"
  | "communication"
  | "automation"
  | "los";

/**
 * Integration slug identifiers
 */
export type IntegrationSlug =
  | "salesforce"
  | "google-business-profile"
  | "slack"
  | "zapier"
  | "encompass"
  | "facebook";

/**
 * Data flow direction for an integration
 */
export interface IntegrationDataFlow {
  /** Direction of data flow */
  direction: "in" | "out" | "both";
  /** Label describing what flows */
  label: string;
}

/**
 * Integration feature item
 */
export interface IntegrationFeature {
  /** Phosphor icon name */
  icon: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
}

/**
 * Integration setup step
 */
export interface IntegrationSetupStep {
  /** Step number */
  step: number;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Phosphor icon name */
  icon: string;
}

/**
 * Integration use case
 */
export interface IntegrationUseCase {
  /** Use case title */
  title: string;
  /** Use case description */
  description: string;
}

/**
 * SEO configuration for integration page
 */
export interface IntegrationSEO {
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** Keywords */
  keywords: string[];
}

/**
 * Category display metadata
 */
export interface IntegrationCategoryInfo {
  /** Category slug */
  slug: IntegrationCategory;
  /** Display label */
  label: string;
  /** Phosphor icon name */
  icon: string;
}

/**
 * Complete integration page configuration
 */
export interface IntegrationPageConfig {
  /** URL slug */
  slug: IntegrationSlug;
  /** Integration display name */
  name: string;
  /** One-liner for cards */
  shortDescription: string;
  /** Category */
  category: IntegrationCategory;
  /** Phosphor icon name for fallback */
  icon: string;

  /** Hero section */
  hero: {
    /** Main headline */
    headline: string;
    /** Description */
    description: string;
    /** Badge text (e.g. "CRM Integration") */
    badge: string;
  };

  /** Overview section */
  overview: {
    /** What the integration does */
    whatItDoes: string;
    /** Data flow items */
    dataFlow: IntegrationDataFlow[];
  };

  /** Features the integration unlocks */
  features: IntegrationFeature[];

  /** Step-by-step setup guide */
  setupSteps: IntegrationSetupStep[];

  /** Use cases */
  useCases: IntegrationUseCase[];

  /** Slugs of related integrations */
  relatedIntegrations: IntegrationSlug[];

  /** SEO metadata */
  seo: IntegrationSEO;
}
