"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/reviews/types";
import {
  mapReviewSourceCounts,
  type ReviewsBySourceEntry,
  type ReviewsBySourceOptions,
} from "./source-distribution";

// Types for manager dashboard
export interface TeamMetrics {
  totalMembers: number;
  activeMembers: number;
  totalReviews: number;
  averageRating: number;
  teamNPS: number;
  averageResponseRate: number;
  // Change metrics (vs last period)
  totalReviewsChange: number;
  averageRatingChange: number;
  teamNPSChange: number;
}

export interface UserComparison {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  branch: string | null;
  totalReviews: number;
  averageRating: number;
  npsScore: number;
  responseRate: number;
  reputationScore: number;
  isActive: boolean;
  reviewsThisMonth: number;
  performanceStatus: "excellent" | "good" | "needs_attention" | "at_risk";
}

export interface FilterOptions {
  branches: string[];
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  fullName: string;
  photoUrl: string | null;
  totalReviews: number;
  averageRating: number;
  npsScore: number;
  reputationScore: number;
  change: number; // rank change from previous period
}

// Get user context — requires authenticated user with an organization
async function getEnterpriseContext() {
  const user = await unifiedGetUser();

  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, branch_id, role")
    .eq("id", user.id)
    .single();

  if (!userData || !userData.organization_id) {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    branchId: userData.branch_id as string | null,
    role: userData.role,
  };
}

/** Get user IDs belonging to the manager's branch */
async function getBranchUserIds(
  supabase: ReturnType<typeof createAdminClient>,
  branchId: string
): Promise<string[]> {
  const { data } = await supabase.from("users").select("id").eq("branch_id", branchId);

  return (data || []).map((u) => u.id);
}

// Get user context for manager actions - requires manager or admin role
async function getManagerContext() {
  const ctx = await getEnterpriseContext();
  if (!ctx) return null;

  if (ctx.role !== "manager" && ctx.role !== "admin") {
    return null;
  }

  return ctx;
}

// Get team-level metrics for the manager dashboard
export async function getTeamMetrics(): Promise<ActionResult<TeamMetrics>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = createAdminClient();

  // Get all team members for this organization
  const { data: teamMembers, error: teamError } = await supabase
    .from("users")
    .select("id, is_active, average_rating, total_reviews, nps_score")
    .eq("organization_id", context.organizationId);

  if (teamError) {
    return { success: false, error: "Failed to fetch team data" };
  }

  const activeMembers = teamMembers?.filter((m) => m.is_active) || [];
  const totalMemberCount = teamMembers?.length || 0;
  const activeMemberCount = activeMembers.length;

  // Calculate aggregate metrics
  const totalReviews = teamMembers?.reduce((sum, m) => sum + (m.total_reviews || 0), 0) || 0;
  const avgRatings = activeMembers.filter((m) => (m.average_rating || 0) > 0);
  const averageRating =
    avgRatings.length > 0
      ? avgRatings.reduce((sum, m) => sum + (m.average_rating || 0), 0) / avgRatings.length
      : 0;

  // Calculate team NPS from survey responses (DB-level org filter)
  const { data: surveyResponses } = await supabase
    .from("survey_responses")
    .select(
      `
      nps_score,
      surveys!inner (
        organization_id
      )
    `
    )
    .eq("surveys.organization_id", context.organizationId)
    .not("nps_score", "is", null);

  const filteredResponses = surveyResponses || [];

  let teamNPS = 0;
  if (filteredResponses.length > 0) {
    const promoters = filteredResponses.filter((r) => (r.nps_score || 0) >= 9).length;
    const detractors = filteredResponses.filter((r) => (r.nps_score || 0) <= 6).length;
    teamNPS = Math.round(((promoters - detractors) / filteredResponses.length) * 100);
  }

  // Calculate average response rate
  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, status")
    .eq("organization_id", context.organizationId);

  const totalSurveys = surveys?.length || 0;
  const completedSurveys = surveys?.filter((s) => s.status === "completed").length || 0;
  const averageResponseRate =
    totalSurveys > 0 ? Math.round((completedSurveys / totalSurveys) * 100) : 0;

  // Calculate change metrics (compare to 30 days ago)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("id")
    .eq("organization_id", context.organizationId)
    .gte("review_date", thirtyDaysAgo.toISOString());

  const { data: previousReviews } = await supabase
    .from("reviews")
    .select("id")
    .eq("organization_id", context.organizationId)
    .gte("review_date", sixtyDaysAgo.toISOString())
    .lt("review_date", thirtyDaysAgo.toISOString());

  const recentCount = recentReviews?.length || 0;
  const previousCount = previousReviews?.length || 0;
  const totalReviewsChange =
    previousCount > 0
      ? Math.round(((recentCount - previousCount) / previousCount) * 100)
      : recentCount > 0
        ? 100
        : 0;

  return {
    success: true,
    data: {
      totalMembers: totalMemberCount,
      activeMembers: activeMemberCount,
      totalReviews,
      averageRating: Number(averageRating.toFixed(2)),
      teamNPS,
      averageResponseRate,
      totalReviewsChange,
      averageRatingChange: 0,
      teamNPSChange: 0,
    },
  };
}

export async function getReviewsBySource(
  options: ReviewsBySourceOptions = {}
): Promise<ActionResult<ReviewsBySourceEntry[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = createAdminClient();

  const args: {
    org_id: string;
    start_date?: string;
    end_date?: string;
  } = {
    org_id: context.organizationId,
  };

  if (options.startDate) {
    args.start_date = options.startDate;
  }

  if (options.endDate) {
    args.end_date = options.endDate;
  }

  const { data, error } = await supabase.rpc("count_reviews_by_source", args);

  if (error) {
    console.error("Error fetching reviews by source:", error);
    return { success: false, error: "Failed to fetch review source data" };
  }

  return {
    success: true,
    data: mapReviewSourceCounts(data || []),
  };
}

// Get user comparison data with optional filtering
export async function getUserComparison(branch?: string): Promise<ActionResult<UserComparison[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = createAdminClient();

  // Build query with optional filters
  let query = supabase
    .from("users")
    .select(
      `
      id,
      full_name,
      email,
      photo_url,
      branch,
      total_reviews,
      average_rating,
      nps_score,
      reputation_score,
      is_active
    `
    )
    .eq("organization_id", context.organizationId)
    .order("reputation_score", { ascending: false });

  if (branch && branch !== "all") {
    query = query.eq("branch", branch);
  }

  const { data: users, error } = await query;

  if (error) {
    return { success: false, error: "Failed to fetch users" };
  }

  // Get reviews from the last 30 days for each user
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const userIds = users?.map((u) => u.id) || [];

  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("user_id")
    .in("user_id", userIds)
    .gte("review_date", thirtyDaysAgo.toISOString());

  // Count reviews per user
  const reviewCounts = new Map<string, number>();
  for (const review of recentReviews || []) {
    if (!review.user_id) continue;
    const count = reviewCounts.get(review.user_id) || 0;
    reviewCounts.set(review.user_id, count + 1);
  }

  // Get survey response rates per user
  const { data: surveys } = await supabase
    .from("surveys")
    .select("user_id, status")
    .in("user_id", userIds);

  const surveyStats = new Map<string, { total: number; completed: number }>();
  for (const survey of surveys || []) {
    if (!survey.user_id) continue;
    const stats = surveyStats.get(survey.user_id) || { total: 0, completed: 0 };
    stats.total += 1;
    if (survey.status === "completed") {
      stats.completed += 1;
    }
    surveyStats.set(survey.user_id, stats);
  }

  const comparison: UserComparison[] = (users || []).map((u) => {
    const stats = surveyStats.get(u.id) || { total: 0, completed: 0 };
    const responseRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const rating = u.average_rating || 0;
    const reviews = u.total_reviews || 0;
    const nps = u.nps_score || 0;

    // Determine performance status
    let performanceStatus: "excellent" | "good" | "needs_attention" | "at_risk" = "good";
    if (rating >= 4.5 && reviews >= 10 && nps >= 50) {
      performanceStatus = "excellent";
    } else if (rating < 3.5 || nps < 0) {
      performanceStatus = "at_risk";
    } else if (rating < 4.0 || nps < 30 || reviews < 5) {
      performanceStatus = "needs_attention";
    }

    return {
      id: u.id,
      fullName: u.full_name || "Unknown",
      email: u.email,
      photoUrl: u.photo_url,
      branch: u.branch,
      totalReviews: reviews,
      averageRating: rating,
      npsScore: nps,
      responseRate,
      reputationScore: u.reputation_score || 0,
      isActive: u.is_active ?? true,
      reviewsThisMonth: reviewCounts.get(u.id) || 0,
      performanceStatus,
    };
  });

  return { success: true, data: comparison };
}

// Get filter options (unique branches) — manager only
export async function getFilterOptions(): Promise<ActionResult<FilterOptions>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  return fetchFilterOptions(context.organizationId);
}

// Get filter options — any enterprise user (used by leaderboard)
export async function getEnterpriseFilterOptions(): Promise<ActionResult<FilterOptions>> {
  const context = await getEnterpriseContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  return fetchFilterOptions(context.organizationId);
}

async function fetchFilterOptions(organizationId: string): Promise<ActionResult<FilterOptions>> {
  const supabase = createAdminClient();

  const { data: userList, error } = await supabase
    .from("users")
    .select("branch")
    .eq("organization_id", organizationId);

  if (error) {
    return { success: false, error: "Failed to fetch filter options" };
  }

  const branches = new Set<string>();

  for (const u of userList || []) {
    if (u.branch) branches.add(u.branch);
  }

  return {
    success: true,
    data: {
      branches: Array.from(branches).sort(),
    },
  };
}

// Get leaderboard data
export async function getLeaderboard(
  limit: number = 10,
  metric: "reputation" | "reviews" | "rating" = "reputation"
): Promise<ActionResult<LeaderboardEntry[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = createAdminClient();

  // Determine sort field
  const sortField =
    metric === "reputation"
      ? "reputation_score"
      : metric === "reviews"
        ? "total_reviews"
        : "average_rating";

  const { data: leaderboardUsers, error } = await supabase
    .from("users")
    .select(
      `
      id,
      full_name,
      photo_url,
      total_reviews,
      average_rating,
      nps_score,
      reputation_score
    `
    )
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order(sortField, { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: "Failed to fetch leaderboard" };
  }

  const leaderboard: LeaderboardEntry[] = (leaderboardUsers || []).map((u, index) => ({
    rank: index + 1,
    id: u.id,
    fullName: u.full_name || "Unknown",
    photoUrl: u.photo_url,
    totalReviews: u.total_reviews || 0,
    averageRating: u.average_rating || 0,
    npsScore: u.nps_score || 0,
    reputationScore: u.reputation_score || 0,
    change: 0, // Would need historical ranking data to calculate
  }));

  return { success: true, data: leaderboard };
}

// Get users needing attention (low performers)
export async function getLowPerformers(): Promise<ActionResult<UserComparison[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const comparisonResult = await getUserComparison();

  if (!comparisonResult.success || !comparisonResult.data) {
    return comparisonResult;
  }

  // Filter to only show those needing attention or at risk
  const lowPerformers = comparisonResult.data.filter(
    (u) => u.performanceStatus === "needs_attention" || u.performanceStatus === "at_risk"
  );

  return { success: true, data: lowPerformers };
}

// Get team NPS trend data (aggregate monthly NPS scores)
export async function getTeamNPSTrend(
  months: number = 6
): Promise<ActionResult<{ date: string; value: number }[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = createAdminClient();

  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - months);

  // Fetch NPS responses, filtering by branch if manager has one
  let surveyQuery = supabase
    .from("survey_responses")
    .select(
      `
      nps_score,
      submitted_at,
      surveys!inner (
        organization_id,
        user_id
      )
    `
    )
    .eq("surveys.organization_id", context.organizationId)
    .not("nps_score", "is", null)
    .gte("submitted_at", startDate.toISOString());

  if (context.branchId) {
    const branchUserIds = await getBranchUserIds(supabase, context.branchId);
    if (branchUserIds.length > 0) {
      surveyQuery = surveyQuery.in("surveys.user_id", branchUserIds);
    }
  }

  const { data: surveyResponses, error } = await surveyQuery;

  if (error) {
    return { success: false, error: "Failed to fetch team NPS trend" };
  }

  const filteredResponses = surveyResponses || [];

  // Group by month and calculate NPS
  const monthlyData = new Map<string, { promoters: number; detractors: number; total: number }>();

  for (const response of filteredResponses) {
    if (!response.submitted_at) continue;

    const date = new Date(response.submitted_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { promoters: 0, detractors: 0, total: 0 });
    }

    const entry = monthlyData.get(monthKey)!;
    entry.total += 1;

    const npsScore = response.nps_score || 0;
    if (npsScore >= 9) {
      entry.promoters += 1;
    } else if (npsScore <= 6) {
      entry.detractors += 1;
    }
  }

  // Convert to array and fill in missing months
  const trendData: { date: string; value: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const entry = monthlyData.get(monthKey);
    let nps = 0;
    if (entry && entry.total > 0) {
      nps = Math.round(((entry.promoters - entry.detractors) / entry.total) * 100);
    }

    trendData.push({
      date: monthLabel,
      value: nps,
    });
  }

  return { success: true, data: trendData };
}

// Get team trend data (aggregate monthly averages)
export async function getTeamRatingTrend(
  months: number = 6
): Promise<ActionResult<{ date: string; value: number }[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = createAdminClient();

  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - months);

  // Filter by branch if manager has one, otherwise fall back to org
  let query = supabase
    .from("reviews")
    .select("rating, review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString())
    .order("review_date", { ascending: true });

  if (context.branchId) {
    const branchUserIds = await getBranchUserIds(supabase, context.branchId);
    if (branchUserIds.length > 0) {
      query = query.in("user_id", branchUserIds);
    }
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: "Failed to fetch team rating trend" };
  }

  // Group by month and calculate averages
  const monthlyData = new Map<string, { sum: number; count: number }>();

  for (const review of data || []) {
    const date = new Date(review.review_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { sum: 0, count: 0 });
    }

    const entry = monthlyData.get(monthKey)!;
    entry.sum += review.rating;
    entry.count += 1;
  }

  // Build cumulative running average over time
  const trendData: { date: string; value: number }[] = [];
  let cumulativeSum = 0;
  let cumulativeCount = 0;
  let hasStarted = false;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const entry = monthlyData.get(monthKey);
    if (entry) {
      cumulativeSum += entry.sum;
      cumulativeCount += entry.count;
      hasStarted = true;
    }

    // Only include data points from the first month with reviews onward
    if (hasStarted) {
      trendData.push({
        date: monthLabel,
        value: Number((cumulativeSum / cumulativeCount).toFixed(1)),
      });
    }
  }

  return { success: true, data: trendData };
}

// Get team review volume trend (filtered by manager's branch)
export async function getTeamReviewVolumeTrend(
  months: number = 6
): Promise<ActionResult<{ date: string; value: number }[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = createAdminClient();

  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - months);

  let query = supabase
    .from("reviews")
    .select("review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString());

  if (context.branchId) {
    const branchUserIds = await getBranchUserIds(supabase, context.branchId);
    if (branchUserIds.length > 0) {
      query = query.in("user_id", branchUserIds);
    }
  }

  const { data, error } = await query;
  if (error) {
    return { success: false, error: "Failed to fetch team review volume" };
  }

  // Group by month
  const monthCounts: Record<string, number> = {};
  for (const row of data || []) {
    if (!row.review_date) continue;
    const date = new Date(row.review_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
  }

  const trendData: { date: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    trendData.push({
      date: monthLabel,
      value: monthCounts[monthKey] || 0,
    });
  }

  return { success: true, data: trendData };
}
