import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { StatsRowSkeleton, ReviewListSkeleton, ChartSkeleton } from "@/components/shared";
import {
  LOStatsCards,
  LOTrendChart,
  LORecentReviews,
  LOQuickActions,
} from "@/components/dashboard";
import {
  GamificationStatsCard,
  BadgeShowcase,
  ReputationBreakdownCard,
  ImprovementTipsCard,
  ProfileCompletionCard,
  CompactProfileLeaderboard,
} from "@/components/gamification";
import {
  getLoanOfficerMetrics,
  getLoanOfficerRecentReviews,
  getRatingTrend,
  getNPSTrend,
} from "@/lib/dashboard";

export const metadata = {
  title: "Dashboard | ReviewHub",
  description: "Your ReviewHub dashboard overview",
};

// Server component for stats cards
async function DashboardStats() {
  const result = await getLoanOfficerMetrics();

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load metrics. Please try refreshing the page.
      </div>
    );
  }

  return <LOStatsCards metrics={result.data} />;
}

// Server component for rating trend chart
async function RatingTrendChart() {
  const result = await getRatingTrend(undefined, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return (
    <LOTrendChart
      data={result.data}
      title="Rating Trend"
      color="hsl(var(--chart-1))"
      type="rating"
    />
  );
}

// Server component for NPS trend chart
async function NPSTrendChart() {
  const result = await getNPSTrend(undefined, 6);

  if (!result.success || !result.data) {
    return null;
  }

  return (
    <LOTrendChart
      data={result.data}
      title="NPS Trend"
      color="hsl(var(--chart-2))"
      type="nps"
    />
  );
}

// Server component for recent reviews
async function RecentReviewsList() {
  const result = await getLoanOfficerRecentReviews(undefined, 5);

  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load reviews.
      </div>
    );
  }

  return <LORecentReviews initialReviews={result.data || []} />;
}


export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-lg font-bold tracking-tight text-brand-navy">
            Dashboard
          </h1>
          <p className="text-body-base text-brand-slate mt-1">
            Welcome back! Here&apos;s an overview of your performance.
          </p>
        </div>
        <Button variant="brand" asChild>
          <a href="/dashboard/distribution">
            <Send className="mr-2 h-4 w-4" />
            Send Survey
          </a>
        </Button>
      </div>

      {/* Stats cards */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Gamification progress */}
      <GamificationStatsCard />

      {/* Charts grid */}
      <section>
        <h2 className="text-heading-sm font-semibold text-brand-navy mb-4">
          Performance Trends
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartSkeleton />}>
            <RatingTrendChart />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <NPSTrendChart />
          </Suspense>
        </div>
      </section>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ReviewListSkeleton count={5} />}>
            <RecentReviewsList />
          </Suspense>

          <ReputationBreakdownCard />

          <div className="grid gap-6 md:grid-cols-2">
            <ImprovementTipsCard />
            <BadgeShowcase />
          </div>
        </div>

        {/* Sidebar - quick actions and profile completion */}
        <div className="space-y-6">
          <LOQuickActions />
          <ProfileCompletionCard showMilestones={true} showTips={true} />
          <CompactProfileLeaderboard limit={5} />
        </div>
      </div>
    </div>
  );
}
