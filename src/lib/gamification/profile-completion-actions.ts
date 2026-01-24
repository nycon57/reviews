"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/reviews/types";
import {
  PROFILE_SECTIONS,
  PROFILE_MILESTONES,
  MAX_PROFILE_POINTS,
  SEARCH_RANK_MAX,
  SEARCH_RANK_WEIGHTS,
  type ProfileCompletionScore,
  type ProfileCompletionLeaderboardEntry,
  type SectionCompletionStatus,
  type FieldCompletionStatus,
  type ProfileCompletionTip,
  type ProfileMilestone,
} from "./profile-completion-types";

// Get user context - parallelized queries for better performance
async function getUserContext() {
  const user = await unifiedGetUser();

  if (!user) return null;

  const supabase = createUntypedAdminClient();
  // Parallelize independent queries
  const [userDataResult, loDataResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, organization_id, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("loan_officers")
      .select("id")
      .eq("user_id", user.id)
      .single(),
  ]);

  const userData = userDataResult.data;
  if (!userData) return null;

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
    loanOfficerId: loDataResult.data?.id || null,
  };
}

// Helper function to check if a JSON field has content
function hasJsonContent(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return false;
}

/**
 * Get comprehensive profile completion score for a loan officer
 */
export async function getProfileCompletionScore(
  loanOfficerId?: string
): Promise<ActionResult<ProfileCompletionScore>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetLoId = loanOfficerId || context.loanOfficerId;
  if (!targetLoId) {
    return { success: false, error: "No loan officer specified" };
  }

  const supabase = createUntypedAdminClient();

  // Get loan officer profile data
  const { data: loData, error: loError } = await supabase
    .from("loan_officers")
    .select(`
      id,
      full_name,
      email,
      phone,
      photo_url,
      title,
      bio,
      branch,
      region,
      address,
      nmls_id,
      linkedin_url,
      zillow_profile_url,
      google_place_id,
      total_reviews,
      average_rating,
      organization_id
    `)
    .eq("id", targetLoId)
    .single();

  if (loError || !loData) {
    return { success: false, error: "Loan officer not found" };
  }

  // Check for social connections (table may not exist yet)
  // Using type assertion since social_connections may not be in types
  let hasSocialConnection = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: socialConnections } = await (supabase as any)
      .from("social_connections")
      .select("id")
      .eq("organization_id", loData.organization_id)
      .eq("is_active", true)
      .limit(1);
    hasSocialConnection = (socialConnections?.length || 0) > 0;
  } catch {
    // Table may not exist, default to false
  }

  // Check for testimonials
  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("id")
    .eq("loan_officer_id", targetLoId)
    .eq("status", "approved")
    .limit(1);

  const hasTestimonials = (testimonials?.length || 0) > 0;

  // Check for social posts (table may not exist yet)
  let hasPublishedPosts = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: socialPosts } = await (supabase as any)
      .from("social_posts")
      .select("id")
      .eq("organization_id", loData.organization_id)
      .eq("status", "published")
      .limit(1);
    hasPublishedPosts = (socialPosts?.length || 0) > 0;
  } catch {
    // Table may not exist, default to false
  }

  // Get survey response rate
  const { data: surveys } = await supabase
    .from("surveys")
    .select("status")
    .eq("loan_officer_id", targetLoId);

  const totalSent =
    surveys?.filter((s) =>
      s.status && ["sent", "opened", "completed", "expired"].includes(s.status)
    ).length || 0;
  const completed = surveys?.filter((s) => s.status === "completed").length || 0;
  const responseRate = totalSent > 0 ? Math.round((completed / totalSent) * 100) : 0;

  // Build completion status map
  const completionMap: Record<string, boolean> = {
    photo_url: !!loData.photo_url,
    full_name: !!loData.full_name,
    email: !!loData.email,
    phone: !!loData.phone,
    title: !!loData.title,
    bio: !!loData.bio && loData.bio.length >= 50,
    branch: !!loData.branch,
    region: !!loData.region,
    address: hasJsonContent(loData.address),
    nmls_id: !!loData.nmls_id,
    linkedin_url: !!loData.linkedin_url,
    zillow_profile_url: !!loData.zillow_profile_url,
    google_place_id: !!loData.google_place_id,
    has_social_connection: hasSocialConnection,
    has_reviews: (loData.total_reviews || 0) >= 5,
    has_testimonials: hasTestimonials,
    has_published_posts: hasPublishedPosts,
    response_rate_50: responseRate >= 50,
  };

  // Calculate section completion
  const sections: SectionCompletionStatus[] = PROFILE_SECTIONS.map((section) => {
    const fields: FieldCompletionStatus[] = section.fields.map((field) => {
      const isCompleted = completionMap[field.id] || false;
      return {
        field,
        completed: isCompleted,
        earnedPoints: isCompleted ? field.points : 0,
      };
    });

    const earnedPoints = fields.reduce((sum, f) => sum + f.earnedPoints, 0);
    const completedFields = fields.filter((f) => f.completed).length;

    return {
      section,
      completed: completedFields === fields.length,
      completedFields,
      totalFields: fields.length,
      earnedPoints,
      maxPoints: section.maxPoints,
      percentage:
        fields.length > 0 ? Math.round((completedFields / fields.length) * 100) : 0,
      fields,
    };
  });

  // Calculate totals
  const earnedPoints = sections.reduce((sum, s) => sum + s.earnedPoints, 0);
  const percentage = Math.round((earnedPoints / MAX_PROFILE_POINTS) * 100);

  // Calculate milestones
  const externalSection = sections.find((s) => s.section.id === "external_connections");
  const allExternalConnected = externalSection?.completed || false;

  const milestones: ProfileMilestone[] = PROFILE_MILESTONES.map((m) => {
    let achieved = false;

    if (m.id === "external_connected") {
      achieved = allExternalConnected;
    } else {
      achieved = percentage >= m.threshold;
    }

    return {
      ...m,
      achieved,
      achievedAt: achieved ? new Date() : undefined,
    };
  });

  // Calculate milestone bonus
  const milestoneBonus = milestones
    .filter((m) => m.achieved)
    .reduce((sum, m) => sum + m.bonusPoints, 0);

  const totalEarnedWithBonus = earnedPoints + milestoneBonus;

  // Calculate search rank score (0-850)
  const searchRankScore = calculateSearchRankScore(
    percentage,
    loData.total_reviews || 0,
    loData.average_rating || 0,
    responseRate
  );

  // Get rank among all loan officers in organization
  const { data: allLoanOfficers } = await supabase
    .from("loan_officers")
    .select("id")
    .eq("organization_id", loData.organization_id)
    .eq("is_active", true);

  // Calculate rankings based on profile completion
  let rank: number | null = null;
  if (allLoanOfficers && allLoanOfficers.length > 0) {
    // For now, use a simple rank calculation
    // In production, you might want to cache this or use a view
    const allScores = await Promise.all(
      allLoanOfficers.map(async (lo) => {
        if (lo.id === targetLoId) {
          return { id: lo.id, score: earnedPoints };
        }
        const result = await getSimpleProfileScore(lo.id);
        return { id: lo.id, score: result };
      })
    );

    allScores.sort((a, b) => b.score - a.score);
    const myPosition = allScores.findIndex((s) => s.id === targetLoId);
    rank = myPosition >= 0 ? myPosition + 1 : null;
  }

  // Generate next actions (prioritized tips)
  const nextActions: ProfileCompletionTip[] = [];
  for (const section of sections) {
    for (const fieldStatus of section.fields) {
      if (!fieldStatus.completed) {
        nextActions.push({
          field: fieldStatus.field,
          priority:
            fieldStatus.field.points >= 75
              ? "high"
              : fieldStatus.field.points >= 50
                ? "medium"
                : "low",
          impact: fieldStatus.field.points,
        });
      }
    }
  }

  // Sort by impact (points) descending
  nextActions.sort((a, b) => b.impact - a.impact);

  return {
    success: true,
    data: {
      totalPoints: MAX_PROFILE_POINTS,
      earnedPoints: totalEarnedWithBonus,
      percentage,
      searchRankScore,
      rank,
      sections,
      nextActions: nextActions.slice(0, 5), // Top 5 recommendations
      milestones,
    },
  };
}

// Helper to get simple profile score for ranking
async function getSimpleProfileScore(loanOfficerId: string): Promise<number> {
  const supabase = createUntypedAdminClient();

  const { data: loData } = await supabase
    .from("loan_officers")
    .select(`
      photo_url,
      full_name,
      email,
      phone,
      title,
      bio,
      branch,
      region,
      address,
      nmls_id,
      linkedin_url,
      zillow_profile_url,
      google_place_id
    `)
    .eq("id", loanOfficerId)
    .single();

  if (!loData) return 0;

  let score = 0;

  // Simple scoring based on field presence
  if (loData.photo_url) score += 50;
  if (loData.full_name) score += 25;
  if (loData.email) score += 25;
  if (loData.phone) score += 25;
  if (loData.title) score += 25;
  if (loData.bio && loData.bio.length >= 50) score += 75;
  if (loData.branch) score += 25;
  if (loData.region) score += 25;
  if (hasJsonContent(loData.address)) score += 25;
  if (loData.nmls_id) score += 50;
  if (loData.linkedin_url) score += 50;
  if (loData.zillow_profile_url) score += 100;
  if (loData.google_place_id) score += 100;

  return score;
}

// Calculate search rank score (0-850)
function calculateSearchRankScore(
  profileCompletionPercent: number,
  reviewCount: number,
  averageRating: number,
  responseRate: number
): number {
  // Normalize each component to 0-100
  const profileScore = profileCompletionPercent;
  const reviewScore = Math.min(reviewCount * 2, 100); // Max at 50 reviews
  const ratingScore = averageRating > 0 ? ((averageRating - 1) / 4) * 100 : 0; // 1-5 scale to 0-100
  const engagementScore = responseRate; // Already 0-100

  // Weighted average
  const weightedScore =
    profileScore * SEARCH_RANK_WEIGHTS.profileCompletion +
    reviewScore * SEARCH_RANK_WEIGHTS.reviewCount +
    ratingScore * SEARCH_RANK_WEIGHTS.averageRating +
    engagementScore * SEARCH_RANK_WEIGHTS.engagementScore;

  // Scale to 0-850
  return Math.round((weightedScore / 100) * SEARCH_RANK_MAX);
}

/**
 * Get profile completion leaderboard
 */
export async function getProfileCompletionLeaderboard(
  limit: number = 10
): Promise<ActionResult<ProfileCompletionLeaderboardEntry[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  // Check if user is manager or admin
  if (context.role !== "manager" && context.role !== "admin") {
    return { success: false, error: "Manager access required" };
  }

  const supabase = createUntypedAdminClient();

  // Get all active loan officers
  const { data: loanOfficers, error } = await supabase
    .from("loan_officers")
    .select(`
      id,
      full_name,
      photo_url,
      branch,
      photo_url,
      full_name,
      email,
      phone,
      title,
      bio,
      region,
      address,
      nmls_id,
      linkedin_url,
      zillow_profile_url,
      google_place_id,
      total_reviews,
      average_rating
    `)
    .eq("organization_id", context.organizationId)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching loan officers:", error);
    return { success: false, error: "Failed to fetch loan officers" };
  }

  // Calculate scores for each loan officer
  const entries: ProfileCompletionLeaderboardEntry[] = (loanOfficers || []).map(
    (lo) => {
      let earnedPoints = 0;
      let completedSections = 0;

      // Calculate points based on field completion
      if (lo.photo_url) earnedPoints += 50;
      if (lo.full_name) earnedPoints += 25;
      if (lo.email) earnedPoints += 25;
      if (lo.phone) earnedPoints += 25;
      if (lo.title) earnedPoints += 25;
      if (lo.bio && lo.bio.length >= 50) earnedPoints += 75;
      if (lo.branch) earnedPoints += 25;
      if (lo.region) earnedPoints += 25;
      if (hasJsonContent(lo.address)) earnedPoints += 25;
      if (lo.nmls_id) earnedPoints += 50;
      if (lo.linkedin_url) earnedPoints += 50;
      if (lo.zillow_profile_url) earnedPoints += 100;
      if (lo.google_place_id) earnedPoints += 100;

      const percentage = Math.round((earnedPoints / MAX_PROFILE_POINTS) * 100);

      // Calculate section completion (simplified)
      const basicInfoComplete = lo.photo_url && lo.full_name && lo.email && lo.phone && lo.title;
      const professionalComplete = lo.bio && lo.nmls_id && lo.branch && lo.region;
      const externalComplete = lo.google_place_id && lo.zillow_profile_url && lo.linkedin_url;

      if (basicInfoComplete) completedSections++;
      if (professionalComplete) completedSections++;
      if (externalComplete) completedSections++;

      const searchRankScore = calculateSearchRankScore(
        percentage,
        lo.total_reviews || 0,
        lo.average_rating || 0,
        50 // Default response rate for leaderboard
      );

      return {
        rank: 0, // Will be set after sorting
        id: lo.id,
        fullName: lo.full_name,
        photoUrl: lo.photo_url,
        branch: lo.branch,
        earnedPoints,
        totalPoints: MAX_PROFILE_POINTS,
        percentage,
        searchRankScore,
        completedSections,
        totalSections: 4,
      };
    }
  );

  // Sort by earned points descending
  entries.sort((a, b) => b.earnedPoints - a.earnedPoints);

  // Assign ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return { success: true, data: entries.slice(0, limit) };
}

/**
 * Get profile completion summary (lightweight version for widgets)
 */
export async function getProfileCompletionSummary(
  loanOfficerId?: string
): Promise<ActionResult<{
  percentage: number;
  earnedPoints: number;
  totalPoints: number;
  searchRankScore: number;
  nextField: ProfileCompletionTip | null;
}>> {
  const result = await getProfileCompletionScore(loanOfficerId);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || "Failed to get profile completion",
    };
  }

  const data = result.data;

  return {
    success: true,
    data: {
      percentage: data.percentage,
      earnedPoints: data.earnedPoints,
      totalPoints: data.totalPoints,
      searchRankScore: data.searchRankScore,
      nextField: data.nextActions[0] || null,
    },
  };
}
