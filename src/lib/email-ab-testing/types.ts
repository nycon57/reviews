/**
 * Types for Email A/B Testing System
 * Story S092: Email A/B Testing System
 */

import { z } from "zod";

// ============================================================================
// Action Result Type
// ============================================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Enums
// ============================================================================

export type ABTestStatus = "draft" | "active" | "paused" | "completed" | "archived";

export type TestType = "subject_line" | "preview_text" | "content" | "send_time";

export type WinningMetric = "open_rate" | "click_rate";

// ============================================================================
// Core Types
// ============================================================================

export interface ABTestVariant {
  id: string; // 'A', 'B', 'C', 'D'
  name: string; // e.g., 'Control', 'Variant 1', 'Short Subject'
  isControl: boolean;

  // What's being tested (depends on testType)
  subjectLine?: string;
  previewText?: string;
  content?: string; // JSON or HTML content
  sendTimeOffsetHours?: number; // Offset from base send time
}

export interface ABTest {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  emailType: string; // Template name (e.g., 'survey_invitation', 'welcome_1_access')
  testType: TestType;
  winningMetric: WinningMetric;
  status: ABTestStatus;

  // Variants configuration
  variants: ABTestVariant[];
  trafficSplit: Record<string, number>; // e.g., { A: 50, B: 50 }

  // Auto-winner settings
  autoWinnerEnabled: boolean;
  minSampleSize: number;
  testDurationHours: number;
  confidenceLevel: number;

  // Winner information
  winnerVariant: string | null;
  winnerDeclaredAt: string | null;
  winnerDeclaredBy: string | null;
  winnerAuto: boolean;
  winnerReason: string | null;
  winnerAppliedAt: string | null;
  winnerAppliedBy: string | null;

  // Timestamps
  createdBy: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ABTestResult {
  id: string;
  abTestId: string;
  variant: string;

  // Volume metrics
  emailsSent: number;
  emailsDelivered: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsBounced: number;
  emailsFailed: number;

  // Rate metrics (as decimals, e.g., 0.2534 for 25.34%)
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;

  // Statistical significance (vs control)
  isStatisticallySignificant: boolean;
  pValue: number | null;
  zScore: number | null;
  confidenceIntervalLower: number | null;
  confidenceIntervalUpper: number | null;

  // Timestamps
  firstEmailSentAt: string | null;
  lastEmailSentAt: string | null;
  lastUpdatedAt: string;
}

export interface ABTestWithResults extends ABTest {
  results: ABTestResult[];
}

export interface StatisticalSignificance {
  variantA: string;
  variantB: string;
  metric: WinningMetric;

  // Statistical test results
  zScore: number;
  pValue: number;
  isSignificant: boolean;
  confidenceLevel: number;

  // Sample sizes
  sampleSizeA: number;
  sampleSizeB: number;

  // Rates being compared
  rateA: number;
  rateB: number;

  // Effect size
  absoluteDifference: number;
  relativeDifference: number;

  // Confidence intervals
  confidenceIntervalA: { lower: number; upper: number };
  confidenceIntervalB: { lower: number; upper: number };
}

export interface ABTestFilters {
  status?: ABTestStatus | "all";
  testType?: TestType | "all";
  emailType?: string;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  hasWinner?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "startedAt" | "name" | "status";
  sortOrder?: "asc" | "desc";
}

export interface ABTestSummary {
  total: number;
  active: number;
  completed: number;
  draft: number;
  paused: number;
  withWinner: number;
  averageDuration: number;
  totalEmailsSent: number;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const variantSchema = z.object({
  id: z.string().min(1).max(1), // 'A', 'B', 'C', 'D'
  name: z.string().min(1).max(100),
  isControl: z.boolean(),
  subjectLine: z.string().max(200).optional(),
  previewText: z.string().max(200).optional(),
  content: z.string().optional(),
  sendTimeOffsetHours: z.number().int().min(-24).max(24).optional(),
});

export const createABTestSchema = z.object({
  name: z.string().min(1, "Test name is required").max(200),
  description: z.string().max(500).optional().nullable(),
  emailType: z.string().min(1, "Email type is required"),
  testType: z.enum(["subject_line", "preview_text", "content", "send_time"]),
  winningMetric: z.enum(["open_rate", "click_rate"]),
  variants: z
    .array(variantSchema)
    .min(2, "At least 2 variants required")
    .max(4, "Maximum 4 variants allowed")
    .refine(
      (variants) => variants.filter((v) => v.isControl).length === 1,
      "Exactly one variant must be marked as control"
    ),
  trafficSplit: z
    .record(z.string(), z.number().int().min(1).max(100))
    .refine(
      (split) => Object.values(split).reduce((sum, val) => sum + val, 0) === 100,
      "Traffic split must sum to 100"
    ),
  autoWinnerEnabled: z.boolean().default(true),
  minSampleSize: z.number().int().min(30, "Minimum sample size is 30").default(100),
  testDurationHours: z.number().int().min(1).max(720, "Maximum duration is 30 days").default(24),
  confidenceLevel: z.number().min(0.8).max(0.99).default(0.95),
});

export const updateABTestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional().nullable(),
  autoWinnerEnabled: z.boolean().optional(),
  minSampleSize: z.number().int().min(30).optional(),
  testDurationHours: z.number().int().min(1).max(720).optional(),
  confidenceLevel: z.number().min(0.8).max(0.99).optional(),
});

export const declareWinnerSchema = z.object({
  testId: z.string().uuid("Invalid test ID"),
  variantId: z.string().min(1, "Variant ID is required").max(1),
  autoWinner: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

export const abTestFiltersSchema = z.object({
  status: z.enum(["draft", "active", "paused", "completed", "archived", "all"]).optional(),
  testType: z.enum(["subject_line", "preview_text", "content", "send_time", "all"]).optional(),
  emailType: z.string().optional(),
  createdBy: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hasWinner: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "startedAt", "name", "status"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateABTestInput = z.infer<typeof createABTestSchema>;
export type UpdateABTestInput = z.infer<typeof updateABTestSchema>;
export type DeclareWinnerInput = z.infer<typeof declareWinnerSchema>;
export type ABTestFiltersInput = z.infer<typeof abTestFiltersSchema>;

// ============================================================================
// Type Guards
// ============================================================================

export function isActiveTest(test: ABTest): boolean {
  return test.status === "active" && test.startedAt !== null;
}

export function isCompletedTest(test: ABTest): boolean {
  return test.status === "completed" || test.endedAt !== null;
}

export function hasWinner(test: ABTest): boolean {
  return test.winnerVariant !== null;
}

export function canEdit(test: ABTest): boolean {
  return test.status === "draft";
}

export function canStart(test: ABTest): boolean {
  return test.status === "draft" && test.variants.length >= 2;
}

export function canStop(test: ABTest): boolean {
  return test.status === "active";
}

export function canPause(test: ABTest): boolean {
  return test.status === "active";
}

export function canResume(test: ABTest): boolean {
  return test.status === "paused";
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getTestTypeDisplayName(testType: TestType): string {
  const names: Record<TestType, string> = {
    subject_line: "Subject Line",
    preview_text: "Preview Text",
    content: "Email Content",
    send_time: "Send Time",
  };
  return names[testType];
}

export function getWinningMetricDisplayName(metric: WinningMetric): string {
  const names: Record<WinningMetric, string> = {
    open_rate: "Open Rate",
    click_rate: "Click Rate",
  };
  return names[metric];
}

export function getStatusDisplayName(status: ABTestStatus): string {
  const names: Record<ABTestStatus, string> = {
    draft: "Draft",
    active: "Active",
    paused: "Paused",
    completed: "Completed",
    archived: "Archived",
  };
  return names[status];
}

export function getStatusColor(status: ABTestStatus): string {
  const colors: Record<ABTestStatus, string> = {
    draft: "secondary",
    active: "default",
    paused: "warning",
    completed: "success",
    archived: "outline",
  };
  return colors[status];
}

export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export function formatConfidenceLevel(level: number): string {
  return `${(level * 100).toFixed(0)}%`;
}

// ============================================================================
// Constants
// ============================================================================

export const MIN_SAMPLE_SIZE_PER_VARIANT = 30;
export const DEFAULT_CONFIDENCE_LEVEL = 0.95;
export const DEFAULT_ALPHA = 0.05;
export const MAX_VARIANTS = 4;
export const MIN_VARIANTS = 2;
export const MAX_TEST_DURATION_HOURS = 720; // 30 days
export const MIN_TEST_DURATION_HOURS = 1;

// Recommended minimum detectable effect (MDE) for different metrics
export const RECOMMENDED_MDE: Record<WinningMetric, number> = {
  open_rate: 0.05, // 5 percentage points
  click_rate: 0.02, // 2 percentage points
};

// Default traffic splits for common configurations
export const DEFAULT_TRAFFIC_SPLITS = {
  two_way_equal: { A: 50, B: 50 },
  two_way_skewed: { A: 80, B: 20 },
  three_way_equal: { A: 33, B: 33, C: 34 },
  four_way_equal: { A: 25, B: 25, C: 25, D: 25 },
};

// Map database snake_case to camelCase for TypeScript
export function mapDbTestToTs(dbTest: Record<string, unknown>): ABTest {
  return {
    id: dbTest.id as string,
    organizationId: dbTest.organization_id as string,
    name: dbTest.name as string,
    description: dbTest.description as string | null,
    emailType: dbTest.email_type as string,
    testType: dbTest.test_type as TestType,
    winningMetric: dbTest.winning_metric as WinningMetric,
    status: dbTest.status as ABTestStatus,
    variants: dbTest.variants as ABTestVariant[],
    trafficSplit: dbTest.traffic_split as Record<string, number>,
    autoWinnerEnabled: dbTest.auto_winner_enabled as boolean,
    minSampleSize: dbTest.min_sample_size as number,
    testDurationHours: dbTest.test_duration_hours as number,
    confidenceLevel: Number(dbTest.confidence_level),
    winnerVariant: dbTest.winner_variant as string | null,
    winnerDeclaredAt: dbTest.winner_declared_at as string | null,
    winnerDeclaredBy: dbTest.winner_declared_by as string | null,
    winnerAuto: dbTest.winner_auto as boolean,
    winnerReason: dbTest.winner_reason as string | null,
    winnerAppliedAt: (dbTest.winner_applied_at as string | null) ?? null,
    winnerAppliedBy: (dbTest.winner_applied_by as string | null) ?? null,
    createdBy: dbTest.created_by as string | null,
    startedAt: dbTest.started_at as string | null,
    endedAt: dbTest.ended_at as string | null,
    createdAt: dbTest.created_at as string,
    updatedAt: dbTest.updated_at as string,
  };
}

export function mapDbResultToTs(dbResult: Record<string, unknown>): ABTestResult {
  return {
    id: dbResult.id as string,
    abTestId: dbResult.ab_test_id as string,
    variant: dbResult.variant as string,
    emailsSent: dbResult.emails_sent as number,
    emailsDelivered: dbResult.emails_delivered as number,
    emailsOpened: dbResult.emails_opened as number,
    emailsClicked: dbResult.emails_clicked as number,
    emailsBounced: dbResult.emails_bounced as number,
    emailsFailed: dbResult.emails_failed as number,
    deliveryRate: Number(dbResult.delivery_rate),
    openRate: Number(dbResult.open_rate),
    clickRate: Number(dbResult.click_rate),
    clickToOpenRate: Number(dbResult.click_to_open_rate),
    isStatisticallySignificant: dbResult.is_statistically_significant as boolean,
    pValue: dbResult.p_value !== null ? Number(dbResult.p_value) : null,
    zScore: dbResult.z_score !== null ? Number(dbResult.z_score) : null,
    confidenceIntervalLower:
      dbResult.confidence_interval_lower !== null
        ? Number(dbResult.confidence_interval_lower)
        : null,
    confidenceIntervalUpper:
      dbResult.confidence_interval_upper !== null
        ? Number(dbResult.confidence_interval_upper)
        : null,
    firstEmailSentAt: dbResult.first_email_sent_at as string | null,
    lastEmailSentAt: dbResult.last_email_sent_at as string | null,
    lastUpdatedAt: dbResult.last_updated_at as string,
  };
}
