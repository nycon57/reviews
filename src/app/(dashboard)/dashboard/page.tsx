import { Suspense } from "react";
import { DashboardEntrance } from "@/components/dashboard/dashboard-entrance";
import { StatsRowSkeleton, ReviewListSkeleton, ChartSkeleton, CardSkeleton, EmptyState, EmptyStateCard, IconContainer } from "@/components/shared";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  UserStatsCards,
  UserTrendChart,
  UserRecentReviews,
  UserQuickActions,
} from "@/components/dashboard";
import {
  GamificationStatsCard,
  BadgeShowcase,
  ReputationBreakdownCard,
  ImprovementTipsCard,
  ProfileCompletionCard,
} from "@/components/gamification";
import {
  getUserMetrics,
  getUserRecentReviews,
  getRatingTrend,
  getNPSTrend,
} from "@/lib/dashboard";
import { getCurrentUser } from "@/lib/users/actions";
import { getAccessContext, hasProAccess } from "@/lib/access";
import { getSmartActionItems, getLOPerformanceScorecard } from "@/lib/ai";
import { SmartActionsCard, PerformanceScorecard } from "@/components/insights";
import { ShareStudioCards } from "@/components/dashboard/share-studio-cards";
import { TrendUp, ShareNetwork } from "@phosphor-icons/react/dist/ssr";

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

// Server component for smart action items (Pro tier only)
async function SmartActionsSection({ userId }: { userId?: string }) {
  const result = await getSmartActionItems(userId);

  if (!result.success || !result.data) {
    return null;
  }

  return <SmartActionsCard data={result.data} />;
}

// Server component for performance scorecard (Pro tier only)
async function PerformanceScorecardSection({ userId }: { userId: string }) {
  const result = await getLOPerformanceScorecard(userId);

  if (!result.success || !result.data) {
    return null;
  }

  return <PerformanceScorecard data={result.data} />;
}

function FullProfileCompletionCard() {
  return <ProfileCompletionCard showMilestones showTips />;
}


export default async function DashboardPage() {
  const [userResult, ctx] = await Promise.all([
    getCurrentUser(),
    getAccessContext(),
  ]);
  const user = userResult.success ? userResult.data : null;
  const userName = user?.fullName ?? null;
  const isPro = ctx ? hasProAccess(ctx) : false;

  return (
    <DashboardEntrance className="flex-1 space-y-8">
      {/* Page header */}
      <DashboardHeader userName={userName} />

      {/* Action items (Pro tier) */}
      {isPro && ctx && (
        <Suspense fallback={<CardSkeleton className="h-[200px]" />}>
          <SmartActionsSection userId={ctx.role === "user" ? ctx.userId : undefined} />
        </Suspense>
      )}

      {/* Stats cards */}
      <Suspense fallback={<StatsRowSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Performance scorecard (Pro tier) */}
      {isPro && ctx && (
        <Suspense fallback={<CardSkeleton className="h-[350px]" />}>
          <PerformanceScorecardSection userId={ctx.userId} />
        </Suspense>
      )}

      {/* Quick Actions */}
      <UserQuickActions profileSlug={user?.slug ?? null} userName={userName} />

      {/* Charts grid */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <IconContainer size="sm" bg="subtle">
            <TrendUp className="h-4 w-4 text-repwell-teal-300" />
          </IconContainer>
          <h2 className="text-heading-sm font-semibold text-heading-accent">
            Performance Trends
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Suspense fallback={<ChartSkeleton />}>
            <RatingTrendChart />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <NPSTrendChart />
          </Suspense>
        </div>
      </section>

      {/* Share Studio: Render Queue + Link Analytics */}
      {ctx && (
        <section>
          <div className="flex items-center gap-2.5 mb-4">
            <IconContainer size="sm" bg="subtle">
              <ShareNetwork className="h-4 w-4 text-repwell-teal-300" />
            </IconContainer>
            <h2 className="text-heading-sm font-semibold text-heading-accent">
              Share Studio
            </h2>
          </div>
          <Suspense fallback={<CardSkeleton className="h-[200px]" />}>
            <ShareStudioCards organizationId={ctx.organizationId} />
          </Suspense>
        </section>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column - takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ReviewListSkeleton count={5} />}>
            <RecentReviewsList />
          </Suspense>

          <Suspense fallback={<CardSkeleton />}>
            <ReputationBreakdownCard />
          </Suspense>
        </div>

        {/* Sidebar - progress and profile completion */}
        <div className="space-y-6">
          <Suspense fallback={<CardSkeleton />}>
            <GamificationStatsCard layout="vertical" />
          </Suspense>
          <Suspense fallback={<CardSkeleton />}>
            <FullProfileCompletionCard />
          </Suspense>
        </div>
      </div>

      {/* Tips & badges — full width across all columns */}
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<CardSkeleton />}>
          <ImprovementTipsCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <BadgeShowcase />
        </Suspense>
      </div>
    </DashboardEntrance>
  );
}
