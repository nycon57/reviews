import { Suspense } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { UrlSyncedTabs } from "@/components/shared/url-synced-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  BuildingOffice as Building2,
  ChartBar,
  GearSix,
  Palette,
  Buildings,
  FileText,
  PlugsConnected,
  CreditCard,
  Key,
  Plugs,
} from "@phosphor-icons/react/dist/ssr";
import { OrganizationSettings } from "@/components/organization/organization-settings";
import { OrganizationBranding } from "@/components/organization/organization-branding";
import { OrganizationBilling } from "@/components/organization/organization-billing";
import { OrganizationOverview } from "@/components/organization/organization-overview";
import { OrganizationBranches } from "@/components/organization/organization-branches";
import { ResponseTemplatesTab } from "@/components/organization/response-templates-tab";
import { IntegrationsTab } from "@/components/organization/integrations-tab";
import { ApiTab } from "@/components/organization/api-tab";
import { WebhookSettingsPanel } from "@/components/settings/webhooks/webhook-settings-panel";
import { requireIndividualOrEnterpriseAdmin } from "@/lib/access";

export const metadata = {
  title: "Workspace | RepWell",
  description: "Billing, branding, integrations, and everything org-scoped",
};

// Org-scoped tabs available in the Workspace. `branches` is enterprise-only.
const VALID_TABS = [
  "overview",
  "settings",
  "branding",
  "branches",
  "templates",
  "integrations",
  "billing",
  "api",
  "webhooks",
] as const;
type WorkspaceTab = (typeof VALID_TABS)[number];

function TabSkeleton() {
  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default async function WorkspacePage() {
  // Allow individual license users and enterprise org admins
  const ctx = await requireIndividualOrEnterpriseAdmin();
  const isEnterpriseAccount = ctx.accountType === "enterprise";

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Building2 className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading-accent">Workspace</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Billing, branding, integrations, and everything org-scoped
          </p>
        </div>
      </div>

      {/* Workspace tabs */}
      <UrlSyncedTabs
        basePath="/dashboard/organization"
        defaultTab="overview"
        tabs={[
          { value: "overview", label: "Overview", icon: <ChartBar className="h-4 w-4" /> },
          { value: "settings", label: "Settings", icon: <GearSix className="h-4 w-4" /> },
          { value: "branding", label: "Branding", icon: <Palette className="h-4 w-4" /> },
          ...(isEnterpriseAccount
            ? [{ value: "branches", label: "Branches", icon: <Buildings className="h-4 w-4" /> }]
            : []),
          { value: "templates", label: "Templates", icon: <FileText className="h-4 w-4" /> },
          { value: "integrations", label: "Integrations", icon: <PlugsConnected className="h-4 w-4" /> },
          { value: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
          { value: "api", label: "API", icon: <Key className="h-4 w-4" /> },
          { value: "webhooks", label: "Webhooks", icon: <Plugs className="h-4 w-4" /> },
        ]}
      >

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationOverview isAdmin />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationBranding />
          </Suspense>
        </TabsContent>

        {isEnterpriseAccount && (
          <TabsContent value="branches" className="space-y-6">
            <Suspense fallback={<TabSkeleton />}>
              <OrganizationBranches />
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="templates" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <ResponseTemplatesTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <IntegrationsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationBilling />
          </Suspense>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <ApiTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <WebhookSettingsPanel />
          </Suspense>
        </TabsContent>
      </UrlSyncedTabs>
    </div>
  );
}
