import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Trophy,
} from "@phosphor-icons/react/dist/ssr";
import { LeaderboardDashboard } from "./leaderboard-dashboard";
import { getEnterpriseFilterOptions } from "@/lib/dashboard";
import { requireEnterprise } from "@/lib/access";

export const metadata = {
  title: "Leaderboard | RepWell",
  description: "View team performance rankings and achievements",
};

async function getInitialFilters() {
  const result = await getEnterpriseFilterOptions();
  return result.success ? result.data || { branches: [], regions: [] } : { branches: [], regions: [] };
}

export default async function LeaderboardPage() {
  // Check access - requires enterprise account (all enterprise users can view leaderboard)
  await requireEnterprise();
  const filters = await getInitialFilters();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Trophy className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-repwell-teal-500">Performance Leaderboard</h1>
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
        <LeaderboardDashboard initialFilters={filters} />
      </Suspense>
    </div>
  );
}
