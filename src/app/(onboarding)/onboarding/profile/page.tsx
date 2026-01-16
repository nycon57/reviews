import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingStatus } from "@/lib/onboarding/actions";
import { ProfileSetupClient } from "./profile-setup-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Set Up Your Profile | RepWell",
  description: "Complete your organization profile",
};

function ProfileSetupSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-6 w-80 mx-auto" />
      </div>
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProfileSetupPage() {
  const status = await getOnboardingStatus();

  // If not authenticated or no org, redirect
  if (!status.success) {
    redirect("/login");
  }

  // If still pending, go to plan selection
  if (status.status === "pending") {
    redirect("/onboarding/plan");
  }

  // If paid plan but not payment complete, go to payment
  if (status.selectedPlan !== "free" && status.status === "plan_selected") {
    redirect("/onboarding/payment");
  }

  // If already completed profile, go to complete page
  if (status.status === "profile_complete" || status.status === "completed") {
    redirect("/onboarding/complete");
  }

  // Get current organization data
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !status.organizationId) {
    redirect("/login");
  }

  // Fetch organization directly
  const { data: orgData } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", status.organizationId)
    .single();

  // Cast to access all columns
  const org = orgData as {
    name: string;
    logo_url: string | null;
    primary_color: string | null;
    domain: string | null;
    settings: Record<string, unknown> | null;
  } | null;

  const initialData = {
    organizationName: org?.name || "",
    industry: (org?.settings?.industry as string) || "",
    companySize: (org?.settings?.companySize as string) || "",
    address: (org?.settings?.address as Record<string, string>) || {},
    logoUrl: org?.logo_url || "",
    primaryColor: org?.primary_color || "#3B82F6",
    website: org?.domain || "",
    phone: (org?.settings?.phone as string) || "",
  };

  return (
    <Suspense fallback={<ProfileSetupSkeleton />}>
      <ProfileSetupClient initialData={initialData} />
    </Suspense>
  );
}
