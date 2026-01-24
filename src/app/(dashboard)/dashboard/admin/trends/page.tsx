import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { ChartSkeleton, CardSkeleton } from "@/components/shared";
import {
  TrendUp as TrendingUp,
} from "@phosphor-icons/react/dist/ssr";
import { AdminTrendsDashboard } from "./admin-trends-dashboard";

export const metadata = {
  title: "Organization Trends | RepWell",
  description: "Track organization-wide performance trends over time",
};

// Check if user is an admin
async function checkAdminAccess() {
  const user = await unifiedGetUser();

  if (!user) {
    return false;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin";
}

export default async function AdminTrendsPage() {
  // Check access
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Trends</h1>
          <p className="text-muted-foreground">
            Track organization-wide performance trends over time
          </p>
        </div>
      </div>

      {/* Trends dashboard */}
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
        <AdminTrendsDashboard />
      </Suspense>
    </div>
  );
}
