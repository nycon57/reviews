"use server";

import { createClient } from "@/lib/supabase/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { EmailPreferences, EmailPreferencesWithToken } from "./types";
import { revalidatePath } from "next/cache";

// ============================================================================
// Authenticated User Actions
// ============================================================================

/**
 * Get email preferences for the current authenticated user
 */
export async function getEmailPreferences(): Promise<EmailPreferences | null> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

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
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

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
      .update(preferences)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating email preferences:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Create new preferences
    const { error } = await supabase
      .from("notification_preferences")
      .insert({ user_id: user.id, ...preferences });

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
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

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
  if (!token || token.length < 32) {
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
  if (!token || token.length < 32) {
    return { success: false, error: "Invalid token" };
  }

  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("update_email_preferences_by_token", {
    p_token: token,
    p_email_enabled: preferences.email_enabled ?? null,
    p_email_onboarding_enabled: preferences.email_onboarding_enabled ?? null,
    p_email_weekly_summary_enabled: preferences.email_weekly_summary_enabled ?? null,
    p_email_milestones_enabled: preferences.email_milestones_enabled ?? null,
    p_email_product_updates_enabled: preferences.email_product_updates_enabled ?? null,
    p_email_marketing_enabled: preferences.email_marketing_enabled ?? null,
    p_email_frequency_mode: preferences.email_frequency_mode ?? null,
    p_email_timezone: preferences.email_timezone ?? null,
    p_quiet_hours_enabled: preferences.quiet_hours_enabled ?? null,
    p_quiet_hours_start: preferences.quiet_hours_start ?? null,
    p_quiet_hours_end: preferences.quiet_hours_end ?? null,
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
  if (!token || token.length < 32) {
    return { success: false, error: "Invalid token" };
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
  if (!token || token.length < 32) {
    return { success: false, error: "Invalid token" };
  }

  // Default to enabling common categories if none specified
  const prefs: Partial<EmailPreferences> = {
    email_enabled: true,
    email_frequency_mode: "immediate",
    email_onboarding_enabled: categories?.onboarding ?? true,
    email_weekly_summary_enabled: categories?.weekly_summary ?? true,
    email_milestones_enabled: categories?.milestones ?? true,
    email_product_updates_enabled: categories?.product_updates ?? true,
    email_marketing_enabled: categories?.marketing ?? false,
  };

  return updateEmailPreferencesByToken(token, prefs);
}

// ============================================================================
// Admin/System Actions
// ============================================================================

/**
 * Generate email preference token for a user (admin use)
 * Used when sending emails to include unsubscribe links
 */
export async function generateEmailPreferenceTokenForUser(
  userId: string
): Promise<string | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("get_or_create_email_preference_token", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Error generating email preference token:", error);
    return null;
  }

  return data as string | null;
}

/**
 * Check if a user has unsubscribed from all emails
 */
export async function isUserUnsubscribed(userId: string): Promise<boolean> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("email_enabled, email_frequency_mode")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking user subscription status:", error);
    return false;
  }

  if (!data) {
    return false; // No preferences = subscribed by default
  }

  return data.email_enabled === false || data.email_frequency_mode === "none";
}

/**
 * Check if a specific email category is enabled for a user
 */
export async function isEmailCategoryEnabled(
  userId: string,
  category: keyof Pick<
    EmailPreferences,
    | "email_onboarding_enabled"
    | "email_weekly_summary_enabled"
    | "email_milestones_enabled"
    | "email_product_updates_enabled"
    | "email_marketing_enabled"
  >
): Promise<boolean> {
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
      email_marketing_enabled
    `
    )
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking email category:", error);
    return true; // Default to enabled on error
  }

  if (!data) {
    // No preferences exist, return default values
    return category !== "email_marketing_enabled"; // Marketing is off by default
  }

  // Master toggle must be on
  if (data.email_enabled === false) {
    return false;
  }

  const prefs = data as Record<string, boolean | null>;
  return prefs[category] !== false;
}
