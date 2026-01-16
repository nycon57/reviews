import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProgress } from "./onboarding-progress";

export const metadata = {
  title: "Get Started | RepWell",
  description: "Set up your RepWell account",
};

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default async function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's organization and onboarding status
  // Note: onboarding_status and selected_plan columns are added via migration
  // Using type assertion until types are regenerated after migration
  const { data: userData } = await supabase
    .from("users")
    .select(`
      organization_id,
      organizations(
        id,
        name
      )
    `)
    .eq("id", user.id)
    .single();

  // Fetch onboarding fields separately with raw query
  let onboardingStatus = "pending";
  let selectedPlan: string | null = null;

  if (userData?.organization_id) {
    const { data: rawOrg } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", userData.organization_id)
      .single();

    // Cast to access potentially untyped columns
    const orgAny = rawOrg as Record<string, unknown> | null;
    onboardingStatus = (orgAny?.onboarding_status as string) || "pending";
    selectedPlan = (orgAny?.selected_plan as string) || null;
  }

  const org = userData?.organizations as {
    id: string;
    name: string;
  } | null;

  // If onboarding is already completed, redirect to dashboard
  if (onboardingStatus === "completed") {
    redirect("/dashboard");
  }

  const currentStatus = onboardingStatus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="https://temwotqafrafajehuiuh.supabase.co/storage/v1/object/public/repwell/branding/RepWell-Logo-Full-Color.png"
                alt="RepWell"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <OnboardingProgress
              currentStatus={currentStatus}
              selectedPlan={selectedPlan}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Need help? Contact us at <a href="mailto:support@repwell.io" className="text-primary hover:underline">support@repwell.io</a></p>
        </div>
      </footer>
    </div>
  );
}
