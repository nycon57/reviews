import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton, StatsRowSkeleton } from "@/components/shared";

export default function MediaLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>

      <StatsRowSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton key={index} className="h-48" />
        ))}
      </div>
    </div>
  );
}
