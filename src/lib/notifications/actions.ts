"use server";

import { createClient } from "@/lib/supabase/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type {
  Notification,
  NotificationPreferences,
  NotificationWithDetails,
  CreateNotificationParams,
} from "./types";
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

/**
 * Validates that a Teams webhook URL is legitimate.
 * Prevents SSRF attacks by ensuring the URL points to Microsoft's webhook service.
 */
function isValidTeamsWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS
    if (parsed.protocol !== "https:") return false;
    // Must be one of Microsoft's webhook domains
    const validDomains = [
      "webhook.office.com",
      "outlook.office.com",
      "outlook.office365.com",
    ];
    const isValidDomain = validDomains.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
    if (!isValidDomain) return false;
    // Must have webhookb2 in the path (Teams incoming webhook pattern)
    if (!parsed.pathname.includes("/webhookb2/") && !parsed.pathname.includes("/IncomingWebhook/")) return false;
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
}): Promise<{ notifications: NotificationWithDetails[]; total: number }> {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return { notifications: [], total: 0 };
  }

  const { limit = 20, offset = 0, unreadOnly = false, includeArchived = false } = options;

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
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

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
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

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
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

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

// Get notification preferences for the current user
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
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
  preferences: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>
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

// Create a notification (server-side, for use by other actions)
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      organization_id: params.organizationId,
      review_id: params.reviewId,
      loan_officer_id: params.loanOfficerId,
      metadata: params.metadata || {},
      action_url: params.actionUrl,
      priority: params.priority || 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: error.message };
  }

  return { success: true, notificationId: data.id };
}

// Send Slack notification
export async function sendSlackNotification(
  userId: string,
  notification: Notification
): Promise<{ success: boolean; error?: string }> {
  const supabase = createUntypedAdminClient();

  // Get user's Slack preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("slack_enabled, slack_webhook_url, slack_channel, slack_new_review, slack_negative_review")
    .eq("user_id", userId)
    .single();

  if (!prefs?.slack_enabled || !prefs.slack_webhook_url) {
    return { success: false, error: "Slack not configured" };
  }

  // Validate webhook URL to prevent SSRF attacks (defense-in-depth)
  if (!isValidSlackWebhookUrl(prefs.slack_webhook_url)) {
    return { success: false, error: "Invalid Slack webhook URL configured" };
  }

  // Check if this notification type should be sent to Slack
  const shouldSend =
    (notification.type === "new_review" && prefs.slack_new_review) ||
    (notification.type === "negative_review" && prefs.slack_negative_review);

  if (!shouldSend) {
    return { success: false, error: "Notification type not enabled for Slack" };
  }

  // Build Slack message
  const rating = (notification.metadata as Record<string, unknown>)?.rating as number | undefined;
  const customerName = (notification.metadata as Record<string, unknown>)?.customer_name as string | undefined;

  const color =
    notification.type === "negative_review" ? "#dc2626" : rating && rating >= 4 ? "#16a34a" : "#f59e0b";

  const payload = {
    channel: prefs.slack_channel,
    attachments: [
      {
        color,
        title: notification.title,
        text: notification.message,
        fields: [
          ...(rating
            ? [
                {
                  title: "Rating",
                  value: "⭐".repeat(rating) + "☆".repeat(5 - rating),
                  short: true,
                },
              ]
            : []),
          ...(customerName
            ? [
                {
                  title: "Customer",
                  value: customerName,
                  short: true,
                },
              ]
            : []),
        ],
        footer: "RepWell",
        ts: Math.floor(new Date(notification.created_at).getTime() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(prefs.slack_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text();

    // Log the webhook call
    await supabase.from("slack_webhook_logs").insert({
      user_id: userId,
      organization_id: notification.organization_id,
      notification_id: notification.id,
      webhook_url: prefs.slack_webhook_url,
      payload,
      response_status: response.status,
      response_body: responseBody,
      success: response.ok,
      error_message: response.ok ? null : responseBody,
    });

    if (!response.ok) {
      return { success: false, error: `Slack webhook failed: ${responseBody}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log the error
    await supabase.from("slack_webhook_logs").insert({
      user_id: userId,
      organization_id: notification.organization_id,
      notification_id: notification.id,
      webhook_url: prefs.slack_webhook_url,
      payload,
      success: false,
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Test Slack webhook
export async function testSlackWebhook(
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
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

// Get pending digest notifications for processing
export async function getPendingDigestNotifications(
  userId: string
): Promise<Array<{ notification_id: string; type: string; title: string; message: string; action_url: string | null; created_at: string }>> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notification_digest_queue")
    .select(
      `
      notification_id,
      notifications!inner(type, title, message, action_url, created_at)
    `
    )
    .eq("user_id", userId)
    .lte("scheduled_for", new Date().toISOString())
    .is("processed_at", null);

  if (error) {
    console.error("Error fetching pending digest notifications:", error);
    return [];
  }

  return (data || []).map((item) => {
    // When using inner join, notifications is an object, not array
    const notification = item.notifications as unknown as {
      type: string;
      title: string;
      message: string;
      action_url: string | null;
      created_at: string;
    };
    return {
      notification_id: item.notification_id as string,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      action_url: notification.action_url,
      created_at: notification.created_at,
    };
  });
}

// Mark digest as sent
export async function markDigestSent(
  userId: string,
  notificationIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createUntypedAdminClient();

  const { error: queueError } = await supabase
    .from("notification_digest_queue")
    .update({ processed_at: new Date().toISOString() })
    .eq("user_id", userId)
    .in("notification_id", notificationIds);

  if (queueError) {
    console.error("Error marking digest as sent:", queueError);
    return { success: false, error: queueError.message };
  }

  const { error: prefsError } = await supabase
    .from("notification_preferences")
    .update({ last_digest_sent_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (prefsError) {
    console.error("Error updating last digest sent time:", prefsError);
  }

  return { success: true };
}

// Get users who need digest emails
export async function getUsersNeedingDigest(): Promise<
  Array<{
    user_id: string;
    email: string;
    full_name: string | null;
    digest_frequency: string;
    digest_timezone: string;
  }>
> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("notification_preferences")
    .select(
      `
      user_id,
      digest_frequency,
      digest_timezone,
      users!inner(email, full_name)
    `
    )
    .eq("digest_enabled", true)
    .lte("last_digest_sent_at", getDigestCutoffTime());

  if (error) {
    console.error("Error fetching users needing digest:", error);
    return [];
  }

  return (data || []).map((item) => {
    const user = item.users as unknown as { email: string; full_name: string | null };
    return {
      user_id: item.user_id as string,
      email: user.email,
      full_name: user.full_name,
      digest_frequency: item.digest_frequency as string,
      digest_timezone: item.digest_timezone as string,
    };
  });
}

function getDigestCutoffTime(): string {
  // Returns the timestamp for when the last digest should have been sent
  // This is used to find users who need a new digest
  const now = new Date();
  now.setHours(now.getHours() - 1); // Allow 1 hour buffer
  return now.toISOString();
}

// Send MS Teams notification using Adaptive Cards
export async function sendTeamsNotification(
  userId: string,
  notification: Notification
): Promise<{ success: boolean; error?: string }> {
  const supabase = createUntypedAdminClient();

  // Get user's Teams preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("teams_enabled, teams_webhook_url, teams_new_review, teams_negative_review")
    .eq("user_id", userId)
    .single();

  if (!prefs?.teams_enabled || !prefs.teams_webhook_url) {
    return { success: false, error: "Teams not configured" };
  }

  // Validate webhook URL to prevent SSRF attacks (defense-in-depth)
  if (!isValidTeamsWebhookUrl(prefs.teams_webhook_url)) {
    return { success: false, error: "Invalid Teams webhook URL configured" };
  }

  // Check if this notification type should be sent to Teams
  const shouldSend =
    (notification.type === "new_review" && prefs.teams_new_review) ||
    (notification.type === "negative_review" && prefs.teams_negative_review);

  if (!shouldSend) {
    return { success: false, error: "Notification type not enabled for Teams" };
  }

  // Build Adaptive Card message
  const rating = (notification.metadata as Record<string, unknown>)?.rating as number | undefined;
  const customerName = (notification.metadata as Record<string, unknown>)?.customer_name as string | undefined;

  // Color based on notification type and rating
  const color =
    notification.type === "negative_review" ? "Attention" : rating && rating >= 4 ? "Good" : "Warning";

  const payload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.5",
          body: [
            {
              type: "TextBlock",
              text: notification.title,
              size: "Medium",
              weight: "Bolder",
              color,
            },
            {
              type: "TextBlock",
              text: notification.message,
              wrap: true,
            },
            ...(rating || customerName
              ? [
                  {
                    type: "FactSet",
                    facts: [
                      ...(rating
                        ? [
                            {
                              title: "Rating",
                              value: "⭐".repeat(rating) + "☆".repeat(5 - rating),
                            },
                          ]
                        : []),
                      ...(customerName
                        ? [
                            {
                              title: "Customer",
                              value: customerName,
                            },
                          ]
                        : []),
                    ],
                  },
                ]
              : []),
            {
              type: "TextBlock",
              text: "RepWell",
              size: "Small",
              isSubtle: true,
            },
          ],
          ...(notification.action_url
            ? {
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "View Review",
                    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com"}${notification.action_url}`,
                  },
                ],
              }
            : {}),
        },
      },
    ],
  };

  try {
    const response = await fetch(prefs.teams_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text();

    // Log the webhook call
    await supabase.from("teams_webhook_logs").insert({
      user_id: userId,
      organization_id: notification.organization_id,
      notification_id: notification.id,
      webhook_url: prefs.teams_webhook_url,
      payload,
      response_status: response.status,
      response_body: responseBody,
      success: response.ok,
      error_message: response.ok ? null : responseBody,
    });

    if (!response.ok) {
      return { success: false, error: `Teams webhook failed: ${responseBody}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log the error
    await supabase.from("teams_webhook_logs").insert({
      user_id: userId,
      organization_id: notification.organization_id,
      notification_id: notification.id,
      webhook_url: prefs.teams_webhook_url,
      payload,
      success: false,
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Test MS Teams webhook with Adaptive Card
export async function testTeamsWebhook(
  webhookUrl: string
): Promise<{ success: boolean; error?: string }> {
  // Validate webhook URL to prevent SSRF attacks
  if (!isValidTeamsWebhookUrl(webhookUrl)) {
    return {
      success: false,
      error: "Invalid Teams webhook URL. Must be a valid Microsoft webhook.office.com URL.",
    };
  }

  const testPayload = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.5",
          body: [
            {
              type: "TextBlock",
              text: "Webhook Test Successful",
              size: "Medium",
              weight: "Bolder",
              color: "Good",
            },
            {
              type: "TextBlock",
              text: "Your Microsoft Teams integration is configured correctly.",
              wrap: true,
            },
            {
              type: "TextBlock",
              text: "RepWell",
              size: "Small",
              isSubtle: true,
            },
          ],
        },
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
      return { success: false, error: `Teams returned: ${body}` };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}
