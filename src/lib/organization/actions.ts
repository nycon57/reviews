"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
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
} from "./types";

// Get current user's organization
export async function getCurrentOrganization(): Promise<{
  organization: Organization | null;
  error: string | null
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { organization: null, error: "Not authenticated" };
  }

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

  return { organization: org as Organization, error: null };
}

// Update organization settings
export async function updateOrganizationSettings(
  data: UpdateOrganizationSettings
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { members: [], error: "Not authenticated" };
  }

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

// Update member role
export async function updateMemberRole(
  memberId: string,
  newRole: "admin" | "manager" | "loan_officer"
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can update member roles" };
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

  // Update role
  const { error } = await supabase
    .from("users")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { success: true, error: null };
}

// Deactivate member
export async function deactivateMember(
  memberId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Cannot deactivate yourself
  if (memberId === user.id) {
    return { success: false, error: "Cannot deactivate yourself" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { invitation: null, error: "Not authenticated" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { invitations: [], error: "Not authenticated" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { stats: null, error: "Not authenticated" };
  }

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
      supabase.from("loan_officers").select("id", { count: "exact", head: true })
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
        total_loan_officers: los.count || 0,
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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { logs: [], error: "Not authenticated" };
  }

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
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin";
}
