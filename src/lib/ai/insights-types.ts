// AI Insights Types

import type { ReviewTheme, SentimentLabel } from './types';

// Sentiment trend data point
export interface SentimentTrendPoint {
  date: string;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  averageScore: number;
  totalReviews: number;
}

// Theme frequency data
export interface ThemeFrequency {
  theme: ReviewTheme;
  count: number;
  percentage: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
}

// Key phrase data
export interface KeyPhraseData {
  phrase: string;
  count: number;
  sentiment: SentimentLabel;
  recentOccurrences: number;
}

// AI-generated summary
export interface AIInsightsSummary {
  id: string;
  loanOfficerId: string | null;
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  highlights: string[];
  areasOfImprovement: string[];
  generatedAt: Date;
}

// Improvement recommendation
export interface ImprovementRecommendation {
  id: string;
  category: ReviewTheme | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  basedOn: string; // What feedback it's based on
  potentialImpact: string;
}

// Industry benchmark data
export interface IndustryBenchmark {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;
  trend: 'above' | 'at' | 'below';
}

// Comprehensive AI insights data
export interface AIInsightsData {
  sentimentTrend: SentimentTrendPoint[];
  themeFrequencies: ThemeFrequency[];
  topKeyPhrases: KeyPhraseData[];
  summary: AIInsightsSummary | null;
  recommendations: ImprovementRecommendation[];
  benchmarks: IndustryBenchmark[];
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  };
  periodStart: Date;
  periodEnd: Date;
}

// Export filter options
export interface InsightsExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeCharts: boolean;
  includeSummary: boolean;
  includeRecommendations: boolean;
  includeBenchmarks: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Insights report data for export
export interface InsightsReport {
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  loanOfficerName?: string;
  organizationName: string;
  insights: AIInsightsData;
}

// ============================================================================
// Smart Action Items
// ============================================================================

export type ActionItemType =
  | "respond_review"
  | "pending_responses"
  | "send_requests"
  | "theme_alert"
  | "milestone"
  | "improvement";

export interface SmartActionItem {
  id: string;
  priority: "high" | "medium" | "low";
  actionType: ActionItemType;
  title: string;
  description: string;
  actionUrl?: string;
  dismissible: boolean;
}

// ============================================================================
// LO Performance Scorecard
// ============================================================================

export interface MetricTrend {
  current: number;
  previous: number;
  direction: "up" | "down" | "stable";
}

export interface LOPerformanceScorecard {
  loanOfficerId: string;
  loanOfficerName: string;
  reviewVelocity: MetricTrend;
  avgRating: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
  };
  responseRate: { rate: number; orgAverage: number };
  avgResponseTimeHours: number;
  sentimentTrajectory: "improving" | "stable" | "declining";
  surveyCompletionRate: number;
  requestToReviewConversion: number;
  topPositiveThemes: string[];
  riskThemes: string[];
  npsTrend: MetricTrend;
  coachingBrief?: string;
  generatedAt: Date;
}

// ============================================================================
// Manager Activity Monitor
// ============================================================================

export type ActivityStatus = "active" | "slowing" | "inactive";

export type AlertType =
  | "unresponded_reviews"
  | "low_request_rate"
  | "response_time_increase"
  | "negative_spike"
  | "engagement_drop"
  | "rating_decline";

export interface ActivityAlert {
  type: AlertType;
  message: string;
  severity: "warning" | "critical";
}

export interface LOActivityStatus {
  userId: string;
  userName: string;
  activityStatus: ActivityStatus;
  unrespondedReviewCount: number;
  reviewRequestsThisWeek: number;
  orgAvgRequestsPerWeek: number;
  avgResponseTimeHours: number;
  responseTimeTrend: "improving" | "stable" | "worsening";
  negativeReviewsLast7Days: number;
  ratingTrend: { avg30Day: number; avg60Day: number };
  alerts: ActivityAlert[];
}

export interface TeamActivityMonitor {
  teamMembers: LOActivityStatus[];
  orgMetrics: {
    avgResponseTimeHours: number;
    avgRequestsPerWeek: number;
    activeCount: number;
    slowingCount: number;
    inactiveCount: number;
  };
}

// ============================================================================
// Channel Effectiveness
// ============================================================================

export interface ChannelMetrics {
  channel: string;
  reviewCount: number;
  avgRating: number;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  conversionRate?: number;
}
