/**
 * Analytics Engine
 *
 * Central module for calculating and caching key metrics:
 * - NPS (Net Promoter Score)
 * - CSAT (Customer Satisfaction Score)
 * - Response Rate
 * - Review Velocity
 * - Historical Trends
 *
 * Usage:
 * ```typescript
 * import {
 *   getNPSMetrics,
 *   getCSATMetrics,
 *   getUserAnalytics
 * } from "@/lib/analytics";
 * ```
 */

// Types
export type {
  PeriodType,
  DateRange,
  NPSBreakdown,
  CSATMetrics,
  ResponseRateMetrics,
  ReviewVelocityMetrics,
  MetricsSnapshot,
  TrendPoint,
  PeriodComparison,
  OrganizationMetrics,
  UserAnalytics,
  /** @deprecated Use UserAnalytics instead */
  LoanOfficerAnalytics,
  CachedMetrics,
} from "./types";

// Calculation functions (pure functions)
export {
  calculateNPS,
  calculateCSAT,
  calculateResponseRate,
  calculateReviewVelocity,
  calculatePeriodComparison,
  generateMonthlyTrend,
  calculateNPSTrend,
  calculateCSATTrend,
  calculateReputationScore,
  determinePerformanceStatus,
} from "./calculations";

// Utility functions (client-safe)
export { getDateRangeForPeriod } from "./utils";

// Engine functions (server actions with database access)
export {
  getNPSMetrics,
  getCSATMetrics,
  getResponseRateMetrics,
  getReviewVelocityMetrics,
  getUserAnalytics,
  /** @deprecated Use getUserAnalytics instead */
  getLoanOfficerAnalytics,
  getOrganizationAnalytics,
  getNPSTrendData,
  getCSATTrendData,
  getReviewVelocityTrendData,
  getMetricComparison,
  invalidateMetricsCache,
  computeHistoricalSnapshots,
} from "./engine";
