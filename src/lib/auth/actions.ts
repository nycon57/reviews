"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  signUpSchema,
  signInSchema,
  magicLinkSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type SignUpInput,
  type SignInInput,
  type MagicLinkInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
  type AuthResult,
} from "./schemas";
import {
  signUpWithBetterAuth,
  signInWithBetterAuth,
  signInWithMagicLinkBetterAuth,
  resetPasswordBetterAuth,
  updatePasswordBetterAuth,
  signOutBetterAuth,
  getSessionBetterAuth,
  getUserBetterAuth,
  getUserWithProfileBetterAuth,
  resendVerificationEmailBetterAuth,
  checkAdminAccessBetterAuth,
} from "./server-actions";
import { generateUniqueUserSlug } from "@/lib/users/slug-utils";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function signUp(formData: SignUpInput): Promise<AuthResult> {
  const supabase = await createClient();

  // Validate input
  const result = signUpSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { email, password, fullName, organizationName } = result.data;

  // Create the organization slug
  const orgSlug = slugify(organizationName);

  // Sign up the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        organization_name: organizationName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: "Failed to create user" };
  }

  // Create the organization with pending onboarding status
  // Self-serve signups create individual accounts (B2C)
  const { data: orgData, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: organizationName,
      slug: orgSlug,
      onboarding_status: "pending",
      account_type: "individual", // Self-serve = individual account
    })
    .select()
    .single();

  if (orgError) {
    // If org creation fails, the trigger should handle it, but log the error
    console.error("Organization creation error:", orgError);
  }

  // Create the user record in our users table
  if (orgData) {
    // Generate SEO-friendly slug for the user
    let userSlug: string;
    try {
      userSlug = await generateUniqueUserSlug(fullName);
    } catch (slugError) {
      console.error("Slug generation failed, using fallback:", slugError);
      userSlug = slugify(fullName) + "-" + Date.now();
    }

    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        organization_id: orgData.id,
        email: email,
        full_name: fullName,
        slug: userSlug,
        role: "admin", // First user is admin
        is_active: true,
        is_owner: true, // Self-serve signup = owner of their org
      });

    if (userError) {
      console.error("User record creation error:", userError);
    }
  }

  return {
    success: true,
    redirectTo: "/verify-email",
  };
}

export async function signIn(formData: SignInInput): Promise<AuthResult> {
  const supabase = await createClient();

  // Validate input
  const result = signInSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { email, password } = result.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    redirectTo: "/dashboard",
  };
}

export async function signInWithMagicLink(formData: MagicLinkInput): Promise<AuthResult> {
  const supabase = await createClient();

  // Validate input
  const result = magicLinkSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { email } = result.data;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
  };
}

export async function resetPassword(formData: ResetPasswordInput): Promise<AuthResult> {
  const supabase = await createClient();

  // Validate input
  const result = resetPasswordSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { email } = result.data;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?type=recovery`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
  };
}

export async function updatePassword(formData: UpdatePasswordInput): Promise<AuthResult> {
  const supabase = await createClient();

  // Validate input
  const result = updatePasswordSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { password } = result.data;

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    redirectTo: "/dashboard",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resendVerificationEmail(): Promise<AuthResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "No user email found" };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserWithProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("id", user.id)
    .single();

  return profile;
}

/**
 * Check if the current user has admin access
 * Returns true if user is authenticated, has admin role, AND belongs to an enterprise organization.
 * This matches the permission system's VIEW_ADMIN_ANALYTICS requirement (isEnterprise && isAdmin).
 */
export async function checkAdminAccess(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: userData } = await supabase
    .from("users")
    .select(`
      role,
      organization:organizations!inner(account_type)
    `)
    .eq("id", user.id)
    .single();

  if (!userData) return false;

  // Check both admin role AND enterprise account type to match permission system
  const isAdmin = userData.role === "admin";
  const organization = userData.organization as { account_type: string } | null;
  const isEnterprise = organization?.account_type === "enterprise";

  return isAdmin && isEnterprise;
}

// =============================================
// Unified Auth Functions (Feature Flag Based)
// =============================================

// Feature flag for Better Auth migration
const USE_BETTER_AUTH = process.env.USE_BETTER_AUTH === "true";

/**
 * Unified sign up function
 */
export async function unifiedSignUp(formData: SignUpInput): Promise<AuthResult> {
  return USE_BETTER_AUTH ? signUpWithBetterAuth(formData) : signUp(formData);
}

/**
 * Unified sign in function
 */
export async function unifiedSignIn(formData: SignInInput): Promise<AuthResult> {
  return USE_BETTER_AUTH ? signInWithBetterAuth(formData) : signIn(formData);
}

/**
 * Unified magic link sign in function
 */
export async function unifiedSignInWithMagicLink(formData: MagicLinkInput): Promise<AuthResult> {
  return USE_BETTER_AUTH
    ? signInWithMagicLinkBetterAuth(formData)
    : signInWithMagicLink(formData);
}

/**
 * Unified password reset request function
 */
export async function unifiedResetPassword(formData: ResetPasswordInput): Promise<AuthResult> {
  return USE_BETTER_AUTH ? resetPasswordBetterAuth(formData) : resetPassword(formData);
}

/**
 * Unified password update function
 */
export async function unifiedUpdatePassword(
  formData: UpdatePasswordInput,
  token?: string
): Promise<AuthResult> {
  if (USE_BETTER_AUTH && token) {
    return updatePasswordBetterAuth(formData, token);
  }
  return updatePassword(formData);
}

/**
 * Unified sign out function
 */
export async function unifiedSignOut(): Promise<void> {
  return USE_BETTER_AUTH ? signOutBetterAuth() : signOut();
}

/**
 * Unified get user function
 */
export async function unifiedGetUser() {
  return USE_BETTER_AUTH ? getUserBetterAuth() : getUser();
}

/**
 * Unified get user with profile function
 */
export async function unifiedGetUserWithProfile() {
  return USE_BETTER_AUTH ? getUserWithProfileBetterAuth() : getUserWithProfile();
}

/**
 * Unified resend verification email function
 */
export async function unifiedResendVerificationEmail(): Promise<AuthResult> {
  return USE_BETTER_AUTH
    ? resendVerificationEmailBetterAuth()
    : resendVerificationEmail();
}

/**
 * Unified check admin access function
 */
export async function unifiedCheckAdminAccess(): Promise<boolean> {
  return USE_BETTER_AUTH ? checkAdminAccessBetterAuth() : checkAdminAccess();
}

/**
 * Get current session (Better Auth only - for advanced use cases)
 */
export async function unifiedGetSession() {
  if (USE_BETTER_AUTH) {
    return getSessionBetterAuth();
  }
  // Supabase doesn't have a direct session equivalent, return null for compatibility
  return null;
}
