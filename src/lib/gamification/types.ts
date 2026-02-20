"use server";

/**
 * Gamification System Types
 * Types for badges, leaderboards, and reputation tracking
 */

// Badge categories
export type BadgeCategory = "milestone" | "performance" | "streak" | "special";

// Badge tiers for visual styling
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

// Badge criteria types
export type BadgeCriteriaType =
  | "review_count"
  | "rating_threshold"
  | "nps_threshold"
  | "response_rate"
  | "leaderboard_rank"
  | "streak"
  | "improvement_streak";

// Badge criteria configuration
export interface BadgeCriteria {
  type: BadgeCriteriaType;
  threshold?: number;
  rating?: number;
  min_reviews?: number;
  months?: number;
  status?: string;
  rank?: number;
}

// Badge definition
export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier | null;
  criteria: BadgeCriteria;
  isSystem: boolean;
  isActive: boolean;
  displayOrder: number;
}

// User's earned badge
export interface UserBadge {
  id: string;
  badge: Badge;
  earnedAt: Date | null;
  progress: BadgeCriteria;
}

// Badge progress for tracking
export interface BadgeProgress {
  badge: Badge;
  currentValue: number;
  targetValue: number;
  percentComplete: number;
  isEarned: boolean;
  earnedAt: Date | null;
}

// Leaderboard period types
export type LeaderboardPeriod = "monthly" | "quarterly" | "yearly" | "all_time";

// Enhanced leaderboard entry with history
export interface EnhancedLeaderboardEntry {
  rank: number;
  previousRank: number | null;
  rankChange: number;
  id: string;
  fullName: string;
  photoUrl: string | null;
  branch: string | null;
  region: string | null;
  totalReviews: number;
  averageRating: number;
  npsScore: number;
  reputationScore: number;
  badges: UserBadge[];
}

// Leaderboard filters
export interface LeaderboardFilters {
  period: LeaderboardPeriod;
  branch?: string;
  region?: string;
  limit?: number;
}

// Reputation score breakdown
export interface ReputationBreakdown {
  totalScore: number;
  components: {
    nps: {
      score: number;
      weight: number;
      contribution: number;
      normalized: number;
    };
    csat: {
      score: number;
      weight: number;
      contribution: number;
    };
    responseRate: {
      score: number;
      weight: number;
      contribution: number;
    };
    reviewVolume: {
      count: number;
      weight: number;
      contribution: number;
      normalized: number;
    };
    averageRating: {
      rating: number;
      weight: number;
      contribution: number;
      normalized: number;
    };
  };
}

// Improvement tip category
export type ImprovementArea =
  | "nps"
  | "csat"
  | "response_rate"
  | "review_volume"
  | "rating";

// Improvement tip
export interface ImprovementTip {
  area: ImprovementArea;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  currentValue: number;
  targetValue: number;
  potentialGain: number; // points gained if improved
}

// Reputation history entry
export interface ReputationHistoryEntry {
  id: string;
  previousScore: number;
  newScore: number;
  changeAmount: number;
  changeReason: string | null;
  breakdown: ReputationBreakdown["components"] | null;
  recordedAt: Date;
}

// Leaderboard snapshot for history tracking
export interface LeaderboardSnapshot {
  id: string;
  loanOfficerId: string;
  periodType: LeaderboardPeriod;
  periodKey: string;
  rank: number;
  reputationScore: number;
  totalReviews: number;
  averageRating: number;
  npsScore: number | null;
  snapshotDate: Date;
}

// Achievement notification
export interface AchievementNotification {
  badge: Badge;
  earnedAt: Date;
  message: string;
}

// Gamification settings
export interface GamificationSettings {
  isEnabled: boolean;
  publicLeaderboard: boolean;
  showBadgesOnProfile: boolean;
  leaderboardRefreshInterval: "hourly" | "daily" | "weekly";
  badgeNotificationEnabled: boolean;
}

// Stats summary for gamification section
export interface GamificationStats {
  totalBadges: number;
  earnedBadges: number;
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number;
  reputationScore: number;
  reputationTrend: "up" | "down" | "stable";
  nextBadgeProgress: BadgeProgress | null;
}
