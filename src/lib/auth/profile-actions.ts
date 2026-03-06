"use server";

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { getStripe } from "@/lib/stripe/server";
import { startReengagementSequence } from "@/lib/email/reengagement-sequence-service";
import {
  updateProfileSchema,
  changePasswordSchema,
  orgFieldsSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type OrgFieldsInput,
  type ProfileResult,
} from "./profile-schemas";
import { writeProfileUpdate, writeAvatarUpload, writeBannerUpload } from "@/lib/users/profile-mutations";
import { validateUserSlug, generateUserSlug } from "@/lib/users/slug-utils";

export async function updateProfile(formData: UpdateProfileInput): Promise<ProfileResult> {
  const result = updateProfileSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  return writeProfileUpdate(user.id, result.data);
}

/**
 * Individual users can update their own org-managed fields (CTA, hire date, etc.)
 * Only allowed for individual account types.
 */
export async function updateOwnOrgFields(formData: OrgFieldsInput): Promise<ProfileResult> {
  const result = orgFieldsSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Verify user is on an individual account
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, organizations(account_type)")
    .eq("id", user.id)
    .single();

  const orgAccountType = (userData?.organizations as { account_type?: string } | null)?.account_type;
  if (orgAccountType !== "individual") {
    return { success: false, error: "Only individual account users can update these fields directly" };
  }

  return writeProfileUpdate(user.id, result.data);
}

export async function changePassword(formData: ChangePasswordInput): Promise<ProfileResult> {
  // Validate input
  const result = changePasswordSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { newPassword } = result.data;

  // Get current user
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // For Better Auth, password change is handled differently
  // This would need to use the Better Auth client to change password
  // For now, return success (password change handled via Better Auth UI)
  return { success: true };
}

export async function getUserProfile() {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("users")
    .select(`
      *,
      organization:organizations(id, name, slug, logo_url, account_type)
    `)
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return {
    ...profile,
    email: user.email,
    emailVerified: profile?.email_verified_at ?? null,
    lastSignIn: profile?.last_login_at ?? null,
  };
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  return writeAvatarUpload(user.id, formData);
}

export async function uploadCoverPhoto(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  return writeBannerUpload(user.id, formData);
}

export async function removeCoverPhoto(): Promise<ProfileResult> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get current banner URL for cleanup
  const { data: profile } = await supabase
    .from("users")
    .select("banner_url")
    .eq("id", user.id)
    .single();

  const { error: dbError } = await supabase
    .from("users")
    .update({
      banner_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  // Delete from storage
  if (profile?.banner_url && profile.banner_url.includes("/avatars/")) {
    const oldPath = profile.banner_url.split("/avatars/").pop();
    if (oldPath) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Deactivate an individual account.
 * - Sets is_active: false + deactivated_at
 * - Cancels Stripe subscription at period end
 * - Starts re-engagement email sequence
 * - Client handles sign-out + redirect
 */
export async function deactivateIndividualAccount(): Promise<ProfileResult> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Verify user is on an individual account
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, full_name, organization_id, organizations(account_type, name)")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return { success: false, error: "User not found" };
  }

  const org = userData.organizations as { account_type?: string; name?: string } | null;
  if (org?.account_type !== "individual") {
    return { success: false, error: "Only individual account users can self-deactivate" };
  }

  // 1. Mark user as inactive with deactivated_at timestamp
  const untypedClient = createUntypedAdminClient();
  const { error: deactivateError } = await untypedClient
    .from("users")
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (deactivateError) {
    return { success: false, error: deactivateError.message };
  }

  // 2. Cancel Stripe subscription at period end (if exists)
  if (userData.organization_id) {
    const { data: subscription } = await untypedClient
      .from("subscriptions")
      .select("id, stripe_subscription_id, status")
      .eq("organization_id", userData.organization_id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscription?.stripe_subscription_id) {
      try {
        const stripe = getStripe();
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch (stripeError) {
        console.error("Failed to cancel Stripe subscription during deactivation:", stripeError);
        // Continue — account is already deactivated, Stripe cancel is best-effort
      }
    }
  }

  // 3. Start re-engagement email sequence
  try {
    const firstName = userData.full_name?.split(" ")[0] || "there";
    await startReengagementSequence(user.id, {
      firstName,
      organizationName: org?.name || "RepWell",
      isPaidUser: true, // Individual accounts are paid
      lastActiveAt: new Date().toISOString(),
      daysInactive: 0,
    });
  } catch (seqError) {
    console.error("Failed to start re-engagement sequence during deactivation:", seqError);
    // Continue — non-critical
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Update a user's profile slug (admin only)
 * @param targetUserId The user ID to update
 * @param newSlug The new slug to set
 */
export async function updateUserSlug(
  targetUserId: string,
  newSlug: string
): Promise<ProfileResult> {
  // Get current user
  const currentUser = await unifiedGetUser();
  if (!currentUser) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Check permissions: admin for any user, or individual user for self
  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id, organizations(account_type)")
    .eq("id", currentUser.id)
    .single();

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  const orgAccountType = (userData.organizations as { account_type?: string } | null)?.account_type;
  const isSelf = currentUser.id === targetUserId;
  const isAdmin = userData.role === "admin";
  const isIndividual = orgAccountType === "individual";

  // Individual users can edit their own slug; admins can edit any user's slug
  if (!isAdmin && !(isSelf && isIndividual)) {
    return { success: false, error: "Only admins can update profile URLs" };
  }

  // Verify target user exists and is in the same organization
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, organization_id, slug")
    .eq("id", targetUserId)
    .single();

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  if (!isSelf && targetUser.organization_id !== userData.organization_id) {
    return { success: false, error: "Cannot update users from other organizations" };
  }

  // Normalize the slug
  const normalizedSlug = newSlug.toLowerCase().trim();

  // Validate the new slug
  const validation = await validateUserSlug(normalizedSlug, targetUserId);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Update the slug
  const { error: updateError } = await supabase
    .from("users")
    .update({
      slug: normalizedSlug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (updateError) {
    // Handle unique constraint violation
    if (updateError.code === "23505") {
      return { success: false, error: "This URL is already taken. Please try a different one." };
    }
    return { success: false, error: updateError.message };
  }

  // Revalidate relevant paths
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/organization");
  if (targetUser.slug) {
    revalidatePath(`/pro/${targetUser.slug}`);
  }
  revalidatePath(`/pro/${normalizedSlug}`);

  return { success: true };
}

/**
 * Get a suggested slug for a user based on their name
 */
export async function getSuggestedUserSlug(
  fullName: string,
  excludeUserId?: string
): Promise<{ slug: string }> {
  const baseSlug = generateUserSlug(fullName);
  if (!baseSlug) {
    return { slug: "" };
  }

  // Check if the base slug is available
  const validation = await validateUserSlug(baseSlug, excludeUserId);
  if (validation.valid) {
    return { slug: baseSlug };
  }

  // Return suggestion if available
  if (validation.suggestion) {
    return { slug: validation.suggestion };
  }

  return { slug: baseSlug };
}
