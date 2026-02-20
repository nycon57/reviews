import {
  Sparkle as Sparkles,
} from "@phosphor-icons/react/dist/ssr";
import { ChartSkeleton, CardSkeleton } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";

export default function InsightsLoading() {
  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered analysis of your customer feedback and performance trends
          </p>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Summary and distribution row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton className="h-[350px]" />
        <CardSkeleton className="h-[350px]" />
      </div>

      {/* Sentiment trend chart */}
      <ChartSkeleton />

      {/* Theme and key phrases row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton className="h-[400px]" />
        <CardSkeleton className="h-[400px]" />
      </div>

      {/* Improvement recommendations */}
      <CardSkeleton className="h-[400px]" />
    </div>
  );
}
