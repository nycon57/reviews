/**
 * Shared profile mutation helpers (internal, NOT server actions).
 * Used by both self-edit (profile-actions) and admin-edit (organization/actions).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// camelCase→snake_case field map for profile updates
const FIELD_MAP: Record<string, string> = {
  fullName: "full_name",
  title: "title",
  nmlsId: "nmls_id",
  bio: "bio",
  phone: "phone",
  personalWebsiteUrl: "personal_website_url",
  linkedinUrl: "linkedin_url",
  zillowProfileUrl: "zillow_profile_url",
  facebookUrl: "facebook_url",
  instagramUrl: "instagram_url",
  twitterUrl: "twitter_url",
  timezone: "timezone",
  avatarUrl: "avatar_url",
  bannerUrl: "banner_url",
  ctaButtonText: "cta_button_text",
  ctaButtonUrl: "cta_button_url",
  hireDate: "hire_date",
  industry: "industry",
  region: "region",
};

function revalidateProfilePaths(userId: string) {
  revalidatePath("/profile");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/settings");
  revalidatePath(`/dashboard/organization/users/${userId}`);
  revalidatePath("/dashboard/team");
}

/**
 * Write a profile update to the users table.
 * Converts camelCase keys to snake_case and syncs avatar_url→photo_url.
 */
export async function writeProfileUpdate(
  userId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const [camelKey, value] of Object.entries(data)) {
    const snakeKey = FIELD_MAP[camelKey];
    if (snakeKey) {
      updateData[snakeKey] = value === undefined || value === null ? null : value;
    }
  }

  // Keep avatar_url and photo_url in sync
  if ("avatar_url" in updateData) {
    updateData.photo_url = updateData.avatar_url;
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateProfilePaths(userId);
  return { success: true };
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload avatar, update DB (avatar_url + photo_url), and clean up old file.
 */
export async function writeAvatarUpload(
  userId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createAdminClient();

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPG, PNG, or WebP image." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File too large. Maximum size is 5MB." };
  }

  // Get old avatar URL for cleanup
  const { data: currentProfile } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", userId)
    .single();
  const oldAvatarUrl = currentProfile?.avatar_url;

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return { success: false, error: "Failed to upload image. Please try again." };
  }

  const { data: { publicUrl } } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from("users")
    .update({
      avatar_url: publicUrl,
      photo_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (dbError) {
    console.error("Database update error:", dbError);
    await supabase.storage.from("avatars").remove([fileName]);
    return { success: false, error: "Failed to update profile. Please try again." };
  }

  // Delete old avatar
  if (oldAvatarUrl && oldAvatarUrl.includes("/avatars/")) {
    const oldPath = oldAvatarUrl.split("/avatars/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  revalidateProfilePaths(userId);
  return { success: true, url: publicUrl };
}

/**
 * Upload banner/cover photo, update DB, and clean up old file.
 */
export async function writeBannerUpload(
  userId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createAdminClient();

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPG, PNG, or WebP image." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File too large. Maximum size is 10MB." };
  }

  // Get old banner URL for cleanup
  const { data: currentProfile } = await supabase
    .from("users")
    .select("banner_url")
    .eq("id", userId)
    .single();

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}/cover-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

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
    .eq("id", userId);

  if (dbError) {
    console.error("Database update error:", dbError);
    await supabase.storage.from("avatars").remove([fileName]);
    return { success: false, error: "Failed to update profile. Please try again." };
  }

  // Delete old banner
  if (currentProfile?.banner_url && currentProfile.banner_url.includes("/avatars/")) {
    const oldPath = currentProfile.banner_url.split("/avatars/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  revalidateProfilePaths(userId);
  return { success: true, url: publicUrl };
}
