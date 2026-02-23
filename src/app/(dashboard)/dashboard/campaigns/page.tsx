import { Suspense } from "react";
import { CardSkeleton } from "@/components/shared";
import {
  Envelope as Mail,
} from "@phosphor-icons/react/dist/ssr";
import { CampaignsDashboard } from "./campaigns-dashboard";
import { requireEnterpriseManager } from "@/lib/access";

export const metadata = {
  title: "Campaigns | RepWell",
  description: "Manage and create email campaigns for survey distribution",
};

export default async function CampaignsPage() {
  // Check access - requires enterprise account + manager/admin role
  const ctx = await requireEnterpriseManager();
  const role = ctx.role;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email campaigns for survey distribution
          </p>
        </div>
      </div>

      {/* Campaigns dashboard */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton className="h-[400px]" />
          </div>
        }
      >
        <CampaignsDashboard userRole={role} />
      </Suspense>
    </div>
  );
}
