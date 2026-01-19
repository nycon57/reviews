import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { OrganizationSettings } from "@/components/organization/organization-settings";
import { OrganizationBranding } from "@/components/organization/organization-branding";
import { OrganizationTeam } from "@/components/organization/organization-team";
import { OrganizationBilling } from "@/components/organization/organization-billing";
import { OrganizationOverview } from "@/components/organization/organization-overview";
import { OrganizationSEO } from "@/components/organization/organization-seo";
import { ResponseTemplatesTab } from "@/components/organization/response-templates-tab";

export const metadata = {
  title: "Organization Settings | RepWell",
  description: "Manage your organization settings, branding, and team",
};

function TabSkeleton() {
  return (
    <Card>
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

async function checkAdminAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  if (userData.role !== "admin") {
    redirect("/dashboard");
  }

  return true;
}

export default async function OrganizationPage() {
  await checkAdminAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization</h1>
          <p className="text-muted-foreground">
            Manage your organization settings, branding, and team
          </p>
        </div>
      </div>

      {/* Organization tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationOverview />
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

        <TabsContent value="templates" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <ResponseTemplatesTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Suspense fallback={<TabSkeleton />}>
            <OrganizationSEO />
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
