import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DistributionDashboard } from "./distribution-dashboard";
import { CardSkeleton } from "@/components/shared/skeletons";

export default async function DistributionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Survey Distribution</h1>
        <p className="text-muted-foreground">
          Monitor and manage automated survey distribution
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton />
          </div>
        }
      >
        <DistributionDashboard />
      </Suspense>
    </div>
  );
}
