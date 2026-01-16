import { Suspense } from "react";
import { PlanSelectionClient } from "./plan-selection-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Select Your Plan | RepWell",
  description: "Choose the plan that fits your needs",
};

function PlanSelectionSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function PlanSelectionPage() {
  return (
    <Suspense fallback={<PlanSelectionSkeleton />}>
      <PlanSelectionClient />
    </Suspense>
  );
}
