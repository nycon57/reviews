/**
 * Shared utilities for referral program email templates.
 *
 * Provides common formatting functions and constants used across
 * multiple referral email templates.
 */

// =============================================================================
// Types
// =============================================================================

export type RewardType = "credit" | "discount" | "cash" | "points";

// =============================================================================
// Reward Formatting
// =============================================================================

/**
 * Format a reward value based on its type.
 */
export function formatRewardValue(value: number, type: RewardType): string {
  switch (type) {
    case "cash":
    case "credit":
      return `$${value}`;
    case "discount":
      return `${value}%`;
    case "points":
      return `${value} pts`;
  }
}

/**
 * Get the emoji icon for a reward type.
 */
export function getRewardIcon(type: RewardType): string {
  const icons: Record<RewardType, string> = {
    credit: "\u{1F4B3}", // Credit card
    discount: "\u{1F3F7}\uFE0F", // Label/tag
    cash: "\u{1F4B5}", // Dollar banknote
    points: "\u2B50", // Star
  };
  return icons[type];
}

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Format a date string for display in emails.
 * Returns format like "January 15, 2024"
 */
export function formatDateLong(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date string for compact display.
 * Returns format like "Jan 15"
 */
export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// =============================================================================
// Leaderboard Display
// =============================================================================

/**
 * Get the display string for a leaderboard rank (medal emoji or #N).
 */
export function getRankDisplay(rank: number): string {
  if (rank === 1) return "\u{1F947}"; // Gold medal
  if (rank === 2) return "\u{1F948}"; // Silver medal
  if (rank === 3) return "\u{1F949}"; // Bronze medal
  return `#${rank}`;
}

/**
 * Get the color for a leaderboard rank.
 */
export function getRankColor(rank: number, defaultColor: string): string {
  if (rank === 1) return "#FFD700"; // Gold
  if (rank === 2) return "#C0C0C0"; // Silver
  if (rank === 3) return "#CD7F32"; // Bronze
  return defaultColor;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = n % 100;
  return n + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
}
