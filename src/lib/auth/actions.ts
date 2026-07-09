"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
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
import { capturePostHogEvent } from "@/lib/posthog-server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getAuthCallbackUrl(params?: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const callbackUrl = `${baseUrl}/auth/callback`;
  const normalizedParams = params?.replace(/^\?/, "");

  return normalizedParams ? `${callbackUrl}?${normalizedParams}` : callbackUrl;
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
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: "Failed to create user" };
  }

  // Provision the org + app user rows with the ADMIN client: at this point the
  // signer-up has no session (email confirmation pending), so user-scoped
  // inserts are RLS-blocked — provisioning is a system operation. Failures are
  // fatal: a "successful" signup without these rows is a ghost account that
  // loops in onboarding forever. (Mirrors the Better Auth path.)
  const supabaseAdmin = createAdminClient();

  const { data: orgData, error: orgError } = await supabaseAdmin
    .from("organizations")
    .insert({
      name: organizationName,
      slug: orgSlug,
      account_type: "individual",
      subscription_tier: "basic",
      onboarding_status: "payment_complete",
    })
    .select()
    .single();

  if (orgError || !orgData) {
    console.error("Organization creation error:", orgError);
    await supabaseAdmin.auth.admin
      .deleteUser(authData.user.id)
      .catch((cleanupError) =>
        console.error("Auth user cleanup failed after org error:", cleanupError)
      );
    return { success: false, error: "Failed to set up your account. Please try again." };
  }

  // Generate SEO-friendly slug for the user
  let userSlug: string;
  try {
    userSlug = await generateUniqueUserSlug(fullName);
  } catch (slugError) {
    console.error("Slug generation failed, using fallback:", slugError);
    userSlug = slugify(fullName) + "-" + Date.now();
  }

  const { error: userError } = await supabaseAdmin.from("users").insert({
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
    await supabaseAdmin.from("organizations").delete().eq("id", orgData.id);
    await supabaseAdmin.auth.admin
      .deleteUser(authData.user.id)
      .catch((cleanupError) =>
        console.error("Auth user cleanup failed after user error:", cleanupError)
      );
    return { success: false, error: "Failed to set up your account. Please try again." };
  }

  // Widget seeding is intentionally skipped here; individual accounts seed on demand.

  void capturePostHogEvent({
    distinctId: authData.user.id,
    event: "user_signed_up",
    properties: {
      auth_system: "supabase",
      account_type: "individual",
    },
    groups: { organization: orgData.id },
    logContext: "supabase signup",
  });

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
      emailRedirectTo: getAuthCallbackUrl(),
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
    redirectTo: getAuthCallbackUrl("type=recovery"),
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function resendVerificationEmail(): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, error: "No user email found" };
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserWithProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select(
      `
      *,
      organization:organizations(*)
    `
    )
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: userData } = await supabase
    .from("users")
    .select(
      `
      role,
      organization:organizations!inner(account_type)
    `
    )
    .eq("id", user.id)
    .single();

  if (!userData) return false;

  // Check both admin role AND enterprise account type to match permission system
  const isAdmin = userData.role === "admin";
  const organization = userData.organization as { account_type: string } | null;
  const isEnterprise = organization?.account_type === "enterprise";

  return isAdmin && isEnterprise;
}

/**
 * Check whether the current authenticated user is RepWell platform staff.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const user = await unifiedGetUser();

  if (!user) return false;

  // TODO(database-types): switch to the typed admin client after
  // users.is_platform_admin is present in generated database types.
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("is_platform_admin")
    .eq("id", user.id)
    .limit(1);

  if (error) {
    console.error("Platform admin lookup failed:", error.message);
    return false;
  }

  return data?.[0]?.is_platform_admin === true;
}

/**
 * Require RepWell platform staff access.
 */
export async function requirePlatformAdmin(): Promise<void> {
  const hasAccess = await isPlatformAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }
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
  return USE_BETTER_AUTH ? signInWithMagicLinkBetterAuth(formData) : signInWithMagicLink(formData);
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
  return USE_BETTER_AUTH ? resendVerificationEmailBetterAuth() : resendVerificationEmail();
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
