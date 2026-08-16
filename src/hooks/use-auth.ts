"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut as betterAuthSignOut, getSession } from "@/lib/auth/auth-client";

// Unified user type that works with both auth systems
interface AuthUser {
  id: string;
  email: string | null;
  name?: string | null;
  image?: string | null;
}

// Better Auth session type
interface BetterAuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
}

export function useAuth() {
  const router = useRouter();
  const [betterAuthUser, setBetterAuthUser] = useState<BetterAuthUser | null>(null);
  const [betterAuthLoading, setBetterAuthLoading] = useState(true);

  // Fetch Better Auth session once on mount, not polling.
  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      try {
        const session = await getSession();
        if (mounted && session.data?.user) {
          setBetterAuthUser(session.data.user);
        }
      } catch (error) {
        console.error("[useAuth] Failed to fetch Better Auth session:", error);
      } finally {
        if (mounted) {
          setBetterAuthLoading(false);
        }
      }
    };

    fetchSession();

    return () => {
      mounted = false;
    };
  }, []);

  const user: AuthUser | null = betterAuthUser
    ? {
        id: betterAuthUser.id,
        email: betterAuthUser.email,
        name: betterAuthUser.name,
        image: betterAuthUser.image,
      }
    : null;

  const signOut = async () => {
    await betterAuthSignOut();
    router.push("/login");
  };

  return {
    user,
    loading: betterAuthLoading,
    signOut,
    isAuthenticated: !!user,
    authSystem: "better-auth",
  };
}

/**
 * Hook specifically for Better Auth session
 * Use this when you need direct access to the Better Auth session
 * @deprecated Use useAuth() instead which handles both auth systems
 */
export function useBetterAuthSession() {
  // This is deprecated - use useAuth() instead
  // Returning a compatible shape for backwards compatibility
  const { user, loading } = useAuth();
  return {
    data: user ? { user } : null,
    isPending: loading,
    error: null,
  };
}
