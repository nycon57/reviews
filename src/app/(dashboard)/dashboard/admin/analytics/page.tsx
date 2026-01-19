import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsRowSkeleton, ChartSkeleton, CardSkeleton } from "@/components/shared";
import { BarChart3 } from "lucide-react";
import { AdminAnalyticsDashboard } from "./admin-analytics-dashboard";

export const metadata = {
  title: "Organization Analytics | RepWell",
  description: "Organization-wide performance analytics and insights",
};

// Check if user is an admin
async function checkAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin";
}

export default async function AdminAnalyticsPage() {
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
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Analytics</h1>
          <p className="text-muted-foreground">
            Organization-wide performance metrics and insights
          </p>
        </div>
      </div>

      {/* Analytics dashboard */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <StatsRowSkeleton />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartSkeleton />
              </div>
              <CardSkeleton className="h-[300px]" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton className="h-[300px]" />
              <CardSkeleton className="h-[300px]" />
            </div>
          </div>
        }
      >
        <AdminAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
