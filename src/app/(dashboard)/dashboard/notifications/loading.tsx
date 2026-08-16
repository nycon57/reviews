import { PageHeaderSkeleton, ReviewListSkeleton, StatsRowSkeleton } from "@/components/shared";

export default function NotificationsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <PageHeaderSkeleton withIcon={false} titleWidth="w-40" subtitleWidth="w-64" />

      <StatsRowSkeleton count={3} />
      <ReviewListSkeleton count={6} />
    </div>
  );
}
