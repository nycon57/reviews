import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { EmailPreferences } from "./types";
import { z } from "zod";

const userIdSchema = z.string().uuid();

export async function generateEmailPreferenceTokenForUser(userId: string): Promise<string | null> {
  const userIdResult = userIdSchema.safeParse(userId);
  if (!userIdResult.success) {
    console.error("Invalid userId format for token generation");
    return null;
  }

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

export async function isUserUnsubscribed(userId: string): Promise<boolean> {
  const userIdResult = userIdSchema.safeParse(userId);
  if (!userIdResult.success) {
    console.error("Invalid userId format for subscription check");
    return false;
  }

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
    return false;
  }

  return data.email_enabled === false || data.email_frequency_mode === "none";
}

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
  const userIdResult = userIdSchema.safeParse(userId);
  if (!userIdResult.success) {
    console.error("Invalid userId format for category check");
    return true;
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
      email_marketing_enabled
    `
    )
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking email category:", error);
    return true;
  }

  if (!data) {
    return category !== "email_marketing_enabled";
  }

  if (data.email_enabled === false) {
    return false;
  }

  const prefs = data as Record<string, boolean | null>;
  return prefs[category] !== false;
}
