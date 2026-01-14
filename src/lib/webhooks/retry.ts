/**
 * Webhook retry utilities with exponential backoff
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 5 * 60 * 1000, // 5 minutes
  maxDelayMs: 4 * 60 * 60 * 1000, // 4 hours
  backoffMultiplier: 2,
};

/**
 * Calculate the next retry delay using exponential backoff
 * Retry schedule: 5min, 10min, 20min, 40min, 80min (capped at max)
 */
export function calculateRetryDelay(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay =
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attemptNumber - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Calculate the next retry timestamp
 */
export function getNextRetryTime(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Date {
  const delayMs = calculateRetryDelay(attemptNumber, config);
  return new Date(Date.now() + delayMs);
}

/**
 * Check if more retries are allowed
 */
export function shouldRetry(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  return attemptNumber < config.maxRetries;
}

/**
 * Format retry delay for human readability
 */
export function formatRetryDelay(delayMs: number): string {
  const minutes = Math.floor(delayMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * Get human-readable retry schedule
 */
export function getRetrySchedule(
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): string[] {
  const schedule: string[] = [];
  for (let i = 1; i <= config.maxRetries; i++) {
    const delay = calculateRetryDelay(i, config);
    schedule.push(`Attempt ${i}: ${formatRetryDelay(delay)} delay`);
  }
  return schedule;
}

/**
 * Categorize error types for retry decisions
 */
export type ErrorCategory =
  | "transient" // Network issues, rate limits - should retry
  | "permanent" // Invalid payload, auth failure - should not retry
  | "unknown"; // Unexpected errors - retry with caution

export function categorizeError(error: Error | string): ErrorCategory {
  const message =
    typeof error === "string" ? error.toLowerCase() : error.message.toLowerCase();

  // Permanent errors - no retry
  const permanentPatterns = [
    "invalid api key",
    "invalid payload",
    "validation error",
    "invalid webhook signature",
    "loan officer not found",
    "no active survey template",
    "ip address not allowed",
    "webhook is disabled",
    "admin access required",
    "not authenticated",
    "organization not found",
  ];

  if (permanentPatterns.some((pattern) => message.includes(pattern))) {
    return "permanent";
  }

  // Transient errors - should retry
  const transientPatterns = [
    "rate limit",
    "timeout",
    "network",
    "connection",
    "econnreset",
    "etimedout",
    "enotfound",
    "internal error",
    "service unavailable",
    "bad gateway",
    "gateway timeout",
    "temporarily",
  ];

  if (transientPatterns.some((pattern) => message.includes(pattern))) {
    return "transient";
  }

  return "unknown";
}

/**
 * Determine if an error should trigger a retry
 */
export function isRetryableError(
  error: Error | string,
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  if (!shouldRetry(attemptNumber, config)) {
    return false;
  }

  const category = categorizeError(error);

  // Permanent errors should never retry
  if (category === "permanent") {
    return false;
  }

  // Transient errors should always retry (if within limits)
  if (category === "transient") {
    return true;
  }

  // Unknown errors: retry up to half the max retries
  return attemptNumber <= Math.ceil(config.maxRetries / 2);
}
