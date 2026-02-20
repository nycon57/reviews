import { Suspense } from "react";
import { StatsRowSkeleton, ChartSkeleton } from "@/components/shared";
import {
  TeamStatsCards,
  UserTrendChart,
  ManagerDashboardClient,
} from "@/components/dashboard";
import { EnhancedLeaderboard } from "@/components/gamification";
import {
  getTeamMetrics,
  getUserComparison,
  getFilterOptions,
  getTeamRatingTrend,
} from "@/lib/dashboard";

async function TeamStats() {
  const result = await getTeamMetrics();

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load team metrics. Please try refreshing the page.
      </div>
    );
  }

  return <TeamStatsCards metrics={result.data} />;
}

async function TeamRatingTrendChart() {
  const result = await getTeamRatingTrend(6);

  if (!result.success || !result.data) {
    return null;
  }

  return (
    <UserTrendChart
      data={result.data}
      title="Team Rating Trend"
      color="hsl(var(--chart-1))"
      type="rating"
    />
  );
}

async function getInitialData() {
  const [comparisonResult, filterResult] = await Promise.all([
    getUserComparison(),
    getFilterOptions(),
  ]);

  return {
    comparison: comparisonResult.success ? comparisonResult.data || [] : [],
    filters: filterResult.success
      ? filterResult.data || { branches: [], regions: [] }
      : { branches: [], regions: [] },
  };
}

export async function TeamOverviewContent() {
  const initialData = await getInitialData();

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <TeamStats />
      </Suspense>

      {/* Rating trend + Leaderboard — two column */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <TeamRatingTrendChart />
        </Suspense>
        <EnhancedLeaderboard filterOptions={initialData.filters} />
      </div>

      {/* Comparison table with client-side filtering */}
      <ManagerDashboardClient
        initialComparison={initialData.comparison}
        filterOptions={initialData.filters}
      />
    </div>
  );
}
