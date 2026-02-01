// A/B testing types for competitor comparison pages (S131)

/** A/B test variant identifier */
export type ABVariant = "A" | "B";

/** Single A/B test definition */
export interface ABTestConfig {
  /** Unique test ID (e.g. "experience-com-h1") */
  id: string;
  /** Human-readable test name */
  name: string;
  /** Test type */
  type: "h1" | "cta_copy" | "cta_color";
  /** Variant A value */
  variantA: string;
  /** Variant B value */
  variantB: string;
  /** Whether the test is active */
  enabled: boolean;
}

/** A/B test configuration for a single competitor page */
export interface PageABTestConfig {
  /** Competitor page slug */
  slug: string;
  /** H1 headline test (2 variants) */
  h1Test?: ABTestConfig;
  /** Primary CTA copy test (2 variants) */
  ctaCopyTest?: ABTestConfig;
  /** Primary CTA color test (2 variants — Tailwind class names) */
  ctaColorTest?: ABTestConfig;
}

/** Tracked A/B test event */
export interface ABTestEvent {
  /** Test ID */
  testId: string;
  /** Assigned variant */
  variant: ABVariant;
  /** Event type */
  eventType: "page_view" | "cta_click" | "demo_booked";
  /** Competitor page slug */
  slug: string;
  /** Timestamp (ISO) */
  timestamp: string;
  /** Traffic source */
  source?: string;
  /** switching_from param value */
  switchingFrom?: string;
}

/** Per-variant metrics for a single test */
export interface ABVariantMetrics {
  variant: ABVariant;
  views: number;
  ctaClicks: number;
  demosBooked: number;
  /** CTA click-through rate (ctaClicks / views) */
  ctr: number;
  /** Demo conversion rate (demosBooked / views) */
  conversionRate: number;
}

/** Aggregated metrics for a single A/B test */
export interface ABTestMetrics {
  testId: string;
  testName: string;
  testType: ABTestConfig["type"];
  variantA: ABVariantMetrics;
  variantB: ABVariantMetrics;
  /** Whether the result is statistically significant (p < 0.05) */
  isSignificant: boolean;
  /** Which variant is winning (higher conversion rate) */
  winner: ABVariant | null;
}

/** Per-page analytics summary */
export interface CompetitorPageMetrics {
  slug: string;
  competitorName: string;
  visits: number;
  bounceRate: number;
  avgTimeOnPage: number;
  ctaClicks: number;
  demoConversions: number;
  /** CTA click-through rate */
  ctr: number;
  /** Demo conversion rate */
  conversionRate: number;
}

/** Traffic source breakdown */
export interface TrafficSourceBreakdown {
  source: string;
  visits: number;
  percentage: number;
}

/** Weekly report data structure */
export interface WeeklyReportData {
  weekStarting: string;
  weekEnding: string;
  pages: CompetitorPageMetrics[];
  topPerformingPage: string;
  totalVisits: number;
  totalCtaClicks: number;
  totalDemoConversions: number;
  overallCtr: number;
  overallConversionRate: number;
  activeTests: ABTestMetrics[];
  trafficSources: TrafficSourceBreakdown[];
}
