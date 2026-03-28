import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
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
  const user = await unifiedGetUser();

  if (!user || !status.organizationId) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Check if this is an individual org by looking for the user's org type
  const { data: userRow } = await supabase
    .from("users")
    .select("organization_id, individual_organization_id, address")
    .eq("id", user.id)
    .single();

  const isIndividual = !userRow?.organization_id && !!userRow?.individual_organization_id;

  let initialData;

  if (isIndividual) {
    // Individual: fetch from individual_organizations
    const { data: indivOrgData } = await supabase
      .from("individual_organizations")
      .select("name, website_url, phone, email")
      .eq("id", status.organizationId)
      .single();

    const userAddress = userRow?.address as Record<string, string> | null;

    initialData = {
      organizationName: indivOrgData?.name || "",
      industry: "",
      companySize: "",
      address: userAddress || {},
      logoUrl: "",
      primaryColor: "#52796f",
      website: indivOrgData?.website_url || "",
      phone: indivOrgData?.phone || "",
      companyEmail: indivOrgData?.email || "",
    };
  } else {
    // Enterprise: fetch from organizations
    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", status.organizationId)
      .single();

    const org = orgData as {
      name: string;
      logo_url: string | null;
      primary_color: string | null;
      domain: string | null;
      industry: string | null;
      company_address: Record<string, string> | null;
      phone: string | null;
      company_email: string | null;
      settings: Record<string, unknown> | null;
    } | null;

    initialData = {
      organizationName: org?.name || "",
      industry: org?.industry || "",
      companySize: (org?.settings?.companySize as string) || "",
      address: org?.company_address || {},
      logoUrl: org?.logo_url || "",
      primaryColor: org?.primary_color || "#52796f",
      website: org?.domain || "",
      phone: org?.phone || "",
      companyEmail: org?.company_email || "",
    };
  }

  return (
    <Suspense fallback={<ProfileSetupSkeleton />}>
      <ProfileSetupClient initialData={initialData} />
    </Suspense>
  );
}
