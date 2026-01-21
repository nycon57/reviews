"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database.types";
import {
  createCredentialSchema,
  updateCredentialSchema,
  verifyCredentialSchema,
  rowToCredential,
  type UserCredential,
  type UserCredentialRow,
  type ActionResult,
} from "./types";

// Get user context
async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

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

  return {
    userId: context.id,
    organizationId: context.organization_id!,
  };
}

/**
 * Get all credentials for the current user
 */
export async function getMyCredentials(): Promise<
  ActionResult<UserCredential[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("user_credentials")
    .select("*")
    .eq("user_id", user.id)
    .order("credential_type");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data as UserCredentialRow[]).map(rowToCredential),
  };
}

/**
 * Get all credentials for a specific user (admin only)
 */
export async function getUserCredentials(
  userId: string
): Promise<ActionResult<UserCredential[]>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_credentials")
    .select("*")
    .eq("user_id", userId)
    .eq("organization_id", context.organizationId)
    .order("credential_type");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data as UserCredentialRow[]).map(rowToCredential),
  };
}

/**
 * Get public credentials for a user (for public profile pages)
 */
export async function getPublicCredentials(
  userId: string
): Promise<ActionResult<UserCredential[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_credentials")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("credential_type");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data as UserCredentialRow[]).map(rowToCredential),
  };
}

/**
 * Create a new credential for the current user
 */
export async function createCredential(
  input: unknown
): Promise<ActionResult<UserCredential>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createCredentialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_credentials")
    .insert({
      user_id: context.id,
      organization_id: context.organization_id!,
      credential_type: parsed.data.credentialType,
      credential_number: parsed.data.credentialNumber,
      issuing_authority: parsed.data.issuingAuthority || null,
      issued_date: parsed.data.issuedDate || null,
      expiry_date: parsed.data.expiryDate || null,
      is_public: parsed.data.isPublic,
      metadata: (parsed.data.metadata || null) as Json,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "This credential already exists for your account",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/profile/${context.id}`);

  return { success: true, data: rowToCredential(data as UserCredentialRow) };
}

/**
 * Create a credential for another user (admin only)
 */
export async function createCredentialForUser(
  userId: string,
  input: unknown
): Promise<ActionResult<UserCredential>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  const parsed = createCredentialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  // Verify user belongs to same organization
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, organization_id")
    .eq("id", userId)
    .eq("organization_id", context.organizationId)
    .single();

  if (!targetUser) {
    return { success: false, error: "User not found in your organization" };
  }

  const { data, error } = await supabase
    .from("user_credentials")
    .insert({
      user_id: userId,
      organization_id: context.organizationId,
      credential_type: parsed.data.credentialType,
      credential_number: parsed.data.credentialNumber,
      issuing_authority: parsed.data.issuingAuthority || null,
      issued_date: parsed.data.issuedDate || null,
      expiry_date: parsed.data.expiryDate || null,
      is_public: parsed.data.isPublic,
      metadata: (parsed.data.metadata || null) as Json,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "This credential already exists for this user",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/team");
  revalidatePath(`/profile/${userId}`);

  return { success: true, data: rowToCredential(data as UserCredentialRow) };
}

/**
 * Update a credential
 */
export async function updateCredential(
  input: unknown
): Promise<ActionResult<UserCredential>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateCredentialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (parsed.data.credentialType !== undefined)
    updates.credential_type = parsed.data.credentialType;
  if (parsed.data.credentialNumber !== undefined)
    updates.credential_number = parsed.data.credentialNumber;
  if (parsed.data.issuingAuthority !== undefined)
    updates.issuing_authority = parsed.data.issuingAuthority;
  if (parsed.data.issuedDate !== undefined)
    updates.issued_date = parsed.data.issuedDate;
  if (parsed.data.expiryDate !== undefined)
    updates.expiry_date = parsed.data.expiryDate;
  if (parsed.data.isPublic !== undefined) updates.is_public = parsed.data.isPublic;
  if (parsed.data.metadata !== undefined) updates.metadata = parsed.data.metadata;

  // Users can update their own, admins can update any in their org
  let query = supabase
    .from("user_credentials")
    .update(updates)
    .eq("id", parsed.data.id);

  if (context.role === "admin") {
    query = query.eq("organization_id", context.organization_id!);
  } else {
    query = query.eq("user_id", context.id);
  }

  const { data, error } = await query.select().single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Credential not found" };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/profile/${(data as UserCredentialRow).user_id}`);

  return { success: true, data: rowToCredential(data as UserCredentialRow) };
}

/**
 * Delete a credential
 */
export async function deleteCredential(id: string): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createClient();

  // Get credential to check ownership and get user_id for revalidation
  let query = supabase.from("user_credentials").select("user_id").eq("id", id);

  if (context.role === "admin") {
    query = query.eq("organization_id", context.organization_id!);
  } else {
    query = query.eq("user_id", context.id);
  }

  const { data: credential } = await query.single();

  if (!credential) {
    return { success: false, error: "Credential not found" };
  }

  const { error } = await supabase
    .from("user_credentials")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/profile/${credential.user_id}`);

  return { success: true };
}

/**
 * Verify a credential (admin only)
 */
export async function verifyCredential(
  input: unknown
): Promise<ActionResult<UserCredential>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  const parsed = verifyCredentialSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_credentials")
    .update({
      is_verified: parsed.data.isVerified,
      verified_at: parsed.data.isVerified ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id)
    .eq("organization_id", context.organizationId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Credential not found" };
  }

  revalidatePath("/dashboard/team");
  revalidatePath(`/profile/${(data as UserCredentialRow).user_id}`);

  return { success: true, data: rowToCredential(data as UserCredentialRow) };
}

/**
 * Get credentials expiring within X days (admin only)
 */
export async function getExpiringCredentials(
  daysUntilExpiry: number = 30
): Promise<ActionResult<UserCredential[]>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  const supabase = await createClient();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysUntilExpiry);

  const { data, error } = await supabase
    .from("user_credentials")
    .select("*")
    .eq("organization_id", context.organizationId)
    .not("expiry_date", "is", null)
    .lte("expiry_date", futureDate.toISOString().split("T")[0])
    .order("expiry_date");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data as UserCredentialRow[]).map(rowToCredential),
  };
}
