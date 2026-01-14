/**
 * Analytics Utilities
 * Pure utility functions for analytics that can be used on client or server
 */

import type { DateRange, PeriodType } from "./types";

/**
 * Get date range for a period type
 */
export function getDateRangeForPeriod(periodType: PeriodType): DateRange {
  const end = new Date();
  const start = new Date();

  switch (periodType) {
    case "daily":
      start.setDate(start.getDate() - 1);
      break;
    case "weekly":
      start.setDate(start.getDate() - 7);
      break;
    case "monthly":
      start.setMonth(start.getMonth() - 1);
      break;
    case "quarterly":
      start.setMonth(start.getMonth() - 3);
      break;
    case "yearly":
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "all_time":
      start.setFullYear(2000); // Far enough back
      break;
  }

  return { start, end };
}
