import { Suspense } from "react";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr";
import { DashboardSkeleton } from "@/components/shared";
import { TeamOverviewContent } from "./team-overview-content";
import { requireEnterpriseManager } from "@/lib/access";

export const metadata = {
  title: "Team Overview | RepWell",
  description: "Team performance, activity, and leaderboards",
};

export default async function TeamOverviewPage() {
  await requireEnterpriseManager();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <SquaresFour className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">
            Team
          </h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Team performance, activity, and leaderboards
          </p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <TeamOverviewContent />
      </Suspense>
    </div>
  );
}
