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

export type ReviewSourceCountRow = {
  source: string;
  review_count: number;
};

export function mapReviewSourceCounts(rows: ReviewSourceCountRow[]): ReviewsBySourceEntry[] {
  return rows.map((row) => ({
    source: row.source,
    label: formatReviewSource(row.source),
    count: Number(row.review_count),
  }));
}
