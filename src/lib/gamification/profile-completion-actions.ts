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

// Get user context
async function getUserContext() {
  const user = await unifiedGetUser();

  if (!user) return null;

  const supabase = createUntypedAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData) return null;

  // The user's id IS their loan officer id in this unified table
  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
    loanOfficerId: userData.id,
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

  // Get user profile data
  const { data: userData, error: userError } = await supabase
    .from("users")
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

  if (userError || !userData) {
    return { success: false, error: "User not found" };
  }

  // Check for social connections (table may not exist yet)
  // Using type assertion since social_connections may not be in types
  let hasSocialConnection = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: socialConnections } = await (supabase as any)
      .from("social_connections")
      .select("id")
      .eq("organization_id", userData.organization_id)
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
    .eq("user_id", targetLoId)
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
      .eq("organization_id", userData.organization_id)
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
    .eq("user_id", targetLoId);

  const totalSent =
    surveys?.filter((s) =>
      s.status && ["sent", "opened", "completed", "expired"].includes(s.status)
    ).length || 0;
  const completed = surveys?.filter((s) => s.status === "completed").length || 0;
  const responseRate = totalSent > 0 ? Math.round((completed / totalSent) * 100) : 0;

  // Build completion status map
  const completionMap: Record<string, boolean> = {
    photo_url: !!userData.photo_url,
    full_name: !!userData.full_name,
    email: !!userData.email,
    phone: !!userData.phone,
    title: !!userData.title,
    bio: !!userData.bio && userData.bio.length >= 50,
    branch: !!userData.branch,
    region: !!userData.region,
    address: hasJsonContent(userData.address),
    nmls_id: !!userData.nmls_id,
    linkedin_url: !!userData.linkedin_url,
    zillow_profile_url: !!userData.zillow_profile_url,
    google_place_id: !!userData.google_place_id,
    has_social_connection: hasSocialConnection,
    has_reviews: (userData.total_reviews || 0) >= 5,
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
    userData.total_reviews || 0,
    userData.average_rating || 0,
    responseRate
  );

  // Get rank among all users in organization (single query, no N+1)
  const { data: allUsers } = await supabase
    .from("users")
    .select(`
      id,
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
    .eq("organization_id", userData.organization_id)
    .eq("is_active", true);

  // Calculate rankings based on profile completion (in-memory scoring)
  let rank: number | null = null;
  if (allUsers && allUsers.length > 0) {
    const allScores = allUsers.map((user) => {
      if (user.id === targetLoId) {
        return { id: user.id, score: earnedPoints };
      }
      // Inline scoring using already-fetched data
      let score = 0;
      if (user.photo_url) score += 50;
      if (user.full_name) score += 25;
      if (user.email) score += 25;
      if (user.phone) score += 25;
      if (user.title) score += 25;
      if (user.bio && user.bio.length >= 50) score += 75;
      if (user.branch) score += 25;
      if (user.region) score += 25;
      if (hasJsonContent(user.address)) score += 25;
      if (user.nmls_id) score += 50;
      if (user.linkedin_url) score += 50;
      if (user.zillow_profile_url) score += 100;
      if (user.google_place_id) score += 100;
      return { id: user.id, score };
    });

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

  // Get all active users (no duplicate columns)
  const { data: users, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      photo_url,
      branch,
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
    console.error("Error fetching users:", error);
    return { success: false, error: "Failed to fetch users" };
  }

  const userIds = (users || []).map((u) => u.id);

  // Batch-fetch survey response rates for all users
  let allSurveys: { user_id: string; status: string }[] | null = [];
  let allTestimonials: { user_id: string }[] | null = [];

  if (userIds.length > 0) {
    const { data: surveyData } = await supabase
      .from("surveys")
      .select("user_id, status")
      .in("user_id", userIds);
    allSurveys = surveyData;

    // Batch-fetch testimonial counts
    const { data: testimonialData } = await supabase
      .from("testimonials")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "approved");
    allTestimonials = testimonialData;
  }

  // Build lookup maps
  const surveysByUser = new Map<string, Array<{ status: string }>>();
  for (const s of allSurveys || []) {
    const list = surveysByUser.get(s.user_id) || [];
    list.push(s);
    surveysByUser.set(s.user_id, list);
  }

  const testimonialUsers = new Set(
    (allTestimonials || []).map((t) => t.user_id)
  );

  // Calculate scores for each user
  const entries: ProfileCompletionLeaderboardEntry[] = (users || []).map(
    (user) => {
      let earnedPoints = 0;
      let completedSections = 0;

      // Basic info fields (150 pts max)
      if (user.photo_url) earnedPoints += 50;
      if (user.full_name) earnedPoints += 25;
      if (user.email) earnedPoints += 25;
      if (user.phone) earnedPoints += 25;
      if (user.title) earnedPoints += 25;

      // Professional details (200 pts max)
      if (user.bio && user.bio.length >= 50) earnedPoints += 75;
      if (user.nmls_id) earnedPoints += 50;
      if (user.branch) earnedPoints += 25;
      if (user.region) earnedPoints += 25;
      if (hasJsonContent(user.address)) earnedPoints += 25;

      // External connections (300 pts max) — includes has_social_connection
      if (user.google_place_id) earnedPoints += 100;
      if (user.zillow_profile_url) earnedPoints += 100;
      if (user.linkedin_url) earnedPoints += 50;
      // has_social_connection (+50) — skipped in lightweight query (would need social_connections table)

      // Social presence fields (200 pts max)
      const hasReviews = (user.total_reviews || 0) >= 5;
      const hasTestimonials = testimonialUsers.has(user.id);
      if (hasReviews) earnedPoints += 75;
      if (hasTestimonials) earnedPoints += 50;
      // has_published_posts (+50) — skipped (would need social_posts table)

      // Survey response rate
      const userSurveys = surveysByUser.get(user.id) || [];
      const totalSent = userSurveys.filter((s) =>
        s.status && ["sent", "opened", "completed", "expired"].includes(s.status)
      ).length;
      const completedSurveys = userSurveys.filter((s) => s.status === "completed").length;
      const responseRate = totalSent > 0 ? Math.round((completedSurveys / totalSent) * 100) : 0;
      if (responseRate >= 50) earnedPoints += 25;

      const percentage = Math.round((earnedPoints / MAX_PROFILE_POINTS) * 100);

      // Calculate section completion
      const basicInfoComplete = user.photo_url && user.full_name && user.email && user.phone && user.title;
      const professionalComplete = user.bio && user.nmls_id && user.branch && user.region;
      const externalComplete = user.google_place_id && user.zillow_profile_url && user.linkedin_url;
      const socialPresenceComplete = hasReviews && hasTestimonials && responseRate >= 50;

      if (basicInfoComplete) completedSections++;
      if (professionalComplete) completedSections++;
      if (externalComplete) completedSections++;
      if (socialPresenceComplete) completedSections++;

      const searchRankScore = calculateSearchRankScore(
        percentage,
        user.total_reviews || 0,
        user.average_rating || 0,
        responseRate
      );

      return {
        rank: 0, // Will be set after sorting
        id: user.id,
        fullName: user.full_name,
        photoUrl: user.photo_url,
        branch: user.branch,
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
