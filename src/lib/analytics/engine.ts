"use server";

/**
 * Analytics Engine - Main Entry Point
 * Fetches data from database and calculates comprehensive metrics
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/reviews/types";
import type {
  PeriodType,
  DateRange,
  AnalyticsOrgContext,
  MetricsSnapshot,
  NPSBreakdown,
  CSATMetrics,
  ResponseRateMetrics,
  ReviewVelocityMetrics,
  TrendPoint,
  PeriodComparison,
  OrganizationMetrics,
  UserAnalytics,
  CachedMetrics,
} from "./types";
import {
  calculateNPS,
  calculateCSAT,
  calculateResponseRate,
  calculateReviewVelocity,
  calculatePeriodComparison,
  calculateNPSTrend,
  calculateCSATTrend,
  calculateReputationScore,
  determinePerformanceStatus,
} from "./calculations";
import { getDateRangeForPeriod } from "./utils";

// Cache duration in minutes
const CACHE_DURATION_MINUTES = 60;

type ResolvedAnalyticsContext = {
  userId: string | null;
  organizationId: string;
  role: string | null;
  loanOfficerId: string | null;
};

/**
 * Get user context for analytics operations - parallelized queries
 */
async function getUserContext(
  explicitContext?: AnalyticsOrgContext
): Promise<ResolvedAnalyticsContext | null> {
  if (explicitContext) {
    return {
      userId: null,
      organizationId: explicitContext.organizationId,
      role: null,
      loanOfficerId: null,
    };
  }

  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createAdminClient();

  // Parallelize independent queries
  const [userDataResult, loanOfficerResult] = await Promise.all([
    supabase.from("users").select("id, organization_id, role").eq("id", user.id).single(),
    supabase.from("users").select("id").eq("user_id", user.id).single(),
  ]);

  const userData = userDataResult.data;
  if (!userData) {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
    loanOfficerId: loanOfficerResult.data?.id || null,
  };
}

/**
 * Get NPS metrics for a user or organization
 */
export async function getNPSMetrics(
  loanOfficerId?: string,
  dateRange?: DateRange,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<NPSBreakdown>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const range = dateRange || getDateRangeForPeriod("all_time");

  let query = supabase
    .from("survey_responses")
    .select(
      `
      nps_score,
      submitted_at,
      surveys!inner (
        user_id,
        organization_id
      )
    `
    )
    .not("nps_score", "is", null)
    .gte("submitted_at", range.start.toISOString())
    .lte("submitted_at", range.end.toISOString());

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching NPS data:", error);
    return { success: false, error: "Failed to fetch NPS data" };
  }

  // Filter by user or organization
  const filteredData = (data || []).filter((r) => {
    const survey = r.surveys;
    if (loanOfficerId) {
      return survey.user_id === loanOfficerId;
    }
    return survey.organization_id === context.organizationId;
  });

  const scores = filteredData.map((r) => r.nps_score!);
  const nps = calculateNPS(scores);

  return { success: true, data: nps };
}

/**
 * Get CSAT metrics for a user or organization
 */
export async function getCSATMetrics(
  loanOfficerId?: string,
  dateRange?: DateRange,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<CSATMetrics>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const range = dateRange || getDateRangeForPeriod("all_time");

  let query = supabase
    .from("survey_responses")
    .select(
      `
      overall_rating,
      submitted_at,
      surveys!inner (
        user_id,
        organization_id
      )
    `
    )
    .not("overall_rating", "is", null)
    .gte("submitted_at", range.start.toISOString())
    .lte("submitted_at", range.end.toISOString());

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching CSAT data:", error);
    return { success: false, error: "Failed to fetch CSAT data" };
  }

  // Filter by user or organization
  const filteredData = (data || []).filter((r) => {
    const survey = r.surveys;
    if (loanOfficerId) {
      return survey.user_id === loanOfficerId;
    }
    return survey.organization_id === context.organizationId;
  });

  const ratings = filteredData.map((r) => r.overall_rating!);
  const csat = calculateCSAT(ratings);

  return { success: true, data: csat };
}

/**
 * Get response rate metrics for a user or organization
 */
export async function getResponseRateMetrics(
  loanOfficerId?: string,
  dateRange?: DateRange,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<ResponseRateMetrics>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const range = dateRange || getDateRangeForPeriod("all_time");

  let query = supabase
    .from("surveys")
    .select("id, status, sent_at, completed_at, created_at")
    .eq("organization_id", context.organizationId)
    .gte("created_at", range.start.toISOString())
    .lte("created_at", range.end.toISOString());

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching survey data:", error);
    return { success: false, error: "Failed to fetch survey data" };
  }

  const surveys = (data || []).map((s) => ({
    status: s.status || "pending",
    sentAt: s.sent_at ? new Date(s.sent_at) : null,
    completedAt: s.completed_at ? new Date(s.completed_at) : null,
  }));

  const responseRate = calculateResponseRate(surveys);

  return { success: true, data: responseRate };
}

/**
 * Get review velocity metrics for a user or organization
 */
export async function getReviewVelocityMetrics(
  loanOfficerId?: string,
  dateRange?: DateRange,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<ReviewVelocityMetrics>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const range = dateRange || getDateRangeForPeriod("monthly");

  let query = supabase
    .from("reviews")
    .select("id, review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", range.start.toISOString())
    .lte("review_date", range.end.toISOString());

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching review velocity data:", error);
    return { success: false, error: "Failed to fetch review data" };
  }

  const reviews = (data || []).map((r) => ({
    reviewDate: new Date(r.review_date),
  }));

  const velocity = calculateReviewVelocity(reviews, range);

  return { success: true, data: velocity };
}

/**
 * Get comprehensive metrics snapshot for a user
 */
export async function getUserAnalytics(
  userId: string,
  periodType: PeriodType = "monthly",
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<UserAnalytics>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Check authorization
  if (context.role === "user" && userId !== context.loanOfficerId) {
    return { success: false, error: "Unauthorized - Can only view own analytics" };
  }

  const supabase = createAdminClient();
  const dateRange = getDateRangeForPeriod(periodType);

  // Try to get cached metrics first
  const cachedResult = await getCachedMetrics(userId, periodType, ctx);
  if (cachedResult.success && cachedResult.data) {
    const cached = cachedResult.data;
    const cacheAge = Date.now() - new Date(cached.computedAt).getTime();
    const maxAge = CACHE_DURATION_MINUTES * 60 * 1000;

    if (cacheAge < maxAge) {
      // Return cached data with user context
      const { data: user } = await supabase
        .from("users")
        .select("average_rating, total_reviews, reputation_score")
        .eq("id", userId)
        .single();

      return {
        success: true,
        data: {
          userId,
          nps: cached.metrics.nps,
          csat: cached.metrics.csat,
          responseRate: cached.metrics.responseRate,
          reviewVelocity: cached.metrics.reviewVelocity,
          averageRating: user?.average_rating || cached.metrics.averageRating,
          totalReviews: user?.total_reviews || cached.metrics.totalReviews,
          reputationScore: user?.reputation_score || 0,
          rank: null,
          performanceStatus: determinePerformanceStatus(
            user?.average_rating || 0,
            user?.total_reviews || 0,
            cached.metrics.nps.score,
            cached.metrics.responseRate.rate
          ),
        },
      };
    }
  }

  // Fetch fresh data
  const [npsResult, csatResult, responseRateResult, velocityResult] = await Promise.all([
    getNPSMetrics(userId, dateRange, ctx),
    getCSATMetrics(userId, dateRange, ctx),
    getResponseRateMetrics(userId, dateRange, ctx),
    getReviewVelocityMetrics(userId, dateRange, ctx),
  ]);

  if (
    !npsResult.success ||
    !csatResult.success ||
    !responseRateResult.success ||
    !velocityResult.success
  ) {
    return { success: false, error: "Failed to fetch analytics data" };
  }

  // Get user cached data
  const { data: userData } = await supabase
    .from("users")
    .select("average_rating, total_reviews, reputation_score")
    .eq("id", userId)
    .single();

  const averageRating = userData?.average_rating || 0;
  const totalReviews = userData?.total_reviews || 0;

  // Calculate reputation score
  const reputationScore = calculateReputationScore(
    npsResult.data!,
    csatResult.data!,
    responseRateResult.data!,
    totalReviews,
    averageRating
  );

  const analytics: UserAnalytics = {
    userId,
    nps: npsResult.data!,
    csat: csatResult.data!,
    responseRate: responseRateResult.data!,
    reviewVelocity: velocityResult.data!,
    averageRating,
    totalReviews,
    reputationScore,
    rank: null,
    performanceStatus: determinePerformanceStatus(
      averageRating,
      totalReviews,
      npsResult.data!.score,
      responseRateResult.data!.rate
    ),
  };

  // Cache the metrics
  const snapshot: MetricsSnapshot = {
    nps: npsResult.data!,
    csat: csatResult.data!,
    responseRate: responseRateResult.data!,
    reviewVelocity: velocityResult.data!,
    averageRating,
    totalReviews,
    periodStart: dateRange.start,
    periodEnd: dateRange.end,
    computedAt: new Date(),
  };

  await cacheMetrics(userId, periodType, snapshot, ctx);

  return { success: true, data: analytics };
}

/** @deprecated Use getUserAnalytics instead */
export const getLoanOfficerAnalytics = getUserAnalytics;

/**
 * Get organization-wide analytics
 */
export async function getOrganizationAnalytics(
  periodType: PeriodType = "monthly",
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<OrganizationMetrics>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Only managers and admins can view org analytics
  if (!ctx && context.role !== "manager" && context.role !== "admin") {
    return { success: false, error: "Unauthorized - Manager or admin access required" };
  }

  const supabase = createAdminClient();
  const dateRange = getDateRangeForPeriod(periodType);

  // Fetch all metrics without user filter (org-wide)
  const [npsResult, csatResult, responseRateResult, velocityResult] = await Promise.all([
    getNPSMetrics(undefined, dateRange, ctx),
    getCSATMetrics(undefined, dateRange, ctx),
    getResponseRateMetrics(undefined, dateRange, ctx),
    getReviewVelocityMetrics(undefined, dateRange, ctx),
  ]);

  if (
    !npsResult.success ||
    !csatResult.success ||
    !responseRateResult.success ||
    !velocityResult.success
  ) {
    return { success: false, error: "Failed to fetch organization analytics" };
  }

  // Get user counts and aggregate data
  const { data: users } = await supabase
    .from("users")
    .select("id, is_active, average_rating, total_reviews, nps_score, reputation_score")
    .eq("organization_id", context.organizationId);

  const totalMembers = users?.length || 0;
  const activeUsers = users?.filter((u) => u.is_active) || [];
  const activeMembers = activeUsers.length;

  // Calculate aggregate rating and reviews
  const totalReviews = users?.reduce((sum, u) => sum + (u.total_reviews || 0), 0) || 0;
  const ratingsWithData = activeUsers.filter((u) => (u.average_rating || 0) > 0);
  const averageRating =
    ratingsWithData.length > 0
      ? ratingsWithData.reduce((sum, u) => sum + (u.average_rating || 0), 0) /
        ratingsWithData.length
      : 0;

  // Identify top performers and those needing attention
  const topPerformers = activeUsers
    .filter((u) => (u.reputation_score || 0) >= 70 && (u.average_rating || 0) >= 4.5)
    .sort((a, b) => (b.reputation_score || 0) - (a.reputation_score || 0))
    .slice(0, 5)
    .map((u) => u.id);

  const needsAttention = activeUsers
    .filter((u) => (u.average_rating || 0) < 4.0 || (u.nps_score || 0) < 30)
    .map((u) => u.id);

  return {
    success: true,
    data: {
      nps: npsResult.data!,
      csat: csatResult.data!,
      responseRate: responseRateResult.data!,
      reviewVelocity: velocityResult.data!,
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews,
      totalMembers,
      activeMembers,
      topPerformers,
      needsAttention,
    },
  };
}

/**
 * Get historical trend data for NPS
 */
export async function getNPSTrendData(
  loanOfficerId?: string,
  months: number = 6,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<TrendPoint[]>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from("survey_responses")
    .select(
      `
      nps_score,
      submitted_at,
      surveys!inner (
        user_id,
        organization_id
      )
    `
    )
    .not("nps_score", "is", null)
    .gte("submitted_at", startDate.toISOString());

  if (error) {
    console.error("Error fetching NPS trend:", error);
    return { success: false, error: "Failed to fetch NPS trend" };
  }

  const filteredData = (data || []).filter((r) => {
    const survey = r.surveys;
    if (loanOfficerId) {
      return survey.user_id === loanOfficerId;
    }
    return survey.organization_id === context.organizationId;
  });

  const responses = filteredData.map((r) => ({
    date: new Date(r.submitted_at!),
    npsScore: r.nps_score!,
  }));

  const trend = calculateNPSTrend(responses, months);

  return { success: true, data: trend };
}

/**
 * Get historical trend data for CSAT
 */
export async function getCSATTrendData(
  loanOfficerId?: string,
  months: number = 6,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<TrendPoint[]>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from("survey_responses")
    .select(
      `
      overall_rating,
      submitted_at,
      surveys!inner (
        user_id,
        organization_id
      )
    `
    )
    .not("overall_rating", "is", null)
    .gte("submitted_at", startDate.toISOString());

  if (error) {
    console.error("Error fetching CSAT trend:", error);
    return { success: false, error: "Failed to fetch CSAT trend" };
  }

  const filteredData = (data || []).filter((r) => {
    const survey = r.surveys;
    if (loanOfficerId) {
      return survey.user_id === loanOfficerId;
    }
    return survey.organization_id === context.organizationId;
  });

  const responses = filteredData.map((r) => ({
    date: new Date(r.submitted_at!),
    rating: r.overall_rating!,
  }));

  const trend = calculateCSATTrend(responses, months);

  return { success: true, data: trend };
}

/**
 * Get historical trend data for review velocity
 */
export async function getReviewVelocityTrendData(
  loanOfficerId?: string,
  months: number = 6,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<TrendPoint[]>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  let query = supabase
    .from("reviews")
    .select("id, review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString())
    .order("review_date", { ascending: true });

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching review velocity trend:", error);
    return { success: false, error: "Failed to fetch review velocity trend" };
  }

  // Group reviews by month
  const now = new Date();
  const monthlyData = new Map<string, number>();

  for (const review of data || []) {
    const date = new Date(review.review_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const count = monthlyData.get(monthKey) || 0;
    monthlyData.set(monthKey, count + 1);
  }

  // Generate trend points
  const trendPoints: TrendPoint[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    trendPoints.push({
      date: monthLabel,
      value: monthlyData.get(monthKey) || 0,
      label: monthKey,
    });
  }

  return { success: true, data: trendPoints };
}

/**
 * Get period comparison for a specific metric
 */
export async function getMetricComparison(
  metric: "nps" | "csat" | "responseRate" | "reviews",
  loanOfficerId?: string,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<PeriodComparison>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const currentRange = getDateRangeForPeriod("monthly");
  const previousRange: DateRange = {
    start: new Date(currentRange.start),
    end: new Date(currentRange.start),
  };
  previousRange.start.setMonth(previousRange.start.getMonth() - 1);

  let currentValue = 0;
  let previousValue = 0;

  switch (metric) {
    case "nps": {
      const [current, previous] = await Promise.all([
        getNPSMetrics(loanOfficerId, currentRange, ctx),
        getNPSMetrics(loanOfficerId, previousRange, ctx),
      ]);
      currentValue = current.data?.score || 0;
      previousValue = previous.data?.score || 0;
      break;
    }
    case "csat": {
      const [current, previous] = await Promise.all([
        getCSATMetrics(loanOfficerId, currentRange, ctx),
        getCSATMetrics(loanOfficerId, previousRange, ctx),
      ]);
      currentValue = current.data?.score || 0;
      previousValue = previous.data?.score || 0;
      break;
    }
    case "responseRate": {
      const [current, previous] = await Promise.all([
        getResponseRateMetrics(loanOfficerId, currentRange, ctx),
        getResponseRateMetrics(loanOfficerId, previousRange, ctx),
      ]);
      currentValue = current.data?.rate || 0;
      previousValue = previous.data?.rate || 0;
      break;
    }
    case "reviews": {
      const [current, previous] = await Promise.all([
        getReviewVelocityMetrics(loanOfficerId, currentRange, ctx),
        getReviewVelocityMetrics(loanOfficerId, previousRange, ctx),
      ]);
      currentValue = current.data?.totalReviews || 0;
      previousValue = previous.data?.totalReviews || 0;
      break;
    }
  }

  const comparison = calculatePeriodComparison(currentValue, previousValue);

  return { success: true, data: comparison };
}

/**
 * Cache metrics to the metrics_snapshots table
 */
async function cacheMetrics(
  loanOfficerId: string | null,
  periodType: PeriodType,
  metrics: MetricsSnapshot,
  ctx?: AnalyticsOrgContext
): Promise<void> {
  const context = await getUserContext(ctx);
  if (!context) return;

  const supabase = createAdminClient();

  // Serialize metrics to JSON-safe format (using JSON.parse/stringify to strip type info)
  const metricsJson = JSON.parse(
    JSON.stringify({
      nps: metrics.nps,
      csat: metrics.csat,
      responseRate: metrics.responseRate,
      reviewVelocity: metrics.reviewVelocity,
      averageRating: metrics.averageRating,
      totalReviews: metrics.totalReviews,
      periodStart: metrics.periodStart.toISOString(),
      periodEnd: metrics.periodEnd.toISOString(),
      computedAt: metrics.computedAt.toISOString(),
    })
  );

  const { error } = await supabase.from("metrics_snapshots").upsert(
    {
      organization_id: context.organizationId,
      user_id: loanOfficerId,
      period_type: periodType,
      period_start: metrics.periodStart.toISOString().split("T")[0],
      period_end: metrics.periodEnd.toISOString().split("T")[0],
      metrics: metricsJson,
      computed_at: new Date().toISOString(),
    },
    {
      onConflict: "organization_id,user_id,period_type,period_start",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    console.error("Error caching metrics:", error);
  }
}

/**
 * A `metrics_snapshots` row as this module writes and reads it.
 *
 * `period_type` is a text column constrained to PeriodType, and `metrics` is a
 * jsonb column written only by {@link cacheMetrics}; the generated schema types
 * both as bare `string`/`Json`, so the contract is restated here.
 */
interface MetricsSnapshotRow {
  id: string;
  organization_id: string;
  user_id: string | null;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  metrics: MetricsSnapshot;
  computed_at: string | null;
}

/**
 * Get cached metrics from the metrics_snapshots table
 */
async function getCachedMetrics(
  loanOfficerId: string | null,
  periodType: PeriodType,
  ctx?: AnalyticsOrgContext
): Promise<ActionResult<CachedMetrics | null>> {
  const context = await getUserContext(ctx);
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const dateRange = getDateRangeForPeriod(periodType);

  let query = supabase
    .from("metrics_snapshots")
    .select("*")
    .eq("organization_id", context.organizationId)
    .eq("period_type", periodType)
    .eq("period_start", dateRange.start.toISOString().split("T")[0]);

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  } else {
    query = query.is("user_id", null);
  }

  const { data, error } = await query.single().returns<MetricsSnapshotRow>();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return { success: true, data: null };
    }
    console.error("Error fetching cached metrics:", error);
    return { success: false, error: "Failed to fetch cached metrics" };
  }

  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      userId: data.user_id,
      periodType: data.period_type,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      metrics: data.metrics,
      computedAt: new Date(data.computed_at || Date.now()),
    },
  };
}

/**
 * Invalidate cached metrics (force refresh on next request)
 */
export async function invalidateMetricsCache(loanOfficerId?: string): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("metrics_snapshots")
    .delete()
    .eq("organization_id", context.organizationId);

  if (loanOfficerId) {
    query = query.eq("user_id", loanOfficerId);
  }

  const { error } = await query;

  if (error) {
    console.error("Error invalidating cache:", error);
    return { success: false, error: "Failed to invalidate cache" };
  }

  return { success: true, data: undefined };
}

/**
 * Compute and cache historical metrics snapshots for all periods
 * Useful for generating historical reports
 */
export async function computeHistoricalSnapshots(
  loanOfficerId?: string,
  _months: number = 12
): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Only admins can trigger bulk computation
  if (context.role !== "admin") {
    return { success: false, error: "Unauthorized - Admin access required" };
  }

  const periodTypes: PeriodType[] = ["monthly", "quarterly", "yearly"];

  for (const periodType of periodTypes) {
    const dateRange = getDateRangeForPeriod(periodType);

    const [npsResult, csatResult, responseRateResult, velocityResult] = await Promise.all([
      getNPSMetrics(loanOfficerId, dateRange),
      getCSATMetrics(loanOfficerId, dateRange),
      getResponseRateMetrics(loanOfficerId, dateRange),
      getReviewVelocityMetrics(loanOfficerId, dateRange),
    ]);

    if (
      npsResult.success &&
      csatResult.success &&
      responseRateResult.success &&
      velocityResult.success
    ) {
      const snapshot: MetricsSnapshot = {
        nps: npsResult.data!,
        csat: csatResult.data!,
        responseRate: responseRateResult.data!,
        reviewVelocity: velocityResult.data!,
        averageRating: 0, // Would need separate calculation
        totalReviews: velocityResult.data!.totalReviews,
        periodStart: dateRange.start,
        periodEnd: dateRange.end,
        computedAt: new Date(),
      };

      await cacheMetrics(loanOfficerId || null, periodType, snapshot);
    }
  }

  return { success: true, data: undefined };
}
