/**
 * Reporting Utilities
 * Client-safe utility functions for reporting
 */

import { subDays, subMonths, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, format } from "date-fns";
import type { DateRangePreset, ReportDateRange } from "./types";

/**
 * Convert date range preset to actual dates
 */
export function getDateRangeFromPreset(preset: DateRangePreset): ReportDateRange {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (preset) {
    case "last_7_days":
      start = subDays(now, 7);
      break;
    case "last_30_days":
      start = subDays(now, 30);
      break;
    case "last_90_days":
      start = subDays(now, 90);
      break;
    case "this_month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case "last_month":
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      break;
    case "this_quarter":
      start = startOfQuarter(now);
      end = endOfQuarter(now);
      break;
    case "last_quarter":
      start = startOfQuarter(subMonths(now, 3));
      end = endOfQuarter(subMonths(now, 3));
      break;
    case "this_year":
      start = startOfYear(now);
      break;
    default:
      start = subDays(now, 30);
  }

  return { start, end, preset };
}

/**
 * Get filename for export
 */
export function getExportFilename(
  reportName: string,
  exportFormat: "csv" | "pdf" | "json"
): string {
  const sanitizedName = reportName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const dateStr = format(new Date(), "yyyy-MM-dd");
  return `${sanitizedName}-${dateStr}.${exportFormat}`;
}
