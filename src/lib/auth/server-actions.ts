"use server";

import { auth } from "./better-auth";
import { headers } from "next/headers";
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
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueUserSlug } from "@/lib/users/slug-utils";

/**
 * Helper to slugify organization names
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Get base URL from request headers (handles any port in dev or prod domain)
 */
async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

/**
 * Trusted app URL for security-sensitive links (e.g. password reset emails).
 * Must never be derived from request headers.
 */
function getTrustedAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Sign up with email and password using Better Auth
 * Creates user, organization, and sets up membership
 */
export async function signUpWithBetterAuth(formData: SignUpInput): Promise<AuthResult> {
  // Validate input
  const result = signUpSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { email, password, fullName, organizationName } = result.data;
  const orgSlug = slugify(organizationName);

  try {
    // Use admin client to create individual organization first
    // Self-serve signups use individual_organizations (not organizations — reserved for enterprise)
    const supabaseAdmin = createAdminClient();

    const { data: indivOrgData, error: indivOrgError } = await supabaseAdmin
      .from("individual_organizations")
      .insert({
        name: organizationName,
        slug: orgSlug,
      })
      .select()
      .single();

    if (indivOrgError) {
      console.error("Individual organization creation error:", indivOrgError);
      return { success: false, error: "Failed to create organization" };
    }

    // Sign up user with Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
      },
    });

    if (!signUpResult || "error" in signUpResult) {
      // Clean up individual organization if user creation failed
      await supabaseAdmin.from("individual_organizations").delete().eq("id", indivOrgData.id);
      return {
        success: false,
        error: (signUpResult as { error?: string })?.error || "Failed to create user",
      };
    }

    // Generate SEO-friendly slug for the user
    let userSlug: string;
    try {
      userSlug = await generateUniqueUserSlug(fullName);
    } catch (slugError) {
      console.error("Slug generation failed, cleaning up:", slugError);
      try {
        await supabaseAdmin.from("accounts").delete().eq("user_id", signUpResult.user.id);
        await supabaseAdmin.from("users").delete().eq("id", signUpResult.user.id);
      } catch (cleanupErr) {
        console.error("Failed to clean up user/accounts after slug error:", cleanupErr);
      }
      try {
        await supabaseAdmin.from("individual_organizations").delete().eq("id", indivOrgData.id);
      } catch (cleanupErr) {
        console.error("Failed to clean up individual organization after slug error:", cleanupErr);
      }
      return {
        success: false,
        error: "Unable to generate user slug, please try again",
      };
    }

    // Update user with individual organization details
    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({
        individual_organization_id: indivOrgData.id,
        slug: userSlug,
        role: "admin",
        is_active: true,
        is_owner: true,
      })
      .eq("id", signUpResult.user.id);

    if (userUpdateError) {
      console.error("User update error:", userUpdateError);
    }

    // Skip widget seeding and membership for individual orgs — widgets require enterprise organization_id

    return {
      success: true,
      redirectTo: "/verify-email",
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Sign in with email and password using Better Auth
 */
export async function signInWithBetterAuth(formData: SignInInput): Promise<AuthResult> {
  // Validate input
  const result = signInSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { email, password } = result.data;

  try {
    const signInResult = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!signInResult || "error" in signInResult) {
      return {
        success: false,
        error: (signInResult as { error?: string })?.error || "Invalid credentials",
      };
    }

    return {
      success: true,
      redirectTo: "/dashboard",
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: "Invalid email or password",
    };
  }
}

/**
 * Sign in with magic link using Better Auth
 */
export async function signInWithMagicLinkBetterAuth(
  formData: MagicLinkInput
): Promise<AuthResult> {
  // Validate input
  const result = magicLinkSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { email } = result.data;

  try {
    // Call the magic link endpoint directly
    const baseUrl = await getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/auth/sign-in/magic-link`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          callbackURL: "/dashboard",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send magic link");
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Magic link error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send magic link",
    };
  }
}

/**
 * Request password reset using Better Auth
 * Note: Better Auth's forgetPassword endpoint is at POST /api/auth/forget-password
 */
export async function resetPasswordBetterAuth(
  formData: ResetPasswordInput
): Promise<AuthResult> {
  // Validate input
  const result = resetPasswordSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { email } = result.data;

  try {
    // Call the forget password endpoint directly
    const appUrl = getTrustedAppUrl();
    const response = await fetch(`${appUrl}/api/auth/forget-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        redirectTo: `${appUrl}/reset-password`,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send reset email");
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Reset password error:", error);
    // Don't reveal if email exists
    return {
      success: true,
    };
  }
}

/**
 * Update password using Better Auth (after reset)
 */
export async function updatePasswordBetterAuth(
  formData: UpdatePasswordInput,
  token: string
): Promise<AuthResult> {
  // Validate input
  const result = updatePasswordSchema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  const { password } = result.data;

  try {
    await auth.api.resetPassword({
      body: {
        token,
        newPassword: password,
      },
    });

    return {
      success: true,
      redirectTo: "/login",
    };
  } catch (error) {
    console.error("Update password error:", error);
    return {
      success: false,
      error: "Failed to update password. The reset link may have expired.",
    };
  }
}

/**
 * Sign out using Better Auth
 */
export async function signOutBetterAuth(): Promise<void> {
  try {
    const headersList = await headers();
    await auth.api.signOut({
      headers: headersList,
    });
  } catch (error) {
    console.error("Sign out error:", error);
  }
  redirect("/login");
}

/**
 * Get current session from Better Auth
 */
export async function getSessionBetterAuth() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });
    return session;
  } catch {
    return null;
  }
}

/**
 * Get current user from Better Auth session
 */
export async function getUserBetterAuth() {
  const session = await getSessionBetterAuth();
  return session?.user ?? null;
}

/**
 * Get user with organization profile
 */
export async function getUserWithProfileBetterAuth() {
  const session = await getSessionBetterAuth();
  if (!session?.user) return null;

  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("id", session.user.id)
    .single();

  return profile;
}

/**
 * Resend verification email using Better Auth
 */
export async function resendVerificationEmailBetterAuth(): Promise<AuthResult> {
  try {
    const session = await getSessionBetterAuth();
    if (!session?.user?.email) {
      return { success: false, error: "No user email found" };
    }

    // Call the send verification email endpoint directly
    const baseUrl = await getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/auth/send-verification-email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          callbackURL: "/dashboard",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send verification email");
    }

    return { success: true };
  } catch (error) {
    console.error("Resend verification error:", error);
    return {
      success: false,
      error: "Failed to send verification email",
    };
  }
}

/**
 * Check if current user has admin access
 * (admin role + enterprise account type)
 */
export async function checkAdminAccessBetterAuth(): Promise<boolean> {
  const session = await getSessionBetterAuth();
  if (!session?.user) return false;

  const supabaseAdmin = createAdminClient();
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select(`
      role,
      organization:organizations!inner(account_type)
    `)
    .eq("id", session.user.id)
    .single();

  if (!userData) return false;

  const isAdmin = userData.role === "admin";
  const organization = userData.organization as { account_type: string } | null;
  const isEnterprise = organization?.account_type === "enterprise";

  return isAdmin && isEnterprise;
}
