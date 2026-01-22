import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsRowSkeleton, TableSkeleton } from "@/components/shared";
import { FlaskConical } from "lucide-react";
import { ABTestsListClient } from "./ab-tests-list-client";

export const metadata = {
  title: "Email A/B Tests | RepWell",
  description: "Create and manage email A/B tests to optimize engagement",
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

export default async function EmailABTestsPage() {
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email A/B Tests</h1>
          <p className="text-muted-foreground">
            Create and manage A/B tests to optimize email performance
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            <StatsRowSkeleton count={4} />
            <TableSkeleton rows={8} columns={6} />
          </div>
        }
      >
        <ABTestsListClient />
      </Suspense>
    </div>
  );
}
