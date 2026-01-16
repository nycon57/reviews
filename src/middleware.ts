import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role-based access control configuration
type UserRole = "admin" | "manager" | "loan_officer";
type AccountType = "individual" | "enterprise";
type SubscriptionTier = "basic" | "pro" | "enterprise";
type OnboardingStatus = "pending" | "plan_selected" | "payment_complete" | "profile_complete" | "completed";

interface RouteConfig {
  path: string;
  /** Roles allowed to access (for enterprise accounts) */
  allowedRoles?: UserRole[];
  /** Minimum subscription tier required */
  minTier?: SubscriptionTier;
  /** Requires enterprise account (hide from individual users) */
  requiresEnterprise?: boolean;
  /** Requires admin role within enterprise account */
  requiresEnterpriseAdmin?: boolean;
}

// Tier hierarchy for comparison
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  basic: 0,
  pro: 1,
  enterprise: 2,
};

// Routes that require specific roles, subscription tiers, or account types
const roleProtectedRoutes: RouteConfig[] = [
  // Enterprise-only management routes (hidden from individual users)
  { path: "/dashboard/manager", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/team", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/campaigns", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/ex-surveys", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/recognition", requiresEnterprise: true },
  { path: "/dashboard/analytics/leaderboard", requiresEnterprise: true },

  // Enterprise admin only routes
  { path: "/dashboard/organization", requiresEnterpriseAdmin: true },

  // Pro tier features (available to pro individuals and all enterprise users)
  { path: "/dashboard/insights", minTier: "pro" },
  { path: "/dashboard/geo", minTier: "pro" },
  { path: "/dashboard/analytics/website", minTier: "pro" },

  // API integrations require pro tier
  { path: "/integrations/api", minTier: "pro" },
  { path: "/integrations/webhooks", minTier: "pro" },
];

// Paths that are part of the onboarding flow
const onboardingPaths = ["/onboarding"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - require authentication
  const protectedPaths = ["/dashboard", "/reviews", "/surveys", "/analytics", "/team", "/settings", "/profile"];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isOnboardingPath = onboardingPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check onboarding status for protected paths (not onboarding paths themselves)
  if (user && isProtectedPath && !isOnboardingPath) {
    // Fetch user's organization ID first
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userData?.organization_id) {
      // Fetch organization with all columns to access onboarding_status
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userData.organization_id)
        .single();

      // Cast to access potentially untyped columns
      const orgAny = orgData as Record<string, unknown> | null;
      const onboardingStatus = (orgAny?.onboarding_status as OnboardingStatus) || "pending";

      // If onboarding not completed, redirect to onboarding
      if (onboardingStatus !== "completed") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
    }
  }

  // Role-based and subscription-based access control for authenticated users
  if (user && isProtectedPath) {
    // Find if current path requires role-based or subscription-based access
    const routeConfig = roleProtectedRoutes.find((route) =>
      request.nextUrl.pathname.startsWith(route.path)
    );

    if (routeConfig?.allowedRoles || routeConfig?.minTier || routeConfig?.requiresEnterprise || routeConfig?.requiresEnterpriseAdmin) {
      // Fetch user's role and organization details from the database
      const { data: userData } = await supabase
        .from("users")
        .select("role, organization_id, organizations(subscription_tier, account_type)")
        .eq("id", user.id)
        .single();

      const userRole = userData?.role as UserRole | undefined;
      const orgData = userData?.organizations as { subscription_tier?: string; account_type?: string } | null;
      const subscriptionTier = (orgData?.subscription_tier || "basic") as SubscriptionTier;
      const accountType = (orgData?.account_type || "enterprise") as AccountType;

      // Check if route requires enterprise account
      if (routeConfig.requiresEnterprise) {
        if (accountType !== "enterprise") {
          // Individual users can't access enterprise-only features
          const redirectUrl = new URL("/dashboard", request.url);
          redirectUrl.searchParams.set("error", "enterprise_only");
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Check if route requires enterprise admin
      if (routeConfig.requiresEnterpriseAdmin) {
        if (accountType !== "enterprise" || userRole !== "admin") {
          const redirectUrl = new URL("/dashboard", request.url);
          redirectUrl.searchParams.set("error", "admin_only");
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Check role-based access (only applies to enterprise accounts)
      if (routeConfig.allowedRoles && accountType === "enterprise") {
        if (!userRole || !routeConfig.allowedRoles.includes(userRole)) {
          const redirectUrl = new URL("/dashboard", request.url);
          redirectUrl.searchParams.set("error", "unauthorized");
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Check subscription tier requirement
      if (routeConfig.minTier) {
        const requiredLevel = TIER_LEVELS[routeConfig.minTier];
        const userLevel = TIER_LEVELS[subscriptionTier];

        if (userLevel < requiredLevel) {
          const redirectUrl = new URL("/dashboard/settings/billing", request.url);
          redirectUrl.searchParams.set("upgrade", routeConfig.minTier);
          redirectUrl.searchParams.set("feature", request.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }

  // Auth routes - redirect to dashboard if already logged in
  const authPaths = ["/login", "/signup", "/forgot-password"];
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Reset password page requires an authenticated session (from recovery email)
  if (request.nextUrl.pathname === "/reset-password" && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     * - api routes (handled separately)
     * - survey routes (public)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api|survey).*)",
  ],
};
