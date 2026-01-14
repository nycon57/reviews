import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { StatsRowSkeleton, ReviewListSkeleton, ChartSkeleton, CardSkeleton } from "@/components/shared";
import {
  LOStatsCards,
  LOTrendChart,
  LORecentReviews,
  LOProfileCompletion,
  LOQuickActions,
} from "@/components/dashboard";
import {
  GamificationStatsCard,
  BadgeShowcase,
  ReputationBreakdownCard,
  ImprovementTipsCard,
} from "@/components/gamification";
import {
  getLoanOfficerMetrics,
  getLoanOfficerRecentReviews,
  getRatingTrend,
  getNPSTrend,
  getProfileCompletion,
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

// Server component for profile completion
async function ProfileCompletionCard() {
  const result = await getProfileCompletion();

  if (!result.success || !result.data) {
    return null;
  }

  // Don't show if no profile (user is not a loan officer)
  if (result.data.items.length === 0) {
    return null;
  }

  return (
    <LOProfileCompletion
      percentage={result.data.percentage}
      items={result.data.items}
    />
  );
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
        {/* Recent reviews - takes 2 columns */}
        <div className="lg:col-span-2">
          <h2 className="text-heading-sm font-semibold text-brand-navy mb-4">
            Recent Reviews
          </h2>
          <Suspense fallback={<ReviewListSkeleton count={5} />}>
            <RecentReviewsList />
          </Suspense>
        </div>

        {/* Sidebar - quick actions, badges, and profile completion */}
        <div className="space-y-6">
          <LOQuickActions />
          <BadgeShowcase />
          <ImprovementTipsCard />
          <Suspense fallback={<CardSkeleton className="h-[280px]" />}>
            <ProfileCompletionCard />
          </Suspense>
        </div>
      </div>

      {/* Reputation breakdown section */}
      <section>
        <h2 className="text-heading-sm font-semibold text-brand-navy mb-4">
          Reputation Insights
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <ReputationBreakdownCard />
        </div>
      </section>
    </div>
  );
}
