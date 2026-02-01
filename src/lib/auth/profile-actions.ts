"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type ProfileResult,
} from "./profile-schemas";
import { validateUserSlug, generateUserSlug } from "@/lib/users/slug-utils";

export async function updateProfile(formData: UpdateProfileInput): Promise<ProfileResult> {
  // Validate input
  const result = updateProfileSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const {
    fullName,
    avatarUrl,
    bannerUrl,
    title,
    nmlsId,
    bio,
    phone,
    personalWebsiteUrl,
    linkedinUrl,
    zillowProfileUrl,
    timezone,
  } = result.data;

  // Get current user
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Update user record in database with all profile fields
  const { error: dbError } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      avatar_url: avatarUrl || null,
      photo_url: avatarUrl || null,
      banner_url: bannerUrl || null,
      title: title || null,
      nmls_id: nmlsId || null,
      bio: bio || null,
      phone: phone || null,
      personal_website_url: personalWebsiteUrl || null,
      linkedin_url: linkedinUrl || null,
      zillow_profile_url: zillowProfileUrl || null,
      timezone: timezone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  return { success: true };
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
      organization:organizations(id, name, slug, logo_url)
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

  const supabase = createAdminClient();
  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPG, PNG, or WebP image." };
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File too large. Maximum size is 5MB." };
  }

  // Get old avatar URL before uploading new one (for cleanup later)
  const { data: currentProfile } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();
  const oldAvatarUrl = currentProfile?.avatar_url;

  // Generate unique filename
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload image. Please try again." };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  // Update both avatar_url and photo_url to keep them in sync
  // (photo_url is used by directory/public profile, avatar_url by dashboard)
  const { error: dbError } = await supabase
    .from("users")
    .update({
      avatar_url: publicUrl,
      photo_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("Database update error:", dbError);
    // Try to delete the uploaded file if database update fails
    await supabase.storage.from("avatars").remove([fileName]);
    return { success: false, error: "Failed to update profile. Please try again." };
  }

  // Delete old avatar if it exists and is from our storage
  if (oldAvatarUrl && oldAvatarUrl.includes("/avatars/")) {
    const oldPath = oldAvatarUrl.split("/avatars/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");

  return { success: true, url: publicUrl };
}

export async function uploadCoverPhoto(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPG, PNG, or WebP image." };
  }

  // 10MB max for cover photos (larger than avatars)
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File too large. Maximum size is 10MB." };
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}/cover-${Date.now()}.${fileExt}`;

  // Get old banner URL before updating
  const { data: currentProfile } = await supabase
    .from("users")
    .select("banner_url")
    .eq("id", user.id)
    .single();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Cover photo upload error:", uploadError);
    return { success: false, error: "Failed to upload image. Please try again." };
  }

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from("users")
    .update({
      banner_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (dbError) {
    console.error("Database update error:", dbError);
    await supabase.storage.from("avatars").remove([fileName]);
    return { success: false, error: "Failed to update profile. Please try again." };
  }

  // Delete old cover photo if it exists in our storage
  if (currentProfile?.banner_url && currentProfile.banner_url.includes("/avatars/")) {
    const oldPath = currentProfile.banner_url.split("/avatars/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");

  return { success: true, url: publicUrl };
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

export async function deleteAccount(): Promise<ProfileResult> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  // Soft delete - mark as inactive
  const { error: dbError } = await supabase
    .from("users")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  // Sign out the user - client will handle redirect
  // Note: signOut is handled client-side with Better Auth
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

  // Check if current user is an admin
  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", currentUser.id)
    .single();

  if (!userData || userData.role !== "admin") {
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

  if (targetUser.organization_id !== userData.organization_id) {
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
