"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
  type ProfileResult,
} from "./profile-schemas";

export async function updateProfile(formData: UpdateProfileInput): Promise<ProfileResult> {
  const supabase = await createClient();

  // Validate input
  const result = updateProfileSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { fullName, avatarUrl } = result.data;

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Update user metadata in Supabase Auth
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  // Update user record in database
  const { error: dbError } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  revalidatePath("/profile");
  return { success: true };
}

export async function changePassword(formData: ChangePasswordInput): Promise<ProfileResult> {
  const supabase = await createClient();

  // Validate input
  const result = changePasswordSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { newPassword } = result.data;

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUserProfile() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

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
    emailVerified: user.email_confirmed_at,
    lastSignIn: user.last_sign_in_at,
  };
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

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

  // Update user's avatar_url in database
  const { error: dbError } = await supabase
    .from("users")
    .update({
      avatar_url: publicUrl,
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
  const { data: profile } = await supabase
    .from("users")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_url && profile.avatar_url.includes("/avatars/")) {
    const oldPath = profile.avatar_url.split("/avatars/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true, url: publicUrl };
}

export async function deleteAccount(): Promise<ProfileResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

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

  // Sign out the user
  await supabase.auth.signOut();

  return { success: true };
}
