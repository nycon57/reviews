import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  BuildingOffice as Building2,
  ChartBar,
  GearSix,
  Palette,
  Users,
  Buildings,
  FileText,
  PlugsConnected,
  CreditCard,
} from "@phosphor-icons/react/dist/ssr";
import { OrganizationSettings } from "@/components/organization/organization-settings";
import { OrganizationBranding } from "@/components/organization/organization-branding";
import { OrganizationTeam } from "@/components/organization/organization-team";
import { OrganizationBilling } from "@/components/organization/organization-billing";
import { OrganizationOverview } from "@/components/organization/organization-overview";
import { OrganizationBranches } from "@/components/organization/organization-branches";
import { ResponseTemplatesTab } from "@/components/organization/response-templates-tab";
import { OrganizationIntegrations } from "@/components/organization/organization-integrations";
import { requireEnterpriseAdmin } from "@/lib/access";

export const metadata = {
  title: "Organization Settings | RepWell",
  description: "Manage your organization settings, branding, and team",
};

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

const triggerClassName = "relative px-4 py-3 text-sm font-medium text-muted-foreground hover:text-repwell-teal-400 dark:hover:text-repwell-sage-100/80 data-[state=active]:text-repwell-teal-300 border-b-2 border-transparent data-[state=active]:border-repwell-teal-300 rounded-none bg-transparent shadow-none transition-colors duration-200 flex items-center gap-2 whitespace-nowrap";

export default async function OrganizationPage() {
  // Check access - requires enterprise account + admin role
  await requireEnterpriseAdmin();

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Building2 className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading-accent">Organization</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Manage your organization settings, branding, and team
          </p>
        </div>
      </div>

      {/* Organization tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0 overflow-x-auto">
          <TabsTrigger value="overview" className={triggerClassName}>
            <ChartBar className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="settings" className={triggerClassName}>
            <GearSix className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="branding" className={triggerClassName}>
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="team" className={triggerClassName}>
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="branches" className={triggerClassName}>
            <Buildings className="h-4 w-4" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="templates" className={triggerClassName}>
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="integrations" className={triggerClassName}>
            <PlugsConnected className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="billing" className={triggerClassName}>
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="team" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationTeam />
          </Suspense>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationBranches />
          </Suspense>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <ResponseTemplatesTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationIntegrations />
          </Suspense>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationBilling />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
