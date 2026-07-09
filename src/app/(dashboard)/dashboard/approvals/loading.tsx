import { Skeleton } from "@/components/ui/skeleton";
import { StatsRowSkeleton, TableSkeleton } from "@/components/shared";

export default function ApprovalsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-[30rem] max-w-full" />
        </div>
      </div>

      <StatsRowSkeleton count={3} />
      <TableSkeleton rows={5} columns={4} />
    </div>
  );
}
