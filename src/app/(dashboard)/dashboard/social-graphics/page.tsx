import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GraphicsList } from "@/components/social-graphics/graphics-list";
import { getGraphics, getReviewsForGeneration } from "@/lib/social-graphics/actions";

export const metadata = {
  title: "Social Graphics | RepWell",
  description: "Create and manage social proof graphics",
};

async function GraphicsLoader() {
  const [graphicsResult, reviewsResult] = await Promise.all([
    getGraphics(),
    getReviewsForGeneration({ minRating: 4, limit: 50 }),
  ]);

  return (
    <GraphicsList
      graphics={graphicsResult.success ? graphicsResult.data : []}
      reviews={reviewsResult.success ? reviewsResult.data : []}
    />
  );
}

function GraphicsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function SocialGraphicsPage() {
  return (
    <div className="flex-1 py-8">
      <Suspense fallback={<GraphicsListSkeleton />}>
        <GraphicsLoader />
      </Suspense>
    </div>
  );
}
