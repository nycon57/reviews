"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import type { Tables } from "@/types/database.types";
import {
  updateOrganizationSettingsSchema,
  updateOrganizationBrandingSchema,
  updateOrganizationBillingSchema,
  createInvitationSchema,
  type Organization,
  type OrganizationMember,
  type Invitation,
  type OrganizationStats,
  type AuditLog,
  type UpdateOrganizationSettings,
  type UpdateOrganizationBranding,
  type UpdateOrganizationBilling,
  type CreateInvitation,
  type SubscriptionTier,
  type SubscriptionStatus,
} from "./types";
import { validateOrgSlug, generateUserSlug } from "@/lib/users/slug-utils";

// Transform database row to full Organization type
function transformDbOrganization(row: Tables<"organizations">): Organization {
  const settings = row.settings as Record<string, unknown> | null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain ?? null,
    logo_url: row.logo_url ?? null,
    primary_color: (settings?.primary_color as string) ?? row.primary_color ?? "#3B82F6",
    secondary_color: (settings?.secondary_color as string) ?? "#1E40AF",
    font_family: (settings?.font_family as string) ?? "Inter",
    company_email: (settings?.company_email as string) ?? null,
    company_phone: (settings?.company_phone as string) ?? null,
    company_address: (settings?.company_address as Organization["company_address"]) ?? null,
    timezone: (settings?.timezone as string) ?? "America/New_York",
    date_format: (settings?.date_format as string) ?? "MM/DD/YYYY",
    billing_email: (settings?.billing_email as string) ?? null,
    billing_address: (settings?.billing_address as Organization["billing_address"]) ?? null,
    subscription_tier: (row.subscription_tier as SubscriptionTier) ?? "free",
    subscription_status: (row.subscription_status as SubscriptionStatus) ?? "active",
    subscription_started_at: (settings?.subscription_started_at as string) ?? null,
    subscription_ends_at: (settings?.subscription_ends_at as string) ?? null,
    subscription_cancelled_at: (settings?.subscription_cancelled_at as string) ?? null,
    trial_ends_at: row.trial_ends_at ?? null,
    features: settings?.features as Organization["features"],
    limits: settings?.limits as Organization["limits"],
    settings: settings ?? undefined,
    metadata: (settings?.metadata as Record<string, unknown>) ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

// Get current user's organization
export async function getCurrentOrganization(): Promise<{
  organization: Organization | null;
  error: string | null
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { organization: null, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization_id
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { organization: null, error: "No organization found" };
  }

  // Get organization details
  const { data: org, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", userData.organization_id)
    .single();

  if (error) {
    return { organization: null, error: error.message };
  }

  return { organization: transformDbOrganization(org), error: null };
}

// Update organization settings
export async function updateOrganizationSettings(
  data: UpdateOrganizationSettings
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Validate input
  const validated = updateOrganizationSettingsSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update organization settings" };
  }

  // Update organization
  const { error } = await supabase
    .from("organizations")
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization");
  return { success: true, error: null };
}

// Update organization branding
export async function updateOrganizationBranding(
  data: UpdateOrganizationBranding
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Validate input
  const validated = updateOrganizationBrandingSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update organization branding" };
  }

  // Update organization
  const { error } = await supabase
    .from("organizations")
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization");
  return { success: true, error: null };
}

// Update organization billing
export async function updateOrganizationBilling(
  data: UpdateOrganizationBilling
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Validate input
  const validated = updateOrganizationBillingSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update billing information" };
  }

  // Update organization
  const { error } = await supabase
    .from("organizations")
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization");
  return { success: true, error: null };
}

// Get organization members
export async function getOrganizationMembers(): Promise<{
  members: OrganizationMember[];
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { members: [], error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { members: [], error: "No organization found" };
  }

  // Get members
  const { data: members, error } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, role, is_active, last_login_at, created_at")
    .eq("organization_id", userData.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    return { members: [], error: error.message };
  }

  return { members: members as OrganizationMember[], error: null };
}

// Update member role (enterprise accounts only)
export async function updateMemberRole(
  memberId: string,
  newRole: "admin" | "manager" | "user"
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Cannot change your own role
  if (memberId === user.id) {
    return { success: false, error: "Cannot change your own role" };
  }

  const supabase = createAdminClient();

  // Get user's organization, role, and account type
  const { data: userData } = await supabase
    .from("users")
    .select(`
      organization_id,
      role,
      organizations (
        account_type
      )
    `)
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can update member roles" };
  }

  // Role elevation only applies to enterprise accounts
  const orgData = userData.organizations as { account_type?: string } | null;
  if (orgData?.account_type !== "enterprise") {
    return { success: false, error: "Role management is only available for enterprise accounts" };
  }

  // Verify member belongs to same organization
  // Note: Using * and casting because is_owner may not be in generated types yet
  const { data: memberDataRaw } = await supabase
    .from("users")
    .select("*")
    .eq("id", memberId)
    .single();

  const memberData = memberDataRaw as { organization_id?: string; is_owner?: boolean } | null;

  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  // Cannot demote the owner of the organization
  if (memberData?.is_owner && newRole !== "admin") {
    return { success: false, error: "Cannot demote the organization owner" };
  }

  // Update role
  const { error } = await supabase
    .from("users")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  revalidatePath("/dashboard/team");
  return { success: true, error: null };
}

// Update member details (admin only)
export async function updateMemberDetails(
  memberId: string,
  data: { full_name?: string; avatar_url?: string }
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can update member details" };
  }

  // Verify member belongs to same organization
  const { data: memberData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", memberId)
    .single();

  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  // Update member details
  const { error } = await supabase
    .from("users")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  revalidatePath("/dashboard/team");
  return { success: true, error: null };
}

// Deactivate member
export async function deactivateMember(
  memberId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Cannot deactivate yourself
  if (memberId === user.id) {
    return { success: false, error: "Cannot deactivate yourself" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can deactivate members" };
  }

  // Verify member belongs to same organization
  const { data: memberData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", memberId)
    .single();

  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  // Deactivate member
  const { error } = await supabase
    .from("users")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { success: true, error: null };
}

// Reactivate member
export async function reactivateMember(
  memberId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can reactivate members" };
  }

  // Verify member belongs to same organization
  const { data: memberData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", memberId)
    .single();

  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  // Reactivate member
  const { error } = await supabase
    .from("users")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { success: true, error: null };
}

// Create invitation
export async function createInvitation(
  data: CreateInvitation
): Promise<{ invitation: Invitation | null; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { invitation: null, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Validate input
  const validated = createInvitationSchema.safeParse(data);
  if (!validated.success) {
    return { invitation: null, error: validated.error.errors[0].message };
  }

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { invitation: null, error: "Only admins can invite members" };
  }

  // Check if user already exists in organization
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", validated.data.email)
    .eq("organization_id", userData.organization_id)
    .single();

  if (existingUser) {
    return { invitation: null, error: "User already exists in organization" };
  }

  // Check if invitation already exists (using any cast as table not in generated types yet)
  const { data: existingInvite } = await (supabase as any)
    .from("organization_invitations")
    .select("id")
    .eq("email", validated.data.email)
    .eq("organization_id", userData.organization_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existingInvite) {
    return { invitation: null, error: "Pending invitation already exists for this email" };
  }

  // Create invitation (using any cast as table not in generated types yet)
  const { data: invitation, error } = await (supabase as any)
    .from("organization_invitations")
    .insert({
      organization_id: userData.organization_id,
      email: validated.data.email,
      role: validated.data.role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { invitation: null, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { invitation: invitation as Invitation, error: null };
}

// Get pending invitations
export async function getPendingInvitations(): Promise<{
  invitations: Invitation[];
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { invitations: [], error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { invitations: [], error: "Only admins can view invitations" };
  }

  // Get pending invitations (using any cast as table not in generated types yet)
  const { data: invitations, error } = await (supabase as any)
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", userData.organization_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return { invitations: [], error: error.message };
  }

  return { invitations: invitations as Invitation[], error: null };
}

// Revoke invitation
export async function revokeInvitation(
  invitationId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can revoke invitations" };
  }

  // Delete invitation (using any cast as table not in generated types yet)
  const { error } = await (supabase as any)
    .from("organization_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("organization_id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { success: true, error: null };
}

// Get organization stats
export async function getOrganizationStats(): Promise<{
  stats: OrganizationStats | null;
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { stats: null, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { stats: null, error: "No organization found" };
  }

  // Call the stats function (using any cast as function not in generated types yet)
  const { data: stats, error } = await (supabase as any)
    .rpc("get_organization_stats", { p_organization_id: userData.organization_id })
    .single();

  if (error) {
    // If function doesn't exist, calculate manually
    const [users, los, reviews, surveys, activeSurveys, pendingReviews] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id).eq("is_active", true),
      supabase.from("users").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id).eq("is_active", true),
      supabase.from("reviews").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id),
      supabase.from("surveys").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id),
      supabase.from("surveys").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id).in("status", ["pending", "sent"]),
      supabase.from("reviews").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id).eq("status", "pending"),
    ]);

    return {
      stats: {
        total_users: users.count || 0,
        total_members: los.count || 0,
        total_reviews: reviews.count || 0,
        total_surveys: surveys.count || 0,
        active_surveys: activeSurveys.count || 0,
        pending_reviews: pendingReviews.count || 0,
      },
      error: null,
    };
  }

  return {
    stats: stats as OrganizationStats,
    error: null
  };
}

// Get audit logs
export async function getAuditLogs(limit = 50): Promise<{
  logs: AuditLog[];
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { logs: [], error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { logs: [], error: "Only admins can view audit logs" };
  }

  // Get audit logs (using any cast as table not in generated types yet)
  const { data: logs, error } = await (supabase as any)
    .from("organization_audit_logs")
    .select("*")
    .eq("organization_id", userData.organization_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { logs: [], error: error.message };
  }

  return { logs: logs as AuditLog[], error: null };
}

// Check if user is organization admin
export async function isOrganizationAdmin(): Promise<boolean> {
  const user = await unifiedGetUser();
  if (!user) return false;

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin";
}

/**
 * Update the organization's public URL slug (admin only)
 * @param newSlug The new slug to set
 */
export async function updateOrganizationSlug(
  newSlug: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update the organization URL" };
  }

  // Get current organization slug for revalidation
  const { data: currentOrg } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", userData.organization_id)
    .single();

  // Normalize the slug
  const normalizedSlug = newSlug.toLowerCase().trim();

  // Validate the new slug
  const validation = await validateOrgSlug(normalizedSlug, userData.organization_id);
  if (!validation.valid) {
    return { success: false, error: validation.error || "Invalid slug" };
  }

  // Update the slug
  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      slug: normalizedSlug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (updateError) {
    // Handle unique constraint violation
    if (updateError.code === "23505") {
      return { success: false, error: "This URL is already taken. Please try a different one." };
    }
    return { success: false, error: updateError.message };
  }

  // Revalidate relevant paths
  revalidatePath("/dashboard/organization");
  if (currentOrg?.slug) {
    revalidatePath(`/org/${currentOrg.slug}`);
  }
  revalidatePath(`/org/${normalizedSlug}`);

  return { success: true, error: null };
}

/**
 * Get a suggested slug for an organization based on its name
 */
export async function getSuggestedOrgSlug(
  name: string,
  excludeOrgId?: string
): Promise<{ slug: string }> {
  const baseSlug = generateUserSlug(name); // Reuse the same slug generation logic
  if (!baseSlug) {
    return { slug: "" };
  }

  // Check if the base slug is available
  const validation = await validateOrgSlug(baseSlug, excludeOrgId);
  if (validation.valid) {
    return { slug: baseSlug };
  }

  // Return suggestion if available
  if (validation.suggestion) {
    return { slug: validation.suggestion };
  }

  // Slug is invalid and no suggestion exists
  return { slug: "" };
}
