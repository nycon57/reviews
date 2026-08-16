"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  type AuthResult,
  type MagicLinkInput,
  type ResetPasswordInput,
  type SignInInput,
  type SignUpInput,
  type UpdatePasswordInput,
} from "./schemas";
import {
  checkAdminAccessBetterAuth,
  getSessionBetterAuth,
  getUserBetterAuth,
  getUserWithProfileBetterAuth,
  resendVerificationEmailBetterAuth,
  resetPasswordBetterAuth,
  signInWithBetterAuth,
  signInWithMagicLinkBetterAuth,
  signOutBetterAuth,
  signUpWithBetterAuth,
  updatePasswordBetterAuth,
} from "./server-actions";

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

export async function unifiedSignUp(formData: SignUpInput): Promise<AuthResult> {
  return signUpWithBetterAuth(formData);
}

export async function unifiedSignIn(formData: SignInInput): Promise<AuthResult> {
  return signInWithBetterAuth(formData);
}

export async function unifiedSignInWithMagicLink(formData: MagicLinkInput): Promise<AuthResult> {
  return signInWithMagicLinkBetterAuth(formData);
}

export async function unifiedResetPassword(formData: ResetPasswordInput): Promise<AuthResult> {
  return resetPasswordBetterAuth(formData);
}

export async function unifiedUpdatePassword(
  formData: UpdatePasswordInput,
  token?: string
): Promise<AuthResult> {
  if (!token) {
    return {
      success: false,
      error: "Missing or expired password reset token.",
    };
  }

  return updatePasswordBetterAuth(formData, token);
}

export async function unifiedSignOut(): Promise<void> {
  return signOutBetterAuth();
}

export async function unifiedGetUser() {
  return getUserBetterAuth();
}

export async function unifiedGetUserWithProfile() {
  return getUserWithProfileBetterAuth();
}

export async function unifiedResendVerificationEmail(): Promise<AuthResult> {
  return resendVerificationEmailBetterAuth();
}

export async function unifiedCheckAdminAccess(): Promise<boolean> {
  return checkAdminAccessBetterAuth();
}

export async function unifiedGetSession() {
  return getSessionBetterAuth();
}
