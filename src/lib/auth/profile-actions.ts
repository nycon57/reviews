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
