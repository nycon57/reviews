import { CardSkeleton, ChartSkeleton, PageHeaderSkeleton, StatsRowSkeleton } from "@/components/shared";

export default function AnalyticsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <PageHeaderSkeleton titleWidth="w-36" subtitleWidth="w-64" />

      <StatsRowSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <CardSkeleton className="h-[350px]" />
    </div>
  );
}
