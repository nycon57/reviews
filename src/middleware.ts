import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role-based access control configuration
type UserRole = "admin" | "manager" | "loan_officer";

interface RouteConfig {
  path: string;
  allowedRoles?: UserRole[];
}

// Routes that require specific roles
const roleProtectedRoutes: RouteConfig[] = [
  { path: "/team", allowedRoles: ["admin", "manager"] },
  { path: "/settings/organization", allowedRoles: ["admin"] },
  { path: "/settings/billing", allowedRoles: ["admin"] },
  { path: "/analytics/team", allowedRoles: ["admin", "manager"] },
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

  // Role-based access control for authenticated users
  if (user && isProtectedPath) {
    // Find if current path requires role-based access
    const roleRoute = roleProtectedRoutes.find((route) =>
      request.nextUrl.pathname.startsWith(route.path)
    );

    if (roleRoute?.allowedRoles) {
      // Fetch user's role from the database
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole = userData?.role as UserRole | undefined;

      // If user doesn't have required role, redirect to dashboard with error
      if (!userRole || !roleRoute.allowedRoles.includes(userRole)) {
        const redirectUrl = new URL("/dashboard", request.url);
        redirectUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(redirectUrl);
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
