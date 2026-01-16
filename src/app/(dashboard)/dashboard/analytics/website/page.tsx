import { Suspense } from "react";
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import for heavy dashboard with recharts (Suspense handles loading)
const WebsiteAnalyticsDashboard = dynamic(
  () => import("./website-analytics-dashboard").then((mod) => mod.WebsiteAnalyticsDashboard)
);

export const metadata: Metadata = {
  title: "Website Analytics | RepWell",
  description: "Track website performance and SEO metrics",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function WebsiteAnalyticsPage() {
  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Website Analytics</h1>
        <p className="text-muted-foreground">
          Track visitor analytics, search performance, and technical SEO health
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <WebsiteAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
