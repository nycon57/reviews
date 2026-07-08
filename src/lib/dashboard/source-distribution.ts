import { formatReviewSource } from "@/lib/reviews/source-labels";

export interface ReviewsBySourceEntry {
  source: string;
  label: string;
  count: number;
}

export interface ReviewsBySourceOptions {
  startDate?: string;
  endDate?: string;
}

export function summarizeReviewsBySource(
  reviews: Array<{ source: string | null | undefined }>
): ReviewsBySourceEntry[] {
  const counts = new Map<string, number>();

  for (const review of reviews) {
    const source = String(review.source ?? "").trim() || "unknown";
    counts.set(source, (counts.get(source) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([source, count]) => ({
      source,
      label: formatReviewSource(source),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
