import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { ChartSkeleton, CardSkeleton } from "@/components/shared";
import { TrendsPageClient } from "@/components/analytics/trends-page-client";

export const metadata = {
  title: "Analytics Trends | RepWell",
  description: "Track performance trends over time",
};

async function checkAccess() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  const allowedRoles = ["admin", "manager", "user"] as const;
  const role = allowedRoles.includes(userData.role as (typeof allowedRoles)[number])
    ? (userData.role as "admin" | "manager" | "user")
    : "user";

  return { role };
}

export default async function TrendsPage() {
  const { role } = await checkAccess();

  return (
    <div className="flex-1">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          </div>
        }
      >
        <TrendsPageClient userRole={role} />
      </Suspense>
    </div>
  );
}
