import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
} from "@phosphor-icons/react/dist/ssr";
import { TeamManagement } from "./team-management";
import { requireEnterpriseManager } from "@/lib/access";

export const metadata = {
  title: "Team Management | RepWell",
  description: "Manage your team members and their roles",
};

function TeamSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function TeamPage() {
  // Check access - requires enterprise account + manager/admin role
  const ctx = await requireEnterpriseManager();
  const role = ctx.role;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members, roles, and invitations
          </p>
        </div>
      </div>

      {/* Team management component */}
      <Suspense fallback={<TeamSkeleton />}>
        <TeamManagement userRole={role} />
      </Suspense>
    </div>
  );
}
