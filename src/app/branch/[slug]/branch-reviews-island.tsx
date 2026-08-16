"use client";

import { PublicProfileReviewsCard } from "@/components/public-profile";
import { ReviewItem } from "@/components/shared/review-item";
import type { PublicBranchReview } from "@/lib/seo/actions";

interface BranchReviewsIslandProps {
  reviews: PublicBranchReview[];
  branchName: string;
  profileUrl: string;
}

export function BranchReviewsIsland({
  reviews,
  branchName,
  profileUrl,
}: BranchReviewsIslandProps) {
  return (
    <PublicProfileReviewsCard
      reviews={reviews}
      title="Recent Reviews"
      emptyCopy="No reviews yet for this branch."
      filteredEmptyCopy="No reviews match your filters."
      loadMoreLabel="Load More Reviews"
      renderReview={(review, onFlag) => (
        <ReviewItem
          key={review.id}
          review={{
            id: review.id,
            customer_name: review.customer_name,
            customer_location: review.customer_location,
            rating: review.rating,
            text: review.text,
            title: review.title,
            review_date: review.review_date,
            source: review.source,
            response_text: review.response_text,
          }}
          respondentName={review.loan_officer.full_name}
          attribution={{
            loanOfficer: {
              name: review.loan_officer.full_name,
              href: review.loan_officer.slug
                ? `/pro/${review.loan_officer.slug}`
                : "#",
              photoUrl: review.loan_officer.photo_url,
            },
          }}
          shareConfig={{ profileUrl, subjectName: branchName }}
          onFlag={onFlag}
        />
      )}
    />
  );
}
