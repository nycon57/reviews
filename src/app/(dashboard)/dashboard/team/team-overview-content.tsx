import { Suspense } from "react";
import { StatsRowSkeleton, ChartSkeleton, CardSkeleton } from "@/components/shared";
import {
  TeamStatsCards,
  UserTrendChart,
  PerformanceLeaderboard,
  PerformanceAlerts,
  ManagerDashboardClient,
} from "@/components/dashboard";
import { EnhancedLeaderboard } from "@/components/gamification";
import {
  getTeamMetrics,
  getUserComparison,
  getFilterOptions,
  getLeaderboard,
  getLowPerformers,
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

async function LeaderboardSection() {
  const result = await getLeaderboard(5, "reputation");

  if (!result.success || !result.data) {
    return null;
  }

  return <PerformanceLeaderboard data={result.data} />;
}

async function AlertsSection() {
  const result = await getLowPerformers();

  if (!result.success || !result.data) {
    return null;
  }

  return <PerformanceAlerts data={result.data} />;
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

      {/* Chart (2/3) + Mini Leaderboard (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <TeamRatingTrendChart />
          </Suspense>
        </div>
        <Suspense fallback={<CardSkeleton className="h-[300px]" />}>
          <LeaderboardSection />
        </Suspense>
      </div>

      {/* Alerts */}
      <Suspense fallback={<CardSkeleton className="h-[200px]" />}>
        <AlertsSection />
      </Suspense>

      {/* Enhanced Leaderboard */}
      <EnhancedLeaderboard filterOptions={initialData.filters} />

      {/* Comparison table with client-side filtering */}
      <ManagerDashboardClient
        initialComparison={initialData.comparison}
        filterOptions={initialData.filters}
      />
    </div>
  );
}
