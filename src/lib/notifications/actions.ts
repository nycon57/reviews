"use server";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { NotificationPreferences, NotificationType, NotificationWithDetails } from "./types";
import { revalidatePath } from "next/cache";

// ============================================================================
// Webhook URL Validation (SSRF Protection)
// ============================================================================

/**
 * Validates that a Slack webhook URL is legitimate.
 * Prevents SSRF attacks by ensuring the URL points to Slack's webhook service.
 */
function isValidSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS
    if (parsed.protocol !== "https:") return false;
    // Must be Slack's webhook domain
    if (parsed.hostname !== "hooks.slack.com") return false;
    // Must have the services path
    if (!parsed.pathname.startsWith("/services/")) return false;
    return true;
  } catch {
    return false;
  }
}

// Get notifications for the current user
export async function getNotifications(options: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  includeArchived?: boolean;
  type?: NotificationType;
}): Promise<{ notifications: NotificationWithDetails[]; total: number }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { notifications: [], total: 0 };
  }

  const { limit = 20, offset = 0, unreadOnly = false, includeArchived = false, type } = options;

  // Use untyped admin client for new tables
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("notifications")
    .select(
      `
      *,
      review:reviews(id, rating, customer_name, text),
      loan_officer:loan_officers(id, full_name, photo_url)
    `,
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  // Filter by notification type server-side so pagination and the total count
  // reflect the selected type (client-side filtering broke both).
  if (type) {
    query = query.eq("type", type);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], total: 0 };
  }

  return {
    notifications: (data || []) as NotificationWithDetails[],
    total: count || 0,
  };
}

// Get unread notification count
export async function getUnreadNotificationCount(): Promise<number> {
  const user = await unifiedGetUser();
  if (!user) {
    return 0;
  }

  const supabase = createUntypedAdminClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
    .eq("is_archived", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }

  return count || 0;
}

// Mark notification(s) as read
export async function markNotificationsAsRead(
  notificationIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createUntypedAdminClient();
  let query = supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (notificationIds && notificationIds.length > 0) {
    query = query.in("id", notificationIds);
  }

  const { error } = await query;

  if (error) {
    console.error("Error marking notifications as read:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// Archive a notification
export async function archiveNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error archiving notification:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// Unarchive a notification
export async function unarchiveNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_archived: false, archived_at: null })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error unarchiving notification:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// Get notification preferences for the current user
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching notification preferences:", error);
    return null;
  }

  return data as NotificationPreferences | null;
}

// Update notification preferences
export async function updateNotificationPreferences(
  preferences: Partial<
    Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">
  >
): Promise<{ success: boolean; error?: string }> {
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
      .update(preferences)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating notification preferences:", error);
      return { success: false, error: error.message };
    }
  } else {
    // Create new preferences
    const { error } = await supabase
      .from("notification_preferences")
      .insert({ user_id: user.id, ...preferences });

    if (error) {
      console.error("Error creating notification preferences:", error);
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// Test Slack webhook
export async function testSlackWebhook(
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate webhook URL to prevent SSRF attacks
  if (!isValidSlackWebhookUrl(webhookUrl)) {
    return {
      success: false,
      error: "Invalid Slack webhook URL. Must be a valid hooks.slack.com URL.",
    };
  }

  const testPayload = {
    text: "This is a test message from RepWell",
    attachments: [
      {
        color: "#6366f1",
        title: "Webhook Test Successful",
        text: "Your Slack integration is configured correctly.",
        footer: "RepWell",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      const body = await response.text();
      return { success: false, error: `Slack returned: ${body}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
