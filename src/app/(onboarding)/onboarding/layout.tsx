import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { OnboardingProgress } from "./onboarding-progress";

export const metadata = {
  title: "Get Started | RepWell",
  description: "Set up your RepWell account",
};

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default async function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Get user's organization and onboarding status
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

    const orgAny = rawOrg as Record<string, unknown> | null;
    onboardingStatus = (orgAny?.onboarding_status as string) || "pending";
    selectedPlan = (orgAny?.selected_plan as string) || null;
  }

  // If onboarding is already completed, redirect to dashboard
  if (onboardingStatus === "completed") {
    redirect("/dashboard");
  }

  const currentStatus = onboardingStatus;

  return (
    <div className="relative min-h-screen bg-[#f8faf8]">
      {/* Subtle dot-grid pattern overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #2f3e46 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 py-5">
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
      <main className="relative container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t bg-white/50 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 text-repwell-teal-300"
              viewBox="0 0 256 256"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Zm-68-56a12,12,0,1,1-12-12A12,12,0,0,1,140,152Z" />
            </svg>
            <span>256-bit SSL encryption protects your data</span>
          </div>
          <p>
            Need help? Contact us at{" "}
            <a href="mailto:support@repwell.ai" className="text-repwell-teal-300 hover:underline">
              support@repwell.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
