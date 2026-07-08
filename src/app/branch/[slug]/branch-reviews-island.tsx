"use client";

import { useCallback, useState } from "react";

import { ReviewFiltersBar } from "@/app/pro/[slug]/components";
import { ReportReviewModal } from "@/app/pro/[slug]/components/report-review-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewItem } from "@/components/shared/review-item";
import { useReviewFilters } from "@/components/public-profile/use-review-filters";
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
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const {
    filters,
    sources,
    filteredReviews,
    displayedReviews,
    displayCount,
    handleFiltersChange,
    loadMore,
  } = useReviewFilters(reviews, 10);

  const handleFlagReview = useCallback((reviewId: string) => {
    setReportReviewId(reviewId);
  }, []);

  return (
    <>
      <Card className="border-t-4 border-t-repwell-sage-200">
        <CardHeader variant="plain">
          <CardTitle className="text-xl font-display text-repwell-teal-500">
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-8 text-center text-repwell-teal-300">
              No reviews yet for this branch.
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
                  No reviews match your filters.
                </p>
              ) : (
                <div className="space-y-6">
                  {displayedReviews.map((review) => (
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
                      onFlag={handleFlagReview}
                    />
                  ))}

                  {filteredReviews.length > displayCount && (
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
