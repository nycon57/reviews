/**
 * Formats a value in cents as a dollar string (e.g. 350 → "$3.50").
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Sums the numeric fields of daily usage stats into a totals object.
 */
export function sumDailyStats(stats: ReadonlyArray<{ sent: number; delivered: number; failed: number; segments: number; costCents: number }>): {
  sent: number;
  delivered: number;
  failed: number;
  segments: number;
  costCents: number;
} {
  return stats.reduce(
    (acc, d) => ({
      sent: acc.sent + d.sent,
      delivered: acc.delivered + d.delivered,
      failed: acc.failed + d.failed,
      segments: acc.segments + d.segments,
      costCents: acc.costCents + d.costCents,
    }),
    { sent: 0, delivered: 0, failed: 0, segments: 0, costCents: 0 }
  );
}
