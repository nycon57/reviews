import { Suspense } from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { checkPageAccess } from "@/lib/access";

const CompetitorPagesAnalyticsDashboard = dynamic(
  () =>
    import("./competitor-pages-dashboard").then(
      (mod) => mod.CompetitorPagesAnalyticsDashboard,
    ),
);

export const metadata: Metadata = {
  title: "Competitor Pages Analytics | RepWell",
  description:
    "A/B testing results, conversion rates, and engagement metrics for competitor comparison pages",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default async function CompetitorPagesAnalyticsPage() {
  // Requires admin or manager role
  await checkPageAccess({ minRole: "manager" });

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Competitor Pages Analytics
        </h1>
        <p className="text-muted-foreground">
          A/B test performance, conversion rates, and traffic insights for
          comparison pages
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <CompetitorPagesAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
