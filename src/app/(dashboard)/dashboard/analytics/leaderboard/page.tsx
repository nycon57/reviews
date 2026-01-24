import { Suspense } from "react";
import { CardSkeleton } from "@/components/shared";
import {
  Trophy,
} from "@phosphor-icons/react/dist/ssr";
import { LeaderboardDashboard } from "./leaderboard-dashboard";
import { getFilterOptions } from "@/lib/dashboard";
import { requireEnterprise } from "@/lib/access";

export const metadata = {
  title: "Leaderboard | RepWell",
  description: "View team performance rankings and achievements",
};

async function getInitialFilters() {
  const result = await getFilterOptions();
  return result.success ? result.data || { branches: [], regions: [] } : { branches: [], regions: [] };
}

export default async function LeaderboardPage() {
  // Check access - requires enterprise account (all enterprise users can view)
  await requireEnterprise();
  const filters = await getInitialFilters();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
          <Trophy className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Leaderboard</h1>
          <p className="text-muted-foreground">
            View team rankings and performance metrics
          </p>
        </div>
      </div>

      {/* Leaderboard dashboard */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton className="h-[500px]" />
          </div>
        }
      >
        <LeaderboardDashboard initialFilters={filters} />
      </Suspense>
    </div>
  );
}
