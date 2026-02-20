/**
 * Analytics threshold constants
 *
 * Centralized numeric thresholds used across analytics components.
 * Prevents magic numbers and ensures consistency.
 */

// ============================================================================
// Rating thresholds
// ============================================================================

/** Rating below this triggers a performance alert */
export const ALERT_RATING_THRESHOLD = 3.5;

// ============================================================================
// NPS thresholds
// ============================================================================

/** NPS below this triggers a performance alert (negative NPS) */
export const ALERT_NPS_THRESHOLD = 0;

// ============================================================================
// Review count thresholds
// ============================================================================

/** Fewer than this many reviews triggers a low review count alert */
export const LOW_REVIEW_COUNT_THRESHOLD = 5;

// ============================================================================
// Response rate thresholds (percentages)
// ============================================================================

/** Response rate below this triggers a performance alert */
export const LOW_RESPONSE_RATE_THRESHOLD = 30;

// ============================================================================
// Response time thresholds (hours)
// ============================================================================

/** Response time under this is considered very fast */
export const FAST_RESPONSE_TIME_HOURS = 1;

/** Response time under this is considered good (green) */
export const GOOD_RESPONSE_TIME_HOURS = 24;

/** Response time under this is considered acceptable (yellow), above is poor (red) */
export const WARNING_RESPONSE_TIME_HOURS = 48;

// ============================================================================
// Sentiment thresholds (percentages)
// ============================================================================

/** Positive sentiment percent at or above this is "excellent" */
export const EXCELLENT_SENTIMENT_PERCENT = 70;

/** Positive sentiment percent at or above this (but below excellent) is "good" */
export const GOOD_SENTIMENT_PERCENT = 50;

/** Minimum percent for a segment to display its label inside the bar */
export const SENTIMENT_BAR_LABEL_MIN_PERCENT = 10;
