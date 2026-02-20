import { Suspense } from "react";
import { StatsRowSkeleton, ReviewListSkeleton, ChartSkeleton, EmptyState, EmptyStateCard } from "@/components/shared";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  UserStatsCards,
  UserTrendChart,
  UserRecentReviews,
  UserQuickActions,
} from "@/components/dashboard";
import { ManagerDashboardClient } from "@/components/dashboard/manager";
import {
  GamificationStatsCard,
  BadgeShowcase,
  ReputationBreakdownCard,
  ImprovementTipsCard,
  ProfileCompletionCard,
  CompactProfileLeaderboard,
} from "@/components/gamification";
import {
  getUserMetrics,
  getUserRecentReviews,
  getRatingTrend,
  getNPSTrend,
  getUserComparison,
  getFilterOptions,
} from "@/lib/dashboard";
import { getCurrentUser } from "@/lib/users/actions";
import { getAccessContext, isManagerOrAbove } from "@/lib/access";

export const metadata = {
  title: "Dashboard | RepWell",
  description: "Your RepWell dashboard overview",
};

// Check if user is new (no data yet)
function isNewUser(metrics: { totalReviews: number; averageRating: number; npsScore: number; responseRate: number }) {
  return metrics.totalReviews === 0 && metrics.averageRating === 0 && metrics.npsScore === 0;
}

// Server component for stats cards
async function DashboardStats() {
  const result = await getUserMetrics();

  const isEmpty = !result.success || (result.data != null && isNewUser(result.data));
  if (isEmpty) {
    return (
      <EmptyState
        iconName="bar-chart"
        title="Your stats will appear here"
        description="Once you start collecting reviews and survey responses, you'll see your performance metrics displayed here."
        actions={[
          { label: "Send Your First Survey", href: "/dashboard/requests", iconName: "send" },
          { label: "Import Reviews", href: "/dashboard/reviews", variant: "outline" },
        ]}
      />
    );
  }

  return <UserStatsCards metrics={result.data!} />;
}

// Server component that fetches data and renders the manager team overview
async function ManagerDashboardSection() {
  const [comparisonResult, filterResult] = await Promise.all([
    getUserComparison(),
    getFilterOptions(),
  ]);

  if (!comparisonResult.success || !filterResult.success) return null;

  return (
    <ManagerDashboardClient
      initialComparison={comparisonResult.data ?? []}
      filterOptions={filterResult.data!}
    />
  );
}

// Server component for rating trend chart
async function RatingTrendChart() {
  const result = await getRatingTrend(undefined, 6);

  // Check if we have actual data points with non-zero values
  const hasData = result.success && result.data && result.data.some(d => d.value > 0);

  if (!hasData) {
    return (
      <EmptyStateCard
        iconName="trending-up"
        title="No rating data yet"
        description="Your rating trends will appear once you collect reviews"
        className="h-[280px]"
      />
    );
  }

  return (
    <UserTrendChart
      data={result.data!}
      title="Rating Trend"
      color="hsl(var(--chart-1))"
      type="rating"
    />
  );
}

// Server component for NPS trend chart
async function NPSTrendChart() {
  const result = await getNPSTrend(undefined, 6);

  // Check if we have actual data points with non-zero values
  const hasData = result.success && result.data && result.data.some(d => d.value !== 0);

  if (!hasData) {
    return (
      <EmptyStateCard
        iconName="users"
        title="No NPS data yet"
        description="Send surveys to start tracking your NPS score"
        className="h-[280px]"
      />
    );
  }

  return (
    <UserTrendChart
      data={result.data!}
      title="NPS Trend"
      color="hsl(var(--chart-2))"
      type="nps"
    />
  );
}

// Server component for recent reviews
async function RecentReviewsList() {
  const result = await getUserRecentReviews(undefined, 5);

  // Even if the call fails, show the component with empty state instead of error
  return <UserRecentReviews initialReviews={result.success ? (result.data || []) : []} />;
}


export default async function DashboardPage() {
  const [userResult, ctx] = await Promise.all([
    getCurrentUser(),
    getAccessContext(),
  ]);
  const userName = userResult.success ? userResult.data?.fullName : null;
  const isManager = ctx != null && isManagerOrAbove(ctx);

  return (
    <div className="flex-1 space-y-8">
      {/* Page header */}
      <DashboardHeader userName={userName} />

      {/* Stats cards */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Manager team overview — shown for admin/manager roles */}
      {isManager && (
        <section>
          <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-muted" />}>
            <ManagerDashboardSection />
          </Suspense>
        </section>
      )}

      {/* Gamification progress */}
      <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
        <GamificationStatsCard />
      </Suspense>

      {/* Charts grid */}
      <section>
        <h2 className="text-heading-sm font-semibold text-repwell-teal-500 mb-4">
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

          <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
            <ReputationBreakdownCard />
          </Suspense>

          <div className="grid gap-6 md:grid-cols-2">
            <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
              <ImprovementTipsCard />
            </Suspense>
            <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
              <BadgeShowcase />
            </Suspense>
          </div>
        </div>

        {/* Sidebar - quick actions and profile completion */}
        <div className="space-y-6">
          <UserQuickActions />
          <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
            <ProfileCompletionCard showMilestones={true} showTips={true} />
          </Suspense>
          <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
            <CompactProfileLeaderboard limit={5} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
