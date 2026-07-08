import { Suspense } from "react";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/actions";
import { getAccessContext, isEnterprise, isManagerOrAbove } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { StatsRowSkeleton, ChartSkeleton, TableSkeleton } from "@/components/shared";
import {
  Envelope as Mail,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import { EmailAnalyticsDashboard } from "./email-analytics-dashboard";

export const metadata = {
  title: "Email Analytics | RepWell",
  description: "Monitor email performance, delivery rates, and engagement metrics",
};

export default async function EmailAnalyticsPage() {
  await requirePlatformAdmin();

  // Reciprocal cross-link to the template builder, shown only to users who can
  // actually reach it (enterprise managers) so the link is never a dead end.
  const ctx = await getAccessContext();
  const canUseBuilder = ctx ? isEnterprise(ctx) && isManagerOrAbove(ctx) : false;

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Mail className="h-6 w-6 text-repwell-teal-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-display leading-tight text-heading">Email Analytics</h1>
            <p className="text-sm leading-snug text-repwell-teal-300">
              Monitor email performance, delivery rates, and engagement metrics
            </p>
          </div>
        </div>
        {canUseBuilder && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/campaigns?tab=templates">
              <PencilSimple className="mr-2 h-4 w-4" />
              Open template builder
            </Link>
          </Button>
        )}
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <StatsRowSkeleton count={5} />
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <TableSkeleton rows={8} columns={6} />
          </div>
        }
      >
        <EmailAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
