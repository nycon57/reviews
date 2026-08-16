"use server";

/**
 * Analytics Engine Types
 * Central type definitions for all analytics calculations
 */

// Period types for metric aggregation
export type PeriodType = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "all_time";

// Date range for queries
export interface DateRange {
  start: Date;
  end: Date;
}

// Explicit organization context for trusted server/system callers.
// Existing session-based analytics callers can omit this.
export interface AnalyticsOrgContext {
  organizationId: string;
}

// NPS breakdown
export interface NPSBreakdown {
  score: number; // -100 to 100
  promoters: number; // count of scores 9-10
  passives: number; // count of scores 7-8
  detractors: number; // count of scores 0-6
  totalResponses: number;
  promoterPercentage: number;
  passivePercentage: number;
  detractorPercentage: number;
}

// CSAT metrics
export interface CSATMetrics {
  score: number; // 0-100 percentage
  averageRating: number; // 1-5 scale
  totalResponses: number;
  satisfiedCount: number; // ratings 4-5
  neutralCount: number; // rating 3
  dissatisfiedCount: number; // ratings 1-2
  satisfiedPercentage: number;
  neutralPercentage: number;
  dissatisfiedPercentage: number;
}

// Response rate metrics
export interface ResponseRateMetrics {
  rate: number; // 0-100 percentage
  totalSent: number;
  totalCompleted: number;
  totalPending: number;
  totalExpired: number;
  averageCompletionTime: number | null; // hours
}

// Review velocity metrics
export interface ReviewVelocityMetrics {
  reviewsPerDay: number;
  reviewsPerWeek: number;
  reviewsPerMonth: number;
  totalReviews: number;
  averageReviewsPerPeriod: number;
  trend: "increasing" | "stable" | "decreasing";
  changePercentage: number; // vs previous period
}

// Comprehensive metrics snapshot
export interface MetricsSnapshot {
  nps: NPSBreakdown;
  csat: CSATMetrics;
  responseRate: ResponseRateMetrics;
  reviewVelocity: ReviewVelocityMetrics;
  averageRating: number;
  totalReviews: number;
  periodStart: Date;
  periodEnd: Date;
  computedAt: Date;
}

// Historical trend data point
export interface TrendPoint {
  date: string;
  value: number;
  label?: string;
}

// Period comparison
export interface PeriodComparison {
  current: number;
  previous: number;
  change: number; // percentage change
  trend: "up" | "down" | "stable";
}

// Aggregate organization metrics
export interface OrganizationMetrics {
  nps: NPSBreakdown;
  csat: CSATMetrics;
  responseRate: ResponseRateMetrics;
  reviewVelocity: ReviewVelocityMetrics;
  averageRating: number;
  totalReviews: number;
  totalMembers: number;
  activeMembers: number;
  topPerformers: string[]; // user IDs
  needsAttention: string[]; // user IDs
}

// User analytics metrics
export interface UserAnalytics {
  userId: string;
  nps: NPSBreakdown;
  csat: CSATMetrics;
  responseRate: ResponseRateMetrics;
  reviewVelocity: ReviewVelocityMetrics;
  averageRating: number;
  totalReviews: number;
  reputationScore: number;
  rank: number | null;
  performanceStatus: "excellent" | "good" | "needs_attention" | "at_risk";
}

/** @deprecated Use UserAnalytics instead */
export type LoanOfficerAnalytics = UserAnalytics;

// Cached metrics from database
export interface CachedMetrics {
  id: string;
  organizationId: string;
  userId: string | null;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  metrics: MetricsSnapshot;
  computedAt: Date;
}
