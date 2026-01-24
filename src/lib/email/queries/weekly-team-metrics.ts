/**
 * Weekly Team Metrics Query (S082)
 *
 * Fetches all metrics needed for the weekly performance summary email for managers.
 */

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { WeeklySummaryManagerEmailData } from "../types";

interface TeamMetricsQueryResult {
  success: boolean;
  data?: Omit<
    WeeklySummaryManagerEmailData,
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

interface TeamMemberMetrics {
  id: string;
  name: string;
  photoUrl?: string;
  reviewsCount: number;
  averageRating: number | null;
  lastActivityDate: Date | null;
}

/**
 * Fetch weekly metrics for a manager's team
 */
export async function fetchWeeklyTeamMetrics(
  managerId: string,
  organizationId: string
): Promise<TeamMetricsQueryResult> {
  try {
    const supabase = createUntypedAdminClient();
    const { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd } =
      getWeekDates();

    // Fetch manager info
    const { data: manager, error: managerError } = await supabase
      .from("users")
      .select("id, full_name, email, organization_id")
      .eq("id", managerId)
      .single();

    if (managerError || !manager) {
      return { success: false, error: "Manager not found" };
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

    // Fetch team members (loan officers in the organization)
    const { data: teamMembers, error: teamError } = await supabase
      .from("users")
      .select("id, full_name, avatar_url, average_rating, nps_score")
      .eq("organization_id", organizationId)
      .eq("role", "user")
      .eq("is_active", true);

    if (teamError) {
      return { success: false, error: "Failed to fetch team members" };
    }

    const teamMemberIds = (teamMembers || []).map((m) => m.id as string);
    const teamSize = teamMemberIds.length;

    if (teamSize === 0) {
      return {
        success: true,
        data: {
          firstName: (manager.full_name as string)?.split(" ")[0] || "there",
          organizationName: org.name as string,
          weekStartDate: formatDate(thisWeekStart),
          weekEndDate: formatDate(thisWeekEnd),
          teamSize: 0,
          teamReviewsThisWeek: 0,
          teamReviewsLastWeek: 0,
          teamReviewsTrend: "neutral",
          teamReviewsTrendValue: "No team members",
          teamAverageRating: null,
          teamAverageRatingLastWeek: null,
          teamRatingTrend: "neutral",
          teamRatingTrendValue: "N/A",
          teamResponseRate: 0,
          teamAverageResponseTime: "N/A",
          topPerformers: [],
          needsAttention: [],
          pendingApprovals: 0,
          alerts: [],
          teamNpsScore: null,
        },
      };
    }

    // Parallel fetch team-wide metrics
    const [
      reviewsThisWeekResult,
      reviewsLastWeekResult,
      pendingApprovalsResult,
      _leaderboardResult,
    ] = await Promise.all([
      // Team reviews this week
      supabase
        .from("reviews")
        .select("id, rating, loan_officer_id, created_at")
        .in("loan_officer_id", teamMemberIds)
        .gte("created_at", thisWeekStart.toISOString())
        .lte("created_at", thisWeekEnd.toISOString()),

      // Team reviews last week
      supabase
        .from("reviews")
        .select("id, rating, loan_officer_id")
        .in("loan_officer_id", teamMemberIds)
        .gte("created_at", lastWeekStart.toISOString())
        .lte("created_at", lastWeekEnd.toISOString()),

      // Pending approvals
      supabase
        .from("reviews")
        .select("id", { count: "exact" })
        .eq("organization_id", organizationId)
        .eq("status", "pending_approval"),

      // Leaderboard for top performers
      supabase
        .from("leaderboard_snapshots")
        .select("loan_officer_id, rank, reputation_score, average_rating, total_reviews")
        .eq("organization_id", organizationId)
        .eq("period_type", "monthly")
        .order("snapshot_date", { ascending: false })
        .order("rank", { ascending: true })
        .limit(20),
    ]);

    // Process team reviews this week
    const reviewsThisWeek = reviewsThisWeekResult.data || [];
    const teamReviewsThisWeekCount = reviewsThisWeek.length;
    const teamAvgRatingThisWeek =
      teamReviewsThisWeekCount > 0
        ? reviewsThisWeek.reduce(
            (sum, r) => sum + (r.rating as number),
            0
          ) / teamReviewsThisWeekCount
        : null;

    // Process team reviews last week
    const reviewsLastWeek = reviewsLastWeekResult.data || [];
    const teamReviewsLastWeekCount = reviewsLastWeek.length;
    const teamAvgRatingLastWeek =
      teamReviewsLastWeekCount > 0
        ? reviewsLastWeek.reduce(
            (sum, r) => sum + (r.rating as number),
            0
          ) / teamReviewsLastWeekCount
        : null;

    // Calculate trends
    const teamReviewsTrend = calculateTrend(
      teamReviewsThisWeekCount,
      teamReviewsLastWeekCount
    );
    const teamReviewsTrendValue = formatTrendValue(
      teamReviewsThisWeekCount,
      teamReviewsLastWeekCount
    );

    const teamRatingTrend =
      teamAvgRatingThisWeek !== null && teamAvgRatingLastWeek !== null
        ? calculateTrend(teamAvgRatingThisWeek, teamAvgRatingLastWeek)
        : "neutral";
    const teamRatingTrendValue =
      teamAvgRatingThisWeek !== null && teamAvgRatingLastWeek !== null
        ? formatTrendValue(teamAvgRatingThisWeek, teamAvgRatingLastWeek, true)
        : "N/A";

    // Batch fetch last activity dates for all team members (avoid N+1 query)
    const { data: lastActivities } = await supabase
      .from("reviews")
      .select("loan_officer_id, created_at")
      .in("loan_officer_id", teamMemberIds)
      .order("created_at", { ascending: false });

    // Build a map of loan_officer_id -> last activity date (first occurrence is most recent)
    const lastActivityMap = new Map<string, Date>();
    for (const activity of lastActivities || []) {
      const loId = activity.loan_officer_id as string;
      if (!lastActivityMap.has(loId)) {
        lastActivityMap.set(loId, new Date(activity.created_at as string));
      }
    }

    // Calculate per-member metrics for top/bottom performers
    const memberMetrics: TeamMemberMetrics[] = [];

    for (const member of teamMembers || []) {
      const memberReviewsThisWeek = reviewsThisWeek.filter(
        (r) => r.loan_officer_id === member.id
      );
      const memberAvgRating =
        memberReviewsThisWeek.length > 0
          ? memberReviewsThisWeek.reduce(
              (sum, r) => sum + (r.rating as number),
              0
            ) / memberReviewsThisWeek.length
          : (member.average_rating as number | null);

      const lastActivityDate = lastActivityMap.get(member.id as string) || null;

      memberMetrics.push({
        id: member.id as string,
        name: member.full_name as string,
        photoUrl: member.avatar_url as string | undefined,
        reviewsCount: memberReviewsThisWeek.length,
        averageRating: memberAvgRating,
        lastActivityDate,
      });
    }

    // Sort for top performers (by reviews count, then rating)
    const sortedByPerformance = [...memberMetrics].sort((a, b) => {
      if (b.reviewsCount !== a.reviewsCount) {
        return b.reviewsCount - a.reviewsCount;
      }
      return (b.averageRating || 0) - (a.averageRating || 0);
    });

    const topPerformers = sortedByPerformance.slice(0, 3).map((m, i) => ({
      name: m.name,
      photoUrl: m.photoUrl,
      reviewsCount: m.reviewsCount,
      averageRating: m.averageRating || 0,
      rank: i + 1,
    }));

    // Sort for needs attention (by days without activity)
    const now = new Date();
    const needsAttention = memberMetrics
      .map((m) => {
        const daysWithoutActivity = m.lastActivityDate
          ? Math.floor(
              (now.getTime() - m.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          : 999;
        return {
          name: m.name,
          photoUrl: m.photoUrl,
          reviewsCount: m.reviewsCount,
          averageRating: m.averageRating,
          daysWithoutActivity,
        };
      })
      .filter((m) => m.daysWithoutActivity > 7 || m.reviewsCount === 0)
      .sort((a, b) => b.daysWithoutActivity - a.daysWithoutActivity)
      .slice(0, 3);

    // Generate alerts
    const alerts: WeeklySummaryManagerEmailData["alerts"] = [];

    // Alert for low ratings
    const lowRatingReviews = reviewsThisWeek.filter(
      (r) => (r.rating as number) <= 2
    );
    if (lowRatingReviews.length > 0) {
      alerts.push({
        type: "negative_review",
        message: `${lowRatingReviews.length} negative review(s) received this week`,
      });
    }

    // Alert for high pending approvals
    const pendingApprovals = pendingApprovalsResult.count || 0;
    if (pendingApprovals > 5) {
      alerts.push({
        type: "high_pending",
        message: `${pendingApprovals} reviews pending approval`,
      });
    }

    // Alert for inactive LOs
    const inactiveLOs = memberMetrics.filter((m) => {
      const daysInactive = m.lastActivityDate
        ? Math.floor(
            (now.getTime() - m.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999;
      return daysInactive > 14;
    });

    if (inactiveLOs.length > 0) {
      alerts.push({
        type: "no_activity",
        message: `${inactiveLOs.length} team member(s) inactive for 14+ days`,
      });
    }

    // Calculate team response rate
    const { count: totalReviews } = await supabase
      .from("reviews")
      .select("id", { count: "exact" })
      .in("loan_officer_id", teamMemberIds);

    const { count: respondedReviews } = await supabase
      .from("reviews")
      .select("id", { count: "exact" })
      .in("loan_officer_id", teamMemberIds)
      .not("response_at", "is", null);

    const teamResponseRate =
      totalReviews && totalReviews > 0
        ? Math.round(((respondedReviews || 0) / totalReviews) * 100)
        : 0;

    // Calculate team NPS
    const teamNpsScores = (teamMembers || [])
      .map((m) => m.nps_score as number | null)
      .filter((s): s is number => s !== null);

    const teamNpsScore =
      teamNpsScores.length > 0
        ? Math.round(
            teamNpsScores.reduce((sum, s) => sum + s, 0) / teamNpsScores.length
          )
        : null;

    return {
      success: true,
      data: {
        firstName: (manager.full_name as string)?.split(" ")[0] || "there",
        organizationName: org.name as string,
        weekStartDate: formatDate(thisWeekStart),
        weekEndDate: formatDate(thisWeekEnd),

        // Team size
        teamSize,

        // Team review metrics
        teamReviewsThisWeek: teamReviewsThisWeekCount,
        teamReviewsLastWeek: teamReviewsLastWeekCount,
        teamReviewsTrend,
        teamReviewsTrendValue,

        // Team rating metrics
        teamAverageRating:
          teamAvgRatingThisWeek !== null
            ? Math.round(teamAvgRatingThisWeek * 10) / 10
            : null,
        teamAverageRatingLastWeek:
          teamAvgRatingLastWeek !== null
            ? Math.round(teamAvgRatingLastWeek * 10) / 10
            : null,
        teamRatingTrend,
        teamRatingTrendValue,

        // Team response metrics
        teamResponseRate,
        teamAverageResponseTime: "< 24 hours", // Placeholder

        // Performers
        topPerformers,
        needsAttention,

        // Pending approvals
        pendingApprovals,

        // Alerts
        alerts,

        // Team NPS
        teamNpsScore,
      },
    };
  } catch (error) {
    console.error("Error fetching weekly team metrics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if there was any team activity this week
 */
export async function hasTeamWeeklyActivity(
  organizationId: string
): Promise<boolean> {
  const supabase = createUntypedAdminClient();
  const { thisWeekStart, thisWeekEnd } = getWeekDates();

  // Get team member IDs
  const { data: teamMembers } = await supabase
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("role", "user")
    .eq("is_active", true);

  const teamMemberIds = (teamMembers || []).map((m) => m.id as string);

  if (teamMemberIds.length === 0) return false;

  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact" })
    .in("loan_officer_id", teamMemberIds)
    .gte("created_at", thisWeekStart.toISOString())
    .lte("created_at", thisWeekEnd.toISOString());

  return (count || 0) > 0;
}
