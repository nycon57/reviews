import { ReviewAggregationDashboard } from "@/components/reviews/review-aggregation-dashboard";
import {
  getAggregatedReviews,
  getReviewAggregationStats,
} from "@/lib/reviews/aggregation-actions";
import { getLoanOfficersForFilter } from "@/lib/reviews/actions";

export const metadata = {
  title: "All Reviews | ReviewHub",
  description: "View and manage all reviews from all sources in one unified dashboard",
};

export default async function AllReviewsPage() {
  // Fetch initial data server-side in parallel
  const [reviewsResult, statsResult, loanOfficersResult] = await Promise.all([
    getAggregatedReviews({ page: 1, limit: 20 }),
    getReviewAggregationStats(),
    getLoanOfficersForFilter(),
  ]);

  const initialReviews = reviewsResult.success ? reviewsResult.data?.reviews ?? [] : [];
  const initialTotal = reviewsResult.success ? reviewsResult.data?.total ?? 0 : 0;
  const initialStats = statsResult.success
    ? statsResult.data ?? {
        total: 0,
        bySource: {},
        byStatus: {},
        byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageRating: 0,
        withResponse: 0,
        featuredCount: 0,
      }
    : {
        total: 0,
        bySource: {},
        byStatus: {},
        byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        averageRating: 0,
        withResponse: 0,
        featuredCount: 0,
      };
  const loanOfficers = loanOfficersResult.success ? loanOfficersResult.data ?? [] : [];

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Reviews</h1>
          <p className="text-muted-foreground">
            Unified view of all reviews from surveys, Google, and other sources
          </p>
        </div>
      </div>

      {/* Aggregation Dashboard Component */}
      <ReviewAggregationDashboard
        initialReviews={initialReviews}
        initialTotal={initialTotal}
        initialStats={initialStats}
        loanOfficers={loanOfficers}
      />
    </div>
  );
}
