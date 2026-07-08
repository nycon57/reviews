"use client";

import { useCallback, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReviewFilters, type FilterableReview } from "./use-review-filters";
import { ReportReviewModal } from "./report-review-modal";
import { ReviewFiltersBar } from "./review-filters";

interface PublicProfileReviewsCardProps<TReview extends FilterableReview & { id: string }> {
  reviews: TReview[];
  title: string;
  titleIcon?: ReactNode;
  hideWhenEmpty?: boolean;
  emptyCopy: string;
  filteredEmptyCopy: string;
  loadMoreLabel: string;
  renderReview: (review: TReview, onFlag: (reviewId: string) => void) => ReactNode;
}

export function PublicProfileReviewsCard<TReview extends FilterableReview & { id: string }>({
  reviews,
  title,
  titleIcon,
  hideWhenEmpty = false,
  emptyCopy,
  filteredEmptyCopy,
  loadMoreLabel,
  renderReview,
}: PublicProfileReviewsCardProps<TReview>) {
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const {
    filters,
    sources,
    filteredReviews,
    displayedReviews,
    hasMore,
    handleFiltersChange,
    loadMore,
  } = useReviewFilters(reviews, 10);

  const handleFlagReview = useCallback((reviewId: string) => {
    setReportReviewId(reviewId);
  }, []);

  if (hideWhenEmpty && reviews.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-t-4 border-t-repwell-sage-200">
        <CardHeader variant="plain">
          <CardTitle
            className={
              titleIcon
                ? "flex items-center gap-2 text-xl font-display text-repwell-teal-500"
                : "text-xl font-display text-repwell-teal-500"
            }
          >
            {titleIcon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-repwell-teal-300">
              {emptyCopy}
            </p>
          ) : (
            <>
              <ReviewFiltersBar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                sources={sources}
                className="mb-8"
              />

              {filteredReviews.length === 0 ? (
                <p className="py-8 text-center text-repwell-teal-300">
                  {filteredEmptyCopy}
                </p>
              ) : (
                <div className="space-y-6">
                  {displayedReviews.map((review) => renderReview(review, handleFlagReview))}

                  {hasMore && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        className="border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
                      >
                        {loadMoreLabel}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ReportReviewModal
        open={reportReviewId !== null}
        onOpenChange={(open) => {
          if (!open) setReportReviewId(null);
        }}
        reviewId={reportReviewId ?? ""}
      />
    </>
  );
}
