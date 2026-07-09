import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

// Feature flag for Better Auth migration
const USE_BETTER_AUTH = process.env.USE_BETTER_AUTH === "true";

// Role-based access control configuration
type UserRole = "admin" | "manager" | "user";
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
  /**
   * Requires org-admin access: individual account owners (their own admin) OR
   * enterprise admins. Mirrors `requireIndividualOrEnterpriseAdmin` so the
   * middleware and the page guard agree (ADR 0007).
   */
  requiresOrgAdmin?: boolean;
  /** Requires RepWell platform staff access */
  requiresPlatformAdmin?: boolean;
}

// Tier hierarchy for comparison
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  basic: 0,
  pro: 1,
  enterprise: 2,
};

// Routes that require specific roles, subscription tiers, or account types
const roleProtectedRoutes: RouteConfig[] = [
  // RepWell platform staff tooling
  { path: "/staff", requiresPlatformAdmin: true },

  // Enterprise-only management routes (hidden from individual users)
  { path: "/dashboard/people", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/campaigns", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/approvals", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/share-studio", allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/ex-surveys", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/analytics/team", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
  { path: "/dashboard/recognition", requiresEnterprise: true },
  { path: "/dashboard/analytics/leaderboard", requiresEnterprise: true },

  // Org-admin routes: individual owners AND enterprise admins (ADR 0007 —
  // individuals reach their own Workspace/org area; the page guard agrees).
  { path: "/dashboard/organization", requiresOrgAdmin: true },
  // Note: /dashboard/surveys access control is handled at the page level (open to individuals + enterprise admins)

  // Pro tier features (available to pro individuals and all enterprise users)
  { path: "/dashboard/insights", minTier: "pro" },
];

// Paths that are part of the onboarding flow
const onboardingPaths = ["/onboarding"];

/**
 * Get user from Better Auth session via API call
 * Uses fetch instead of direct import to avoid Node.js modules in Edge runtime
 */
async function getBetterAuthUser(request: NextRequest) {
  try {
    // Derive base URL from the request (handles any port: 3000, 3001, 3002, 3003, or prod)
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Forward cookies to the Better Auth session endpoint
    const cookieHeader = request.headers.get("cookie") || "";

    const response = await fetch(`${baseUrl}/api/auth/get-session`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      // If rate limited (429), log and return null to avoid redirect loops
      // The rate limiter should be disabled or configured to allow session checks
      if (response.status === 429) {
        console.warn("[Middleware] Session check rate limited - consider disabling rate limiting for get-session");
      }
      return null;
    }

    const session = await response.json();
    return session?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Get user from Supabase Auth (legacy)
 */
async function getSupabaseUser(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(
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

  return { user, supabase };
}

async function getPlatformAdminFlag(
  request: NextRequest,
  response: NextResponse,
  userId: string
): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = USE_BETTER_AUTH
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(`[Middleware] Missing Supabase config for platform staff lookup`);
    return false;
  }

  const supabase = USE_BETTER_AUTH
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : createServerClient(supabaseUrl, supabaseKey, {
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
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      });

  // Untyped client: users.is_platform_admin is added by the pending staff
  // migration and is not in generated database types yet.
  const { data, error } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", userId)
    .limit(1);

  if (error) {
    console.error(`[Middleware] Platform staff query error:`, error.message);
    return false;
  }

  return data?.[0]?.is_platform_admin === true;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip auth check for RSC/Server Action POST requests - these are data fetches for already-authed pages
  // The initial GET request already verified auth, and cookies are still valid
  // RSC requests have Next-Router-State-Tree header, Server Actions have Next-Action header
  const isRSCOrServerAction = request.method === "POST" && (
    request.headers.get("next-router-state-tree") !== null ||
    request.headers.get("next-action") !== null ||
    request.headers.get("rsc") !== null
  );

  if (isRSCOrServerAction) {
    return response;
  }

  // Get authenticated user based on auth system
  let user: { id: string; email?: string | null } | null = null;
  // Use union type to support both createClient (service_role) and createServerClient (SSR)
  let supabase: ReturnType<typeof createServerClient<Database>> | ReturnType<typeof createClient<Database>> | null = null;

  if (USE_BETTER_AUTH) {
    // Use Better Auth
    user = await getBetterAuthUser(request);
  } else {
    // Use Supabase Auth (legacy)
    const result = await getSupabaseUser(request, response);
    user = result.user;
    supabase = result.supabase;
  }

  // Protected routes - require authentication
  const protectedPaths = ["/dashboard", "/staff", "/reviews", "/surveys", "/analytics", "/team", "/settings", "/profile"];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const isOnboardingPath = onboardingPaths.some((path) => request.nextUrl.pathname.startsWith(path));
  const routeConfig = roleProtectedRoutes.find((route) =>
    request.nextUrl.pathname.startsWith(route.path)
  );

  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // For database queries, create a Supabase client if we haven't already
  // Use service role key when Better Auth is enabled (bypasses RLS since session token isn't set)
  // IMPORTANT: Use createClient (not createServerClient) for service_role to properly bypass RLS
  if (!supabase && user) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = USE_BETTER_AUTH
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(`[Middleware] Missing Supabase config: url=${!!supabaseUrl}, key=${!!supabaseKey}`);
    } else if (USE_BETTER_AUTH) {
      // Use createClient directly for service_role - it properly sets both apikey and Authorization headers
      // createServerClient from @supabase/ssr doesn't correctly bypass RLS with service_role
      supabase = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      // For Supabase Auth, use the SSR client with cookies
      supabase = createServerClient<Database>(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );
    }
  }

  // Fetch user data once for both onboarding and access checks
  let cachedUserData: { role: string | null; organization_id: string | null } | null = null;
  let cachedOrgData: { subscription_tier: string | null; account_type: string | null; onboarding_status: string | null } | null = null;

  if (user && supabase && isProtectedPath) {
    // Fetch user data using .limit(1) instead of .single() to avoid PGRST116 errors
    const { data: userRows, error: userQueryError } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", user.id)
      .limit(1);

    if (userQueryError) {
      console.error(`[Middleware] User query error for user.id=${user.id}:`, userQueryError.message, userQueryError.code);
    } else if (userRows && userRows.length > 0) {
      cachedUserData = userRows[0];

      // Single path (ADR 0006): every account has one organizations row, and
      // account_type discriminates individual vs enterprise. subscription_tier
      // and onboarding_status are read straight from it for both.
      if (cachedUserData?.organization_id) {
        const { data: orgRows, error: orgQueryError } = await supabase
          .from("organizations")
          .select("subscription_tier, account_type, onboarding_status")
          .eq("id", cachedUserData.organization_id)
          .limit(1);

        if (orgQueryError) {
          console.error(`[Middleware] Org query error:`, orgQueryError.message, orgQueryError.code);
        } else if (orgRows && orgRows.length > 0) {
          cachedOrgData = orgRows[0];
        }
      }
    }
  }

  // Check onboarding status for protected paths (not onboarding paths themselves)
  if (user && isProtectedPath && !isOnboardingPath && !routeConfig?.requiresPlatformAdmin && cachedOrgData) {
    const onboardingStatus = (cachedOrgData.onboarding_status || "pending") as OnboardingStatus;

    // If onboarding not completed, redirect to onboarding
    if (onboardingStatus !== "completed") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  // Role-based and subscription-based access control for authenticated users
  if (user && supabase && isProtectedPath) {
    if (routeConfig?.allowedRoles || routeConfig?.minTier || routeConfig?.requiresEnterprise || routeConfig?.requiresEnterpriseAdmin || routeConfig?.requiresOrgAdmin || routeConfig?.requiresPlatformAdmin) {
      if (routeConfig.requiresPlatformAdmin) {
        const isStaff = await getPlatformAdminFlag(request, response, user.id);

        if (!isStaff) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      // Default to "user" role if not set (consistent with access module)
      // Also handle legacy "loan_officer" role by treating it as "user"
      const rawRole = cachedUserData?.role;
      const userRole = (rawRole === "loan_officer" ? "user" : rawRole || "user") as UserRole;
      const subscriptionTier = (cachedOrgData?.subscription_tier || "basic") as SubscriptionTier;
      // Default to "individual" (not "enterprise") for safety
      const accountType = (cachedOrgData?.account_type || "individual") as AccountType;

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

      // Check if route requires org-admin access (individual owners OR
      // enterprise admins). Enterprise non-admins are bounced; individuals pass.
      if (routeConfig.requiresOrgAdmin) {
        const isOrgAdmin =
          accountType === "individual" ||
          (accountType === "enterprise" && userRole === "admin");
        if (!isOrgAdmin) {
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
          const redirectUrl = new URL("/dashboard/settings", request.url);
          redirectUrl.searchParams.set("tab", "billing");
          redirectUrl.searchParams.set("upgrade", routeConfig.minTier);
          redirectUrl.searchParams.set("feature", request.nextUrl.pathname);
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }

  // Redirect old /dashboard/requests to /dashboard/reviews?tab=requests
  if (request.nextUrl.pathname.startsWith("/dashboard/requests")) {
    const redirectUrl = new URL("/dashboard/reviews", request.url);
    redirectUrl.searchParams.set("tab", "requests");
    return NextResponse.redirect(redirectUrl);
  }

  // Auth routes - redirect to dashboard if already logged in
  const authPaths = ["/login", "/signup", "/forgot-password"];
  const isAuthPath = authPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Reset password page requires an authenticated session (from recovery email)
  // For Better Auth, this is handled differently - the token is in the URL
  if (!USE_BETTER_AUTH && request.nextUrl.pathname === "/reset-password" && !user) {
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
