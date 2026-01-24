import { Suspense } from "react";
import { StatsRowSkeleton, ReviewListSkeleton, ChartSkeleton, EmptyState, EmptyStateCard } from "@/components/shared";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
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
import { getCurrentUser } from "@/lib/users/actions";

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
  const result = await getLoanOfficerMetrics();

  if (!result.success) {
    // Show empty state for new users instead of error
    return (
      <EmptyState
        iconName="bar-chart"
        title="Your stats will appear here"
        description="Once you start collecting reviews and survey responses, you'll see your performance metrics displayed here."
        actions={[
          { label: "Send Your First Survey", href: "/dashboard/send", iconName: "send" },
          { label: "Import Reviews", href: "/dashboard/reviews", variant: "outline" },
        ]}
      />
    );
  }

  // Check if user has no data yet (new user)
  if (result.data && isNewUser(result.data)) {
    return (
      <EmptyState
        iconName="bar-chart"
        title="Your stats will appear here"
        description="Once you start collecting reviews and survey responses, you'll see your performance metrics displayed here."
        actions={[
          { label: "Send Your First Survey", href: "/dashboard/send", iconName: "send" },
          { label: "Import Reviews", href: "/dashboard/reviews", variant: "outline" },
        ]}
      />
    );
  }

  return <LOStatsCards metrics={result.data!} />;
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
    <LOTrendChart
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
    <LOTrendChart
      data={result.data!}
      title="NPS Trend"
      color="hsl(var(--chart-2))"
      type="nps"
    />
  );
}

// Server component for recent reviews
async function RecentReviewsList() {
  const result = await getLoanOfficerRecentReviews(undefined, 5);

  // Even if the call fails, show the component with empty state instead of error
  return <LORecentReviews initialReviews={result.success ? (result.data || []) : []} />;
}


export default async function DashboardPage() {
  const userResult = await getCurrentUser();
  const userName = userResult.success ? userResult.data?.fullName : null;

  return (
    <div className="flex-1 space-y-8">
      {/* Page header */}
      <DashboardHeader userName={userName} />

      {/* Stats cards */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Gamification progress */}
      <GamificationStatsCard />

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
