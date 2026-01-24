"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { signOut as betterAuthSignOut, getSession } from "@/lib/auth/auth-client";

// Feature flag for Better Auth migration
const USE_BETTER_AUTH = process.env.NEXT_PUBLIC_USE_BETTER_AUTH === "true";

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

/**
 * Unified auth hook that supports both Supabase Auth and Better Auth
 * Uses feature flag to determine which auth system to use
 */
export function useAuth() {
  const router = useRouter();

  // Supabase Auth state
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(!USE_BETTER_AUTH);
  const supabase = useMemo(() => createClient(), []);

  // Better Auth state - only fetched once on mount, not polling
  const [betterAuthUser, setBetterAuthUser] = useState<BetterAuthUser | null>(null);
  const [betterAuthLoading, setBetterAuthLoading] = useState(USE_BETTER_AUTH);

  // Fetch Better Auth session once on mount (only when feature flag is enabled)
  useEffect(() => {
    if (!USE_BETTER_AUTH) return;

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

  // Initialize Supabase auth listener (only when not using Better Auth)
  useEffect(() => {
    if (USE_BETTER_AUTH) return;

    // Get initial user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSupabaseUser(user);
      setSupabaseLoading(false);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      setSupabaseLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Determine current user and loading state based on auth system
  const user: AuthUser | null = USE_BETTER_AUTH
    ? betterAuthUser
      ? {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          name: betterAuthUser.name,
          image: betterAuthUser.image,
        }
      : null
    : supabaseUser
      ? {
          id: supabaseUser.id,
          email: supabaseUser.email ?? null,
          name: supabaseUser.user_metadata?.full_name,
          image: supabaseUser.user_metadata?.avatar_url,
        }
      : null;

  const loading = USE_BETTER_AUTH ? betterAuthLoading : supabaseLoading;

  // Sign out function
  const signOut = async () => {
    if (USE_BETTER_AUTH) {
      await betterAuthSignOut();
    } else {
      await supabase.auth.signOut();
    }
    router.push("/login");
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
    // Expose which auth system is being used (for debugging/logging)
    authSystem: USE_BETTER_AUTH ? "better-auth" : "supabase",
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
