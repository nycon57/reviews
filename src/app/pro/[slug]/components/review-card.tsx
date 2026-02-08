"use client";

import { ReviewItem, SourceIcon } from "@/components/shared/review-item";
import type { PublicReview } from "@/lib/seo/actions";

// Re-export for backward compatibility
export { SourceIcon };
export { SOURCE_CONFIG } from "@/components/shared/review-item";

interface ReviewCardProps {
  review: PublicReview;
  loanOfficerName: string;
  profileUrl: string;
  onFlag?: (reviewId: string) => void;
  className?: string;
}

export function ReviewCard({
  review,
  loanOfficerName,
  profileUrl,
  onFlag,
  className,
}: ReviewCardProps) {
  return (
    <ReviewItem
      review={review}
      respondentName={loanOfficerName}
      shareConfig={{ profileUrl, subjectName: loanOfficerName }}
      onFlag={onFlag}
      animate
      className={className}
    />
  );
}
