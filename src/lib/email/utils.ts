/**
 * Email Utility Functions
 *
 * Shared utilities for email templates.
 */

/**
 * Format duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "1m 30s" or "45s"
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Render a star rating as a string of star characters
 * Uses filled stars (★), half stars (½), and empty stars (☆)
 *
 * @param rating - Rating value (will be clamped to 0-5 range)
 * @param showHalf - Whether to show half stars for fractional ratings (default: false)
 * @returns Star rating string, e.g., "★★★☆☆" or "★★★½☆"
 */
export function renderStars(rating: number, showHalf: boolean = false): string {
  // Clamp rating to valid range to prevent negative repeat counts
  const clampedRating = Math.min(5, Math.max(0, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalf = showHalf && clampedRating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalf ? 1 : 0));
  return "★".repeat(fullStars) + (hasHalf ? "½" : "") + "☆".repeat(emptyStars);
}
