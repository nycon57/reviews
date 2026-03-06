"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import {
  updateUserProfileSchema,
  updateUserSettingsSchema,
  updateUserByAdminSchema,
  rowToUser,
  rowToPublicUser,
  publicUserFields,
  type User,
  type UserRow,
  type UserWithBranch,
  type PublicUser,
  type ActionResult,
} from "./types";

// Get user context
async function getUserContext() {
  const user = await unifiedGetUser();

  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  return userData;
}

// Check if user has admin role
async function requireAdminRole(): Promise<{
  userId: string;
  organizationId: string;
} | null> {
  const context = await getUserContext();

  if (!context || context.role !== "admin") {
    return null;
  }

  if (!context.organization_id) {
    return null;
  }

  return {
    userId: context.id,
    organizationId: context.organization_id,
  };
}

// Check if user has manager/admin role
async function requireManagerRole(): Promise<{
  userId: string;
  organizationId: string;
  role: string;
} | null> {
  const context = await getUserContext();

  if (!context || !["admin", "manager"].includes(context.role)) {
    return null;
  }

  if (!context.organization_id) {
    return null;
  }

  return {
    userId: context.id,
    organizationId: context.organization_id,
    role: context.role,
  };
}

/**
 * Get the current user's full profile
 */
export async function getCurrentUser(): Promise<ActionResult<User>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: rowToUser(data as UserRow) };
}

/**
 * Get a user by ID (within organization)
 */
export async function getUser(userId: string): Promise<ActionResult<User>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .eq("organization_id", context.organization_id!)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "User not found" };
  }

  return { success: true, data: rowToUser(data as UserRow) };
}

/**
 * Get a user with branch details
 */
export async function getUserWithBranch(
  userId: string
): Promise<ActionResult<UserWithBranch>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select(
      `
      *,
      branches!users_branch_id_fkey (
        id,
        name,
        slug
      )
    `
    )
    .eq("id", userId)
    .eq("organization_id", context.organization_id!)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "User not found" };
  }

  const user = rowToUser(data as UserRow);
  const branch = data.branches as { id: string; name: string; slug: string } | null;

  return {
    success: true,
    data: {
      ...user,
      branch: branch || null,
    },
  };
}

/**
 * Get all users in the organization
 */
export async function getOrganizationUsers(params?: {
  role?: string;
  isActive?: boolean;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ users: User[]; total: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .eq("organization_id", context.organizationId)
    .order("full_name");

  if (params?.role) {
    query = query.eq("role", params.role);
  }

  if (params?.isActive !== undefined) {
    query = query.eq("is_active", params.isActive);
  }

  if (params?.branchId) {
    query = query.eq("branch_id", params.branchId);
  }

  if (params?.search) {
    // Sanitize search input: escape special characters used in PostgREST filter syntax
    const sanitizedSearch = params.search
      .replace(/[%_\\]/g, "\\$&")  // Escape SQL wildcards and backslash
      .replace(/[(),.'":]/g, "");  // Remove PostgREST special characters

    if (sanitizedSearch.length > 0 && sanitizedSearch.length <= 100) {
      query = query.or(
        `full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`
      );
    }
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      users: (data as UserRow[]).map(rowToUser),
      total: count || 0,
    },
  };
}

/**
 * Get users for public directory (loan officers only)
 */
export async function getPublicUsers(params?: {
  organizationId: string;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ users: User[]; total: number }>> {
  if (!params?.organizationId) {
    return { success: false, error: "Organization ID is required" };
  }

  const supabase = createAdminClient();
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .eq("organization_id", params.organizationId)
    .eq("role", "user")
    .eq("is_active", true)
    .order("full_name");

  if (params?.branchId) {
    query = query.eq("branch_id", params.branchId);
  }

  if (params?.search) {
    // Sanitize search input: escape special characters used in PostgREST filter syntax
    const sanitizedSearch = params.search
      .replace(/[%_\\]/g, "\\$&")  // Escape SQL wildcards and backslash
      .replace(/[(),.'":]/g, "");  // Remove PostgREST special characters

    if (sanitizedSearch.length > 0 && sanitizedSearch.length <= 100) {
      query = query.or(
        `full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`
      );
    }
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      users: (data as UserRow[]).map(rowToUser),
      total: count || 0,
    },
  };
}

/**
 * Update current user's profile
 */
export async function updateMyProfile(
  input: unknown
): Promise<ActionResult<User>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const parsed = updateUserProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.photoUrl !== undefined) updates.photo_url = parsed.data.photoUrl;
  if (parsed.data.personalWebsiteUrl !== undefined)
    updates.personal_website_url = parsed.data.personalWebsiteUrl;
  if (parsed.data.linkedinUrl !== undefined)
    updates.linkedin_url = parsed.data.linkedinUrl;
  if (parsed.data.zillowProfileUrl !== undefined)
    updates.zillow_profile_url = parsed.data.zillowProfileUrl;
  if (parsed.data.address !== undefined) updates.address = parsed.data.address;
  if (parsed.data.timezone !== undefined) updates.timezone = parsed.data.timezone;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/profile/${user.id}`);

  return { success: true, data: rowToUser(data as UserRow) };
}

/**
 * Update current user's settings
 */
export async function updateMySettings(
  input: unknown
): Promise<ActionResult<User>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const parsed = updateUserSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (parsed.data.receiveNotifications !== undefined)
    updates.receive_notifications = parsed.data.receiveNotifications;
  if (parsed.data.autoRequestReviews !== undefined)
    updates.auto_request_reviews = parsed.data.autoRequestReviews;
  if (parsed.data.notificationPreferences !== undefined)
    updates.notification_preferences = parsed.data.notificationPreferences;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");

  return { success: true, data: rowToUser(data as UserRow) };
}

/**
 * Update a user by admin
 */
export async function updateUserByAdmin(
  input: unknown
): Promise<ActionResult<User>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  const parsed = updateUserByAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = createAdminClient();

  // Build update object
  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName !== undefined) updates.full_name = parsed.data.fullName;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.photoUrl !== undefined) updates.photo_url = parsed.data.photoUrl;
  if (parsed.data.branchId !== undefined) updates.branch_id = parsed.data.branchId;
  if (parsed.data.managerUserId !== undefined)
    updates.manager_user_id = parsed.data.managerUserId;
  if (parsed.data.hireDate !== undefined) updates.hire_date = parsed.data.hireDate;
  if (parsed.data.googleBusinessId !== undefined)
    updates.google_business_id = parsed.data.googleBusinessId;
  if (parsed.data.googlePlaceId !== undefined)
    updates.google_place_id = parsed.data.googlePlaceId;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", parsed.data.userId)
    .eq("organization_id", context.organizationId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "User not found" };
  }

  revalidatePath("/dashboard/team");
  revalidatePath(`/profile/${parsed.data.userId}`);

  return { success: true, data: rowToUser(data as UserRow) };
}

/**
 * Deactivate a user
 */
export async function deactivateUser(userId: string): Promise<ActionResult> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  // Prevent self-deactivation
  if (userId === context.userId) {
    return { success: false, error: "You cannot deactivate your own account" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", userId)
    .eq("organization_id", context.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/team");

  return { success: true };
}

/**
 * Reactivate a user
 */
export async function reactivateUser(userId: string): Promise<ActionResult> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({ is_active: true })
    .eq("id", userId)
    .eq("organization_id", context.organizationId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/team");

  return { success: true };
}

/**
 * Get users by manager (direct reports)
 */
export async function getDirectReports(
  managerId?: string
): Promise<ActionResult<User[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const targetManagerId = managerId || context.id;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("manager_user_id", targetManagerId)
    .eq("organization_id", context.organization_id!)
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data as UserRow[]).map(rowToUser),
  };
}

/**
 * Get public user profile (for public profile pages)
 * Returns only public-safe fields to avoid exposing sensitive data
 */
export async function getPublicUserProfile(
  userId: string
): Promise<ActionResult<PublicUser>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select(publicUserFields.join(","))
    .eq("id", userId)
    .eq("is_active", true)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "User not found" };
  }

  return { success: true, data: rowToPublicUser(data as Partial<UserRow>) };
}
