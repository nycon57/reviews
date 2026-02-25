"use server";

/**
 * Member Analytics Actions
 * Fetches analytics data for individual team members
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/reviews/types";

// Member analytics summary type
export interface MemberAnalytics {
  member: {
    id: string;
    slug: string | null;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    joinedAt: string;
  };
  metrics: {
    totalReviews: number;
    averageRating: number;
    npsScore: number | null;
    responseRate: number;
    surveysSent: number;
    surveysCompleted: number;
    recognitionReceived: number;
    recognitionGiven: number;
  };
  trends: {
    reviewsTrend: { date: string; value: number }[];
    ratingTrend: { date: string; value: number }[];
  };
  comparison: {
    teamAverageRating: number;
    teamAverageReviews: number;
    teamAverageNps: number | null;
    ratingDiff: number;
    reviewsDiff: number;
    npsDiff: number | null;
  };
}

// Get user context with organization access check
async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData || !userData.organization_id) {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    role: userData.role as string,
  };
}

/**
 * Get comprehensive analytics for a specific team member
 */
export async function getMemberAnalytics(
  memberId: string
): Promise<ActionResult<MemberAnalytics>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Only managers and admins can view member analytics
  if (context.role === "user" && context.userId !== memberId) {
    return { success: false, error: "Unauthorized - Only managers can view team member analytics" };
  }

  const supabase = createAdminClient();

  // Verify member belongs to same organization
  const { data: memberData, error: memberError } = await supabase
    .from("users")
    .select(`
      id,
      slug,
      full_name,
      email,
      avatar_url,
      role,
      created_at,
      organization_id,
      average_rating,
      total_reviews,
      nps_score
    `)
    .eq("id", memberId)
    .single();

  if (memberError || !memberData) {
    return { success: false, error: "Member not found" };
  }

  if (memberData.organization_id !== context.organizationId) {
    return { success: false, error: "Member not in your organization" };
  }

  // Fetch all data in parallel
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    surveysResult,
    reviewsResult,
    recognitionReceivedResult,
    recognitionGivenResult,
    teamMetricsResult,
  ] = await Promise.all([
    // Survey metrics
    supabase
      .from("surveys")
      .select("id, status")
      .eq("user_id", memberId),

    // Reviews with trend data (last 30 days)
    supabase
      .from("reviews")
      .select("id, rating, created_at")
      .eq("user_id", memberId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true }),

    // Recognition received
    supabase
      .from("recognitions")
      .select("id")
      .eq("to_user_id", memberId),

    // Recognition given
    supabase
      .from("recognitions")
      .select("id")
      .eq("from_user_id", memberId),

    // Team averages for comparison
    supabase
      .from("users")
      .select("average_rating, total_reviews, nps_score")
      .eq("organization_id", context.organizationId)
      .eq("is_active", true),
  ]);

  // Calculate survey metrics
  const surveys = surveysResult.data || [];
  const surveysSent = surveys.length;
  const surveysCompleted = surveys.filter((s) => s.status === "completed").length;
  const responseRate = surveysSent > 0 ? Math.round((surveysCompleted / surveysSent) * 100) : 0;

  // Calculate reviews trend (group by day)
  const reviews = reviewsResult.data || [];
  const reviewsByDay = new Map<string, { count: number; totalRating: number }>();
  reviews.forEach((r) => {
    if (!r.created_at) return;
    const day = r.created_at.split("T")[0];
    const existing = reviewsByDay.get(day) || { count: 0, totalRating: 0 };
    existing.count += 1;
    existing.totalRating += r.rating;
    reviewsByDay.set(day, existing);
  });

  const reviewsTrend: { date: string; value: number }[] = [];
  const ratingTrend: { date: string; value: number }[] = [];
  reviewsByDay.forEach((data, date) => {
    reviewsTrend.push({ date, value: data.count });
    ratingTrend.push({ date, value: data.count > 0 ? data.totalRating / data.count : 0 });
  });

  // Calculate team comparison
  const teamMembers = teamMetricsResult.data || [];
  const teamAverageRating = teamMembers.length > 0
    ? teamMembers.reduce((sum, m) => sum + (m.average_rating || 0), 0) / teamMembers.length
    : 0;
  const teamAverageReviews = teamMembers.length > 0
    ? teamMembers.reduce((sum, m) => sum + (m.total_reviews || 0), 0) / teamMembers.length
    : 0;
  const npsScores = teamMembers.filter((m) => m.nps_score !== null).map((m) => m.nps_score!);
  const teamAverageNps = npsScores.length > 0
    ? npsScores.reduce((sum, n) => sum + n, 0) / npsScores.length
    : null;

  const memberRating = memberData.average_rating || 0;
  const memberReviews = memberData.total_reviews || 0;
  const memberNps = memberData.nps_score;

  const analytics: MemberAnalytics = {
    member: {
      id: memberData.id,
      slug: memberData.slug,
      fullName: memberData.full_name || memberData.email,
      email: memberData.email,
      avatarUrl: memberData.avatar_url,
      role: memberData.role,
      joinedAt: memberData.created_at || new Date().toISOString(),
    },
    metrics: {
      totalReviews: memberReviews,
      averageRating: memberRating,
      npsScore: memberNps,
      responseRate,
      surveysSent,
      surveysCompleted,
      recognitionReceived: recognitionReceivedResult.data?.length || 0,
      recognitionGiven: recognitionGivenResult.data?.length || 0,
    },
    trends: {
      reviewsTrend,
      ratingTrend,
    },
    comparison: {
      teamAverageRating: Math.round(teamAverageRating * 100) / 100,
      teamAverageReviews: Math.round(teamAverageReviews),
      teamAverageNps: teamAverageNps !== null ? Math.round(teamAverageNps) : null,
      ratingDiff: Math.round((memberRating - teamAverageRating) * 100) / 100,
      reviewsDiff: Math.round(memberReviews - teamAverageReviews),
      npsDiff: memberNps !== null && teamAverageNps !== null
        ? Math.round(memberNps - teamAverageNps)
        : null,
    },
  };

  return { success: true, data: analytics };
}
