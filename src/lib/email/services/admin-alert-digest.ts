/**
 * Admin Alert Digest Service (S089)
 *
 * Service for sending daily digest emails to managers/admins
 * who prefer batched alerts over immediate delivery.
 */

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { getResendClient, emailConfig, getFromAddress } from "../client";
import { render } from "@react-email/render";
import { AdminAlertDigestEmail } from "../templates/admin-alerts";
import type {
  AdminAlertDigestEmailData,
  AdminAlertDigestItem,
  AdminAlertSeverity,
} from "../types";

interface SendDigestResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

interface QueuedAlert {
  id: string;
  user_id: string;
  organization_id: string;
  alert_type: string;
  severity: AdminAlertSeverity;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  created_at: string;
  action_url?: string;
}

/**
 * Check if an email address is unsubscribed
 */
async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  return !!data;
}

/**
 * Log email send attempt to database
 */
async function logEmail(params: {
  toEmail: string;
  toName?: string;
  fromEmail: string;
  subject: string;
  templateName: string;
  organizationId?: string;
  resendMessageId?: string;
  status: string;
  errorMessage?: string;
}): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from("email_logs").insert({
    to_email: params.toEmail,
    to_name: params.toName,
    from_email: params.fromEmail,
    subject: params.subject,
    template_name: params.templateName,
    organization_id: params.organizationId,
    resend_message_id: params.resendMessageId,
    status: params.status,
    sent_at: params.status === "sent" ? new Date().toISOString() : null,
    error_message: params.errorMessage,
  });
}

/**
 * Get users who have pending alerts in the queue
 */
async function getUsersWithPendingAlerts(): Promise<
  Array<{
    userId: string;
    email: string;
    fullName: string;
    organizationId: string;
    organizationName: string;
  }>
> {
  const supabase = createUntypedAdminClient();

  // Get distinct user IDs from the queue with pending alerts
  const { data: queuedUsers, error: queueError } = await supabase
    .from("admin_alert_queue")
    .select("user_id")
    .eq("status", "pending");

  if (queueError || !queuedUsers) {
    console.error("Error fetching queued users:", queueError);
    return [];
  }

  const userIds = [...new Set(queuedUsers.map((q) => q.user_id as string))];

  if (userIds.length === 0) {
    return [];
  }

  // Get user details
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, full_name, organization_id, organizations(name)")
    .in("id", userIds)
    .eq("is_active", true);

  if (usersError || !users) {
    console.error("Error fetching user details:", usersError);
    return [];
  }

  return users.map((user) => {
    // Handle both single object and array cases from Supabase join
    const org = user.organizations as { name: string } | { name: string }[] | null;
    const orgName = Array.isArray(org) ? org[0]?.name : org?.name;

    return {
      userId: user.id as string,
      email: user.email as string,
      fullName: user.full_name as string,
      organizationId: user.organization_id as string,
      organizationName: orgName || "Your Organization",
    };
  });
}

/**
 * Get pending alerts for a specific user
 */
async function getPendingAlertsForUser(userId: string): Promise<QueuedAlert[]> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("admin_alert_queue")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching pending alerts:", error);
    return [];
  }

  return data as QueuedAlert[];
}

/**
 * Mark alerts as sent
 */
async function markAlertsAsSent(alertIds: string[]): Promise<void> {
  if (alertIds.length === 0) return;

  // Use untyped client since admin_alert_queue isn't in generated types yet
  const supabase = createUntypedAdminClient();

  await supabase
    .from("admin_alert_queue")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .in("id", alertIds);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Build action URL from alert payload
 */
function getActionUrl(alert: QueuedAlert): string {
  // Try to extract action URL from payload
  if (alert.payload?.actionUrl) {
    return alert.payload.actionUrl as string;
  }
  if (alert.action_url) {
    return alert.action_url;
  }
  // Default to dashboard
  return `${emailConfig.baseUrl}/dashboard`;
}

/**
 * Send daily digest email to a single user
 */
async function sendDigestToUser(
  user: {
    userId: string;
    email: string;
    fullName: string;
    organizationId: string;
    organizationName: string;
  },
  alerts: QueuedAlert[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResendClient();

    // Check if unsubscribed
    const unsubscribed = await isEmailUnsubscribed(user.email);
    if (unsubscribed) {
      // Mark alerts as sent anyway to clear the queue
      await markAlertsAsSent(alerts.map((a) => a.id));
      return { success: true };
    }

    // Convert alerts to digest items
    const digestItems: AdminAlertDigestItem[] = alerts.map((alert) => ({
      alertType: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      summary: alert.summary,
      timestamp: formatTimestamp(alert.created_at),
      actionUrl: getActionUrl(alert),
    }));

    // Count by severity
    const criticalCount = digestItems.filter((a) => a.severity === "critical").length;
    const highCount = digestItems.filter((a) => a.severity === "high").length;

    // Build email data
    const emailData: AdminAlertDigestEmailData = {
      recipientName: user.fullName,
      organizationName: user.organizationName,
      digestDate: formatDate(new Date()),
      alerts: digestItems,
      totalAlerts: digestItems.length,
      criticalCount,
      highCount,
      dashboardUrl: `${emailConfig.baseUrl}/dashboard`,
      alertSettingsUrl: `${emailConfig.baseUrl}/settings/notifications`,
      toEmail: user.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}&type=admin_alerts`,
    };

    // Render email
    const html = await render(AdminAlertDigestEmail({ data: emailData }));

    // Build subject line
    let subject = `Daily Alert Digest: ${digestItems.length} alert${digestItems.length !== 1 ? "s" : ""}`;
    if (criticalCount > 0) {
      subject = `[URGENT] ${subject} (${criticalCount} critical)`;
    } else if (highCount > 0) {
      subject = `[Important] ${subject}`;
    }

    // Send email
    const { data: sendData, error: sendError } = await resend.emails.send({
      from: getFromAddress(),
      to: user.email,
      subject,
      html,
      tags: [
        { name: "template", value: "admin_alert_digest" },
        { name: "organization_id", value: user.organizationId },
        { name: "alert_count", value: String(digestItems.length) },
      ],
    });

    if (sendError) {
      await logEmail({
        toEmail: user.email,
        toName: user.fullName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "admin_alert_digest",
        organizationId: user.organizationId,
        status: "failed",
        errorMessage: sendError.message,
      });
      return { success: false, error: sendError.message };
    }

    await logEmail({
      toEmail: user.email,
      toName: user.fullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "admin_alert_digest",
      organizationId: user.organizationId,
      resendMessageId: sendData?.id,
      status: "sent",
    });

    // Mark alerts as sent
    await markAlertsAsSent(alerts.map((a) => a.id));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send daily digest emails to all users with pending alerts
 */
export async function sendAdminAlertDigests(): Promise<SendDigestResult> {
  const result: SendDigestResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [],
  };

  try {
    const users = await getUsersWithPendingAlerts();

    if (users.length === 0) {
      return result;
    }

    for (const user of users) {
      const alerts = await getPendingAlertsForUser(user.userId);

      if (alerts.length === 0) {
        continue;
      }

      const sendResult = await sendDigestToUser(user, alerts);

      if (sendResult.success) {
        result.sent++;
      } else {
        result.failed++;
        if (sendResult.error) {
          result.errors.push(`Failed to send to ${user.email}: ${sendResult.error}`);
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error sending admin alert digests:", error);
    return {
      success: false,
      sent: result.sent,
      failed: result.failed,
      errors: [...result.errors, error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Get digest preview for a user (for testing/preview purposes)
 */
export async function getDigestPreview(userId: string): Promise<{
  success: boolean;
  data?: AdminAlertDigestEmailData;
  error?: string;
}> {
  try {
    const supabase = createUntypedAdminClient();

    // Get user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, organization_id, organizations(name)")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return { success: false, error: "User not found" };
    }

    // Get pending alerts
    const alerts = await getPendingAlertsForUser(userId);

    if (alerts.length === 0) {
      return { success: false, error: "No pending alerts" };
    }

    const digestItems: AdminAlertDigestItem[] = alerts.map((alert) => ({
      alertType: alert.alert_type,
      severity: alert.severity,
      title: alert.title,
      summary: alert.summary,
      timestamp: formatTimestamp(alert.created_at),
      actionUrl: getActionUrl(alert),
    }));

    const criticalCount = digestItems.filter((a) => a.severity === "critical").length;
    const highCount = digestItems.filter((a) => a.severity === "high").length;

    // Handle both single object and array cases from Supabase join
    const org = user.organizations as { name: string } | { name: string }[] | null;
    const orgName = Array.isArray(org) ? org[0]?.name : org?.name;

    const emailData: AdminAlertDigestEmailData = {
      recipientName: user.full_name as string,
      organizationName: orgName || "Your Organization",
      digestDate: formatDate(new Date()),
      alerts: digestItems,
      totalAlerts: digestItems.length,
      criticalCount,
      highCount,
      dashboardUrl: `${emailConfig.baseUrl}/dashboard`,
      alertSettingsUrl: `${emailConfig.baseUrl}/settings/notifications`,
      toEmail: user.email as string,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email as string)}&type=admin_alerts`,
    };

    return { success: true, data: emailData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
