import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChartSkeleton, CardSkeleton } from "@/components/shared";
import { TrendingUp } from "lucide-react";
import { TrendsDashboard } from "./trends-dashboard";

export const metadata = {
  title: "Analytics Trends | ReviewHub",
  description: "Track performance trends over time",
};

async function checkAccess() {
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

  return { role: userData.role };
}

export default async function TrendsPage() {
  await checkAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Trends</h1>
          <p className="text-muted-foreground">
            Track performance metrics and trends over time
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
        <TrendsDashboard />
      </Suspense>
    </div>
  );
}
