import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton, ChartSkeleton, StatsRowSkeleton } from "@/components/shared";

export default function AnalyticsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>

      <StatsRowSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <CardSkeleton className="h-[350px]" />
    </div>
  );
}
