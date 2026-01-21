/**
 * Weekly Loan Officer Metrics Query (S082)
 *
 * Fetches all metrics needed for the weekly performance summary email for loan officers.
 */

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { WeeklySummaryLOEmailData } from "../types";

interface LOMetricsQueryResult {
  success: boolean;
  data?: Omit<
    WeeklySummaryLOEmailData,
    "toEmail" | "toName" | "dashboardUrl" | "unsubscribeUrl"
  >;
  error?: string;
}

/**
 * Calculate the start and end dates for the current week and previous week
 */
function getWeekDates(): {
  thisWeekStart: Date;
  thisWeekEnd: Date;
  lastWeekStart: Date;
  lastWeekEnd: Date;
} {
  const now = new Date();

  // Find the most recent Monday (start of current week)
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - daysToMonday);
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
  thisWeekEnd.setHours(23, 59, 59, 999);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);

  const lastWeekEnd = new Date(thisWeekEnd);
  lastWeekEnd.setDate(thisWeekEnd.getDate() - 7);

  return { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd };
}

/**
 * Format a date as a readable string
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Calculate trend direction based on current vs previous values
 */
function calculateTrend(
  current: number,
  previous: number
): "up" | "down" | "neutral" {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "neutral";
}

/**
 * Format trend value as a percentage or absolute change
 */
function formatTrendValue(
  current: number,
  previous: number,
  isPercentage = false
): string {
  const diff = current - previous;
  if (diff === 0) return "No change";

  if (isPercentage) {
    const percentChange =
      previous === 0 ? 100 : Math.round((diff / previous) * 100);
    return `${diff > 0 ? "+" : ""}${percentChange}%`;
  }

  return `${diff > 0 ? "+" : ""}${diff}`;
}

/**
 * Fetch weekly metrics for a loan officer
 */
export async function fetchWeeklyLOMetrics(
  loanOfficerId: string,
  organizationId: string
): Promise<LOMetricsQueryResult> {
  try {
    const supabase = createUntypedAdminClient();
    const { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd } =
      getWeekDates();

    // Fetch user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, full_name, email, organization_id")
      .eq("id", loanOfficerId)
      .single();

    if (userError || !user) {
      return { success: false, error: "User not found" };
    }

    // Fetch organization info
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return { success: false, error: "Organization not found" };
    }

    // Parallel fetch all metrics
    const [
      reviewsThisWeekResult,
      reviewsLastWeekResult,
      topReviewResult,
      pendingResponsesResult,
      pendingSurveysResult,
      leaderboardResult,
      surveysCompletedResult,
      totalSurveysSentResult,
      npsScoreResult,
    ] = await Promise.all([
      // Reviews this week
      supabase
        .from("reviews")
        .select("id, rating, created_at")
        .eq("loan_officer_id", loanOfficerId)
        .gte("created_at", thisWeekStart.toISOString())
        .lte("created_at", thisWeekEnd.toISOString()),

      // Reviews last week
      supabase
        .from("reviews")
        .select("id, rating")
        .eq("loan_officer_id", loanOfficerId)
        .gte("created_at", lastWeekStart.toISOString())
        .lte("created_at", lastWeekEnd.toISOString()),

      // Top review this week (highest rated)
      supabase
        .from("reviews")
        .select("id, rating, review_text, customer_name")
        .eq("loan_officer_id", loanOfficerId)
        .gte("created_at", thisWeekStart.toISOString())
        .lte("created_at", thisWeekEnd.toISOString())
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1),

      // Pending review responses
      supabase
        .from("reviews")
        .select("id", { count: "exact" })
        .eq("loan_officer_id", loanOfficerId)
        .is("response_at", null)
        .not("review_text", "is", null),

      // Pending surveys
      supabase
        .from("surveys")
        .select("id", { count: "exact" })
        .eq("loan_officer_id", loanOfficerId)
        .eq("status", "pending"),

      // Leaderboard position
      supabase
        .from("leaderboard_snapshots")
        .select("rank, period_type")
        .eq("loan_officer_id", loanOfficerId)
        .eq("organization_id", organizationId)
        .eq("period_type", "monthly")
        .order("snapshot_date", { ascending: false })
        .limit(2),

      // Surveys completed this week
      supabase
        .from("survey_responses")
        .select("id, overall_rating, nps_score")
        .eq("survey_id", loanOfficerId) // Note: This joins through surveys table
        .gte("submitted_at", thisWeekStart.toISOString())
        .lte("submitted_at", thisWeekEnd.toISOString()),

      // Total surveys sent this week (for response rate)
      supabase
        .from("surveys")
        .select("id", { count: "exact" })
        .eq("loan_officer_id", loanOfficerId)
        .gte("created_at", thisWeekStart.toISOString())
        .lte("created_at", thisWeekEnd.toISOString()),

      // NPS score from user profile
      supabase
        .from("users")
        .select("nps_score")
        .eq("id", loanOfficerId)
        .single(),
    ]);

    // Process reviews this week
    const reviewsThisWeek = reviewsThisWeekResult.data || [];
    const reviewsThisWeekCount = reviewsThisWeek.length;
    const avgRatingThisWeek =
      reviewsThisWeekCount > 0
        ? reviewsThisWeek.reduce(
            (sum, r) => sum + (r.rating as number),
            0
          ) / reviewsThisWeekCount
        : null;

    // Process reviews last week
    const reviewsLastWeek = reviewsLastWeekResult.data || [];
    const reviewsLastWeekCount = reviewsLastWeek.length;
    const avgRatingLastWeek =
      reviewsLastWeekCount > 0
        ? reviewsLastWeek.reduce(
            (sum, r) => sum + (r.rating as number),
            0
          ) / reviewsLastWeekCount
        : null;

    // Calculate trends
    const reviewsTrend = calculateTrend(
      reviewsThisWeekCount,
      reviewsLastWeekCount
    );
    const reviewsTrendValue = formatTrendValue(
      reviewsThisWeekCount,
      reviewsLastWeekCount
    );

    const ratingTrend =
      avgRatingThisWeek !== null && avgRatingLastWeek !== null
        ? calculateTrend(avgRatingThisWeek, avgRatingLastWeek)
        : "neutral";
    const ratingTrendValue =
      avgRatingThisWeek !== null && avgRatingLastWeek !== null
        ? formatTrendValue(avgRatingThisWeek, avgRatingLastWeek, true)
        : "N/A";

    // Process top review
    const topReviewData = topReviewResult.data?.[0];
    const topReview = topReviewData
      ? {
          customerName: (topReviewData.customer_name as string) || "Customer",
          rating: topReviewData.rating as number,
          text: ((topReviewData.review_text as string) || "").slice(0, 200),
          reviewId: topReviewData.id as string,
        }
      : undefined;

    // Process leaderboard
    const leaderboardData = leaderboardResult.data || [];
    const currentRank =
      leaderboardData.length > 0 ? (leaderboardData[0].rank as number) : null;
    const previousRank =
      leaderboardData.length > 1 ? (leaderboardData[1].rank as number) : null;
    const rankChange =
      currentRank !== null && previousRank !== null
        ? previousRank - currentRank
        : null;

    // Get total LOs for leaderboard context
    const { count: totalLOs } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("organization_id", organizationId)
      .eq("role", "loan_officer")
      .eq("is_active", true);

    // Process survey metrics
    const surveysCompleted = surveysCompletedResult.data?.length || 0;
    const totalSurveysSent = totalSurveysSentResult.count || 0;
    const surveyResponseRate =
      totalSurveysSent > 0
        ? Math.round((surveysCompleted / totalSurveysSent) * 100)
        : 0;

    // Calculate response rate (reviews with responses / total reviews)
    const { count: totalReviewsCount } = await supabase
      .from("reviews")
      .select("id", { count: "exact" })
      .eq("loan_officer_id", loanOfficerId);

    const { count: respondedReviewsCount } = await supabase
      .from("reviews")
      .select("id", { count: "exact" })
      .eq("loan_officer_id", loanOfficerId)
      .not("response_at", "is", null);

    const responseRate =
      totalReviewsCount && totalReviewsCount > 0
        ? Math.round(((respondedReviewsCount || 0) / totalReviewsCount) * 100)
        : 0;

    return {
      success: true,
      data: {
        firstName: (user.full_name as string)?.split(" ")[0] || "there",
        organizationName: org.name as string,
        weekStartDate: formatDate(thisWeekStart),
        weekEndDate: formatDate(thisWeekEnd),

        // Review metrics
        reviewsThisWeek: reviewsThisWeekCount,
        reviewsLastWeek: reviewsLastWeekCount,
        reviewsTrend,
        reviewsTrendValue,

        // Rating metrics
        averageRatingThisWeek:
          avgRatingThisWeek !== null ? Math.round(avgRatingThisWeek * 10) / 10 : null,
        averageRatingLastWeek:
          avgRatingLastWeek !== null ? Math.round(avgRatingLastWeek * 10) / 10 : null,
        ratingTrend,
        ratingTrendValue,

        // Response metrics
        responseRate,
        averageResponseTime: "< 24 hours", // Placeholder - would need response time tracking

        // Pending actions
        pendingReviewResponses: pendingResponsesResult.count || 0,
        pendingSurveys: pendingSurveysResult.count || 0,

        // Leaderboard position
        leaderboardRank: currentRank,
        leaderboardRankChange: rankChange,
        totalLoanOfficers: totalLOs || 0,

        // Top review highlight
        topReview,

        // NPS score
        npsScore: (npsScoreResult.data?.nps_score as number | null) || null,
        npsTrend: undefined,

        // Survey metrics
        surveysCompleted,
        surveyResponseRate,
      },
    };
  } catch (error) {
    console.error("Error fetching weekly LO metrics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if there was any activity for the loan officer this week
 */
export async function hasWeeklyActivity(
  loanOfficerId: string
): Promise<boolean> {
  const supabase = createUntypedAdminClient();
  const { thisWeekStart, thisWeekEnd } = getWeekDates();

  const [reviewsResult, responsesResult, surveysResult] = await Promise.all([
    supabase
      .from("reviews")
      .select("id", { count: "exact" })
      .eq("loan_officer_id", loanOfficerId)
      .gte("created_at", thisWeekStart.toISOString())
      .lte("created_at", thisWeekEnd.toISOString()),

    supabase
      .from("survey_responses")
      .select("id", { count: "exact" })
      .gte("submitted_at", thisWeekStart.toISOString())
      .lte("submitted_at", thisWeekEnd.toISOString()),

    supabase
      .from("surveys")
      .select("id", { count: "exact" })
      .eq("loan_officer_id", loanOfficerId)
      .gte("created_at", thisWeekStart.toISOString())
      .lte("created_at", thisWeekEnd.toISOString()),
  ]);

  const totalActivity =
    (reviewsResult.count || 0) +
    (responsesResult.count || 0) +
    (surveysResult.count || 0);

  return totalActivity > 0;
}
