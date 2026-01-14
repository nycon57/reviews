"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/reviews/types";

// Types for manager dashboard
export interface TeamMetrics {
  totalLoanOfficers: number;
  activeLoanOfficers: number;
  totalReviews: number;
  averageRating: number;
  teamNPS: number;
  averageResponseRate: number;
  // Change metrics (vs last period)
  totalReviewsChange: number;
  averageRatingChange: number;
  teamNPSChange: number;
}

export interface LoanOfficerComparison {
  id: string;
  fullName: string;
  email: string;
  photoUrl: string | null;
  branch: string | null;
  region: string | null;
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
  regions: string[];
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

// Get user context for manager actions - requires manager or admin role
async function getManagerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return null;
  }

  // Check if user has manager or admin role
  if (userData.role !== "manager" && userData.role !== "admin") {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
  };
}

// Get team-level metrics for the manager dashboard
export async function getTeamMetrics(): Promise<ActionResult<TeamMetrics>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = await createClient();

  // Get all loan officers for this organization
  const { data: loanOfficers, error: loError } = await supabase
    .from("loan_officers")
    .select("id, is_active, average_rating, total_reviews, nps_score")
    .eq("organization_id", context.organizationId);

  if (loError) {
    console.error("Error fetching loan officers:", loError);
    return { success: false, error: "Failed to fetch team data" };
  }

  const activeLOs = loanOfficers?.filter((lo) => lo.is_active) || [];
  const totalLoanOfficers = loanOfficers?.length || 0;
  const activeLoanOfficers = activeLOs.length;

  // Calculate aggregate metrics
  const totalReviews = loanOfficers?.reduce((sum, lo) => sum + (lo.total_reviews || 0), 0) || 0;
  const avgRatings = activeLOs.filter((lo) => (lo.average_rating || 0) > 0);
  const averageRating = avgRatings.length > 0
    ? avgRatings.reduce((sum, lo) => sum + (lo.average_rating || 0), 0) / avgRatings.length
    : 0;

  // Calculate team NPS from survey responses
  const { data: surveyResponses } = await supabase
    .from("survey_responses")
    .select(`
      nps_score,
      surveys!inner (
        organization_id
      )
    `)
    .not("nps_score", "is", null);

  const filteredResponses = surveyResponses?.filter(
    (r) => {
      const survey = r.surveys as unknown as { organization_id: string };
      return survey.organization_id === context.organizationId;
    }
  ) || [];

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
  const averageResponseRate = totalSurveys > 0 ? Math.round((completedSurveys / totalSurveys) * 100) : 0;

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
  const totalReviewsChange = previousCount > 0
    ? Math.round(((recentCount - previousCount) / previousCount) * 100)
    : recentCount > 0 ? 100 : 0;

  return {
    success: true,
    data: {
      totalLoanOfficers,
      activeLoanOfficers,
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

// Get loan officer comparison data with optional filtering
export async function getLoanOfficerComparison(
  branch?: string,
  region?: string
): Promise<ActionResult<LoanOfficerComparison[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = await createClient();

  // Build query with optional filters
  let query = supabase
    .from("loan_officers")
    .select(`
      id,
      full_name,
      email,
      photo_url,
      branch,
      region,
      total_reviews,
      average_rating,
      nps_score,
      reputation_score,
      is_active
    `)
    .eq("organization_id", context.organizationId)
    .order("reputation_score", { ascending: false });

  if (branch && branch !== "all") {
    query = query.eq("branch", branch);
  }

  if (region && region !== "all") {
    query = query.eq("region", region);
  }

  const { data: loanOfficers, error } = await query;

  if (error) {
    console.error("Error fetching loan officers:", error);
    return { success: false, error: "Failed to fetch loan officers" };
  }

  // Get reviews from the last 30 days for each LO
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const loIds = loanOfficers?.map((lo) => lo.id) || [];

  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("loan_officer_id")
    .in("loan_officer_id", loIds)
    .gte("review_date", thirtyDaysAgo.toISOString());

  // Count reviews per LO
  const reviewCounts = new Map<string, number>();
  for (const review of recentReviews || []) {
    const count = reviewCounts.get(review.loan_officer_id) || 0;
    reviewCounts.set(review.loan_officer_id, count + 1);
  }

  // Get survey response rates per LO
  const { data: surveys } = await supabase
    .from("surveys")
    .select("loan_officer_id, status")
    .in("loan_officer_id", loIds);

  const surveyStats = new Map<string, { total: number; completed: number }>();
  for (const survey of surveys || []) {
    const stats = surveyStats.get(survey.loan_officer_id) || { total: 0, completed: 0 };
    stats.total += 1;
    if (survey.status === "completed") {
      stats.completed += 1;
    }
    surveyStats.set(survey.loan_officer_id, stats);
  }

  const comparison: LoanOfficerComparison[] = (loanOfficers || []).map((lo) => {
    const stats = surveyStats.get(lo.id) || { total: 0, completed: 0 };
    const responseRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const rating = lo.average_rating || 0;
    const reviews = lo.total_reviews || 0;
    const nps = lo.nps_score || 0;

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
      id: lo.id,
      fullName: lo.full_name,
      email: lo.email,
      photoUrl: lo.photo_url,
      branch: lo.branch,
      region: lo.region,
      totalReviews: reviews,
      averageRating: rating,
      npsScore: nps,
      responseRate,
      reputationScore: lo.reputation_score || 0,
      isActive: lo.is_active ?? true,
      reviewsThisMonth: reviewCounts.get(lo.id) || 0,
      performanceStatus,
    };
  });

  return { success: true, data: comparison };
}

// Get filter options (unique branches and regions)
export async function getFilterOptions(): Promise<ActionResult<FilterOptions>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = await createClient();

  const { data: loanOfficers, error } = await supabase
    .from("loan_officers")
    .select("branch, region")
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error fetching filter options:", error);
    return { success: false, error: "Failed to fetch filter options" };
  }

  const branches = new Set<string>();
  const regions = new Set<string>();

  for (const lo of loanOfficers || []) {
    if (lo.branch) branches.add(lo.branch);
    if (lo.region) regions.add(lo.region);
  }

  return {
    success: true,
    data: {
      branches: Array.from(branches).sort(),
      regions: Array.from(regions).sort(),
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

  const supabase = await createClient();

  // Determine sort field
  const sortField = metric === "reputation"
    ? "reputation_score"
    : metric === "reviews"
      ? "total_reviews"
      : "average_rating";

  const { data: loanOfficers, error } = await supabase
    .from("loan_officers")
    .select(`
      id,
      full_name,
      photo_url,
      total_reviews,
      average_rating,
      nps_score,
      reputation_score
    `)
    .eq("organization_id", context.organizationId)
    .eq("is_active", true)
    .order(sortField, { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return { success: false, error: "Failed to fetch leaderboard" };
  }

  const leaderboard: LeaderboardEntry[] = (loanOfficers || []).map((lo, index) => ({
    rank: index + 1,
    id: lo.id,
    fullName: lo.full_name,
    photoUrl: lo.photo_url,
    totalReviews: lo.total_reviews || 0,
    averageRating: lo.average_rating || 0,
    npsScore: lo.nps_score || 0,
    reputationScore: lo.reputation_score || 0,
    change: 0, // Would need historical ranking data to calculate
  }));

  return { success: true, data: leaderboard };
}

// Get loan officers needing attention (low performers)
export async function getLowPerformers(): Promise<ActionResult<LoanOfficerComparison[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const comparisonResult = await getLoanOfficerComparison();

  if (!comparisonResult.success || !comparisonResult.data) {
    return comparisonResult;
  }

  // Filter to only show those needing attention or at risk
  const lowPerformers = comparisonResult.data.filter(
    (lo) => lo.performanceStatus === "needs_attention" || lo.performanceStatus === "at_risk"
  );

  return { success: true, data: lowPerformers };
}

// Get team trend data (aggregate monthly averages)
export async function getTeamRatingTrend(
  months: number = 6
): Promise<ActionResult<{ date: string; value: number }[]>> {
  const context = await getManagerContext();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager access required" };
  }

  const supabase = await createClient();

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from("reviews")
    .select("rating, review_date")
    .eq("organization_id", context.organizationId)
    .gte("review_date", startDate.toISOString())
    .order("review_date", { ascending: true });

  if (error) {
    console.error("Error fetching team rating trend:", error);
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

  // Convert to array and fill in missing months
  const trendData: { date: string; value: number }[] = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    const entry = monthlyData.get(monthKey);
    trendData.push({
      date: monthLabel,
      value: entry ? Number((entry.sum / entry.count).toFixed(1)) : 0,
    });
  }

  return { success: true, data: trendData };
}
