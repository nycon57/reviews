import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
} from "@phosphor-icons/react/dist/ssr";
import { LeaderboardDashboard } from "./leaderboard-dashboard";
import { getEnterpriseFilterOptions } from "@/lib/dashboard";
import { requireEnterprise } from "@/lib/access";
import { getEnhancedLeaderboard } from "@/lib/gamification/actions";
import { getProfileCompletionLeaderboard } from "@/lib/gamification/profile-completion-actions";

export const metadata = {
  title: "Leaderboard | RepWell",
  description: "View team performance rankings and achievements",
};

async function getInitialLeaderboardData() {
  const [filtersResult, leaderboardResult, profileCompletionResult] =
    await Promise.all([
      getEnterpriseFilterOptions(),
      getEnhancedLeaderboard({ period: "monthly", limit: 20 }),
      getProfileCompletionLeaderboard(10),
    ]);

  return {
    filters: filtersResult.success
      ? filtersResult.data || { branches: [], regions: [] }
      : { branches: [], regions: [] },
    topPerformers: leaderboardResult.success ? (leaderboardResult.data || []).slice(0, 3) : [],
    topPerformersError: leaderboardResult.success
      ? null
      : leaderboardResult.error || "Failed to load leaderboard data",
    leaderboard: leaderboardResult.success ? leaderboardResult.data || [] : [],
    leaderboardError: leaderboardResult.success
      ? null
      : leaderboardResult.error || "Failed to load leaderboard",
    profileCompletion: profileCompletionResult.success ? profileCompletionResult.data || [] : [],
  };
}

export default async function LeaderboardPage() {
  // Check access - requires enterprise account (all enterprise users can view leaderboard)
  await requireEnterprise();
  const initialData = await getInitialLeaderboardData();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Trophy className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">Performance Leaderboard</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            View team rankings and performance metrics
          </p>
        </div>
      </div>

      {/* Leaderboard dashboard */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[500px] rounded-xl" />
          </div>
        }
      >
        <LeaderboardDashboard
          initialFilters={initialData.filters}
          initialTopPerformers={initialData.topPerformers}
          initialTopPerformersError={initialData.topPerformersError}
          initialLeaderboard={initialData.leaderboard}
          initialLeaderboardError={initialData.leaderboardError}
          initialProfileCompletion={initialData.profileCompletion}
        />
      </Suspense>
    </div>
  );
}
