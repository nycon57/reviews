/**
 * Customer case study types for /customers pages
 */

export type IndustryTag =
  | "mortgage"
  | "real-estate"
  | "insurance"
  | "healthcare"
  | "financial-advisory"
  | "home-services"
  | "legal"
  | "consulting";

export type CompanySize = "small" | "mid-market" | "enterprise";

export interface CustomerMetric {
  readonly label: string;
  readonly before: string;
  readonly after: string;
  readonly percentageChange: string;
}

export interface CustomerQuote {
  readonly text: string;
  readonly author: string;
  readonly role: string;
}

export interface CustomerPageConfig {
  readonly slug: string;
  readonly companyName: string;
  readonly industry: IndustryTag;
  readonly companySize: CompanySize;
  readonly logo: string;
  readonly heroHeadline: string;
  readonly summary: string;
  readonly challenge: string;
  readonly solution: string;
  readonly metrics: readonly CustomerMetric[];
  readonly quote: CustomerQuote;
  readonly previousPlatform?: string;
  readonly seo: {
    readonly title: string;
    readonly description: string;
    readonly keywords: readonly string[];
  };
}
