export interface DateModifiedProfessional {
  updated_at?: string | null;
}

export interface DateModifiedReview {
  updated_at?: string | null;
  review_date?: string | null;
}

export function getValidTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getProfessionalDateModified(
  professional: DateModifiedProfessional,
  reviews: DateModifiedReview[] = []
): string | undefined {
  const timestamps = [
    getValidTimestamp(professional.updated_at),
    ...reviews.map((review) =>
      getValidTimestamp(review.updated_at) ?? getValidTimestamp(review.review_date)
    ),
  ].filter((timestamp): timestamp is number => timestamp !== null);

  if (timestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}
