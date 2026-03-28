import { Suspense } from "react";
import { DashboardEntrance } from "@/components/dashboard/dashboard-entrance";
import { StatsRowSkeleton, ReviewListSkeleton, CardSkeleton, EmptyState } from "@/components/shared";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  UserStatsCards,
  UserRecentReviews,
  UserQuickActions,
} from "@/components/dashboard";
import {
  GamificationStatsCard,
  ReputationBreakdownCard,
  ProfileCompletionCard,
} from "@/components/gamification";
import {
  getUserMetrics,
  getUserRecentReviews,
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
  const result = await getUserMetrics();

  const isEmpty = !result.success || (result.data != null && isNewUser(result.data));
  if (isEmpty) {
    return (
      <EmptyState
        iconName="bar-chart"
        title="Your stats will appear here"
        description="Once you start collecting reviews and survey responses, you'll see your performance metrics displayed here."
        actions={[
          { label: "Send Your First Survey", href: "/dashboard/reviews?tab=requests", iconName: "send" },
          { label: "Import Reviews", href: "/dashboard/reviews", variant: "outline" },
        ]}
      />
    );
  }

  return <UserStatsCards metrics={result.data!} />;
}

// Server component for recent reviews
async function RecentReviewsList() {
  const result = await getUserRecentReviews(undefined, 3);

  // Even if the call fails, show the component with empty state instead of error
  return <UserRecentReviews initialReviews={result.success ? (result.data || []) : []} />;
}

function FullProfileCompletionCard() {
  return <ProfileCompletionCard showMilestones showTips />;
}


export default async function DashboardPage() {
  const userResult = await getCurrentUser();
  const user = userResult.success ? userResult.data : null;
  const userName = user?.fullName ?? null;

  return (
    <DashboardEntrance className="flex-1 space-y-8">
      {/* Page header with Send Review Request CTA */}
      <DashboardHeader userName={userName} />

      {/* Stats cards */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Quick Actions */}
      <UserQuickActions profileSlug={user?.slug ?? null} userName={userName} />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ReviewListSkeleton count={3} />}>
            <RecentReviewsList />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <ReputationBreakdownCard />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Suspense fallback={<CardSkeleton />}>
            <GamificationStatsCard layout="vertical" />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <FullProfileCompletionCard />
          </Suspense>
        </div>
      </div>

    </DashboardEntrance>
  );
}
