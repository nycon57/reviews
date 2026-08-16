/**
 * Admin Alert Email Service (S089)
 *
 * Service for sending real-time alert emails to managers and admins.
 * Handles immediate delivery and digest queuing based on user preferences.
 */

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { getResendClient, emailConfig, getFromAddress } from "../client";
import { render } from "@react-email/render";
import {
  AdminAlertNegativeReviewEmail,
  AdminAlertTeamStrugglingEmail,
  AdminAlertComplianceViolationEmail,
  AdminAlertUsageLimitEmail,
  AdminAlertTeamMemberJoinedEmail,
  AdminAlertTeamMemberLeftEmail,
  AdminAlertUnusualActivityEmail,
  AdminAlertIntegrationDisconnectedEmail,
} from "../templates/admin-alerts";
import type {
  EmailTemplate,
  AdminAlertType,
  AdminAlertSeverity,
  AdminAlertNegativeReviewEmailData,
  AdminAlertTeamStrugglingEmailData,
  AdminAlertComplianceViolationEmailData,
  AdminAlertUsageLimitEmailData,
  AdminAlertTeamMemberJoinedEmailData,
  AdminAlertTeamMemberLeftEmailData,
  AdminAlertUnusualActivityEmailData,
  AdminAlertIntegrationDisconnectedEmailData,
} from "../types";

// Type union for all alert email data
type AlertEmailData =
  | AdminAlertNegativeReviewEmailData
  | AdminAlertTeamStrugglingEmailData
  | AdminAlertComplianceViolationEmailData
  | AdminAlertUsageLimitEmailData
  | AdminAlertTeamMemberJoinedEmailData
  | AdminAlertTeamMemberLeftEmailData
  | AdminAlertUnusualActivityEmailData
  | AdminAlertIntegrationDisconnectedEmailData;

interface AdminAlertPreferences {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  deliveryMode: "immediate" | "digest";
  alertEnabled: boolean;
}

interface SendAlertResult {
  success: boolean;
  sent: number;
  queued: number;
  skipped: number;
  errors: string[];
}

const alertTypeToTemplate: Record<AdminAlertType, EmailTemplate> = {
  negative_review: "admin_alert_negative_review",
  team_struggling: "admin_alert_team_struggling",
  compliance_violation: "admin_alert_compliance_violation",
  usage_limit: "admin_alert_usage_limit",
  team_member_joined: "admin_alert_team_member_joined",
  team_member_left: "admin_alert_team_member_left",
  unusual_activity: "admin_alert_unusual_activity",
  integration_disconnected: "admin_alert_integration_disconnected",
};

const alertTypeToPreferenceColumn: Record<AdminAlertType, string> = {
  negative_review: "alert_negative_review",
  team_struggling: "alert_team_struggling",
  compliance_violation: "alert_compliance_violation",
  usage_limit: "alert_usage_limit",
  team_member_joined: "alert_team_member_joined",
  team_member_left: "alert_team_member_left",
  unusual_activity: "alert_unusual_activity",
  integration_disconnected: "alert_integration_disconnected",
};

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
  fromName?: string;
  subject: string;
  templateName: EmailTemplate;
  organizationId?: string;
  resendMessageId?: string;
  status: string;
  errorMessage?: string;
}): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("email_logs")
    .insert({
      to_email: params.toEmail,
      to_name: params.toName,
      from_email: params.fromEmail,
      from_name: params.fromName,
      subject: params.subject,
      template_name: params.templateName,
      organization_id: params.organizationId,
      resend_message_id: params.resendMessageId,
      status: params.status,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
      error_message: params.errorMessage,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log email:", error);
    return null;
  }

  return data.id;
}

/**
 * Get alert preferences for managers/admins in an organization
 */
async function getAlertRecipients(
  organizationId: string,
  alertType: AdminAlertType
): Promise<AdminAlertPreferences[]> {
  const supabase = createUntypedAdminClient();

  // Get all managers and admins in the organization
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, full_name, organization_id, role")
    .eq("organization_id", organizationId)
    .in("role", ["admin", "manager"])
    .eq("is_active", true)
    .not("email", "is", null);

  if (usersError || !users) {
    console.error("Error fetching alert recipients:", usersError);
    return [];
  }

  // Get preferences for each user
  const recipients: AdminAlertPreferences[] = [];
  const preferenceColumn = alertTypeToPreferenceColumn[alertType];

  for (const user of users) {
    const { data: prefs } = await supabase
      .from("admin_alert_preferences")
      .select(`${preferenceColumn}, delivery_mode`)
      .eq("user_id", user.id)
      .single();

    // Default to enabled with immediate delivery if no preferences set
    const prefsRecord = prefs as Record<string, unknown> | null;
    const alertEnabled = (prefsRecord?.[preferenceColumn] as boolean | undefined) ?? true;
    const deliveryMode = (prefsRecord?.delivery_mode as "immediate" | "digest" | undefined) ?? "immediate";

    recipients.push({
      userId: user.id as string,
      email: user.email as string,
      fullName: user.full_name as string,
      organizationId: user.organization_id as string,
      deliveryMode,
      alertEnabled,
    });
  }

  return recipients;
}

/**
 * Queue alert for digest delivery
 */
async function queueAlertForDigest(
  userId: string,
  organizationId: string,
  alertType: AdminAlertType,
  severity: AdminAlertSeverity,
  title: string,
  message: string,
  metadata: AlertEmailData
): Promise<boolean> {
  // Use untyped client since admin_alert_queue isn't in generated types yet
  const supabase = createUntypedAdminClient();

  const { error } = await supabase.from("admin_alert_queue").insert({
    user_id: userId,
    organization_id: organizationId,
    alert_type: alertType,
    severity,
    title,
    message,
    metadata,
  });

  if (error) {
    console.error("Failed to queue alert for digest:", error);
    return false;
  }

  return true;
}

/**
 * Get subject line for alert type
 */
function getAlertSubject(alertType: AdminAlertType, _data: AlertEmailData): string {
  switch (alertType) {
    case "negative_review":
      return `Alert: Negative Review Received`;
    case "team_struggling":
      return `Alert: Team Member Performance Below Threshold`;
    case "compliance_violation":
      return `Alert: Compliance Issue Detected`;
    case "usage_limit":
      return `Alert: Usage Limit Approaching`;
    case "team_member_joined":
      return `New Team Member Joined`;
    case "team_member_left":
      return `Team Member Departed`;
    case "unusual_activity":
      return `Security Alert: Unusual Activity Detected`;
    case "integration_disconnected":
      return `Alert: Integration Disconnected`;
    default:
      return `Admin Alert`;
  }
}

/**
 * Render alert email based on type
 */
async function renderAlertEmail(
  alertType: AdminAlertType,
  data: AlertEmailData
): Promise<string> {
  switch (alertType) {
    case "negative_review":
      return await render(
        AdminAlertNegativeReviewEmail({
          data: data as AdminAlertNegativeReviewEmailData,
        })
      );
    case "team_struggling":
      return await render(
        AdminAlertTeamStrugglingEmail({
          data: data as AdminAlertTeamStrugglingEmailData,
        })
      );
    case "compliance_violation":
      return await render(
        AdminAlertComplianceViolationEmail({
          data: data as AdminAlertComplianceViolationEmailData,
        })
      );
    case "usage_limit":
      return await render(
        AdminAlertUsageLimitEmail({
          data: data as AdminAlertUsageLimitEmailData,
        })
      );
    case "team_member_joined":
      return await render(
        AdminAlertTeamMemberJoinedEmail({
          data: data as AdminAlertTeamMemberJoinedEmailData,
        })
      );
    case "team_member_left":
      return await render(
        AdminAlertTeamMemberLeftEmail({
          data: data as AdminAlertTeamMemberLeftEmailData,
        })
      );
    case "unusual_activity":
      return await render(
        AdminAlertUnusualActivityEmail({
          data: data as AdminAlertUnusualActivityEmailData,
        })
      );
    case "integration_disconnected":
      return await render(
        AdminAlertIntegrationDisconnectedEmail({
          data: data as AdminAlertIntegrationDisconnectedEmailData,
        })
      );
    default:
      throw new Error(`Unknown alert type: ${alertType}`);
  }
}

/**
 * Send an alert to all eligible recipients in an organization
 */
export async function sendAdminAlert<T extends AlertEmailData>(
  organizationId: string,
  alertType: AdminAlertType,
  severity: AdminAlertSeverity,
  buildEmailData: (recipient: AdminAlertPreferences) => T,
  digestInfo?: { title: string; message: string }
): Promise<SendAlertResult> {
  const result: SendAlertResult = {
    success: true,
    sent: 0,
    queued: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const resend = getResendClient();
    const recipients = await getAlertRecipients(organizationId, alertType);

    for (const recipient of recipients) {
      try {
        // Check if alert is enabled for this recipient
        if (!recipient.alertEnabled) {
          result.skipped++;
          continue;
        }

        // Check if email is unsubscribed
        const unsubscribed = await isEmailUnsubscribed(recipient.email);
        if (unsubscribed) {
          result.skipped++;
          continue;
        }

        const emailData = buildEmailData(recipient);

        // Handle digest mode - queue instead of sending immediately
        if (recipient.deliveryMode === "digest") {
          if (digestInfo) {
            const queued = await queueAlertForDigest(
              recipient.userId,
              recipient.organizationId,
              alertType,
              severity,
              digestInfo.title,
              digestInfo.message,
              emailData
            );
            if (queued) {
              result.queued++;
            } else {
              result.errors.push(`Failed to queue alert for ${recipient.email}`);
            }
          }
          continue;
        }

        // Render and send email immediately
        const subject = getAlertSubject(alertType, emailData);
        const html = await renderAlertEmail(alertType, emailData);
        const templateName = alertTypeToTemplate[alertType];

        // Operational admin alert; leave direct because it is not A/B material.
        const { data: sendData, error: sendError } = await resend.emails.send({
          from: getFromAddress(),
          to: recipient.email,
          subject,
          html,
          tags: [
            { name: "template", value: templateName },
            { name: "organization_id", value: organizationId },
            { name: "alert_type", value: alertType },
            { name: "severity", value: severity },
          ],
        });

        if (sendError) {
          await logEmail({
            toEmail: recipient.email,
            toName: recipient.fullName,
            fromEmail: emailConfig.defaultFromEmail,
            subject,
            templateName,
            organizationId,
            status: "failed",
            errorMessage: sendError.message,
          });
          result.errors.push(`Failed to send to ${recipient.email}: ${sendError.message}`);
          continue;
        }

        await logEmail({
          toEmail: recipient.email,
          toName: recipient.fullName,
          fromEmail: emailConfig.defaultFromEmail,
          subject,
          templateName,
          organizationId,
          resendMessageId: sendData?.id,
          status: "sent",
        });

        result.sent++;
      } catch (recipientError) {
        result.errors.push(
          `Error processing recipient ${recipient.email}: ${recipientError instanceof Error ? recipientError.message : "Unknown error"}`
        );
      }
    }

    return result;
  } catch (error) {
    console.error("Error sending admin alerts:", error);
    return {
      success: false,
      sent: result.sent,
      queued: result.queued,
      skipped: result.skipped,
      errors: [...result.errors, error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Send negative review alert
 */
export async function sendNegativeReviewAlert(
  organizationId: string,
  reviewData: {
    loanOfficerName: string;
    loanOfficerPhotoUrl?: string;
    customerName: string;
    rating: number;
    reviewText?: string;
    reviewSource?: string;
    reviewDate: string;
    suggestedResponse?: string;
    actionUrl: string;
  }
): Promise<SendAlertResult> {
  return sendAdminAlert(
    organizationId,
    "negative_review",
    reviewData.rating <= 2 ? "high" : "medium",
    (recipient) => ({
      recipientName: recipient.fullName,
      organizationName: "",
      loanOfficerName: reviewData.loanOfficerName,
      loanOfficerPhotoUrl: reviewData.loanOfficerPhotoUrl,
      customerName: reviewData.customerName,
      rating: reviewData.rating,
      reviewText: reviewData.reviewText,
      reviewSource: reviewData.reviewSource,
      reviewDate: reviewData.reviewDate,
      suggestedResponse: reviewData.suggestedResponse,
      actionUrl: reviewData.actionUrl,
      toEmail: recipient.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=admin_alerts`,
    }),
    {
      title: "Negative Review",
      message: `${reviewData.loanOfficerName} received a ${reviewData.rating}-star review`,
    }
  );
}

/**
 * Send team struggling alert
 */
export async function sendTeamStrugglingAlert(
  organizationId: string,
  alertData: {
    loanOfficerName: string;
    loanOfficerPhotoUrl?: string;
    currentRating: number;
    previousRating?: number;
    threshold: number;
    reviewCount?: number;
    trend: "declining" | "stagnant" | "volatile";
    recentReviews?: Array<{ rating: number; date: string; customerName?: string; source?: string }>;
    actionUrl: string;
    coachingUrl: string;
  }
): Promise<SendAlertResult> {
  return sendAdminAlert(
    organizationId,
    "team_struggling",
    alertData.currentRating < alertData.threshold - 0.5 ? "high" : "medium",
    (recipient) => ({
      recipientName: recipient.fullName,
      organizationName: "",
      loanOfficerName: alertData.loanOfficerName,
      loanOfficerPhotoUrl: alertData.loanOfficerPhotoUrl,
      currentRating: alertData.currentRating,
      previousRating: alertData.previousRating,
      threshold: alertData.threshold,
      reviewCount: alertData.reviewCount,
      trend: alertData.trend,
      recentReviews: alertData.recentReviews,
      actionUrl: alertData.actionUrl,
      coachingUrl: alertData.coachingUrl,
      toEmail: recipient.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=admin_alerts`,
    }),
    {
      title: "Team Member Struggling",
      message: `${alertData.loanOfficerName}'s rating dropped to ${alertData.currentRating.toFixed(1)}`,
    }
  );
}

/**
 * Send compliance violation alert
 */
export async function sendComplianceViolationAlert(
  organizationId: string,
  alertData: {
    loanOfficerName?: string;
    customerName?: string;
    violationType: "profanity" | "pii" | "legal_risk" | "brand_violation" | "other";
    contentSource: "review" | "response" | "testimonial" | "bio";
    flaggedContent: string;
    flaggedAt: string;
    actionUrl: string;
    reviewQueueUrl: string;
  }
): Promise<SendAlertResult> {
  const severityMap: Record<string, AdminAlertSeverity> = {
    pii: "critical",
    legal_risk: "critical",
    profanity: "high",
    brand_violation: "medium",
    other: "medium",
  };

  return sendAdminAlert(
    organizationId,
    "compliance_violation",
    severityMap[alertData.violationType] || "medium",
    (recipient) => ({
      recipientName: recipient.fullName,
      organizationName: "",
      loanOfficerName: alertData.loanOfficerName,
      customerName: alertData.customerName,
      violationType: alertData.violationType,
      contentSource: alertData.contentSource,
      flaggedContent: alertData.flaggedContent,
      flaggedAt: alertData.flaggedAt,
      actionUrl: alertData.actionUrl,
      reviewQueueUrl: alertData.reviewQueueUrl,
      toEmail: recipient.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=admin_alerts`,
    }),
    {
      title: "Compliance Violation",
      message: `${alertData.violationType.replace("_", " ")} detected in ${alertData.contentSource}`,
    }
  );
}

/**
 * Send usage limit alert
 */
export async function sendUsageLimitAlert(
  organizationId: string,
  alertData: {
    limitType: "surveys" | "reviews" | "team_members" | "api_calls" | "storage";
    currentUsage: number;
    maxLimit: number;
    percentUsed: number;
    periodEnd?: string;
    upgradeUrl: string;
    usageDetailsUrl: string;
    actionUrl: string;
  }
): Promise<SendAlertResult> {
  const severity: AdminAlertSeverity =
    alertData.percentUsed >= 100 ? "critical" : alertData.percentUsed >= 90 ? "high" : "medium";

  return sendAdminAlert(
    organizationId,
    "usage_limit",
    severity,
    (recipient) => ({
      recipientName: recipient.fullName,
      organizationName: "",
      limitType: alertData.limitType,
      currentUsage: alertData.currentUsage,
      maxLimit: alertData.maxLimit,
      percentUsed: alertData.percentUsed,
      periodEnd: alertData.periodEnd,
      upgradeUrl: alertData.upgradeUrl,
      usageDetailsUrl: alertData.usageDetailsUrl,
      actionUrl: alertData.actionUrl,
      toEmail: recipient.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=admin_alerts`,
    }),
    {
      title: "Usage Limit",
      message: `${alertData.percentUsed}% of ${alertData.limitType.replace("_", " ")} limit used`,
    }
  );
}

/**
 * Send team member joined alert
 */
export async function sendTeamMemberJoinedAlert(
  organizationId: string,
  alertData: {
    newMemberName: string;
    newMemberEmail: string;
    newMemberRole: string;
    newMemberPhotoUrl?: string;
    invitedBy?: string;
    joinedAt: string;
    actionUrl: string;
    teamDirectoryUrl: string;
  }
): Promise<SendAlertResult> {
  return sendAdminAlert(
    organizationId,
    "team_member_joined",
    "low",
    (recipient) => ({
      recipientName: recipient.fullName,
      organizationName: "",
      newMemberName: alertData.newMemberName,
      newMemberEmail: alertData.newMemberEmail,
      newMemberRole: alertData.newMemberRole,
      newMemberPhotoUrl: alertData.newMemberPhotoUrl,
      invitedBy: alertData.invitedBy,
      joinedAt: alertData.joinedAt,
      actionUrl: alertData.actionUrl,
      teamDirectoryUrl: alertData.teamDirectoryUrl,
      toEmail: recipient.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=admin_alerts`,
    }),
    {
      title: "New Team Member",
      message: `${alertData.newMemberName} joined as ${alertData.newMemberRole}`,
    }
  );
}

/**
 * Send team member left alert
 */
export async function sendTeamMemberLeftAlert(
  organizationId: string,
  alertData: {
    departedMemberName: string;
    departedMemberEmail: string;
    departedMemberRole: string;
    leftAt: string;
    reason?: "resigned" | "terminated" | "account_deleted" | "unknown";
    pendingItemsCount?: number;
    actionUrl: string;
    reassignUrl?: string;
  }
): Promise<SendAlertResult> {
  const hasPendingItems = alertData.pendingItemsCount && alertData.pendingItemsCount > 0;

  return sendAdminAlert(
    organizationId,
    "team_member_left",
    hasPendingItems ? "medium" : "low",
    (recipient) => ({
      recipientName: recipient.fullName,
      organizationName: "",
      departedMemberName: alertData.departedMemberName,
      departedMemberEmail: alertData.departedMemberEmail,
      departedMemberRole: alertData.departedMemberRole,
      leftAt: alertData.leftAt,
      reason: alertData.reason,
      pendingItemsCount: alertData.pendingItemsCount,
      actionUrl: alertData.actionUrl,
      reassignUrl: alertData.reassignUrl,
      toEmail: recipient.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=admin_alerts`,
    }),
    {
      title: "Team Member Left",
      message: `${alertData.departedMemberName} departed${hasPendingItems ? ` (${alertData.pendingItemsCount} pending items)` : ""}`,
    }
  );
}

/**
 * Send unusual activity alert
 */
export async function sendUnusualActivityAlert(
  organizationId: string,
  alertData: {
    activityType: "login_anomaly" | "bulk_action" | "data_export" | "permission_change" | "api_abuse" | "unknown";
    description: string;
    userInvolved?: string;
    userEmail?: string;
    ipAddress?: string;
    location?: string;
    detectedAt: string;
    riskLevel: AdminAlertSeverity;
    actionUrl: string;
    securitySettingsUrl: string;
  }
): Promise<SendAlertResult> {
  return sendAdminAlert(
    organizationId,
    "unusual_activity",
    alertData.riskLevel,
    (recipient) => ({
      recipientName: recipient.fullName,
      organizationName: "",
      activityType: alertData.activityType,
      description: alertData.description,
      userInvolved: alertData.userInvolved,
      userEmail: alertData.userEmail,
      ipAddress: alertData.ipAddress,
      location: alertData.location,
      detectedAt: alertData.detectedAt,
      riskLevel: alertData.riskLevel,
      actionUrl: alertData.actionUrl,
      securitySettingsUrl: alertData.securitySettingsUrl,
      toEmail: recipient.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=admin_alerts`,
    }),
    {
      title: "Unusual Activity",
      message: alertData.description.substring(0, 100),
    }
  );
}

/**
 * Send integration disconnected alert
 */
export async function sendIntegrationDisconnectedAlert(
  organizationId: string,
  alertData: {
    integrationName: string;
    disconnectedAt: string;
    reason?: "token_expired" | "revoked" | "api_error" | "rate_limited" | "account_suspended" | "unknown";
    affectedFeatures?: string[];
    reconnectUrl: string;
    integrationsUrl: string;
    actionUrl: string;
  }
): Promise<SendAlertResult> {
  return sendAdminAlert(
    organizationId,
    "integration_disconnected",
    "medium",
    (recipient) => ({
      recipientName: recipient.fullName,
      organizationName: "",
      integrationName: alertData.integrationName,
      disconnectedAt: alertData.disconnectedAt,
      reason: alertData.reason,
      affectedFeatures: alertData.affectedFeatures,
      reconnectUrl: alertData.reconnectUrl,
      integrationsUrl: alertData.integrationsUrl,
      actionUrl: alertData.actionUrl,
      toEmail: recipient.email,
      unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=admin_alerts`,
    }),
    {
      title: "Integration Disconnected",
      message: `${alertData.integrationName} connection lost`,
    }
  );
}
