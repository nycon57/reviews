"use server";

/**
 * Milestone Tracking Service (S081)
 *
 * Handles detection, recording, and notification of user milestones.
 * Integrates with the gamification system and email service.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult } from "@/lib/reviews/types";
import {
  sendFirstReviewMilestoneEmail,
  sendReviewCountMilestoneEmail,
  sendFirst5StarMilestoneEmail,
} from "@/lib/email/send";
import {
  REVIEW_MILESTONES,
  STREAK_MILESTONES,
  VIDEO_MILESTONES,
  PROFILE_MILESTONES,
  NPS_IMPROVEMENT_THRESHOLD,
  RATING_IMPROVEMENT_THRESHOLD,
  getMilestoneKey,
  getNextMilestone,
  getPreviousMilestone,
  type MilestoneType,
  type MilestoneRecord,
  type MilestoneCheckResult,
} from "./types";

const MILESTONE_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://repwell.ai";

// Helper to access milestone tables that may not be in generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(supabase: ReturnType<typeof createAdminClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// Helper to map database milestone record to MilestoneRecord type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMilestoneRecord(m: any): MilestoneRecord {
  return {
    id: m.id,
    userId: m.user_id,
    organizationId: m.organization_id,
    milestoneType: m.milestone_type as MilestoneType,
    milestoneKey: m.milestone_key,
    milestoneValue: m.milestone_value,
    milestoneMetadata: m.milestone_metadata || {},
    achievedAt: new Date(m.achieved_at),
    emailSentAt: m.email_sent_at ? new Date(m.email_sent_at) : null,
    emailStatus: m.email_status || "pending",
    emailMessageId: m.email_message_id,
    socialSharedAt: m.social_shared_at ? new Date(m.social_shared_at) : null,
    socialPlatform: m.social_platform,
  };
}

// Get user context for authenticated requests
async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role, email, full_name")
    .eq("id", user.id)
    .single();

  if (!userData) return null;

  // The user's id IS their loan officer id in this unified table
  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
    email: userData.email,
    fullName: userData.full_name,
    loanOfficerId: userData.id,
  };
}

// =============================================================================
// MILESTONE DETECTION FUNCTIONS
// =============================================================================

/**
 * Check if a milestone has already been achieved
 */
async function hasMilestoneBeenAchieved(
  userId: string,
  milestoneKey: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await fromTable(supabase, "user_milestones")
    .select("id")
    .eq("user_id", userId)
    .eq("milestone_key", milestoneKey)
    .single();

  return !!data;
}

/**
 * Record a new milestone achievement
 */
async function recordMilestone(params: {
  userId: string;
  organizationId: string;
  milestoneType: MilestoneType;
  milestoneKey: string;
  milestoneValue?: number;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await fromTable(supabase, "user_milestones")
    .insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      milestone_type: params.milestoneType,
      milestone_key: params.milestoneKey,
      milestone_value: params.milestoneValue ?? null,
      milestone_metadata: params.metadata ?? {},
      achieved_at: new Date().toISOString(),
      email_status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error recording milestone:", error);
    return null;
  }

  return data.id;
}

/**
 * Check for first review milestone
 */
export async function checkFirstReviewMilestone(
  userId: string,
  organizationId: string,
  loanOfficerId: string
): Promise<MilestoneCheckResult> {
  const milestoneKey = getMilestoneKey("first_review");

  // Check if already achieved
  const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);
  if (alreadyAchieved) {
    return { achieved: false, milestoneKey };
  }

  // Check if user has exactly 1 review (just received first review)
  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("total_reviews")
    .eq("id", loanOfficerId)
    .single();

  if (!userData || userData.total_reviews !== 1) {
    return { achieved: false, milestoneKey };
  }

  // Record the milestone
  const milestoneId = await recordMilestone({
    userId,
    organizationId,
    milestoneType: "first_review",
    milestoneKey,
    milestoneValue: 1,
  });

  return {
    achieved: !!milestoneId,
    milestoneKey,
    milestoneValue: 1,
    metadata: { milestoneId },
  };
}

/**
 * Check for review count milestones (5, 10, 25, 50, 100, 250, 500)
 */
export async function checkReviewCountMilestones(
  userId: string,
  organizationId: string,
  loanOfficerId: string
): Promise<MilestoneCheckResult[]> {
  const results: MilestoneCheckResult[] = [];

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("total_reviews")
    .eq("id", loanOfficerId)
    .single();

  if (!userData) return results;

  const totalReviews = userData.total_reviews || 0;

  // Check each milestone threshold
  for (const milestone of REVIEW_MILESTONES) {
    if (milestone === 1) continue; // Skip 1, handled by first_review

    if (totalReviews >= milestone) {
      const milestoneKey = getMilestoneKey("review_milestone", milestone);
      const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);

      if (!alreadyAchieved) {
        const milestoneId = await recordMilestone({
          userId,
          organizationId,
          milestoneType: "review_milestone",
          milestoneKey,
          milestoneValue: milestone,
          metadata: { totalReviews },
        });

        results.push({
          achieved: !!milestoneId,
          milestoneKey,
          milestoneValue: milestone,
          metadata: { milestoneId, totalReviews },
        });
      }
    }
  }

  return results;
}

/**
 * Check for first 5-star review milestone
 */
export async function checkFirst5StarMilestone(
  userId: string,
  organizationId: string,
  loanOfficerId: string,
  reviewRating: number
): Promise<MilestoneCheckResult> {
  const milestoneKey = getMilestoneKey("first_5_star");

  // Only trigger on 5-star reviews
  if (reviewRating !== 5) {
    return { achieved: false, milestoneKey };
  }

  // Check if already achieved
  const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);
  if (alreadyAchieved) {
    return { achieved: false, milestoneKey };
  }

  // Record the milestone
  const milestoneId = await recordMilestone({
    userId,
    organizationId,
    milestoneType: "first_5_star",
    milestoneKey,
    milestoneValue: 5,
  });

  return {
    achieved: !!milestoneId,
    milestoneKey,
    milestoneValue: 5,
    metadata: { milestoneId },
  };
}

/**
 * Check for rating improvement milestone
 */
export async function checkRatingImprovementMilestone(
  userId: string,
  organizationId: string,
  loanOfficerId: string
): Promise<MilestoneCheckResult> {
  const supabase = createAdminClient();

  // Get current rating
  const { data: userData } = await supabase
    .from("users")
    .select("average_rating")
    .eq("id", loanOfficerId)
    .single();

  if (!userData) {
    return { achieved: false, milestoneKey: "rating_improvement" };
  }

  // Get previous rating from reputation history
  const { data: history } = await fromTable(supabase, "reputation_history")
    .select("breakdown")
    .eq("user_id", loanOfficerId)
    .order("recorded_at", { ascending: false })
    .limit(2);

  if (!history || history.length < 2) {
    return { achieved: false, milestoneKey: "rating_improvement" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previousBreakdown = history[1].breakdown as any;
  const previousRating = previousBreakdown?.averageRating?.rating ?? 0;
  const currentRating = userData.average_rating ?? 0;
  const improvement = currentRating - previousRating;

  if (improvement < RATING_IMPROVEMENT_THRESHOLD) {
    return { achieved: false, milestoneKey: "rating_improvement" };
  }

  // Generate unique key for this improvement period
  const periodKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const milestoneKey = getMilestoneKey("rating_improvement", periodKey);

  const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);
  if (alreadyAchieved) {
    return { achieved: false, milestoneKey };
  }

  const milestoneId = await recordMilestone({
    userId,
    organizationId,
    milestoneType: "rating_improvement",
    milestoneKey,
    metadata: { previousRating, currentRating, improvement },
  });

  return {
    achieved: !!milestoneId,
    milestoneKey,
    metadata: { milestoneId, previousRating, currentRating, improvement },
  };
}

/**
 * Check for NPS improvement milestone
 */
export async function checkNpsImprovementMilestone(
  userId: string,
  organizationId: string,
  loanOfficerId: string
): Promise<MilestoneCheckResult> {
  const supabase = createAdminClient();

  // Get current NPS
  const { data: userData } = await supabase
    .from("users")
    .select("nps_score")
    .eq("id", loanOfficerId)
    .single();

  if (!userData) {
    return { achieved: false, milestoneKey: "nps_improvement" };
  }

  // Get previous NPS from reputation history
  const { data: history } = await fromTable(supabase, "reputation_history")
    .select("breakdown")
    .eq("user_id", loanOfficerId)
    .order("recorded_at", { ascending: false })
    .limit(2);

  if (!history || history.length < 2) {
    return { achieved: false, milestoneKey: "nps_improvement" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previousBreakdown = history[1].breakdown as any;
  const previousNps = previousBreakdown?.nps?.score ?? 0;
  const currentNps = userData.nps_score ?? 0;
  const improvement = currentNps - previousNps;

  if (improvement < NPS_IMPROVEMENT_THRESHOLD) {
    return { achieved: false, milestoneKey: "nps_improvement" };
  }

  // Generate unique key for this improvement period
  const periodKey = new Date().toISOString().slice(0, 7);
  const milestoneKey = getMilestoneKey("nps_improvement", periodKey);

  const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);
  if (alreadyAchieved) {
    return { achieved: false, milestoneKey };
  }

  const milestoneId = await recordMilestone({
    userId,
    organizationId,
    milestoneType: "nps_improvement",
    milestoneKey,
    metadata: { previousNps, currentNps, improvement },
  });

  return {
    achieved: !!milestoneId,
    milestoneKey,
    metadata: { milestoneId, previousNps, currentNps, improvement },
  };
}

/**
 * Check for streak milestones (7, 14, 30, 60, 90, 180, 365 days)
 */
export async function checkStreakMilestones(
  userId: string,
  organizationId: string,
  currentStreak: number,
  streakType: "response" | "review" | "rating" = "response"
): Promise<MilestoneCheckResult[]> {
  const results: MilestoneCheckResult[] = [];

  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak >= milestone) {
      const milestoneKey = getMilestoneKey("streak", `${streakType}_${milestone}`);
      const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);

      if (!alreadyAchieved) {
        const milestoneId = await recordMilestone({
          userId,
          organizationId,
          milestoneType: "streak",
          milestoneKey,
          milestoneValue: milestone,
          metadata: { streakType, currentStreak },
        });

        results.push({
          achieved: !!milestoneId,
          milestoneKey,
          milestoneValue: milestone,
          metadata: { milestoneId, streakType },
        });
      }
    }
  }

  return results;
}

/**
 * Check for leaderboard achievement milestones
 */
export async function checkLeaderboardMilestones(
  userId: string,
  organizationId: string,
  loanOfficerId: string
): Promise<MilestoneCheckResult[]> {
  const results: MilestoneCheckResult[] = [];
  const supabase = createAdminClient();

  // Get current rank
  const { data: userData } = await supabase
    .from("users")
    .select("reputation_score")
    .eq("id", loanOfficerId)
    .single();

  if (!userData) return results;

  // Count how many have higher scores
  const { data: higherRanked } = await supabase
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .gt("reputation_score", userData.reputation_score || 0);

  const currentRank = (higherRanked?.length || 0) + 1;

  // Check #1 milestone
  if (currentRank === 1) {
    const milestoneKey = getMilestoneKey("leaderboard_achievement", "reached_number_1");
    const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);

    if (!alreadyAchieved) {
      const milestoneId = await recordMilestone({
        userId,
        organizationId,
        milestoneType: "leaderboard_achievement",
        milestoneKey,
        milestoneValue: 1,
        metadata: { achievementType: "reached_number_1" },
      });

      results.push({
        achieved: !!milestoneId,
        milestoneKey,
        milestoneValue: 1,
        metadata: { milestoneId, achievementType: "reached_number_1" },
      });
    }
  }

  // Check top 3 milestone
  if (currentRank <= 3) {
    const milestoneKey = getMilestoneKey("leaderboard_achievement", "reached_top_3");
    const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);

    if (!alreadyAchieved) {
      const milestoneId = await recordMilestone({
        userId,
        organizationId,
        milestoneType: "leaderboard_achievement",
        milestoneKey,
        milestoneValue: currentRank,
        metadata: { achievementType: "reached_top_3" },
      });

      results.push({
        achieved: !!milestoneId,
        milestoneKey,
        milestoneValue: currentRank,
        metadata: { milestoneId, achievementType: "reached_top_3" },
      });
    }
  }

  // Check top 10 milestone
  if (currentRank <= 10) {
    const milestoneKey = getMilestoneKey("leaderboard_achievement", "entered_top_10");
    const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);

    if (!alreadyAchieved) {
      const milestoneId = await recordMilestone({
        userId,
        organizationId,
        milestoneType: "leaderboard_achievement",
        milestoneKey,
        milestoneValue: currentRank,
        metadata: { achievementType: "entered_top_10" },
      });

      results.push({
        achieved: !!milestoneId,
        milestoneKey,
        milestoneValue: currentRank,
        metadata: { milestoneId, achievementType: "entered_top_10" },
      });
    }
  }

  return results;
}

/**
 * Check for badge earned milestone (triggered from gamification system)
 */
export async function checkBadgeEarnedMilestone(
  userId: string,
  organizationId: string,
  badgeId: string,
  badgeName: string
): Promise<MilestoneCheckResult> {
  const milestoneKey = getMilestoneKey("badge_earned", badgeId);

  // Check if already recorded
  const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);
  if (alreadyAchieved) {
    return { achieved: false, milestoneKey };
  }

  const milestoneId = await recordMilestone({
    userId,
    organizationId,
    milestoneType: "badge_earned",
    milestoneKey,
    metadata: { badgeId, badgeName },
  });

  return {
    achieved: !!milestoneId,
    milestoneKey,
    metadata: { milestoneId, badgeId, badgeName },
  };
}

/**
 * Check for profile completion milestones (50%, 75%, 100%)
 */
export async function checkProfileCompletionMilestones(
  userId: string,
  organizationId: string,
  completionPercent: number
): Promise<MilestoneCheckResult[]> {
  const results: MilestoneCheckResult[] = [];

  for (const milestone of PROFILE_MILESTONES) {
    if (completionPercent >= milestone) {
      const milestoneKey = getMilestoneKey("profile_completion", milestone);
      const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);

      if (!alreadyAchieved) {
        const milestoneId = await recordMilestone({
          userId,
          organizationId,
          milestoneType: "profile_completion",
          milestoneKey,
          milestoneValue: milestone,
          metadata: { completionPercent },
        });

        results.push({
          achieved: !!milestoneId,
          milestoneKey,
          milestoneValue: milestone,
          metadata: { milestoneId, completionPercent },
        });
      }
    }
  }

  return results;
}

/**
 * Check for video testimonial milestones (1, 5, 10, 25, 50)
 */
export async function checkVideoMilestones(
  userId: string,
  organizationId: string,
  loanOfficerId: string
): Promise<MilestoneCheckResult[]> {
  const results: MilestoneCheckResult[] = [];
  const supabase = createAdminClient();

  // Count approved video testimonials
  const { count } = await supabase
    .from("testimonials")
    .select("*", { count: "exact", head: true })
    .eq("user_id", loanOfficerId)
    .eq("type", "video")
    .eq("status", "approved");

  const videoCount = count || 0;

  for (const milestone of VIDEO_MILESTONES) {
    if (videoCount >= milestone) {
      const milestoneKey = getMilestoneKey("video_milestone", milestone);
      const alreadyAchieved = await hasMilestoneBeenAchieved(userId, milestoneKey);

      if (!alreadyAchieved) {
        const milestoneId = await recordMilestone({
          userId,
          organizationId,
          milestoneType: "video_milestone",
          milestoneKey,
          milestoneValue: milestone,
          metadata: { videoCount },
        });

        results.push({
          achieved: !!milestoneId,
          milestoneKey,
          milestoneValue: milestone,
          metadata: { milestoneId, videoCount },
        });
      }
    }
  }

  return results;
}

// =============================================================================
// MILESTONE QUERY FUNCTIONS
// =============================================================================

/**
 * Get all milestones for a user
 */
export async function getUserMilestones(
  userId?: string
): Promise<ActionResult<MilestoneRecord[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetUserId = userId || context.userId;
  const supabase = createAdminClient();

  const { data, error } = await fromTable(supabase, "user_milestones")
    .select("*")
    .eq("user_id", targetUserId)
    .order("achieved_at", { ascending: false });

  if (error) {
    console.error("Error fetching milestones:", error);
    return { success: false, error: "Failed to fetch milestones" };
  }

  const milestones = (data || []).map(mapMilestoneRecord);

  return { success: true, data: milestones };
}

/**
 * Get pending milestones that need email notifications
 */
export async function getPendingMilestoneEmails(): Promise<
  ActionResult<MilestoneRecord[]>
> {
  const context = await getUserContext();
  if (!context || (context.role !== "admin" && context.role !== "manager")) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { data, error } = await fromTable(supabase, "user_milestones")
    .select("*")
    .eq("organization_id", context.organizationId)
    .eq("email_status", "pending")
    .order("achieved_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending milestone emails:", error);
    return { success: false, error: "Failed to fetch pending emails" };
  }

  const milestones = (data || []).map(mapMilestoneRecord);

  return { success: true, data: milestones };
}

/**
 * Update milestone email status
 */
export async function updateMilestoneEmailStatus(
  milestoneId: string,
  status: "sent" | "failed" | "skipped",
  messageId?: string
): Promise<ActionResult<void>> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    email_status: status,
  };

  if (status === "sent") {
    updateData.email_sent_at = new Date().toISOString();
  }

  if (messageId) {
    updateData.email_message_id = messageId;
  }

  const { error } = await fromTable(supabase, "user_milestones")
    .update(updateData)
    .eq("id", milestoneId);

  if (error) {
    console.error("Error updating milestone email status:", error);
    return { success: false, error: "Failed to update email status" };
  }

  return { success: true };
}

/**
 * Record social share for a milestone
 */
export async function recordMilestoneSocialShare(
  milestoneId: string,
  platform: string
): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { error } = await fromTable(supabase, "user_milestones")
    .update({
      social_shared_at: new Date().toISOString(),
      social_platform: platform,
    })
    .eq("id", milestoneId)
    .eq("user_id", context.userId);

  if (error) {
    console.error("Error recording social share:", error);
    return { success: false, error: "Failed to record social share" };
  }

  return { success: true };
}

// =============================================================================
// MILESTONE EMAIL PREFERENCE FUNCTIONS
// =============================================================================

/**
 * Get user's milestone email preferences
 */
export async function getMilestoneEmailPreferences(userId?: string): Promise<
  ActionResult<{
    enabled: boolean;
    reviewMilestones: boolean;
    ratingMilestones: boolean;
    streakMilestones: boolean;
    leaderboardMilestones: boolean;
    badgeMilestones: boolean;
    profileMilestones: boolean;
    videoMilestones: boolean;
  }>
> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetUserId = userId || context.userId;
  const supabase = createAdminClient();

  const { data, error } = await fromTable(supabase, "milestone_email_preferences")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = row not found
    console.error("Error fetching milestone preferences:", error);
    return { success: false, error: "Failed to fetch preferences" };
  }

  // Return defaults if no preferences exist
  if (!data) {
    return {
      success: true,
      data: {
        enabled: true,
        reviewMilestones: true,
        ratingMilestones: true,
        streakMilestones: true,
        leaderboardMilestones: true,
        badgeMilestones: true,
        profileMilestones: true,
        videoMilestones: true,
      },
    };
  }

  return {
    success: true,
    data: {
      enabled: data.enabled ?? true,
      reviewMilestones: data.review_milestones ?? true,
      ratingMilestones: data.rating_milestones ?? true,
      streakMilestones: data.streak_milestones ?? true,
      leaderboardMilestones: data.leaderboard_milestones ?? true,
      badgeMilestones: data.badge_milestones ?? true,
      profileMilestones: data.profile_milestones ?? true,
      videoMilestones: data.video_milestones ?? true,
    },
  };
}

/**
 * Update user's milestone email preferences
 */
export async function updateMilestoneEmailPreferences(preferences: {
  enabled?: boolean;
  reviewMilestones?: boolean;
  ratingMilestones?: boolean;
  streakMilestones?: boolean;
  leaderboardMilestones?: boolean;
  badgeMilestones?: boolean;
  profileMilestones?: boolean;
  videoMilestones?: boolean;
}): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const updateData: Record<string, boolean> = {};
  if (preferences.enabled !== undefined) updateData.enabled = preferences.enabled;
  if (preferences.reviewMilestones !== undefined)
    updateData.review_milestones = preferences.reviewMilestones;
  if (preferences.ratingMilestones !== undefined)
    updateData.rating_milestones = preferences.ratingMilestones;
  if (preferences.streakMilestones !== undefined)
    updateData.streak_milestones = preferences.streakMilestones;
  if (preferences.leaderboardMilestones !== undefined)
    updateData.leaderboard_milestones = preferences.leaderboardMilestones;
  if (preferences.badgeMilestones !== undefined)
    updateData.badge_milestones = preferences.badgeMilestones;
  if (preferences.profileMilestones !== undefined)
    updateData.profile_milestones = preferences.profileMilestones;
  if (preferences.videoMilestones !== undefined)
    updateData.video_milestones = preferences.videoMilestones;

  const { error } = await fromTable(supabase, "milestone_email_preferences").upsert(
    {
      user_id: context.userId,
      ...updateData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Error updating milestone preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }

  return { success: true };
}

// =============================================================================
// COMPREHENSIVE MILESTONE CHECK
// =============================================================================

/**
 * Run all milestone checks for a user after a review event
 */
export async function checkAllMilestonesForReview(
  userId: string,
  organizationId: string,
  loanOfficerId: string,
  reviewRating: number
): Promise<ActionResult<MilestoneCheckResult[]>> {
  const results: MilestoneCheckResult[] = [];

  // Check first review
  const firstReview = await checkFirstReviewMilestone(userId, organizationId, loanOfficerId);
  if (firstReview.achieved) results.push(firstReview);

  // Check review count milestones
  const reviewCounts = await checkReviewCountMilestones(userId, organizationId, loanOfficerId);
  results.push(...reviewCounts.filter((r) => r.achieved));

  // Check first 5-star
  const first5Star = await checkFirst5StarMilestone(
    userId,
    organizationId,
    loanOfficerId,
    reviewRating
  );
  if (first5Star.achieved) results.push(first5Star);

  // Check leaderboard achievements
  const leaderboard = await checkLeaderboardMilestones(userId, organizationId, loanOfficerId);
  results.push(...leaderboard.filter((r) => r.achieved));

  // Check rating improvement
  const ratingImprovement = await checkRatingImprovementMilestone(
    userId,
    organizationId,
    loanOfficerId
  );
  if (ratingImprovement.achieved) results.push(ratingImprovement);

  // Check NPS improvement
  const npsImprovement = await checkNpsImprovementMilestone(
    userId,
    organizationId,
    loanOfficerId
  );
  if (npsImprovement.achieved) results.push(npsImprovement);

  return { success: true, data: results };
}

/**
 * Get milestone statistics for a user
 */
export async function getMilestoneStats(userId?: string): Promise<
  ActionResult<{
    totalMilestones: number;
    milestonesByType: Record<MilestoneType, number>;
    recentMilestones: MilestoneRecord[];
    nextMilestones: Array<{
      type: MilestoneType;
      currentValue: number;
      nextValue: number;
      progress: number;
    }>;
  }>
> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const targetUserId = userId || context.userId;
  const milestonesResult = await getUserMilestones(targetUserId);

  if (!milestonesResult.success || !milestonesResult.data) {
    return { success: false, error: "Failed to fetch milestones" };
  }

  const milestones = milestonesResult.data;

  // Count by type
  const milestonesByType: Record<MilestoneType, number> = {
    first_review: 0,
    review_milestone: 0,
    first_5_star: 0,
    rating_improvement: 0,
    nps_improvement: 0,
    streak: 0,
    leaderboard_achievement: 0,
    badge_earned: 0,
    profile_completion: 0,
    video_milestone: 0,
  };

  for (const m of milestones) {
    milestonesByType[m.milestoneType]++;
  }

  // Get recent milestones (last 5)
  const recentMilestones = milestones.slice(0, 5);

  // Calculate next milestones
  const nextMilestones: Array<{
    type: MilestoneType;
    currentValue: number;
    nextValue: number;
    progress: number;
  }> = [];

  // Get loan officer data for next milestone calculations
  if (context.loanOfficerId) {
    const supabase = createAdminClient();
    const { data: userData } = await supabase
      .from("users")
      .select("total_reviews")
      .eq("id", context.loanOfficerId)
      .single();

    if (userData) {
      const currentReviews = userData.total_reviews || 0;
      const nextReviewMilestone = getNextMilestone(currentReviews, REVIEW_MILESTONES);
      const prevReviewMilestone = getPreviousMilestone(currentReviews, REVIEW_MILESTONES) || 0;

      if (nextReviewMilestone) {
        const range = nextReviewMilestone - prevReviewMilestone;
        const progress = range > 0 ? ((currentReviews - prevReviewMilestone) / range) * 100 : 0;

        nextMilestones.push({
          type: "review_milestone",
          currentValue: currentReviews,
          nextValue: nextReviewMilestone,
          progress: Math.min(100, Math.round(progress)),
        });
      }
    }
  }

  return {
    success: true,
    data: {
      totalMilestones: milestones.length,
      milestonesByType,
      recentMilestones,
      nextMilestones,
    },
  };
}

// =============================================================================
// MILESTONE EMAIL QUEUE PROCESSING (cron-safe — no auth context required)
// =============================================================================

type MilestoneEmailContextData = {
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    total_reviews: number | null;
    average_rating: number | null;
  } | null;
  orgName: string;
  latestReview: {
    id: string;
    customer_name: string | null;
    rating: number | null;
    review_date: string | null;
  } | null;
};

async function loadMilestoneEmailContext(
  record: MilestoneRecord
): Promise<MilestoneEmailContextData> {
  const supabase = createAdminClient();
  const [{ data: user }, { data: org }, { data: latestReview }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, total_reviews, average_rating")
      .eq("id", record.userId)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("name")
      .eq("id", record.organizationId)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("id, customer_name, rating, review_date")
      .eq("user_id", record.userId)
      .order("review_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    user: user as MilestoneEmailContextData["user"],
    orgName: org?.name || "your organization",
    latestReview: latestReview as MilestoneEmailContextData["latestReview"],
  };
}

/**
 * Dispatch the correct milestone celebration email for one pending record.
 * Returns the status to persist. Preference/unsubscribe gating lives inside
 * the individual senders, so a non-success send result is treated as a skip.
 *
 * Coverage is intentionally scoped to the review-driven milestone types whose
 * payloads can be assembled with high fidelity from the record + user stats +
 * latest review. The remaining milestone types (leaderboard, rating/NPS
 * improvement, badge, streak, video, profile) are marked 'skipped' pending a
 * dedicated payload-assembly follow-up — several also lack a template today.
 */
async function dispatchMilestoneEmail(
  record: MilestoneRecord
): Promise<{ status: "sent" | "skipped"; messageId?: string }> {
  const { user, orgName, latestReview } = await loadMilestoneEmailContext(record);

  if (!user?.email) {
    return { status: "skipped" };
  }

  const firstName = (user.full_name || "").trim().split(/\s+/)[0] || "there";
  const achievedAt = new Date(record.achievedAt).toISOString();
  const base = {
    toEmail: user.email,
    toName: user.full_name || undefined,
    organizationId: record.organizationId,
    loanOfficerId: record.userId,
    firstName,
    organizationName: orgName,
    dashboardUrl: `${MILESTONE_APP_URL}/dashboard`,
    unsubscribeUrl: `${MILESTONE_APP_URL}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`,
    milestoneId: record.id,
    achievedAt,
  };
  const reviewUrl = latestReview?.id
    ? `${MILESTONE_APP_URL}/dashboard/reviews/${latestReview.id}`
    : `${MILESTONE_APP_URL}/dashboard/reviews`;

  let result: { success: boolean; messageId?: string } | null = null;

  switch (record.milestoneType) {
    case "first_review":
      result = await sendFirstReviewMilestoneEmail({
        ...base,
        customerName: latestReview?.customer_name || "A customer",
        reviewRating: latestReview?.rating ?? 5,
        reviewDate: latestReview?.review_date || achievedAt,
        nextMilestoneCount: 5,
        viewReviewUrl: reviewUrl,
      });
      break;
    case "review_milestone": {
      const reviewCount = record.milestoneValue ?? user.total_reviews ?? 0;
      result = await sendReviewCountMilestoneEmail({
        ...base,
        reviewCount,
        averageRating: user.average_rating ?? 0,
        previousMilestone: getPreviousMilestone(reviewCount, REVIEW_MILESTONES) ?? undefined,
        nextMilestone: getNextMilestone(reviewCount, REVIEW_MILESTONES) ?? undefined,
        viewReviewsUrl: `${MILESTONE_APP_URL}/dashboard/reviews`,
      });
      break;
    }
    case "first_5_star":
      result = await sendFirst5StarMilestoneEmail({
        ...base,
        customerName: latestReview?.customer_name || "A customer",
        reviewDate: latestReview?.review_date || achievedAt,
        totalReviews: user.total_reviews ?? 0,
        viewReviewUrl: reviewUrl,
      });
      break;
    default:
      // No high-fidelity payload/template wired for this type yet.
      return { status: "skipped" };
  }

  return result?.success
    ? { status: "sent", messageId: result.messageId }
    : { status: "skipped" };
}

/**
 * Drain the pending milestone email queue. Cron-safe: reads pending
 * user_milestones across all organizations (no auth/org scoping) and updates
 * each row's email_status to sent/skipped/failed.
 */
export async function processPendingMilestoneEmails(
  limit = 50
): Promise<
  ActionResult<{ processed: number; sent: number; skipped: number; failed: number }>
> {
  const supabase = createAdminClient();

  const { data: pending, error } = await fromTable(supabase, "user_milestones")
    .select("*")
    .eq("email_status", "pending")
    .order("achieved_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching pending milestone emails:", error);
    return { success: false, error: "Failed to fetch pending milestone emails" };
  }

  const records = (pending || []).map(mapMilestoneRecord);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const outcome = await dispatchMilestoneEmail(record);
      await updateMilestoneEmailStatus(record.id, outcome.status, outcome.messageId);
      if (outcome.status === "sent") {
        sent += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      console.error(`Error processing milestone email ${record.id}:`, err);
      await updateMilestoneEmailStatus(record.id, "failed");
      failed += 1;
    }
  }

  return {
    success: true,
    data: { processed: records.length, sent, skipped, failed },
  };
}
