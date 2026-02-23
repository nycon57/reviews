import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedSignOut, unifiedGetUser } from "@/lib/auth/actions";
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
  const authUser = await unifiedGetUser();

  if (!authUser) {
    redirect("/login");
  }

  const supabase = createAdminClient();

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

  // Cast to access potentially untyped columns (is_owner, account_type, slug)
  const profile = profileData as {
    full_name?: string | null;
    avatar_url?: string | null;
    role?: string | null;
    is_owner?: boolean | null;
    organization_id?: string | null;
    individual_organization_id?: string | null;
    slug?: string | null;
    organizations?: {
      account_type?: string | null;
      subscription_tier?: string | null;
    } | null;
  } | null;

  // Handle both Supabase Auth (user_metadata) and Better Auth (name) user structures
  const authUserName =
    (authUser as { name?: string }).name ||
    (authUser as { user_metadata?: { full_name?: string } }).user_metadata?.full_name;

  const user = {
    name: profile?.full_name || authUserName || "User",
    email: authUser.email || "",
    avatar: profile?.avatar_url || undefined,
    initials: getInitials(profile?.full_name || authUserName || null),
    loanOfficerId: authUser.id, // User ID is now the professional ID
    slug: profile?.slug || undefined,
  };

  // Build user context for permission system
  const orgData = profile?.organizations;

  // Build user context: enterprise org path, or individual org fallback
  let userContext: UserContext | null = null;
  if (profile?.organization_id) {
    userContext = {
      userId: authUser.id,
      role: (profile.role || "user") as UserContext["role"],
      accountType: (orgData?.account_type || "individual") as AccountType,
      isOwner: profile.is_owner || false,
      subscriptionTier: (orgData?.subscription_tier || "basic") as SubscriptionTier,
      organizationId: profile.organization_id,
    };
  } else if (profile?.individual_organization_id) {
    userContext = {
      userId: authUser.id,
      role: "admin" as UserContext["role"],
      accountType: "individual" as AccountType,
      isOwner: true,
      subscriptionTier: "basic" as SubscriptionTier,
      organizationId: profile.individual_organization_id,
    };
  }

  if (!userContext) {
    redirect("/onboarding");
  }

  return (
    <DashboardLayout user={user} userContext={userContext} onSignOut={unifiedSignOut}>
      {children}
    </DashboardLayout>
  );
}
