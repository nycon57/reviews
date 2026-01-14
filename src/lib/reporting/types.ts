/**
 * Reporting System Types
 * Type definitions for reports, templates, scheduling, and exports
 */

import type {
  NPSBreakdown,
  CSATMetrics,
  ResponseRateMetrics,
  ReviewVelocityMetrics,
  LoanOfficerAnalytics,
} from "@/lib/analytics/types";

// Report template types
export type ReportTemplateType = "monthly_performance" | "team_summary" | "custom";

// Report schedule frequency
export type ScheduleFrequency = "daily" | "weekly" | "monthly";

// Export formats
export type ExportFormat = "pdf" | "csv" | "json";

// Date range presets
export type DateRangePreset =
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "custom";

// Date range for report queries
export interface ReportDateRange {
  start: Date;
  end: Date;
  preset?: DateRangePreset;
}

// Report filter options
export interface ReportFilters {
  loanOfficerIds?: string[];
  branches?: string[];
  regions?: string[];
  performanceStatus?: ("excellent" | "good" | "needs_attention" | "at_risk")[];
  minRating?: number;
  maxRating?: number;
}

// Report template configuration
export interface ReportTemplateConfig {
  sections: ReportSection[];
  metrics: ReportMetric[];
  charts: ReportChart[];
  includeComparison?: boolean;
  showTrends?: boolean;
  granularity?: "daily" | "weekly" | "monthly";
}

// Available report sections
export type ReportSection =
  | "executive_summary"
  | "nps_breakdown"
  | "csat_analysis"
  | "response_rates"
  | "review_velocity"
  | "top_performers"
  | "needs_attention"
  | "team_comparison"
  | "trend_analysis";

// Available metrics to include
export type ReportMetric =
  | "nps_score"
  | "csat_score"
  | "average_rating"
  | "total_reviews"
  | "response_rate"
  | "review_velocity"
  | "reputation_score";

// Chart types for visual reports
export type ReportChart =
  | "nps_trend"
  | "csat_trend"
  | "review_velocity_trend"
  | "rating_distribution"
  | "team_comparison_bar"
  | "performance_pie";

// Report template from database
export interface ReportTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  templateType: ReportTemplateType;
  config: ReportTemplateConfig;
  isDefault: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Scheduled report from database
export interface ScheduledReport {
  id: string;
  organizationId: string;
  templateId: string;
  name: string;
  recipients: string[];
  schedule: ScheduleFrequency;
  scheduleDayOfWeek: number | null;
  scheduleDayOfMonth: number | null;
  scheduleTime: string;
  filters: ReportFilters;
  isActive: boolean;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Report share from database
export interface ReportShare {
  id: string;
  organizationId: string;
  templateId: string;
  shareToken: string;
  title: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  filters: ReportFilters;
  sharedBy: string | null;
  expiresAt: Date | null;
  accessCount: number;
  lastAccessedAt: Date | null;
  createdAt: Date;
}

// Report export record from database
export interface ReportExport {
  id: string;
  organizationId: string;
  templateId: string;
  exportFormat: ExportFormat;
  fileName: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  filters: ReportFilters;
  rowCount: number | null;
  createdBy: string | null;
  createdAt: Date;
}

// Executive summary data
export interface ExecutiveSummary {
  periodLabel: string;
  totalReviews: number;
  averageRating: number;
  npsScore: number;
  csatScore: number;
  responseRate: number;
  reviewVelocity: number;
  comparisonPeriod?: {
    totalReviews: number;
    averageRating: number;
    npsScore: number;
    csatScore: number;
    reviewsChange: number;
    ratingChange: number;
    npsChange: number;
    csatChange: number;
  };
}

// Team comparison data
export interface TeamComparisonRow {
  loanOfficerId: string;
  name: string;
  photoUrl: string | null;
  branch: string | null;
  totalReviews: number;
  averageRating: number;
  npsScore: number;
  csatScore: number;
  responseRate: number;
  reputationScore: number;
  performanceStatus: "excellent" | "good" | "needs_attention" | "at_risk";
  rank: number;
}

// Full generated report data
export interface GeneratedReport {
  templateId: string;
  templateName: string;
  templateType: ReportTemplateType;
  dateRange: ReportDateRange;
  filters: ReportFilters;
  generatedAt: Date;
  executiveSummary: ExecutiveSummary;
  npsBreakdown?: NPSBreakdown;
  csatMetrics?: CSATMetrics;
  responseRateMetrics?: ResponseRateMetrics;
  reviewVelocityMetrics?: ReviewVelocityMetrics;
  teamComparison?: TeamComparisonRow[];
  topPerformers?: LoanOfficerAnalytics[];
  needsAttention?: LoanOfficerAnalytics[];
  trends?: {
    nps: { date: string; value: number }[];
    csat: { date: string; value: number }[];
    reviews: { date: string; value: number }[];
  };
}

// CSV export row structure
export interface ReportCSVRow {
  [key: string]: string | number | null;
}

// PDF report section data
export interface PDFReportData {
  title: string;
  subtitle: string;
  organizationName: string;
  dateRange: string;
  generatedAt: string;
  sections: {
    type: ReportSection;
    title: string;
    data: Record<string, unknown>;
  }[];
}

// Report generation request
export interface GenerateReportRequest {
  templateId: string;
  dateRange: ReportDateRange;
  filters?: ReportFilters;
}

// Export report request
export interface ExportReportRequest {
  templateId: string;
  dateRange: ReportDateRange;
  filters?: ReportFilters;
  format: ExportFormat;
}

// Schedule report request
export interface ScheduleReportRequest {
  templateId: string;
  name: string;
  recipients: string[];
  schedule: ScheduleFrequency;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleTime?: string;
  filters?: ReportFilters;
}

// Share report request
export interface ShareReportRequest {
  templateId: string;
  title: string;
  dateRange: ReportDateRange;
  filters?: ReportFilters;
  expiresInDays?: number;
}

// Create template request
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  templateType: ReportTemplateType;
  config: ReportTemplateConfig;
}

// Update template request
export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  config?: ReportTemplateConfig;
}
