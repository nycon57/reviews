/**
 * Email Sequence Orchestration Engine - Shared Utilities
 *
 * Common utilities used across the orchestration engine:
 * - Delay calculations for scheduling
 */

import type { DelayConfig } from "./types";

// ============================================================================
// Delay Constants
// ============================================================================

/**
 * Multipliers to convert delay units to milliseconds
 */
const DELAY_MULTIPLIERS: Record<string, number> = {
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

// ============================================================================
// Delay Functions
// ============================================================================

/**
 * Convert delay config to milliseconds
 */
export function delayToMs(delay: DelayConfig): number {
  return delay.value * (DELAY_MULTIPLIERS[delay.unit] || 0);
}

/**
 * Add a delay to a date, returning a new date
 */
export function addDelay(date: Date, delay: DelayConfig): Date {
  const result = new Date(date);
  result.setTime(result.getTime() + delayToMs(delay));
  return result;
}
