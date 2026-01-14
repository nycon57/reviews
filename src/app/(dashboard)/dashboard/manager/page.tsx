import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsRowSkeleton, ChartSkeleton, CardSkeleton } from "@/components/shared";
import {
  TeamStatsCards,
  PerformanceLeaderboard,
  PerformanceAlerts,
  LOTrendChart,
} from "@/components/dashboard";
import { EnhancedLeaderboard } from "@/components/gamification";
import { ManagerDashboardClient } from "./manager-dashboard-client";
import {
  getTeamMetrics,
  getLoanOfficerComparison,
  getFilterOptions,
  getLeaderboard,
  getLowPerformers,
  getTeamRatingTrend,
} from "@/lib/dashboard";

export const metadata = {
  title: "Manager Dashboard | ReviewHub",
  description: "Team performance overview and analytics",
};

// Check if user is a manager or admin
async function checkManagerAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "manager" || userData?.role === "admin";
}

// Server component for team stats
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

// Server component for team rating trend
async function TeamRatingTrendChart() {
  const result = await getTeamRatingTrend(6);

  if (!result.success || !result.data) {
    return null;
  }

  return (
    <LOTrendChart
      data={result.data}
      title="Team Rating Trend"
      color="hsl(var(--chart-1))"
      type="rating"
    />
  );
}

// Server component for leaderboard
async function LeaderboardSection() {
  const result = await getLeaderboard(5, "reputation");

  if (!result.success || !result.data) {
    return null;
  }

  return <PerformanceLeaderboard data={result.data} />;
}

// Server component for alerts
async function AlertsSection() {
  const result = await getLowPerformers();

  if (!result.success || !result.data) {
    return null;
  }

  return <PerformanceAlerts data={result.data} />;
}

// Server component for initial comparison data
async function getInitialData() {
  const [comparisonResult, filterResult] = await Promise.all([
    getLoanOfficerComparison(),
    getFilterOptions(),
  ]);

  return {
    comparison: comparisonResult.success ? comparisonResult.data || [] : [],
    filters: filterResult.success ? filterResult.data || { branches: [], regions: [] } : { branches: [], regions: [] },
  };
}

export default async function ManagerDashboardPage() {
  // Check access
  const hasAccess = await checkManagerAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Get initial data for client component
  const initialData = await getInitialData();

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">
            Team performance overview and analytics
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <TeamStats />
      </Suspense>

      {/* Main content grid - 2/3 chart + 1/3 leaderboard */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <TeamRatingTrendChart />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<CardSkeleton className="h-[300px]" />}>
            <LeaderboardSection />
          </Suspense>
        </div>
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
