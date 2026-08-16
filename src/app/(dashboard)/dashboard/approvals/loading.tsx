import { PageHeaderSkeleton, StatsRowSkeleton, TableSkeleton } from "@/components/shared";

export default function ApprovalsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <PageHeaderSkeleton titleWidth="w-32" subtitleWidth="w-[30rem]" />

      <StatsRowSkeleton count={3} />
      <TableSkeleton rows={5} columns={4} />
    </div>
  );
}
