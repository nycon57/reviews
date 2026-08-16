import { Suspense } from "react";
import { Users, AddressBook } from "@phosphor-icons/react/dist/ssr";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { UrlSyncedTabs } from "@/components/shared/url-synced-tabs";
import { TeamManagement } from "./team-management";
import { EmployeesPageClient } from "./employees-page-client";
import { requireEnterpriseManager } from "@/lib/access";
import { getEmployees } from "@/lib/employees/actions";
import { getOrganizationMembers, getPendingInvitations } from "@/lib/organization";

export const metadata = {
  title: "People | RepWell",
  description: "Manage platform members and your employee roster",
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

export default async function PeoplePage() {
  const ctx = await requireEnterpriseManager();
  const role = ctx.role;
  const [membersResult, invitationsResult, employeesResult] = await Promise.all([
    getOrganizationMembers(),
    getPendingInvitations(),
    getEmployees(1, 25),
  ]);

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Users className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-heading">
            People
          </h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Platform members and your employee roster in one place
          </p>
        </div>
      </div>

      <Suspense fallback={<TabsSkeleton />}>
        <UrlSyncedTabs
          basePath="/dashboard/people"
          defaultTab="members"
          tabs={[
            {
              value: "members",
              label: "Members",
              icon: <Users className="h-4 w-4" />,
            },
            {
              value: "employees",
              label: "Employees",
              icon: <AddressBook className="h-4 w-4" />,
            },
          ]}
        >
          <TabsContent value="members" className="m-0 animate-fade-in">
            <TeamManagement
              userRole={role}
              initialMembers={membersResult.members}
              initialInvitations={invitationsResult.invitations}
            />
          </TabsContent>
          <TabsContent value="employees" className="m-0 animate-fade-in">
            <EmployeesPageClient
              initialEmployees={employeesResult.data ?? []}
              initialTotal={employeesResult.total ?? 0}
              initialError={employeesResult.success ? null : employeesResult.error}
            />
          </TabsContent>
        </UrlSyncedTabs>
      </Suspense>
    </div>
  );
}
