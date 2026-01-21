"use server";

/**
 * Milestone Types and Constants (S081)
 *
 * Defines milestone thresholds, types, and configuration.
 */

// Review count milestones
export const REVIEW_MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500] as const;

// Streak day milestones
export const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;

// Video testimonial milestones
export const VIDEO_MILESTONES = [1, 5, 10, 25, 50] as const;

// Profile completion milestones (percentage)
export const PROFILE_MILESTONES = [50, 75, 100] as const;

// NPS improvement thresholds (points)
export const NPS_IMPROVEMENT_THRESHOLD = 10;

// Rating improvement thresholds
export const RATING_IMPROVEMENT_THRESHOLD = 0.25;

// Leaderboard achievement types
export type LeaderboardAchievement =
  | "entered_top_10"
  | "reached_top_3"
  | "reached_number_1";

// Milestone type definitions
export type MilestoneType =
  | "first_review"
  | "review_milestone"
  | "first_5_star"
  | "rating_improvement"
  | "nps_improvement"
  | "streak"
  | "leaderboard_achievement"
  | "badge_earned"
  | "profile_completion"
  | "video_milestone";

// Milestone record from database
export interface MilestoneRecord {
  id: string;
  userId: string;
  organizationId: string;
  milestoneType: MilestoneType;
  milestoneKey: string;
  milestoneValue: number | null;
  milestoneMetadata: Record<string, unknown>;
  achievedAt: Date;
  emailSentAt: Date | null;
  emailStatus: "pending" | "sent" | "failed" | "skipped";
  emailMessageId: string | null;
  socialSharedAt: Date | null;
  socialPlatform: string | null;
}

// Milestone check result
export interface MilestoneCheckResult {
  achieved: boolean;
  milestoneKey: string;
  milestoneValue?: number;
  metadata?: Record<string, unknown>;
}

// Milestone email context
export interface MilestoneEmailContext {
  userId: string;
  userEmail: string;
  firstName: string;
  organizationId: string;
  organizationName: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
}

// Helper to generate milestone key
export function getMilestoneKey(type: MilestoneType, value?: number | string): string {
  if (value !== undefined) {
    return `${type}_${value}`;
  }
  return type;
}

// Helper to get next milestone value
export function getNextMilestone(current: number, milestones: readonly number[]): number | null {
  for (const milestone of milestones) {
    if (current < milestone) {
      return milestone;
    }
  }
  return null;
}

// Helper to get previous milestone value
export function getPreviousMilestone(current: number, milestones: readonly number[]): number | null {
  let previous: number | null = null;
  for (const milestone of milestones) {
    if (current >= milestone) {
      previous = milestone;
    } else {
      break;
    }
  }
  return previous;
}
