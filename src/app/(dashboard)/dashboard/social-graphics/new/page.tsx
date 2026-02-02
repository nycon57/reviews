import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NewGraphicForm } from "@/components/social-graphics/new-graphic-form";
import { getReviewsForGeneration, getOrgName } from "@/lib/social-graphics/actions";

export const metadata = {
  title: "New Graphic | Social Graphics | RepWell",
  description: "Create a new social proof graphic",
};

async function NewGraphicLoader() {
  const [reviewsResult, orgNameResult] = await Promise.all([
    getReviewsForGeneration({ minRating: 4, limit: 50 }),
    getOrgName(),
  ]);

  return (
    <NewGraphicForm
      reviews={reviewsResult.success ? reviewsResult.data : []}
      orgName={orgNameResult.success ? orgNameResult.data : "Your Company"}
    />
  );
}

export default function NewGraphicPage() {
  return (
    <div className="flex-1 py-8">
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        }
      >
        <NewGraphicLoader />
      </Suspense>
    </div>
  );
}
