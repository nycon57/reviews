import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import type { UserContext, AccountType, SubscriptionTier } from "@/lib/permissions";

function getInitials(name: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Fetch user profile with organization details for permission context
  // Note: Using * and casting because is_owner and account_type may not be in generated types yet
  const { data: profileData } = await supabase
    .from("users")
    .select(`
      *,
      organizations (*)
    `)
    .eq("id", authUser.id)
    .single();

  // Cast to access potentially untyped columns (is_owner, account_type)
  const profile = profileData as {
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    is_owner?: boolean | null;
    organization_id?: string | null;
    organizations?: {
      account_type?: string | null;
      subscription_tier?: string | null;
    } | null;
  } | null;

  // Fetch loan officer ID if user is linked to a loan officer record
  const { data: loanOfficer } = await supabase
    .from("loan_officers")
    .select("id")
    .eq("user_id", authUser.id)
    .single();

  const user = {
    name: profile?.full_name || authUser.user_metadata?.full_name || "User",
    email: authUser.email || "",
    avatar: profile?.avatar_url || undefined,
    initials: getInitials(profile?.full_name || authUser.user_metadata?.full_name),
    loanOfficerId: loanOfficer?.id || undefined,
  };

  // Build user context for permission system
  const orgData = profile?.organizations;

  const userContext: UserContext | null = profile?.organization_id
    ? {
        userId: authUser.id,
        role: (profile.role || "loan_officer") as UserContext["role"],
        accountType: (orgData?.account_type || "enterprise") as AccountType,
        isOwner: profile.is_owner || false,
        subscriptionTier: (orgData?.subscription_tier || "basic") as SubscriptionTier,
        organizationId: profile.organization_id,
      }
    : null;

  return (
    <DashboardLayout user={user} userContext={userContext} onSignOut={signOut}>
      {children}
    </DashboardLayout>
  );
}
