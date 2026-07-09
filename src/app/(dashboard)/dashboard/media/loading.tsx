import { CardSkeleton, PageHeaderSkeleton, StatsRowSkeleton } from "@/components/shared";

export default function MediaLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withIcon={false} titleWidth="w-40" subtitleWidth="w-[32rem]" />

      <StatsRowSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton key={index} className="h-48" />
        ))}
      </div>
    </div>
  );
}
