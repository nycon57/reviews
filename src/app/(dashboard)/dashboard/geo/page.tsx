import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CardSkeleton } from "@/components/shared";
import { GeoDashboard } from "./geo-dashboard";

export const metadata = {
  title: "AI Visibility & GEO | ReviewHub",
  description: "Optimize your content for AI search engines like ChatGPT, Perplexity, and Google AI Overviews",
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

  return { role: userData.role, organizationId: userData.organization_id };
}

export default async function GeoPage() {
  await checkAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Visibility & GEO</h1>
          <p className="text-muted-foreground">
            Optimize your content for AI search engines like ChatGPT, Perplexity, and Google AI Overviews
          </p>
        </div>
      </div>

      {/* GEO Dashboard */}
      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Stats row skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            {/* Main content skeleton */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton className="h-[400px]" />
              <CardSkeleton className="h-[400px]" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CardSkeleton className="h-[400px]" />
              <CardSkeleton className="h-[400px]" />
            </div>
          </div>
        }
      >
        <GeoDashboard />
      </Suspense>
    </div>
  );
}
