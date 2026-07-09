import { Skeleton } from "@/components/ui/skeleton";
import { ReviewListSkeleton, StatsRowSkeleton } from "@/components/shared";

export default function NotificationsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>

      <StatsRowSkeleton count={3} />
      <ReviewListSkeleton count={6} />
    </div>
  );
}
