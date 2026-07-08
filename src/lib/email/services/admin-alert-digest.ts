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
  AdminAlertEmailHealth,
  AdminAlertSeverity,
} from "../types";

interface SendDigestResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

interface DigestRecipient {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
}

/** Default failed-send count over the window that triggers an email-health alert. */
const EMAIL_FAILURE_THRESHOLD_DEFAULT = 5;
/** Window over which failed sends are counted for the health check. */
const EMAIL_HEALTH_WINDOW_HOURS = 24;
/** How many top failing templates to surface in the digest. */
const EMAIL_HEALTH_TOP_TEMPLATES = 3;

/**
 * Per-org email-deliverability health for orgs whose failed-send count in the
 * window exceeds their threshold (default 5, overridable via
 * organizations.settings.email_failure_alert_threshold). Returns a map keyed by
 * organization_id — only over-threshold orgs are included.
 */
async function getOrgEmailHealth(): Promise<Map<string, AdminAlertEmailHealth>> {
  const supabase = createUntypedAdminClient();
  const since = new Date(
    Date.now() - EMAIL_HEALTH_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data: failedRows, error } = await supabase
    .from("email_logs")
    .select("organization_id, template_name")
    .eq("status", "failed")
    .gte("created_at", since)
    .not("organization_id", "is", null);

  if (error || !failedRows || failedRows.length === 0) {
    if (error) console.error("Error computing email health:", error);
    return new Map();
  }

  // Aggregate failed counts per org, and per template within each org.
  const perOrg = new Map<string, { total: number; byTemplate: Map<string, number> }>();
  for (const row of failedRows as Array<{
    organization_id: string | null;
    template_name: string | null;
  }>) {
    const orgId = row.organization_id;
    if (!orgId) continue;
    const entry = perOrg.get(orgId) ?? { total: 0, byTemplate: new Map() };
    entry.total += 1;
    const template = row.template_name || "unknown";
    entry.byTemplate.set(template, (entry.byTemplate.get(template) ?? 0) + 1);
    perOrg.set(orgId, entry);
  }

  // Load per-org thresholds from settings; default when unset/invalid.
  const orgIds = [...perOrg.keys()];
  const thresholds = new Map<string, number>();
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, settings")
    .in("id", orgIds);
  for (const org of (orgs ?? []) as Array<{ id: string; settings: unknown }>) {
    const raw = (org.settings as Record<string, unknown> | null)?.[
      "email_failure_alert_threshold"
    ];
    const parsed = Number(raw);
    thresholds.set(
      org.id,
      Number.isFinite(parsed) && parsed > 0 ? parsed : EMAIL_FAILURE_THRESHOLD_DEFAULT
    );
  }

  const analyticsUrl = `${emailConfig.baseUrl}/staff/email-analytics`;
  const result = new Map<string, AdminAlertEmailHealth>();
  for (const [orgId, entry] of perOrg) {
    const threshold = thresholds.get(orgId) ?? EMAIL_FAILURE_THRESHOLD_DEFAULT;
    if (entry.total <= threshold) continue;

    const topTemplates = [...entry.byTemplate.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, EMAIL_HEALTH_TOP_TEMPLATES)
      .map(([templateName, count]) => ({ templateName, count }));

    result.set(orgId, {
      failedCount: entry.total,
      threshold,
      windowHours: EMAIL_HEALTH_WINDOW_HOURS,
      topTemplates,
      analyticsUrl,
    });
  }

  return result;
}

/**
 * Admins/managers of the given orgs — the recipients for an email-health alert
 * when they have no queued alerts that would otherwise pull them into the digest.
 */
async function getAdminRecipientsForOrgs(
  orgIds: string[]
): Promise<DigestRecipient[]> {
  if (orgIds.length === 0) return [];
  const supabase = createUntypedAdminClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, full_name, organization_id, organizations(name)")
    .in("organization_id", orgIds)
    .in("role", ["admin", "manager"])
    .eq("is_active", true);

  if (error || !users) {
    if (error) console.error("Error fetching email-health recipients:", error);
    return [];
  }

  return (users as Array<Record<string, unknown>>).map((user) => {
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

interface QueuedAlert {
  id: string;
  user_id: string;
  organization_id: string;
  alert_type: string;
  severity: AdminAlertSeverity;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
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

  // Get distinct user IDs from the queue with pending alerts (processed_at IS NULL means pending)
  const { data: queuedUsers, error: queueError } = await supabase
    .from("admin_alert_queue")
    .select("user_id")
    .is("processed_at", null);

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
    .is("processed_at", null)
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

  const now = new Date().toISOString();
  await supabase
    .from("admin_alert_queue")
    .update({ processed_at: now, sent_at: now })
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
 * Build action URL from alert metadata
 */
function getActionUrl(alert: QueuedAlert): string {
  // Try to extract action URL from metadata
  if (alert.metadata?.actionUrl) {
    return alert.metadata.actionUrl as string;
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
  user: DigestRecipient,
  alerts: QueuedAlert[],
  emailHealth?: AdminAlertEmailHealth
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
      summary: alert.message,
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
      emailHealth,
    };

    // Render email
    const html = await render(AdminAlertDigestEmail({ data: emailData }));

    // Build subject line. An email-health-only digest (no queued alerts) leads
    // with the deliverability problem rather than "0 alerts".
    let subject = `Daily Alert Digest: ${digestItems.length} alert${digestItems.length !== 1 ? "s" : ""}`;
    if (digestItems.length === 0 && emailHealth) {
      subject = `[Important] Email health: ${emailHealth.failedCount} failed sends need attention`;
    } else if (criticalCount > 0) {
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
    // Email-health is org-scoped and can reach admins who have no queued alerts,
    // so the recipient set is the union of alert-queue users and admins/managers
    // of over-threshold orgs.
    const emailHealthByOrg = await getOrgEmailHealth();
    const alertUsers = await getUsersWithPendingAlerts();

    const recipients = new Map<string, DigestRecipient>();
    for (const user of alertUsers) recipients.set(user.userId, user);
    if (emailHealthByOrg.size > 0) {
      const healthRecipients = await getAdminRecipientsForOrgs([
        ...emailHealthByOrg.keys(),
      ]);
      for (const user of healthRecipients) {
        if (!recipients.has(user.userId)) recipients.set(user.userId, user);
      }
    }

    if (recipients.size === 0) {
      return result;
    }

    for (const user of recipients.values()) {
      const alerts = await getPendingAlertsForUser(user.userId);
      const emailHealth = emailHealthByOrg.get(user.organizationId);

      // Relaxed early-continue: skip only when there is nothing to say — no
      // queued alerts AND the org is not over its failed-send threshold.
      if (alerts.length === 0 && !emailHealth) {
        continue;
      }

      const sendResult = await sendDigestToUser(user, alerts, emailHealth);

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
      summary: alert.message,
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
