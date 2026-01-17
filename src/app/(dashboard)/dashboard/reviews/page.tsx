import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getReviewStats,
  getLoanOfficersForFilter,
} from "@/lib/reviews/actions";
import {
  getAggregatedReviews,
  getReviewAggregationStats,
} from "@/lib/reviews/aggregation-actions";
import { getCurrentOrganization } from "@/lib/organization/actions";
import { TIER_FEATURES } from "@/lib/organization/types";

// Dynamic import for heavy ReviewQueue component (1,260 lines)
const ReviewQueue = dynamic(
  () => import("@/components/reviews/review-queue").then((mod) => mod.ReviewQueue),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-12" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    ),
  }
);

export const metadata = {
  title: "Reviews | RepWell",
  description: "View and manage all customer reviews",
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const initialReviewId = params?.id;

  // Fetch initial data server-side
  const [reviewsResult, statsResult, aggregatedStatsResult, loanOfficersResult, orgResult] = await Promise.all([
    getAggregatedReviews({ page: 1, limit: 20 }),
    getReviewStats(),
    getReviewAggregationStats(),
    getLoanOfficersForFilter(),
    getCurrentOrganization(),
  ]);

  const initialReviews = reviewsResult.success ? reviewsResult.data?.reviews ?? [] : [];
  const initialTotal = reviewsResult.success ? reviewsResult.data?.total ?? 0 : 0;
  const initialStats = statsResult.success
    ? statsResult.data ?? { pending: 0, approved: 0, rejected: 0, total: 0 }
    : { pending: 0, approved: 0, rejected: 0, total: 0 };
  const initialAggregatedStats = aggregatedStatsResult.success
    ? aggregatedStatsResult.data ?? undefined
    : undefined;
  const loanOfficers = loanOfficersResult.success
    ? loanOfficersResult.data ?? []
    : [];

  // Determine AI access based on subscription tier
  const subscriptionTier = orgResult.organization?.subscription_tier ?? "free";
  const hasAiAccess = TIER_FEATURES[subscriptionTier]?.ai_insights ?? false;

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
        initialAggregatedStats={initialAggregatedStats}
        initialReviewId={initialReviewId}
        hasAiAccess={hasAiAccess}
      />
    </div>
  );
}
