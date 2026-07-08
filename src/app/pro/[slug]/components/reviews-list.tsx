"use client";

import { PencilSimple, Users } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./review-card";
import { ReviewFiltersBar } from "@/components/public-profile/review-filters";
import type { PublicReview } from "@/lib/seo/actions";
import { useReviewFilters } from "@/components/public-profile/use-review-filters";

interface ReviewsListProps {
  reviews: PublicReview[];
  loanOfficerName: string;
  profileUrl: string;
  acceptsPublicReviews?: boolean;
  onWriteReview?: () => void;
  onReferFriend?: () => void;
  onFlagReview?: (reviewId: string) => void;
  className?: string;
}

const REVIEWS_PER_PAGE = 10;

export function ReviewsList({
  reviews,
  loanOfficerName,
  profileUrl,
  acceptsPublicReviews = true,
  onWriteReview,
  onReferFriend,
  onFlagReview,
  className,
}: ReviewsListProps) {
  const {
    filters,
    sources,
    filteredReviews,
    displayedReviews,
    hasMore,
    loadMore,
    handleFiltersChange,
  } = useReviewFilters(reviews, REVIEWS_PER_PAGE);

  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200", className)}>
      <CardHeader variant="plain" className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-xl font-display text-repwell-teal-500">
          Customer Reviews
        </CardTitle>
        <div className="flex items-center gap-2">
          {onReferFriend && (
            <Button
              onClick={onReferFriend}
              variant="outline"
              className="border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
            >
              <Users className="h-4 w-4" />
              Refer {loanOfficerName.split(" ")[0]}
            </Button>
          )}
          {acceptsPublicReviews && onWriteReview && (
            <Button
              onClick={onWriteReview}
              className="bg-repwell-teal-300 hover:bg-repwell-teal-400"
            >
              <PencilSimple className="h-4 w-4" />
              Write a Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No reviews yet. Be the first to leave a review!
            </p>
            {acceptsPublicReviews && onWriteReview && (
              <Button
                onClick={onWriteReview}
                variant="outline"
                className="border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
              >
                <PencilSimple className="h-4 w-4" />
                Write the First Review
              </Button>
            )}
          </div>
        ) : (
          <>
            <ReviewFiltersBar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              sources={sources}
              className="mb-8"
            />

            {filteredReviews.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No reviews match your filters. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    loanOfficerName={loanOfficerName}
                    profileUrl={profileUrl}
                    onFlag={onFlagReview}
                  />
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      className="border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
                    >
                      Load More Reviews
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
