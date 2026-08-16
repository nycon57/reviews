/**
 * Website Analytics & SEO Audit Types
 * Types for visitor analytics, pageviews, sessions, and technical SEO audits
 */

// Traffic source types
export type TrafficSource = "organic" | "direct" | "referral" | "social" | "email" | "paid";

// Device types
export type DeviceType = "desktop" | "mobile" | "tablet";

// SEO issue severity
export type IssueSeverity = "error" | "warning" | "info";

// SEO issue category
export type IssueCategory =
  | "meta"
  | "content"
  | "performance"
  | "mobile"
  | "structured_data"
  | "links"
  | "images"
  | "technical";

// Traffic source breakdown
export interface TrafficSourceBreakdown {
  organic: number;
  direct: number;
  referral: number;
  social: number;
  email: number;
  paid: number;
}

// Device breakdown
export interface DeviceBreakdown {
  desktop: number;
  mobile: number;
  tablet: number;
}

// Geographic data entry
export interface GeographicEntry {
  country: string;
  countryCode: string;
  visitors: number;
  percentage: number;
}

// Search query data
export interface SearchQueryData {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

// Page analytics data
export interface PageAnalytics {
  pagePath: string;
  pageTitle: string | null;
  pageviews: number;
  uniqueVisitors: number;
  sessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  exitRate: number;
}

// Daily analytics data
export interface DailyAnalytics {
  date: string;
  pageviews: number;
  uniqueVisitors: number;
  sessions: number;
  avgSessionDuration: number;
  bounceRate: number;
}

// Website analytics overview
export interface WebsiteAnalyticsOverview {
  totalPageviews: number;
  totalUniqueVisitors: number;
  totalSessions: number;
  avgSessionDuration: number;
  avgBounceRate: number;
  trafficSources: TrafficSourceBreakdown;
  deviceBreakdown: DeviceBreakdown;
  geographicData: GeographicEntry[];
  topPages: PageAnalytics[];
  topSearchQueries: SearchQueryData[];
  dailyTrend: DailyAnalytics[];
  periodComparison: {
    pageviewsChange: number;
    visitorsChange: number;
    sessionsChange: number;
    bounceRateChange: number;
  };
}

// SEO Issue
export interface SEOIssue {
  id: string;
  type: IssueSeverity;
  category: IssueCategory;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  affectedElement?: string;
  howToFix?: string;
}

// SEO Recommendation
export interface SEORecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  category: IssueCategory;
  title: string;
  description: string;
  estimatedImpact: number; // 1-10
  effort: "minimal" | "moderate" | "significant";
  currentValue?: string;
  suggestedValue?: string;
}

// Performance metrics
export interface PerformanceMetrics {
  pageLoadTime: number | null;
  firstContentfulPaint: number | null;
  largestContentfulPaint: number | null;
  cumulativeLayoutShift: number | null;
  totalBlockingTime: number | null;
  performanceScore: number | null;
}

// Mobile friendliness
export interface MobileFriendliness {
  isMobileFriendly: boolean;
  viewportConfigured: boolean;
  fontSizeReadable: boolean;
  tapTargetsSized: boolean;
  score: number;
}

// Headers analysis
export interface HeadersAnalysis {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  hierarchyValid: boolean;
  issues: string[];
}

// Images analysis
export interface ImagesAnalysis {
  totalImages: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  altTextScore: number;
}

// Links analysis
export interface LinksAnalysis {
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  healthScore: number;
}

// Meta tags analysis
export interface MetaTagsAnalysis {
  hasTitle: boolean;
  hasDescription: boolean;
  titleLength: number | null;
  descriptionLength: number | null;
  titleOptimal: boolean;
  descriptionOptimal: boolean;
  hasCanonical: boolean;
  hasRobotsMeta: boolean;
}

// Content analysis
export interface ContentAnalysis {
  wordCount: number;
  readingTimeMinutes: number;
  contentFreshnessDays: number | null;
}

// Structured data analysis
export interface StructuredDataAnalysis {
  hasStructuredData: boolean;
  types: string[];
  isValid: boolean;
  issues: string[];
}

// Complete SEO Audit Result
export interface SEOAuditResult {
  id: string;
  pageUrl: string;
  pagePath: string;
  pageTitle: string | null;

  // Overall score
  seoScore: number;
  previousScore: number | null;
  scoreChange: number | null;

  // Score breakdown
  technicalScore: number;
  contentScore: number;
  performanceScore: number | null;
  mobileScore: number;

  // Detailed analysis
  metaTags: MetaTagsAnalysis;
  headers: HeadersAnalysis;
  images: ImagesAnalysis;
  links: LinksAnalysis;
  performance: PerformanceMetrics;
  mobileFriendliness: MobileFriendliness;
  structuredData: StructuredDataAnalysis;
  content: ContentAnalysis;

  // Issues and recommendations
  issues: SEOIssue[];
  recommendations: SEORecommendation[];

  // Metadata
  auditedAt: string;
}

// Website SEO Overview (aggregate across all pages)
export interface WebsiteSEOOverview {
  overallScore: number;
  previousScore: number | null;
  scoreChange: number | null;

  // Score breakdown
  avgTechnicalScore: number;
  avgContentScore: number;
  avgPerformanceScore: number | null;
  avgMobileScore: number;

  // Page audits
  totalPagesAudited: number;
  pagesWithErrors: number;
  pagesWithWarnings: number;
  pagesHealthy: number;

  // Top issues
  topIssues: SEOIssue[];
  topRecommendations: SEORecommendation[];

  // Page audits list
  pageAudits: SEOAuditResult[];

  // Last audit date
  lastAuditedAt: string | null;
}

// Combined website analytics and SEO data
export interface WebsiteAnalyticsSEO {
  analytics: WebsiteAnalyticsOverview;
  seo: WebsiteSEOOverview;
}

// Period type for analytics
export type AnalyticsPeriod = "7d" | "30d" | "90d" | "12m";
