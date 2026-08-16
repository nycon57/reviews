import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, StatsRowSkeleton, TableSkeleton } from "@/components/shared";

export default function ShareStudioLoading() {
  return (
    <div className="flex-1 space-y-6">
      <PageHeaderSkeleton className="items-start" titleWidth="w-40" subtitleWidth="w-[28rem]" />

      <StatsRowSkeleton count={3} />
      <Skeleton className="h-11 w-full rounded-none" />
      <TableSkeleton rows={6} columns={5} />
    </div>
  );
}
