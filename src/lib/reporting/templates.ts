/**
 * Pre-built Report Templates
 * Default configurations for Monthly Performance and Team Summary reports
 */

import type {
  ReportTemplateConfig,
  ReportSection,
  ReportMetric,
  ReportChart,
  TeamComparisonRow,
} from "./types";

// Monthly Performance Report Template
export const MONTHLY_PERFORMANCE_CONFIG: ReportTemplateConfig = {
  sections: [
    "executive_summary",
    "nps_breakdown",
    "csat_analysis",
    "response_rates",
    "review_velocity",
    "trend_analysis",
  ] as ReportSection[],
  metrics: [
    "nps_score",
    "csat_score",
    "average_rating",
    "total_reviews",
    "response_rate",
    "review_velocity",
  ] as ReportMetric[],
  charts: [
    "nps_trend",
    "csat_trend",
    "review_velocity_trend",
    "rating_distribution",
  ] as ReportChart[],
  includeComparison: true,
  showTrends: true,
  granularity: "daily",
};

// Team Summary Report Template
export const TEAM_SUMMARY_CONFIG: ReportTemplateConfig = {
  sections: [
    "executive_summary",
    "team_comparison",
    "top_performers",
    "needs_attention",
    "nps_breakdown",
    "csat_analysis",
  ] as ReportSection[],
  metrics: [
    "nps_score",
    "csat_score",
    "average_rating",
    "total_reviews",
    "response_rate",
    "reputation_score",
  ] as ReportMetric[],
  charts: ["team_comparison_bar", "performance_pie", "nps_trend"] as ReportChart[],
  includeComparison: true,
  showTrends: true,
  granularity: "weekly",
};

// Default templates to seed for new organizations
export const DEFAULT_TEMPLATES = [
  {
    name: "Monthly Performance Report",
    description: "Comprehensive monthly performance analysis with NPS, CSAT, and review trends",
    templateType: "monthly_performance" as const,
    config: MONTHLY_PERFORMANCE_CONFIG,
    isDefault: true,
  },
  {
    name: "Team Summary Report",
    description: "Team-level overview with performance comparisons and leaderboard",
    templateType: "team_summary" as const,
    config: TEAM_SUMMARY_CONFIG,
    isDefault: true,
  },
];

// Section display names
export const SECTION_LABELS: Record<ReportSection, string> = {
  executive_summary: "Executive Summary",
  nps_breakdown: "NPS Breakdown",
  csat_analysis: "Customer Satisfaction Analysis",
  response_rates: "Survey Response Rates",
  review_velocity: "Review Volume & Velocity",
  top_performers: "Top Performers",
  needs_attention: "Needs Attention",
  team_comparison: "Team Performance Comparison",
  trend_analysis: "Trend Analysis",
};

// Metric display names and descriptions
export const METRIC_INFO: Record<ReportMetric, { label: string; description: string }> = {
  nps_score: {
    label: "NPS Score",
    description: "Net Promoter Score (-100 to 100)",
  },
  csat_score: {
    label: "CSAT Score",
    description: "Customer Satisfaction Score (0-100%)",
  },
  average_rating: {
    label: "Average Rating",
    description: "Average star rating (1-5)",
  },
  total_reviews: {
    label: "Total Reviews",
    description: "Number of reviews received",
  },
  response_rate: {
    label: "Response Rate",
    description: "Survey completion rate (%)",
  },
  review_velocity: {
    label: "Review Velocity",
    description: "Reviews per month",
  },
  reputation_score: {
    label: "Reputation Score",
    description: "Overall reputation (0-100)",
  },
};

export const PERFORMANCE_STATUS_META: Record<
  TeamComparisonRow["performanceStatus"],
  { label: string; backgroundColor: string; color: string }
> = {
  excellent: {
    label: "excellent",
    backgroundColor: "#e7efe5",
    color: "#354f52",
  },
  good: {
    label: "good",
    backgroundColor: "#edf3f1",
    color: "#52796f",
  },
  needs_attention: {
    label: "needs attention",
    backgroundColor: "#f6ecdd",
    color: "#8a6533",
  },
  at_risk: {
    label: "at risk",
    backgroundColor: "#f4e1e1",
    color: "#8a3d3d",
  },
};

// Chart display names
export const CHART_LABELS: Record<ReportChart, string> = {
  nps_trend: "NPS Trend Over Time",
  csat_trend: "CSAT Trend Over Time",
  review_velocity_trend: "Review Volume Trend",
  rating_distribution: "Rating Distribution",
  team_comparison_bar: "Team Performance Comparison",
  performance_pie: "Performance Status Distribution",
};
