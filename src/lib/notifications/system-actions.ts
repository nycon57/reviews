import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { CreateNotificationParams, Notification } from "./types";

function isValidSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== "hooks.slack.com") return false;
    if (!parsed.pathname.startsWith("/services/")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const supabase = createUntypedAdminClient();
  const createdAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      organization_id: params.organizationId,
      review_id: params.reviewId,
      target_user_id: params.loanOfficerId,
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

  try {
    await sendSlackNotification(params.userId, {
      id: data.id,
      user_id: params.userId,
      organization_id: params.organizationId ?? null,
      type: params.type,
      title: params.title,
      message: params.message,
      review_id: params.reviewId ?? null,
      target_user_id: params.loanOfficerId ?? null,
      metadata: params.metadata || {},
      is_read: false,
      read_at: null,
      is_archived: false,
      archived_at: null,
      action_url: params.actionUrl ?? null,
      priority: params.priority || 0,
      created_at: createdAt,
    });
  } catch (slackError) {
    console.error("Slack notification dispatch failed:", slackError);
  }

  return { success: true, notificationId: data.id };
}

export async function sendSlackNotification(
  userId: string,
  notification: Notification
): Promise<{ success: boolean; error?: string }> {
  const supabase = createUntypedAdminClient();

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select(
      "slack_enabled, slack_webhook_url, slack_channel, slack_new_review, slack_negative_review"
    )
    .eq("user_id", userId)
    .single();

  if (!prefs?.slack_enabled || !prefs.slack_webhook_url) {
    return { success: false, error: "Slack not configured" };
  }

  if (!isValidSlackWebhookUrl(prefs.slack_webhook_url)) {
    return { success: false, error: "Invalid Slack webhook URL configured" };
  }

  const shouldSend =
    (notification.type === "new_review" && prefs.slack_new_review) ||
    (notification.type === "negative_review" && prefs.slack_negative_review);

  if (!shouldSend) {
    return { success: false, error: "Notification type not enabled for Slack" };
  }

  const rating = (notification.metadata as Record<string, unknown>)?.rating as number | undefined;
  const customerName = (notification.metadata as Record<string, unknown>)?.customer_name as
    | string
    | undefined;

  const color =
    notification.type === "negative_review"
      ? "#dc2626"
      : rating && rating >= 4
        ? "#16a34a"
        : "#f59e0b";

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
                  value: `${rating}/5 stars`,
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

export async function getPendingDigestNotifications(userId: string): Promise<
  Array<{
    notification_id: string;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    created_at: string;
  }>
> {
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
  const now = new Date();
  now.setHours(now.getHours() - 1);
  return now.toISOString();
}
