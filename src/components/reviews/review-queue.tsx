"use client";

import type { Review, ReviewAggregationStats } from "@/lib/reviews/types";
import { ReviewQueueProvider, ReviewQueueContent } from "@/components/review-queue";

interface ReviewQueueProps {
  initialReviews: Review[];
  initialTotal: number;
  teamMembers: { id: string; fullName: string }[];
  initialStats: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  initialAggregatedStats?: ReviewAggregationStats;
  initialReviewId?: string;
  hasAiAccess?: boolean;
}

export function ReviewQueue({
  initialReviews,
  initialTotal,
  teamMembers,
  initialStats,
  initialAggregatedStats,
  initialReviewId,
  hasAiAccess = true,
}: ReviewQueueProps) {
  return (
    <ReviewQueueProvider
      initialReviews={initialReviews}
      initialTotal={initialTotal}
      teamMembers={teamMembers}
      initialStats={initialStats}
      initialAggregatedStats={initialAggregatedStats}
      initialReviewId={initialReviewId}
      hasAiAccess={hasAiAccess}
    >
      <ReviewQueueContent />
    </ReviewQueueProvider>
  );
}
