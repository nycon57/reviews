import { Suspense } from "react";
import { Robot, ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { Skeleton } from "@/components/ui/skeleton";
import { requireEnterpriseManager } from "@/lib/access";
import { getAgentAnalyticsDashboardData } from "@/lib/agents/analytics";
import { AgentsAnalyticsDashboard } from "./agents-analytics-dashboard";

export const metadata = {
  title: "Agent Analytics | RepWell",
  description: "Monitor agent traffic and public API usage.",
};

export const revalidate = 300;

async function AgentsAnalyticsLoader() {
  const data = await getAgentAnalyticsDashboardData();
  return <AgentsAnalyticsDashboard data={data} />;
}

function AgentsAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[360px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  );
}

export default async function AgentAnalyticsPage() {
  await requireEnterpriseManager();

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Robot className="h-6 w-6 text-repwell-teal-300" weight="duotone" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">
            Agent Analytics
          </h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Detect crawler, LLM, and agent traffic alongside public API demand.
          </p>
        </div>
        <div className="ml-auto hidden items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground md:flex">
          <ChartLineUp className="h-4 w-4 text-repwell-teal-300" />
          Last 30 days
        </div>
      </div>

      <Suspense fallback={<AgentsAnalyticsSkeleton />}>
        <AgentsAnalyticsLoader />
      </Suspense>
    </div>
  );
}
