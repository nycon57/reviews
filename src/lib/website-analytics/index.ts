/**
 * Website Analytics & SEO Audit Module
 * Exports all types and actions for website analytics and SEO auditing
 */

// Types
export type {
  TrafficSource,
  DeviceType,
  IssueSeverity,
  IssueCategory,
  TrafficSourceBreakdown,
  DeviceBreakdown,
  GeographicEntry,
  SearchQueryData,
  PageAnalytics,
  DailyAnalytics,
  WebsiteAnalyticsOverview,
  SEOIssue,
  SEORecommendation,
  PerformanceMetrics,
  MobileFriendliness,
  HeadersAnalysis,
  ImagesAnalysis,
  LinksAnalysis,
  MetaTagsAnalysis,
  ContentAnalysis,
  StructuredDataAnalysis,
  SEOAuditResult,
  WebsiteSEOOverview,
  WebsiteAnalyticsSEO,
  AnalyticsPeriod,
} from "./types";

// Analytics actions
export {
  getWebsiteAnalytics,
  getWebsiteSEOOverview,
  getPageSEOAudit,
  recordAnalytics,
} from "./actions";

// SEO audit actions
export {
  runPageSEOAudit,
  runBatchSEOAudit,
} from "./seo-audit";
