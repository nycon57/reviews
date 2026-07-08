"use client";

import { useCallback, useState } from "react";
import { Quotes as Quote } from "@phosphor-icons/react";

import { ReviewFiltersBar } from "@/app/pro/[slug]/components";
import { ReportReviewModal } from "@/app/pro/[slug]/components/report-review-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewItem } from "@/components/shared/review-item";
import { getBranchPublicPath } from "@/lib/branches/utils";
import type { PublicOrgTestimonial } from "@/lib/seo/actions";
import { useReviewFilters } from "@/components/public-profile/use-review-filters";

interface OrganizationReviewsIslandProps {
  testimonials: PublicOrgTestimonial[];
  organizationName: string;
  profileUrl: string;
}

export function OrganizationReviewsIsland({
  testimonials,
  organizationName,
  profileUrl,
}: OrganizationReviewsIslandProps) {
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const {
    filters,
    sources,
    filteredReviews,
    displayedReviews,
    displayCount,
    handleFiltersChange,
    loadMore,
  } = useReviewFilters(testimonials, 10);

  const handleFlagReview = useCallback((reviewId: string) => {
    setReportReviewId(reviewId);
  }, []);

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-t-4 border-t-repwell-sage-200">
        <CardHeader variant="plain">
          <CardTitle className="flex items-center gap-2 text-xl font-display text-repwell-teal-500">
            <Quote className="h-5 w-5 text-repwell-teal-300" />
            Customer Testimonials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewFiltersBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sources={sources}
            className="mb-8"
          />

          {filteredReviews.length === 0 ? (
            <p className="py-8 text-center text-repwell-teal-300">
              No testimonials match your filters.
            </p>
          ) : (
            <div className="space-y-6">
              {displayedReviews.map((testimonial) => (
                <ReviewItem
                  key={testimonial.id}
                  review={{
                    id: testimonial.id,
                    customer_name: testimonial.customer_name,
                    customer_location: testimonial.customer_location,
                    rating: testimonial.rating,
                    text: testimonial.text,
                    title: testimonial.title,
                    review_date: testimonial.review_date,
                    source: testimonial.source,
                  }}
                  attributionLabel="Served by"
                  attribution={{
                    loanOfficer: {
                      name: testimonial.loan_officer.full_name,
                      href: testimonial.loan_officer.slug
                        ? `/pro/${testimonial.loan_officer.slug}`
                        : "#",
                      photoUrl: testimonial.loan_officer.photo_url,
                    },
                    branch: testimonial.branch
                      ? {
                          name: testimonial.branch.name,
                          href: getBranchPublicPath(testimonial.branch),
                        }
                      : undefined,
                  }}
                  shareConfig={{ profileUrl, subjectName: organizationName }}
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
                    Load More Testimonials
                  </Button>
                </div>
              )}
            </div>
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
