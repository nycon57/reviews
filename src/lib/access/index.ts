/**
 * Centralized Access Control Module
 *
 * Provides server-side helpers for checking page/feature access based on:
 * - Account type (individual vs enterprise)
 * - User role (admin, manager, user)
 * - Subscription tier (basic, pro, enterprise)
 *
 * Access Matrix:
 * | Feature Category | Individual Basic | Individual Pro | Enterprise User | Enterprise Manager | Enterprise Admin |
 * |------------------|------------------|----------------|-----------------|-------------------|------------------|
 * | Basic            | ✓                | ✓              | ✓               | ✓                 | ✓                |
 * | Pro Features     | 🔒 (upgrade)     | ✓              | ✓               | ✓                 | ✓                |
 * | Enterprise User  | hidden           | hidden         | ✓               | ✓                 | ✓                |
 * | Enterprise Mgr   | hidden           | hidden         | hidden          | ✓                 | ✓                |
 * | Enterprise Admin | hidden           | hidden         | hidden          | hidden            | ✓                |
 */

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { isInGracePeriod, isGracePeriodExpired } from "@/lib/stripe/types";
import type { UserRole } from "@/types";

export type AccountType = "individual" | "enterprise";
export type SubscriptionTier = "basic" | "pro" | "enterprise";

export interface AccessContext {
  userId: string;
  role: UserRole;
  accountType: AccountType;
  subscriptionTier: SubscriptionTier;
  organizationId: string;
  isOwner: boolean;
  /** True when the subscription is cancelled but within the 30-day grace period */
  isGracePeriod: boolean;
}

export interface PageAccessConfig {
  /** Requires enterprise account type */
  requiresEnterprise?: boolean;
  /** Minimum role required (within enterprise) */
  minRole?: "user" | "manager" | "admin";
  /** Minimum subscription tier required */
  minTier?: SubscriptionTier;
  /** Custom error redirect path */
  redirectTo?: string;
}

// Role hierarchy for comparison
const ROLE_LEVELS: Record<UserRole, number> = {
  user: 0,
  manager: 1,
  admin: 2,
};

// Tier hierarchy for comparison
const TIER_LEVELS: Record<SubscriptionTier, number> = {
  basic: 0,
  pro: 1,
  enterprise: 2,
};

/**
 * Get the current user's access context from the database
 * Returns null if user is not authenticated or has no organization
 */
export async function getAccessContext(): Promise<AccessContext | null> {
  const authUser = await unifiedGetUser();
  if (!authUser) return null;

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select(
      `
      id,
      role,
      is_owner,
      organization_id,
      individual_organization_id,
      organizations (
        account_type,
        subscription_tier,
        subscription_status,
        grace_period_ends_at
      )
    `
    )
    .eq("id", authUser.id)
    .single();

  // Enterprise path: organization_id is set
  if (userData?.organization_id) {
    const org = userData.organizations as {
      account_type?: string;
      subscription_tier?: string;
      subscription_status?: string;
      grace_period_ends_at?: string;
    } | null;

    const gracePeriod = isInGracePeriod(
      org?.subscription_status,
      org?.grace_period_ends_at
    );

    // If grace period has expired, redirect to reactivation
    if (isGracePeriodExpired(org?.subscription_status, org?.grace_period_ends_at)) {
      redirect("/reactivate");
    }

    return {
      userId: authUser.id,
      role: (userData.role || "user") as UserRole,
      accountType: (org?.account_type || "enterprise") as AccountType,
      subscriptionTier: (org?.subscription_tier || "basic") as SubscriptionTier,
      organizationId: userData.organization_id,
      isOwner: userData.is_owner || false,
      isGracePeriod: gracePeriod,
    };
  }

  // Individual path: individual_organization_id is set (no enterprise org)
  if (userData?.individual_organization_id) {
    return {
      userId: authUser.id,
      role: (userData.role || "admin") as UserRole,
      accountType: "individual" as AccountType,
      subscriptionTier: "basic" as SubscriptionTier,
      organizationId: userData.individual_organization_id,
      isOwner: true,
      isGracePeriod: false,
    };
  }

  return null;
}

/**
 * Check if user has access to a page/feature and redirect if not
 *
 * @param config Access requirements for the page
 * @returns AccessContext if access granted, redirects otherwise
 */
export async function checkPageAccess(
  config: PageAccessConfig
): Promise<AccessContext> {
  const ctx = await getAccessContext();

  if (!ctx) {
    redirect("/login");
  }

  const { requiresEnterprise, minRole, minTier, redirectTo } = config;

  // Check enterprise requirement
  if (requiresEnterprise && ctx.accountType !== "enterprise") {
    redirect(redirectTo || "/dashboard?error=enterprise_only");
  }

  // Check role requirement (only applies to enterprise accounts)
  if (minRole && ctx.accountType === "enterprise") {
    const requiredLevel = ROLE_LEVELS[minRole];
    const userLevel = ROLE_LEVELS[ctx.role];

    if (userLevel < requiredLevel) {
      redirect(redirectTo || "/dashboard?error=insufficient_role");
    }
  }

  // Check tier requirement
  if (minTier) {
    const requiredLevel = TIER_LEVELS[minTier];
    const userLevel = TIER_LEVELS[ctx.subscriptionTier];

    if (userLevel < requiredLevel) {
      // Redirect to billing with upgrade prompt
      const upgradeUrl = `/dashboard/settings?tab=billing&upgrade=${minTier}`;
      redirect(redirectTo || upgradeUrl);
    }
  }

  return ctx;
}

/**
 * Check if user has access without redirecting
 * Returns { hasAccess: true, ctx } or { hasAccess: false, reason }
 */
export async function hasPageAccess(
  config: PageAccessConfig
): Promise<
  | { hasAccess: true; ctx: AccessContext }
  | { hasAccess: false; reason: string }
> {
  const ctx = await getAccessContext();

  if (!ctx) {
    return { hasAccess: false, reason: "not_authenticated" };
  }

  const { requiresEnterprise, minRole, minTier } = config;

  // Check enterprise requirement
  if (requiresEnterprise && ctx.accountType !== "enterprise") {
    return { hasAccess: false, reason: "enterprise_only" };
  }

  // Check role requirement (only applies to enterprise accounts)
  if (minRole && ctx.accountType === "enterprise") {
    const requiredLevel = ROLE_LEVELS[minRole];
    const userLevel = ROLE_LEVELS[ctx.role];

    if (userLevel < requiredLevel) {
      return { hasAccess: false, reason: "insufficient_role" };
    }
  }

  // Check tier requirement
  if (minTier) {
    const requiredLevel = TIER_LEVELS[minTier];
    const userLevel = TIER_LEVELS[ctx.subscriptionTier];

    if (userLevel < requiredLevel) {
      return { hasAccess: false, reason: "insufficient_tier" };
    }
  }

  return { hasAccess: true, ctx };
}

// ============================================================================
// Convenience helpers for common access patterns
// ============================================================================

/**
 * Require enterprise account (for enterprise-only features)
 * Redirects individual users to dashboard
 */
export async function requireEnterprise(): Promise<AccessContext> {
  return checkPageAccess({ requiresEnterprise: true });
}

/**
 * Require enterprise + manager role or above
 */
export async function requireEnterpriseManager(): Promise<AccessContext> {
  return checkPageAccess({ requiresEnterprise: true, minRole: "manager" });
}

/**
 * Require enterprise + admin role
 */
export async function requireEnterpriseAdmin(): Promise<AccessContext> {
  return checkPageAccess({ requiresEnterprise: true, minRole: "admin" });
}

/**
 * Require individual license OR enterprise admin role.
 * Used for features that are org-level but available to individual users
 * (who are effectively their own org admin).
 */
export async function requireIndividualOrEnterpriseAdmin(): Promise<AccessContext> {
  const ctx = await getAccessContext();
  if (!ctx) redirect("/login");

  // Individual users always have access (they're their own admin)
  if (ctx.accountType === "individual") return ctx;

  // Enterprise users need admin role
  if (ctx.accountType === "enterprise" && ctx.role === "admin") return ctx;

  redirect("/dashboard?error=insufficient_role");
}

/**
 * Require Pro tier (pro or enterprise subscription)
 * Redirects basic users to billing page
 */
export async function requireProTier(): Promise<AccessContext> {
  return checkPageAccess({ minTier: "pro" });
}

/**
 * Check if user has Pro access (for conditional rendering)
 */
export function hasProAccess(ctx: AccessContext): boolean {
  return TIER_LEVELS[ctx.subscriptionTier] >= TIER_LEVELS.pro;
}

/**
 * Check if user is enterprise account
 */
export function isEnterprise(ctx: AccessContext): boolean {
  return ctx.accountType === "enterprise";
}

/**
 * Check if user has manager or admin role (enterprise only)
 */
export function isManagerOrAbove(ctx: AccessContext): boolean {
  return (
    ctx.accountType === "enterprise" && ROLE_LEVELS[ctx.role] >= ROLE_LEVELS.manager
  );
}

/**
 * Check if user is admin (enterprise only)
 */
export function isAdmin(ctx: AccessContext): boolean {
  return ctx.accountType === "enterprise" && ctx.role === "admin";
}

/**
 * Check if user has full access (not in grace period).
 * During grace period, users can view data but can't perform actions
 * like sending surveys, managing reviews, etc.
 */
export function hasFullAccess(ctx: AccessContext): boolean {
  return !ctx.isGracePeriod;
}
