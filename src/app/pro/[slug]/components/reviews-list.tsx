"use client";

import { useState, useMemo, useCallback } from "react";
import { PencilSimple, Users } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./review-card";
import { ReviewFiltersBar, type ReviewFilters } from "./review-filters";
import type { PublicReview } from "@/lib/seo/actions";

interface ReviewsListProps {
  reviews: PublicReview[];
  loanOfficerName: string;
  profileUrl: string;
  zillowUrl?: string | null;
  linkedinUrl?: string | null;
  googlePlaceId?: string | null;
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
  zillowUrl,
  linkedinUrl,
  googlePlaceId,
  acceptsPublicReviews = true,
  onWriteReview,
  onReferFriend,
  onFlagReview,
  className,
}: ReviewsListProps) {
  const [filters, setFilters] = useState<ReviewFilters>({
    search: "",
    rating: null,
    sources: [],
    dateRange: undefined,
    sort: "newest",
  });
  const [displayCount, setDisplayCount] = useState(REVIEWS_PER_PAGE);

  // Get unique sources from reviews
  const sources = useMemo(() => {
    const sourceSet = new Set(reviews.map((r) => r.source.toLowerCase()));
    return Array.from(sourceSet).filter(
      (s) => s !== "internal" && s !== "survey"
    );
  }, [reviews]);

  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.text?.toLowerCase().includes(searchLower) ||
          r.title?.toLowerCase().includes(searchLower) ||
          r.customer_name?.toLowerCase().includes(searchLower) ||
          r.customer_location?.toLowerCase().includes(searchLower)
      );
    }

    // Apply rating filter
    if (filters.rating !== null) {
      result = result.filter((r) => r.rating >= filters.rating!);
    }

    // Apply source filter (multi-select)
    if (filters.sources.length > 0) {
      const selected = new Set(filters.sources.map((s) => s.toLowerCase()));
      result = result.filter((r) => selected.has(r.source.toLowerCase()));
    }

    // Apply date range filter
    if (filters.dateRange?.from) {
      const from = new Date(filters.dateRange.from).setHours(0, 0, 0, 0);
      const to = filters.dateRange.to
        ? new Date(filters.dateRange.to).setHours(23, 59, 59, 999)
        : new Date(filters.dateRange.from).setHours(23, 59, 59, 999);
      result = result.filter((r) => {
        const d = new Date(r.review_date).getTime();
        return d >= from && d <= to;
      });
    }

    // Apply sorting - featured reviews always come first
    result.sort((a, b) => {
      // Featured reviews always at the top
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // Then apply the selected sort within each group
      switch (filters.sort) {
        case "oldest":
          return new Date(a.review_date).getTime() - new Date(b.review_date).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        case "newest":
        default:
          return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
      }
    });

    return result;
  }, [reviews, filters]);

  // Paginated reviews
  const displayedReviews = useMemo(
    () => filteredReviews.slice(0, displayCount),
    [filteredReviews, displayCount]
  );

  const hasMore = displayCount < filteredReviews.length;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => prev + REVIEWS_PER_PAGE);
  }, []);

  const handleFiltersChange = useCallback((newFilters: ReviewFilters) => {
    setFilters(newFilters);
    setDisplayCount(REVIEWS_PER_PAGE); // Reset pagination on filter change
  }, []);

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
