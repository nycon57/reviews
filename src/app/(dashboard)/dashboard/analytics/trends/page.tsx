import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access";
import { ChartSkeleton, CardSkeleton } from "@/components/shared";
import { TrendsPageClient } from "@/components/analytics/trends-page-client";

export const metadata = {
  title: "Analytics Trends | RepWell",
  description: "Track performance trends over time",
};

export default async function TrendsPage() {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");
  const role = ctx.role;

  return (
    <div className="flex-1">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </div>
        }
      >
        <TrendsPageClient userRole={role} />
      </Suspense>
    </div>
  );
}
