/**
 * Centralized Permission System for RepWell
 *
 * Three-tier user model:
 * - Individual: Solo user, self-serve signup (Basic/Pro plan)
 * - Enterprise User: Invited member (loan_officer/manager role)
 * - Enterprise Admin: Full org management (admin role)
 */

import type { UserRole } from "@/types";

export type AccountType = "individual" | "enterprise";
export type SubscriptionTier = "basic" | "pro" | "enterprise";

export interface UserContext {
  userId: string;
  role: UserRole;
  accountType: AccountType;
  isOwner: boolean;
  subscriptionTier: SubscriptionTier;
  organizationId: string;
}

// Permission identifiers
export const PERMISSIONS = {
  // Management features (enterprise only, manager+)
  VIEW_MANAGER_DASHBOARD: "view:manager_dashboard",
  VIEW_TEAM: "view:team",
  MANAGE_TEAM: "manage:team",
  VIEW_EX_SURVEYS: "view:ex_surveys",
  MANAGE_EX_SURVEYS: "manage:ex_surveys",
  VIEW_CAMPAIGNS: "view:campaigns",
  MANAGE_CAMPAIGNS: "manage:campaigns",

  // Organization settings (enterprise admin only)
  VIEW_ORGANIZATION: "view:organization",
  MANAGE_ORGANIZATION: "manage:organization",
  MANAGE_BILLING: "manage:billing",
  INVITE_USERS: "invite:users",
  ELEVATE_ROLES: "elevate:roles",

  // Enterprise team features (all enterprise users)
  VIEW_LEADERBOARD: "view:leaderboard",
  VIEW_RECOGNITION: "view:recognition",

  // Pro tier features
  VIEW_AI_INSIGHTS: "view:ai_insights",
  VIEW_GEO_VISIBILITY: "view:geo_visibility",
  VIEW_WEBSITE_ANALYTICS: "view:website_analytics",

  // Basic features (all users)
  VIEW_DASHBOARD: "view:dashboard",
  VIEW_REVIEWS: "view:reviews",
  VIEW_SURVEYS: "view:surveys",
  VIEW_LISTINGS: "view:listings",
  VIEW_RESPONSES: "view:responses",
  VIEW_ANALYTICS: "view:analytics",
  VIEW_TRENDS: "view:trends",
  VIEW_TESTIMONIALS: "view:testimonials",
  SEND_SURVEY: "send:survey",
  VIEW_SETTINGS: "view:settings",
  VIEW_HELP: "view:help",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Check if user has a specific permission based on their context
 */
export function hasPermission(ctx: UserContext | null, permission: Permission): boolean {
  if (!ctx) return false;

  const { role, accountType, subscriptionTier } = ctx;
  const _isIndividual = accountType === "individual"; // Reserved for future individual-specific permissions
  const isEnterprise = accountType === "enterprise";
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const _isLoanOfficer = role === "loan_officer"; // Reserved for future loan officer-specific permissions
  const isManagerOrAbove = isAdmin || isManager;
  const isPro = subscriptionTier === "pro" || subscriptionTier === "enterprise";

  switch (permission) {
    // === Enterprise-only management features (hidden from individual users) ===
    case PERMISSIONS.VIEW_MANAGER_DASHBOARD:
    case PERMISSIONS.VIEW_TEAM:
    case PERMISSIONS.MANAGE_TEAM:
    case PERMISSIONS.VIEW_EX_SURVEYS:
    case PERMISSIONS.MANAGE_EX_SURVEYS:
    case PERMISSIONS.VIEW_CAMPAIGNS:
    case PERMISSIONS.MANAGE_CAMPAIGNS:
      // Only enterprise managers/admins can access these
      return isEnterprise && isManagerOrAbove;

    // === Enterprise admin only ===
    case PERMISSIONS.VIEW_ORGANIZATION:
    case PERMISSIONS.MANAGE_ORGANIZATION:
    case PERMISSIONS.MANAGE_BILLING:
    case PERMISSIONS.INVITE_USERS:
    case PERMISSIONS.ELEVATE_ROLES:
      // Only enterprise admins
      return isEnterprise && isAdmin;

    // === Enterprise team features (all enterprise users) ===
    case PERMISSIONS.VIEW_LEADERBOARD:
    case PERMISSIONS.VIEW_RECOGNITION:
      // All enterprise users can see these, but not individual users
      return isEnterprise;

    // === Pro tier features ===
    case PERMISSIONS.VIEW_AI_INSIGHTS:
    case PERMISSIONS.VIEW_GEO_VISIBILITY:
    case PERMISSIONS.VIEW_WEBSITE_ANALYTICS:
      // Requires Pro subscription (individuals) or Enterprise tier
      return isPro;

    // === Basic features (all authenticated users) ===
    case PERMISSIONS.VIEW_DASHBOARD:
    case PERMISSIONS.VIEW_REVIEWS:
    case PERMISSIONS.VIEW_SURVEYS:
    case PERMISSIONS.VIEW_LISTINGS:
    case PERMISSIONS.VIEW_RESPONSES:
    case PERMISSIONS.VIEW_ANALYTICS:
    case PERMISSIONS.VIEW_TRENDS:
    case PERMISSIONS.VIEW_TESTIMONIALS:
    case PERMISSIONS.SEND_SURVEY:
    case PERMISSIONS.VIEW_SETTINGS:
    case PERMISSIONS.VIEW_HELP:
      return true;

    default:
      return false;
  }
}

/**
 * Check if user can access a Pro feature (for upgrade prompts)
 */
export function canAccessProFeature(ctx: UserContext | null): boolean {
  if (!ctx) return false;
  return ctx.subscriptionTier === "pro" || ctx.subscriptionTier === "enterprise";
}

/**
 * Check if user should see the "Upgrade to Pro" CTA
 */
export function shouldShowUpgradeCTA(ctx: UserContext | null): boolean {
  if (!ctx) return false;
  // Only show to individual Basic users
  return ctx.accountType === "individual" && ctx.subscriptionTier === "basic";
}

/**
 * Check if user should see the "Invite Team" button
 */
export function canInviteTeam(ctx: UserContext | null): boolean {
  if (!ctx) return false;
  // Only enterprise admins can invite team members
  return ctx.accountType === "enterprise" && ctx.role === "admin";
}

/**
 * Get user tier label for display
 */
export function getUserTierLabel(ctx: UserContext | null): string {
  if (!ctx) return "";

  if (ctx.accountType === "individual") {
    return ctx.subscriptionTier === "basic" ? "Basic" : "Pro";
  }

  // Enterprise users
  switch (ctx.role) {
    case "admin":
      return "Enterprise Admin";
    case "manager":
      return "Enterprise Manager";
    default:
      return "Enterprise";
  }
}

/**
 * Check multiple permissions at once
 */
export function hasAnyPermission(ctx: UserContext | null, permissions: Permission[]): boolean {
  return permissions.some((perm) => hasPermission(ctx, perm));
}

/**
 * Check all permissions at once
 */
export function hasAllPermissions(ctx: UserContext | null, permissions: Permission[]): boolean {
  return permissions.every((perm) => hasPermission(ctx, perm));
}
