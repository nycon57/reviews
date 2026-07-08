/**
 * Weekly Summary Email Service (S082)
 *
 * Service for sending weekly performance summary emails to loan officers and managers.
 */

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { getResendClient, emailConfig, getFromAddress } from "../client";
import {
  renderWeeklySummaryLOEmail,
  renderWeeklySummaryManagerEmail,
} from "../templates/index";
import {
  fetchWeeklyLOMetrics,
  hasWeeklyActivity,
  fetchWeeklyTeamMetrics,
  hasTeamWeeklyActivity,
} from "../queries";
import type {
  WeeklySummaryLOEmailData,
  WeeklySummaryManagerEmailData,
  WeeklySummaryEmailPreferences,
  EmailTemplate,
} from "../types";

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
  loanOfficerId?: string;
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
      user_id: params.loanOfficerId,
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

interface SendWeeklySummaryResult {
  success: boolean;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * Default weekly summary preferences
 */
const DEFAULT_WEEKLY_PREFERENCES: WeeklySummaryEmailPreferences = {
  enabled: true,
  sendDay: "monday",
  sendHour: 8,
  skipIfNoActivity: true,
};

/**
 * Get users who should receive weekly summary emails
 */
async function getUsersForWeeklySummary(
  role: "user" | "manager"
): Promise<
  Array<{
    userId: string;
    email: string;
    fullName: string;
    organizationId: string;
    preferences: WeeklySummaryEmailPreferences;
  }>
> {
  const supabase = createUntypedAdminClient();

  // Get users with the specified role who are active
  const { data: users, error } = await supabase
    .from("users")
    .select(
      "id, email, full_name, organization_id, notification_preferences"
    )
    .eq("role", role)
    .eq("is_active", true)
    .not("email", "is", null);

  if (error || !users) {
    console.error("Error fetching users for weekly summary:", error);
    return [];
  }

  return users.map((user) => {
    // Extract weekly summary preferences from notification_preferences JSON
    const notifPrefs = user.notification_preferences as Record<string, unknown> | null;
    const weeklyPrefs = notifPrefs?.weekly_summary as Partial<WeeklySummaryEmailPreferences> | undefined;

    return {
      userId: user.id as string,
      email: user.email as string,
      fullName: user.full_name as string,
      organizationId: user.organization_id as string,
      preferences: {
        ...DEFAULT_WEEKLY_PREFERENCES,
        ...weeklyPrefs,
      },
    };
  });
}

/**
 * Check if it's the right time to send weekly summary based on preferences
 * Note: Currently unused but kept for hourly cron job implementation
 */
function _shouldSendNow(preferences: WeeklySummaryEmailPreferences): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDay = dayMap[preferences.sendDay];
  const targetHour = preferences.sendHour;

  // Check if it's the right day and within the hour window
  return dayOfWeek === targetDay && hour === targetHour;
}

/**
 * Send weekly summary emails to all loan officers
 */
export async function sendWeeklyLOSummaries(): Promise<SendWeeklySummaryResult> {
  const result: SendWeeklySummaryResult = {
    success: true,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const resend = getResendClient();
    const users = await getUsersForWeeklySummary("user");

    for (const user of users) {
      try {
        // Check if enabled
        if (!user.preferences.enabled) {
          result.skipped++;
          continue;
        }

        // Check if email is unsubscribed
        const unsubscribed = await isEmailUnsubscribed(user.email);
        if (unsubscribed) {
          result.skipped++;
          continue;
        }

        // Check if should send now (for scheduled runs)
        // Skip this check if running manually or as a weekly batch
        // Uncomment for hourly cron: if (!shouldSendNow(user.preferences)) { result.skipped++; continue; }

        // Check for activity if skip option is enabled
        if (user.preferences.skipIfNoActivity) {
          const hasActivity = await hasWeeklyActivity(user.userId);
          if (!hasActivity) {
            result.skipped++;
            continue;
          }
        }

        // Fetch metrics
        const metricsResult = await fetchWeeklyLOMetrics(
          user.userId,
          user.organizationId
        );

        if (!metricsResult.success || !metricsResult.data) {
          result.errors.push(
            `Failed to fetch metrics for user ${user.userId}: ${metricsResult.error}`
          );
          result.failed++;
          continue;
        }

        // Build email data
        const emailData: WeeklySummaryLOEmailData = {
          ...metricsResult.data,
          toEmail: user.email,
          toName: user.fullName,
          dashboardUrl: `${emailConfig.baseUrl}/dashboard`,
          unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}&type=weekly_summary`,
        };

        // Render and send operational weekly summary; leave direct because it is not A/B material.
        const { subject, html } = await renderWeeklySummaryLOEmail(emailData);
        const fromAddress = getFromAddress();

        const { data: sendData, error: sendError } = await resend.emails.send({
          from: fromAddress,
          to: user.email,
          subject,
          html,
          tags: [
            { name: "template", value: "weekly_summary_lo" },
            { name: "organization_id", value: user.organizationId },
            { name: "user_id", value: user.userId },
          ],
        });

        if (sendError) {
          await logEmail({
            toEmail: user.email,
            toName: user.fullName,
            fromEmail: emailConfig.defaultFromEmail,
            subject,
            templateName: "weekly_summary_lo",
            organizationId: user.organizationId,
            loanOfficerId: user.userId,
            status: "failed",
            errorMessage: sendError.message,
          });
          result.errors.push(
            `Failed to send to ${user.email}: ${sendError.message}`
          );
          result.failed++;
          continue;
        }

        await logEmail({
          toEmail: user.email,
          toName: user.fullName,
          fromEmail: emailConfig.defaultFromEmail,
          subject,
          templateName: "weekly_summary_lo",
          organizationId: user.organizationId,
          loanOfficerId: user.userId,
          resendMessageId: sendData?.id,
          status: "sent",
        });

        result.sent++;
      } catch (userError) {
        result.errors.push(
          `Error processing user ${user.userId}: ${userError instanceof Error ? userError.message : "Unknown error"}`
        );
        result.failed++;
      }
    }

    return result;
  } catch (error) {
    console.error("Error sending weekly LO summaries:", error);
    return {
      success: false,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      errors: [
        ...result.errors,
        error instanceof Error ? error.message : "Unknown error",
      ],
    };
  }
}

/**
 * Send weekly summary emails to all managers
 */
export async function sendWeeklyManagerSummaries(): Promise<SendWeeklySummaryResult> {
  const result: SendWeeklySummaryResult = {
    success: true,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const resend = getResendClient();
    const users = await getUsersForWeeklySummary("manager");

    for (const user of users) {
      try {
        // Check if enabled
        if (!user.preferences.enabled) {
          result.skipped++;
          continue;
        }

        // Check if email is unsubscribed
        const unsubscribed = await isEmailUnsubscribed(user.email);
        if (unsubscribed) {
          result.skipped++;
          continue;
        }

        // Check for team activity if skip option is enabled
        if (user.preferences.skipIfNoActivity) {
          const hasActivity = await hasTeamWeeklyActivity(user.organizationId);
          if (!hasActivity) {
            result.skipped++;
            continue;
          }
        }

        // Fetch team metrics
        const metricsResult = await fetchWeeklyTeamMetrics(
          user.userId,
          user.organizationId
        );

        if (!metricsResult.success || !metricsResult.data) {
          result.errors.push(
            `Failed to fetch team metrics for manager ${user.userId}: ${metricsResult.error}`
          );
          result.failed++;
          continue;
        }

        // Build email data
        const emailData: WeeklySummaryManagerEmailData = {
          ...metricsResult.data,
          toEmail: user.email,
          toName: user.fullName,
          dashboardUrl: `${emailConfig.baseUrl}/dashboard`,
          unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}&type=weekly_summary`,
        };

        // Render and send operational weekly summary; leave direct because it is not A/B material.
        const { subject, html } =
          await renderWeeklySummaryManagerEmail(emailData);
        const fromAddress = getFromAddress();

        const { data: sendData, error: sendError } = await resend.emails.send({
          from: fromAddress,
          to: user.email,
          subject,
          html,
          tags: [
            { name: "template", value: "weekly_summary_manager" },
            { name: "organization_id", value: user.organizationId },
          ],
        });

        if (sendError) {
          await logEmail({
            toEmail: user.email,
            toName: user.fullName,
            fromEmail: emailConfig.defaultFromEmail,
            subject,
            templateName: "weekly_summary_manager",
            organizationId: user.organizationId,
            status: "failed",
            errorMessage: sendError.message,
          });
          result.errors.push(
            `Failed to send to ${user.email}: ${sendError.message}`
          );
          result.failed++;
          continue;
        }

        await logEmail({
          toEmail: user.email,
          toName: user.fullName,
          fromEmail: emailConfig.defaultFromEmail,
          subject,
          templateName: "weekly_summary_manager",
          organizationId: user.organizationId,
          resendMessageId: sendData?.id,
          status: "sent",
        });

        result.sent++;
      } catch (userError) {
        result.errors.push(
          `Error processing manager ${user.userId}: ${userError instanceof Error ? userError.message : "Unknown error"}`
        );
        result.failed++;
      }
    }

    return result;
  } catch (error) {
    console.error("Error sending weekly manager summaries:", error);
    return {
      success: false,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      errors: [
        ...result.errors,
        error instanceof Error ? error.message : "Unknown error",
      ],
    };
  }
}

/**
 * Send all weekly summary emails (both user and manager)
 */
export async function sendAllWeeklySummaries(): Promise<{
  user: SendWeeklySummaryResult;
  manager: SendWeeklySummaryResult;
}> {
  const [userResult, managerResult] = await Promise.all([
    sendWeeklyLOSummaries(),
    sendWeeklyManagerSummaries(),
  ]);

  return {
    user: userResult,
    manager: managerResult,
  };
}

/**
 * Send a test weekly summary email to a specific user
 */
export async function sendTestWeeklySummary(
  userId: string,
  type: "lo" | "manager"
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createUntypedAdminClient();
    const resend = getResendClient();

    // Get user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, organization_id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return { success: false, error: "User not found" };
    }

    if (type === "lo") {
      const metricsResult = await fetchWeeklyLOMetrics(
        user.id as string,
        user.organization_id as string
      );

      if (!metricsResult.success || !metricsResult.data) {
        return {
          success: false,
          error: metricsResult.error || "Failed to fetch metrics",
        };
      }

      const emailData: WeeklySummaryLOEmailData = {
        ...metricsResult.data,
        toEmail: user.email as string,
        toName: user.full_name as string,
        dashboardUrl: `${emailConfig.baseUrl}/dashboard`,
        unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email as string)}&type=weekly_summary`,
      };

      const { subject, html } = await renderWeeklySummaryLOEmail(emailData);

      // Operational/test weekly summary send; leave direct because it is not A/B material.
      const { error: sendError } = await resend.emails.send({
        from: getFromAddress(),
        to: user.email as string,
        subject: `[TEST] ${subject}`,
        html,
      });

      if (sendError) {
        return { success: false, error: sendError.message };
      }
    } else {
      const metricsResult = await fetchWeeklyTeamMetrics(
        user.id as string,
        user.organization_id as string
      );

      if (!metricsResult.success || !metricsResult.data) {
        return {
          success: false,
          error: metricsResult.error || "Failed to fetch team metrics",
        };
      }

      const emailData: WeeklySummaryManagerEmailData = {
        ...metricsResult.data,
        toEmail: user.email as string,
        toName: user.full_name as string,
        dashboardUrl: `${emailConfig.baseUrl}/dashboard`,
        unsubscribeUrl: `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email as string)}&type=weekly_summary`,
      };

      const { subject, html } =
        await renderWeeklySummaryManagerEmail(emailData);

      // Operational/test weekly summary send; leave direct because it is not A/B material.
      const { error: sendError } = await resend.emails.send({
        from: getFromAddress(),
        to: user.email as string,
        subject: `[TEST] ${subject}`,
        html,
      });

      if (sendError) {
        return { success: false, error: sendError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending test weekly summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
