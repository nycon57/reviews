"use server";

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type {
  EmailPreferences,
  EmailPreferencesWithToken,
  CommunicationPreferencesWithToken,
} from "./types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const emailPreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  email_onboarding_enabled: z.boolean().optional(),
  email_weekly_summary_enabled: z.boolean().optional(),
  email_milestones_enabled: z.boolean().optional(),
  email_product_updates_enabled: z.boolean().optional(),
  email_marketing_enabled: z.boolean().optional(),
  email_frequency_mode: z.enum(["immediate", "daily", "weekly", "none"]).optional(),
  email_timezone: z.string().max(100).optional(),
  quiet_hours_enabled: z.boolean().optional(),
  quiet_hours_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
});

const tokenSchema = z.string().min(32).max(128);

const resubscribeCategoriesSchema = z
  .object({
    onboarding: z.boolean().optional(),
    weekly_summary: z.boolean().optional(),
    milestones: z.boolean().optional(),
    product_updates: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .optional();

// ============================================================================
// Authenticated User Actions
// ============================================================================

/**
 * Get email preferences for the current authenticated user
 */
export async function getEmailPreferences(): Promise<EmailPreferences | null> {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select(
      `
      email_enabled,
      email_onboarding_enabled,
      email_weekly_summary_enabled,
      email_milestones_enabled,
      email_product_updates_enabled,
      email_marketing_enabled,
      email_frequency_mode,
      email_timezone,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end
    `
    )
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching email preferences:", error);
    return null;
  }

  // Return defaults if no preferences exist
  if (!data) {
    return {
      email_enabled: true,
      email_onboarding_enabled: true,
      email_weekly_summary_enabled: true,
      email_milestones_enabled: true,
      email_product_updates_enabled: true,
      email_marketing_enabled: false,
      email_frequency_mode: "immediate",
      email_timezone: "America/New_York",
      quiet_hours_enabled: false,
      quiet_hours_start: null,
      quiet_hours_end: null,
    };
  }

  return data as EmailPreferences;
}

/**
 * Update email preferences for the current authenticated user
 */
export async function updateEmailPreferences(
  preferences: Partial<EmailPreferences>
): Promise<{ success: boolean; error?: string }> {
  // Validate input with Zod
  const validationResult = emailPreferencesSchema.safeParse(preferences);
  if (!validationResult.success) {
    return { success: false, error: "Invalid preferences data" };
  }
  const validatedPrefs = validationResult.data;

  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createUntypedAdminClient();

  // Check if preferences exist
  const { data: existing } = await supabase
    .from("notification_preferences")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Update existing preferences
    const { error } = await supabase
      .from("notification_preferences")
      .update(validatedPrefs)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating email preferences:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Create new preferences
    const { error } = await supabase
      .from("notification_preferences")
      .insert({ user_id: user.id, ...validatedPrefs });

    if (error) {
      console.error("Error creating email preferences:", error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

/**
 * Get or create an email preference token for the current user
 * Used for including unsubscribe links in emails
 */
export async function getEmailPreferenceToken(): Promise<string | null> {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createUntypedAdminClient();

  // Use the database function to get or create token
  const { data, error } = await supabase.rpc("get_or_create_email_preference_token", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Error getting email preference token:", error);
    return null;
  }

  return data as string | null;
}

// ============================================================================
// Public Token-Based Actions (for email links)
// ============================================================================

/**
 * Validate an email preference token and get current preferences
 * Used by public unsubscribe/preferences pages
 */
export async function getEmailPreferencesByToken(
  token: string
): Promise<EmailPreferencesWithToken | null> {
  // Validate token format with Zod
  const tokenResult = tokenSchema.safeParse(token);
  if (!tokenResult.success) {
    return null;
  }

  const supabase = createUntypedAdminClient();

  // Use the database function to validate token and get preferences
  const { data, error } = await supabase.rpc("validate_email_preference_token", {
    p_token: token,
  });

  if (error) {
    console.error("Error validating email preference token:", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    user_id: row.user_id,
    email: row.email,
    is_valid: row.is_valid,
    email_enabled: row.email_enabled,
    email_onboarding_enabled: row.email_onboarding_enabled,
    email_weekly_summary_enabled: row.email_weekly_summary_enabled,
    email_milestones_enabled: row.email_milestones_enabled,
    email_product_updates_enabled: row.email_product_updates_enabled,
    email_marketing_enabled: row.email_marketing_enabled,
    email_frequency_mode: row.email_frequency_mode,
    email_timezone: row.email_timezone,
    quiet_hours_enabled: row.quiet_hours_enabled,
    quiet_hours_start: row.quiet_hours_start,
    quiet_hours_end: row.quiet_hours_end,
  } as EmailPreferencesWithToken;
}

/**
 * Update email preferences via token (public access)
 * Used by public preferences page
 */
export async function updateEmailPreferencesByToken(
  token: string,
  preferences: Partial<EmailPreferences>
): Promise<{ success: boolean; error?: string }> {
  // Validate token format with Zod
  const tokenResult = tokenSchema.safeParse(token);
  if (!tokenResult.success) {
    return { success: false, error: "Invalid token format" };
  }

  // Validate preferences with Zod
  const prefsResult = emailPreferencesSchema.safeParse(preferences);
  if (!prefsResult.success) {
    return { success: false, error: "Invalid preferences data" };
  }
  const validatedPrefs = prefsResult.data;

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("update_email_preferences_by_token", {
    p_token: token,
    p_email_enabled: validatedPrefs.email_enabled ?? null,
    p_email_onboarding_enabled: validatedPrefs.email_onboarding_enabled ?? null,
    p_email_weekly_summary_enabled: validatedPrefs.email_weekly_summary_enabled ?? null,
    p_email_milestones_enabled: validatedPrefs.email_milestones_enabled ?? null,
    p_email_product_updates_enabled: validatedPrefs.email_product_updates_enabled ?? null,
    p_email_marketing_enabled: validatedPrefs.email_marketing_enabled ?? null,
    p_email_frequency_mode: validatedPrefs.email_frequency_mode ?? null,
    p_email_timezone: validatedPrefs.email_timezone ?? null,
    p_quiet_hours_enabled: validatedPrefs.quiet_hours_enabled ?? null,
    p_quiet_hours_start: validatedPrefs.quiet_hours_start ?? null,
    p_quiet_hours_end: validatedPrefs.quiet_hours_end ?? null,
  });

  if (error) {
    console.error("Error updating email preferences by token:", error);
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Invalid or expired token" };
  }

  return { success: true };
}

/**
 * Unsubscribe from all emails via token (one-click unsubscribe)
 * Used by unsubscribe links in email footers
 */
export async function unsubscribeAllByToken(
  token: string
): Promise<{ success: boolean; error?: string }> {
  // Validate token format with Zod
  const tokenResult = tokenSchema.safeParse(token);
  if (!tokenResult.success) {
    return { success: false, error: "Invalid token format" };
  }

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("unsubscribe_all_by_token", {
    p_token: token,
  });

  if (error) {
    console.error("Error unsubscribing by token:", error);
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Invalid or expired token" };
  }

  return { success: true };
}

/**
 * Resubscribe to emails via token
 * Used when user wants to re-enable emails after unsubscribing
 */
export async function resubscribeByToken(
  token: string,
  categories?: {
    onboarding?: boolean;
    weekly_summary?: boolean;
    milestones?: boolean;
    product_updates?: boolean;
    marketing?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  // Validate token format with Zod
  const tokenResult = tokenSchema.safeParse(token);
  if (!tokenResult.success) {
    return { success: false, error: "Invalid token format" };
  }

  // Validate categories with Zod
  const categoriesResult = resubscribeCategoriesSchema.safeParse(categories);
  if (!categoriesResult.success) {
    return { success: false, error: "Invalid categories data" };
  }
  const validatedCategories = categoriesResult.data;

  // Default to enabling common categories if none specified
  const prefs: Partial<EmailPreferences> = {
    email_enabled: true,
    email_frequency_mode: "immediate",
    email_onboarding_enabled: validatedCategories?.onboarding ?? true,
    email_weekly_summary_enabled: validatedCategories?.weekly_summary ?? true,
    email_milestones_enabled: validatedCategories?.milestones ?? true,
    email_product_updates_enabled: validatedCategories?.product_updates ?? true,
    email_marketing_enabled: validatedCategories?.marketing ?? false,
  };

  return updateEmailPreferencesByToken(token, prefs);
}

// ============================================================================
// Combined Communication Preferences (Email-only)
// ============================================================================

/**
 * Get communication preferences via token (public access).
 */
export async function getCommunicationPreferencesByToken(
  token: string
): Promise<CommunicationPreferencesWithToken | null> {
  const emailPrefs = await getEmailPreferencesByToken(token);
  if (!emailPrefs) return null;

  return {
    ...emailPrefs,
    sms_consent_status: "none",
    sms_phone_number: null,
  };
}

/**
 * Update SMS consent via email preference token (public access).
 * SMS has been removed — this is a no-op stub for backwards compatibility.
 */
export async function updateSmsConsentByToken(
  _token: string,
  _optOut: boolean
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
