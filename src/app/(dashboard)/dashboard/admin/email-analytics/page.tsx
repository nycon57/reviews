import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsRowSkeleton, ChartSkeleton, TableSkeleton } from "@/components/shared";
import { Mail } from "lucide-react";
import { EmailAnalyticsDashboard } from "./email-analytics-dashboard";

export const metadata = {
  title: "Email Analytics | RepWell",
  description: "Monitor email performance, delivery rates, and engagement metrics",
};

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

export default async function EmailAnalyticsPage() {
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Analytics</h1>
          <p className="text-muted-foreground">
            Monitor email performance, delivery rates, and engagement metrics
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <StatsRowSkeleton count={5} />
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <TableSkeleton rows={8} columns={6} />
          </div>
        }
      >
        <EmailAnalyticsDashboard />
      </Suspense>
    </div>
  );
}
