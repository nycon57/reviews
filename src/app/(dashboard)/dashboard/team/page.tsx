import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamManagement } from "./team-management";
import { TeamPageTabs } from "./team-page-tabs";
import { TeamOverviewContent } from "./team-overview-content";
import { requireEnterpriseManager } from "@/lib/access";

export const metadata = {
  title: "Team | RepWell",
  description: "Team performance overview, analytics, and member management",
};

function TabsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default async function TeamPage() {
  const ctx = await requireEnterpriseManager();
  const role = ctx.role;

  return (
    <div className="flex-1 space-y-6">
      <Suspense fallback={<TabsSkeleton />}>
        <TeamPageTabs
          overviewContent={<TeamOverviewContent />}
          membersContent={<TeamManagement userRole={role} />}
        />
      </Suspense>
    </div>
  );
}
