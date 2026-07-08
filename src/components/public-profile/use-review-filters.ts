"use client";

import { useCallback, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";

export interface ReviewFilters {
  search: string;
  rating: number | null;
  sources: string[];
  dateRange: DateRange | undefined;
  sort: "newest" | "oldest" | "highest" | "lowest";
}

export interface FilterableReview {
  rating: number;
  review_date: string;
  source?: string | null;
  featured?: boolean | null;
  text?: string | null;
  title?: string | null;
  customer_name?: string | null;
  customer_location?: string | null;
}

const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_REVIEW_FILTERS: ReviewFilters = {
  search: "",
  rating: null,
  sources: [],
  dateRange: undefined,
  sort: "newest",
};

export function getReviewSources<TReview extends FilterableReview>(
  reviews: TReview[]
) {
  const sourceSet = new Set(
    reviews.map((review) => (review.source || "").toLowerCase()).filter(Boolean)
  );

  return Array.from(sourceSet).filter(
    (source) => source !== "internal" && source !== "survey"
  );
}

export function filterAndSortReviews<TReview extends FilterableReview>(
  reviews: TReview[],
  filters: ReviewFilters
) {
  let result = [...reviews];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (review) =>
        review.text?.toLowerCase().includes(searchLower) ||
        review.title?.toLowerCase().includes(searchLower) ||
        review.customer_name?.toLowerCase().includes(searchLower) ||
        review.customer_location?.toLowerCase().includes(searchLower)
    );
  }

  if (filters.rating !== null) {
    result = result.filter((review) => review.rating >= filters.rating!);
  }

  if (filters.sources.length > 0) {
    const selected = new Set(filters.sources.map((source) => source.toLowerCase()));
    result = result.filter((review) =>
      selected.has((review.source || "").toLowerCase())
    );
  }

  if (filters.dateRange?.from) {
    const from = new Date(filters.dateRange.from).setHours(0, 0, 0, 0);
    const to = filters.dateRange.to
      ? new Date(filters.dateRange.to).setHours(23, 59, 59, 999)
      : new Date(filters.dateRange.from).setHours(23, 59, 59, 999);

    result = result.filter((review) => {
      const reviewDate = new Date(review.review_date).getTime();
      return reviewDate >= from && reviewDate <= to;
    });
  }

  result.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    switch (filters.sort) {
      case "oldest":
        return (
          new Date(a.review_date).getTime() - new Date(b.review_date).getTime()
        );
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      case "newest":
      default:
        return (
          new Date(b.review_date).getTime() - new Date(a.review_date).getTime()
        );
    }
  });

  return result;
}

export function useReviewFilters<TReview extends FilterableReview>(
  reviews: TReview[],
  pageSize = DEFAULT_PAGE_SIZE
) {
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_REVIEW_FILTERS);
  const [displayCount, setDisplayCount] = useState(pageSize);

  const sources = useMemo(() => getReviewSources(reviews), [reviews]);

  const filteredReviews = useMemo(
    () => filterAndSortReviews(reviews, filters),
    [reviews, filters]
  );

  const displayedReviews = useMemo(
    () => filteredReviews.slice(0, displayCount),
    [filteredReviews, displayCount]
  );

  const hasMore = displayCount < filteredReviews.length;

  const loadMore = useCallback(() => {
    setDisplayCount((previous) => previous + pageSize);
  }, [pageSize]);

  const handleFiltersChange = useCallback(
    (nextFilters: ReviewFilters) => {
      setFilters(nextFilters);
      setDisplayCount(pageSize);
    },
    [pageSize]
  );

  return {
    filters,
    sources,
    filteredReviews,
    displayedReviews,
    displayCount,
    hasMore,
    loadMore,
    handleFiltersChange,
  };
}
