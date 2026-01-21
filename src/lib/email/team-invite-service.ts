"use server";

/**
 * Team Member Invite Sequence Service
 *
 * Manages the email sequence for invited team members:
 * - Email 1 (Immediate): Initial invitation from inviter
 * - Email 2 (Day 2): Reminder if not accepted
 * - Email 3 (Day 5): Final reminder with urgency
 * - Email 4 (On Accept): Role-specific welcome and quick start
 * - Email 5 (Day 14): Expiration notice
 *
 * Handles:
 * - Starting invite sequences when team members are invited
 * - Processing reminder queue
 * - Sending welcome emails on acceptance
 * - Sending expiration notices
 * - Tracking invite → acceptance → activation funnel
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type { EmailTemplate, TeamInvite4WelcomeEmailData } from "./types";
import {
  getTeamInvite1InitialEmail,
  getTeamInvite2ReminderEmail,
  getTeamInvite3FinalReminderEmail,
  getTeamInvite4WelcomeEmail,
  getTeamInvite5ExpirationEmail,
} from "./team-invite-templates";

// ============================================================================
// Types
// ============================================================================

interface InvitationRecord {
  id: string;
  organization_id: string;
  email: string;
  role: "admin" | "manager" | "loan_officer";
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  reminder_count: number;
  last_reminder_at: string | null;
  expiration_sent: boolean;
}

interface QueueProcessResult {
  processed: number;
  failed: number;
  expired: number;
  errors: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  return !!data;
}

async function logEmail(params: {
  toEmail: string;
  toName?: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  templateName: EmailTemplate;
  organizationId?: string;
  userId?: string;
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

async function getInviterInfo(
  invitedBy: string | null
): Promise<{ name: string; email: string } | null> {
  if (!invitedBy) return null;

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", invitedBy)
    .single();

  if (error || !user) {
    return null;
  }

  return {
    name: user.full_name?.split(" ")[0] || "Your team",
    email: user.email,
  };
}

async function getOrganizationInfo(
  organizationId: string
): Promise<{ name: string; logoUrl?: string } | null> {
  const supabase = createAdminClient();
  const { data: org, error } = await supabase
    .from("organizations")
    .select("name, logo_url")
    .eq("id", organizationId)
    .single();

  if (error || !org) {
    return null;
  }

  return {
    name: org.name,
    logoUrl: org.logo_url || undefined,
  };
}

function buildAcceptUrl(token: string): string {
  return `${emailConfig.baseUrl}/invite/accept?token=${encodeURIComponent(token)}`;
}

function buildUnsubscribeUrl(email: string, organizationId: string): string {
  return `${emailConfig.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&org=${encodeURIComponent(organizationId)}`;
}

// ============================================================================
// Email Sending Functions
// ============================================================================

async function sendTeamInviteEmail(
  invitation: InvitationRecord,
  templateName: EmailTemplate,
  organizationInfo: { name: string; logoUrl?: string },
  inviterInfo: { name: string; email: string } | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = getResendClient();

  // Check unsubscribe status
  if (await isEmailUnsubscribed(invitation.email)) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const inviterName = inviterInfo?.name || "Your organization";
  const expiresAt = new Date(invitation.expires_at);
  const now = new Date();
  const daysUntilExpiration = Math.max(0, daysBetween(expiresAt, now));

  // Build base data
  const baseData = {
    toEmail: invitation.email,
    inviteeName: invitation.email.split("@")[0], // Use email prefix as name
    inviteeEmail: invitation.email,
    inviterName,
    organizationName: organizationInfo.name,
    organizationLogoUrl: organizationInfo.logoUrl,
    role: invitation.role,
    invitationId: invitation.id,
    acceptUrl: buildAcceptUrl(invitation.token),
    unsubscribeUrl: buildUnsubscribeUrl(invitation.email, invitation.organization_id),
    organizationId: invitation.organization_id,
  };

  const reminderData = {
    ...baseData,
    expiresAt: invitation.expires_at,
    daysUntilExpiration,
  };

  let emailContent: { subject: string; html: string };

  switch (templateName) {
    case "team_invite_1_initial":
      emailContent = getTeamInvite1InitialEmail(reminderData);
      break;
    case "team_invite_2_reminder":
      emailContent = getTeamInvite2ReminderEmail(reminderData);
      break;
    case "team_invite_3_final_reminder":
      emailContent = getTeamInvite3FinalReminderEmail(reminderData);
      break;
    case "team_invite_5_expiration":
      emailContent = getTeamInvite5ExpirationEmail({
        ...baseData,
        expiredAt: invitation.expires_at,
        canRequestNewInvite: false,
      });
      break;
    default:
      return { success: false, error: `Unknown template: ${templateName}` };
  }

  try {
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: getFromAddress(organizationInfo.name),
      to: invitation.email,
      subject: emailContent.subject,
      html: emailContent.html,
      tags: [
        { name: "template", value: templateName },
        { name: "organization_id", value: invitation.organization_id },
        { name: "invitation_id", value: invitation.id },
      ],
    });

    if (resendError) {
      await logEmail({
        toEmail: invitation.email,
        fromEmail: emailConfig.defaultFromEmail,
        fromName: organizationInfo.name,
        subject: emailContent.subject,
        templateName,
        organizationId: invitation.organization_id,
        status: "failed",
        errorMessage: resendError.message,
      });
      return { success: false, error: resendError.message };
    }

    await logEmail({
      toEmail: invitation.email,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: organizationInfo.name,
      subject: emailContent.subject,
      templateName,
      organizationId: invitation.organization_id,
      resendMessageId: resendData?.id,
      status: "sent",
    });

    return { success: true, messageId: resendData?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await logEmail({
      toEmail: invitation.email,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: organizationInfo.name,
      subject: emailContent.subject,
      templateName,
      organizationId: invitation.organization_id,
      status: "failed",
      errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Main Service Functions
// ============================================================================

/**
 * Send the initial invitation email when a team member is invited
 */
export async function sendTeamInviteInitialEmail(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get invitation data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitation, error: inviteError } = await (supabase as any)
    .from("organization_invitations")
    .select("*")
    .eq("id", invitationId)
    .is("accepted_at", null)
    .single();

  if (inviteError || !invitation) {
    return {
      success: false,
      error: `Invitation not found: ${inviteError?.message || "Unknown error"}`,
    };
  }

  // Get organization info
  const orgInfo = await getOrganizationInfo(invitation.organization_id);
  if (!orgInfo) {
    return { success: false, error: "Organization not found" };
  }

  // Get inviter info
  const inviterInfo = await getInviterInfo(invitation.invited_by);

  // Send the initial email
  const result = await sendTeamInviteEmail(
    invitation as InvitationRecord,
    "team_invite_1_initial",
    orgInfo,
    inviterInfo
  );

  if (result.success) {
    // Update reminder count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organization_invitations")
      .update({
        reminder_count: 1,
        last_reminder_at: new Date().toISOString(),
      })
      .eq("id", invitationId);
  }

  return result;
}

/**
 * Send the welcome email when an invitation is accepted
 */
export async function sendTeamInviteWelcomeEmail(
  invitationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get invitation data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitation, error: inviteError } = await (supabase as any)
    .from("organization_invitations")
    .select("*")
    .eq("id", invitationId)
    .single();

  if (inviteError || !invitation) {
    return {
      success: false,
      error: `Invitation not found: ${inviteError?.message || "Unknown error"}`,
    };
  }

  // Get user data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, error: userError } = await (supabase as any)
    .from("users")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return { success: false, error: "User not found" };
  }

  // Get organization info
  const orgInfo = await getOrganizationInfo(invitation.organization_id);
  if (!orgInfo) {
    return { success: false, error: "Organization not found" };
  }

  // Get inviter info
  const inviterInfo = await getInviterInfo(invitation.invited_by);

  // Check unsubscribe
  if (await isEmailUnsubscribed(user.email)) {
    return { success: false, error: "Email is unsubscribed" };
  }

  // Build welcome email data
  const baseUrl = emailConfig.baseUrl;
  const dashboardUrl = `${baseUrl}/dashboard`;
  const profileUrl = `${baseUrl}/dashboard/settings/profile`;

  const data: TeamInvite4WelcomeEmailData = {
    toEmail: user.email,
    inviteeName: user.full_name?.split(" ")[0] || user.email.split("@")[0],
    inviteeEmail: user.email,
    inviterName: inviterInfo?.name || "Your organization",
    organizationName: orgInfo.name,
    organizationLogoUrl: orgInfo.logoUrl,
    role: invitation.role as "admin" | "manager" | "loan_officer",
    invitationId: invitation.id,
    acceptUrl: buildAcceptUrl(invitation.token),
    unsubscribeUrl: buildUnsubscribeUrl(user.email, invitation.organization_id),
    organizationId: invitation.organization_id,
    dashboardUrl,
    profileUrl,
    // Role-specific URLs
    reviewsUrl:
      invitation.role === "loan_officer"
        ? `${baseUrl}/dashboard/reviews`
        : undefined,
    leaderboardUrl:
      invitation.role === "loan_officer"
        ? `${baseUrl}/dashboard/leaderboard`
        : undefined,
    teamAnalyticsUrl:
      invitation.role === "manager"
        ? `${baseUrl}/dashboard/analytics/team`
        : undefined,
    teamManagementUrl:
      invitation.role === "manager"
        ? `${baseUrl}/dashboard/settings/team`
        : undefined,
  };

  const emailContent = getTeamInvite4WelcomeEmail(data);

  try {
    const resend = getResendClient();
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: getFromAddress(orgInfo.name),
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      tags: [
        { name: "template", value: "team_invite_4_welcome" },
        { name: "organization_id", value: invitation.organization_id },
        { name: "user_id", value: userId },
      ],
    });

    if (resendError) {
      await logEmail({
        toEmail: user.email,
        fromEmail: emailConfig.defaultFromEmail,
        fromName: orgInfo.name,
        subject: emailContent.subject,
        templateName: "team_invite_4_welcome",
        organizationId: invitation.organization_id,
        userId,
        status: "failed",
        errorMessage: resendError.message,
      });
      return { success: false, error: resendError.message };
    }

    await logEmail({
      toEmail: user.email,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: orgInfo.name,
      subject: emailContent.subject,
      templateName: "team_invite_4_welcome",
      organizationId: invitation.organization_id,
      userId,
      resendMessageId: resendData?.id,
      status: "sent",
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Process the team invite reminder queue
 * Called by cron job every hour
 */
export async function processTeamInviteQueue(
  batchSize: number = 50
): Promise<QueueProcessResult> {
  const supabase = createAdminClient();
  const result: QueueProcessResult = {
    processed: 0,
    failed: 0,
    expired: 0,
    errors: [],
  };

  const now = new Date();

  // Get pending invitations that haven't been accepted
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitations, error } = await (supabase as any)
    .from("organization_invitations")
    .select("*")
    .is("accepted_at", null)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    result.errors.push(`Failed to fetch invitations: ${error.message}`);
    return result;
  }

  if (!invitations || invitations.length === 0) {
    return result;
  }

  for (const invitation of invitations as InvitationRecord[]) {
    const createdAt = new Date(invitation.created_at);
    const expiresAt = new Date(invitation.expires_at);
    const daysSinceCreation = daysBetween(now, createdAt);
    const isExpired = now > expiresAt;

    // Handle expired invitations
    if (isExpired) {
      if (!invitation.expiration_sent) {
        // Send expiration notice
        const orgInfo = await getOrganizationInfo(invitation.organization_id);
        const inviterInfo = await getInviterInfo(invitation.invited_by);

        if (orgInfo) {
          const sendResult = await sendTeamInviteEmail(
            invitation,
            "team_invite_5_expiration",
            orgInfo,
            inviterInfo
          );

          if (sendResult.success) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from("organization_invitations")
              .update({ expiration_sent: true })
              .eq("id", invitation.id);
            result.expired++;
          } else {
            result.failed++;
            result.errors.push(
              `Failed to send expiration email for ${invitation.id}: ${sendResult.error}`
            );
          }
        }
      }
      continue;
    }

    // Determine which reminder to send based on days since creation
    let templateToSend: EmailTemplate | null = null;
    let expectedReminderCount = 0;

    // Day 2 reminder (reminder_count should be 1 after initial)
    if (daysSinceCreation >= 2 && invitation.reminder_count < 2) {
      templateToSend = "team_invite_2_reminder";
      expectedReminderCount = 2;
    }
    // Day 5 reminder (reminder_count should be 2 after first reminder)
    else if (daysSinceCreation >= 5 && invitation.reminder_count < 3) {
      templateToSend = "team_invite_3_final_reminder";
      expectedReminderCount = 3;
    }

    if (templateToSend) {
      const orgInfo = await getOrganizationInfo(invitation.organization_id);
      const inviterInfo = await getInviterInfo(invitation.invited_by);

      if (orgInfo) {
        const sendResult = await sendTeamInviteEmail(
          invitation,
          templateToSend,
          orgInfo,
          inviterInfo
        );

        if (sendResult.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("organization_invitations")
            .update({
              reminder_count: expectedReminderCount,
              last_reminder_at: now.toISOString(),
            })
            .eq("id", invitation.id);
          result.processed++;
        } else {
          result.failed++;
          result.errors.push(
            `Failed to send ${templateToSend} for ${invitation.id}: ${sendResult.error}`
          );
        }
      }
    }
  }

  return result;
}

/**
 * Get invite funnel statistics for an organization
 */
export async function getInviteFunnelStats(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalInvites: number;
  pending: number;
  accepted: number;
  expired: number;
  acceptanceRate: number;
}> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("organization_invitations")
    .select("id, accepted_at, expires_at, created_at")
    .eq("organization_id", organizationId);

  if (startDate) {
    query = query.gte("created_at", startDate.toISOString());
  }
  if (endDate) {
    query = query.lte("created_at", endDate.toISOString());
  }

  const { data: invitations, error } = await query;

  if (error || !invitations) {
    return {
      totalInvites: 0,
      pending: 0,
      accepted: 0,
      expired: 0,
      acceptanceRate: 0,
    };
  }

  const now = new Date();
  let pending = 0;
  let accepted = 0;
  let expired = 0;

  for (const inv of invitations) {
    if (inv.accepted_at) {
      accepted++;
    } else if (new Date(inv.expires_at) < now) {
      expired++;
    } else {
      pending++;
    }
  }

  const totalInvites = invitations.length;
  const acceptanceRate =
    totalInvites > 0 ? Math.round((accepted / totalInvites) * 100) : 0;

  return {
    totalInvites,
    pending,
    accepted,
    expired,
    acceptanceRate,
  };
}

/**
 * Resend an invitation email (for pending invitations)
 */
export async function resendTeamInvite(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get invitation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: invitation, error: inviteError } = await (supabase as any)
    .from("organization_invitations")
    .select("*")
    .eq("id", invitationId)
    .is("accepted_at", null)
    .single();

  if (inviteError || !invitation) {
    return { success: false, error: "Invitation not found or already accepted" };
  }

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return { success: false, error: "Invitation has expired" };
  }

  // Get org and inviter info
  const orgInfo = await getOrganizationInfo(invitation.organization_id);
  if (!orgInfo) {
    return { success: false, error: "Organization not found" };
  }

  const inviterInfo = await getInviterInfo(invitation.invited_by);

  // Send the initial email again
  const result = await sendTeamInviteEmail(
    invitation as InvitationRecord,
    "team_invite_1_initial",
    orgInfo,
    inviterInfo
  );

  if (result.success) {
    // Update last reminder timestamp but don't increment count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("organization_invitations")
      .update({ last_reminder_at: new Date().toISOString() })
      .eq("id", invitationId);
  }

  return result;
}
