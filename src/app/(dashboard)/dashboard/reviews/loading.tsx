import { PageHeaderSkeleton, ReviewsHubFallback } from "@/components/shared";

export default function ReviewsLoading() {
  return (
    <div className="flex-1 space-y-6">
      <PageHeaderSkeleton titleWidth="w-32" subtitleWidth="w-72" />
      <ReviewsHubFallback />
    </div>
  );
}
