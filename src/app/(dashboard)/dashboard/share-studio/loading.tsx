import { Skeleton } from "@/components/ui/skeleton";
import { StatsRowSkeleton, TableSkeleton } from "@/components/shared";

export default function ShareStudioLoading() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
      </div>

      <StatsRowSkeleton count={3} />
      <Skeleton className="h-11 w-full rounded-none" />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
