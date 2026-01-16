import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role-based access control configuration
type UserRole = "admin" | "manager" | "loan_officer";
type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

interface RouteConfig {
  path: string;
  allowedRoles?: UserRole[];
  /** Minimum subscription tier required (free allows all) */
  minTier?: SubscriptionTier;
}

// Tier hierarchy for comparison
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

// Routes that require specific roles or subscription tiers
const roleProtectedRoutes: RouteConfig[] = [
  { path: "/team", allowedRoles: ["admin", "manager"] },
  { path: "/settings/organization", allowedRoles: ["admin"] },
  { path: "/settings/billing", allowedRoles: ["admin"] },
  { path: "/analytics/team", allowedRoles: ["admin", "manager"] },
  // Premium features requiring subscription
  { path: "/integrations/api", minTier: "professional" },
  { path: "/integrations/webhooks", minTier: "professional" },
];

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

  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based and subscription-based access control for authenticated users
  if (user && isProtectedPath) {
    // Find if current path requires role-based or subscription-based access
    const routeConfig = roleProtectedRoutes.find((route) =>
      request.nextUrl.pathname.startsWith(route.path)
    );

    if (routeConfig?.allowedRoles || routeConfig?.minTier) {
      // Fetch user's role and organization subscription from the database
      const { data: userData } = await supabase
        .from("users")
        .select("role, organization_id, organizations(subscription_tier)")
        .eq("id", user.id)
        .single();

      const userRole = userData?.role as UserRole | undefined;
      const orgData = userData?.organizations as { subscription_tier?: string } | null;
      const subscriptionTier = (orgData?.subscription_tier || "free") as SubscriptionTier;

      // Check role-based access
      if (routeConfig.allowedRoles) {
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
          const redirectUrl = new URL("/pricing", request.url);
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
