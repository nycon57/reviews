import { ReviewQueue } from "@/components/reviews/review-queue";
import {
  getReviews,
  getReviewStats,
  getLoanOfficersForFilter,
} from "@/lib/reviews/actions";

export const metadata = {
  title: "Reviews | ReviewHub",
  description: "View and manage all customer reviews",
};

export default async function ReviewsPage() {
  // Fetch initial data server-side
  const [reviewsResult, statsResult, loanOfficersResult] = await Promise.all([
    getReviews({ status: "all" }),
    getReviewStats(),
    getLoanOfficersForFilter(),
  ]);

  const initialReviews = reviewsResult.success ? reviewsResult.data?.reviews ?? [] : [];
  const initialTotal = reviewsResult.success ? reviewsResult.data?.total ?? 0 : 0;
  const initialStats = statsResult.success
    ? statsResult.data ?? { pending: 0, approved: 0, rejected: 0, total: 0 }
    : { pending: 0, approved: 0, rejected: 0, total: 0 };
  const loanOfficers = loanOfficersResult.success
    ? loanOfficersResult.data ?? []
    : [];

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">
            Manage and approve customer reviews
          </p>
        </div>
      </div>

      {/* Review Queue Component */}
      <ReviewQueue
        initialReviews={initialReviews}
        initialTotal={initialTotal}
        loanOfficers={loanOfficers}
        initialStats={initialStats}
      />
    </div>
  );
}
