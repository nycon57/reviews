import { Skeleton } from "@/components/ui/skeleton";
import { ReviewListSkeleton, StatsRowSkeleton } from "@/components/shared";

export default function ReviewsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>

      <StatsRowSkeleton />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-12 w-full" />
      <ReviewListSkeleton count={5} />
    </div>
  );
}
