import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CardSkeleton } from "@/components/shared";
import { Mail } from "lucide-react";
import { CampaignsDashboard } from "./campaigns-dashboard";

export const metadata = {
  title: "Email Campaigns | RepWell",
  description: "Manage and create email campaigns for survey distribution",
};

async function checkCampaignAccess() {
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

  // Only managers and admins can access campaigns
  if (userData.role !== "admin" && userData.role !== "manager") {
    redirect("/dashboard");
  }

  return { role: userData.role };
}

export default async function CampaignsPage() {
  const { role } = await checkCampaignAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email campaigns for survey distribution
          </p>
        </div>
      </div>

      {/* Campaigns dashboard */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton className="h-[400px]" />
          </div>
        }
      >
        <CampaignsDashboard userRole={role} />
      </Suspense>
    </div>
  );
}
