/**
 * Gamification Module
 * Exports all gamification-related types and actions
 */

// Types
export type {
  BadgeCategory,
  BadgeTier,
  BadgeCriteriaType,
  BadgeCriteria,
  Badge,
  UserBadge,
  BadgeProgress,
  LeaderboardPeriod,
  EnhancedLeaderboardEntry,
  LeaderboardFilters,
  ReputationBreakdown,
  ImprovementArea,
  ImprovementTip,
  ReputationHistoryEntry,
  LeaderboardSnapshot,
  AchievementNotification,
  GamificationSettings,
  GamificationStats,
} from "./types";

// Actions
export {
  getAvailableBadges,
  getUserBadges,
  getBadgeProgress,
  getEnhancedLeaderboard,
  getReputationBreakdown,
  getImprovementTips,
  getReputationHistory,
  getGamificationStats,
  saveLeaderboardSnapshot,
} from "./actions";

// Profile Completion Types
export type {
  ProfileSection,
  ProfileCompletionField,
  ProfileSectionConfig,
  FieldCompletionStatus,
  SectionCompletionStatus,
  ProfileCompletionScore,
  ProfileCompletionTip,
  ProfileMilestone,
  ProfileCompletionLeaderboardEntry,
} from "./profile-completion-types";

export {
  PROFILE_COMPLETION_FIELDS,
  PROFILE_SECTIONS,
  PROFILE_MILESTONES,
  MAX_PROFILE_POINTS,
  MAX_MILESTONE_BONUS,
  SEARCH_RANK_MAX,
  SEARCH_RANK_WEIGHTS,
} from "./profile-completion-types";

// Profile Completion Actions
export {
  getProfileCompletionScore,
  getProfileCompletionLeaderboard,
  getProfileCompletionSummary,
} from "./profile-completion-actions";
