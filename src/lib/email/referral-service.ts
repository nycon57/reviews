"use server";

/**
 * Referral Program Email Service
 *
 * Sends referral program emails:
 * - Referral invite (sent to friends by referrer)
 * - Friend signed up notification (to referrer)
 * - Friend converted notification (to referrer when friend upgrades)
 * - Reward earned notification (to referrer when reward available)
 * - Referral reminder (to inactive referrers)
 * - Leaderboard update (to top referrers)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type {
  EmailTemplate,
  ReferralInviteEmailData,
  ReferralFriendSignedUpEmailData,
  ReferralFriendConvertedEmailData,
  ReferralRewardEarnedEmailData,
  ReferralReminderEmailData,
  ReferralLeaderboardEmailData,
} from "./types";
import {
  getReferralInviteEmail,
  getReferralInviteSubject,
  getReferralFriendSignedUpEmail,
  getReferralFriendSignedUpSubject,
  getReferralFriendConvertedEmail,
  getReferralFriendConvertedSubject,
  getReferralRewardEarnedEmail,
  getReferralRewardEarnedSubject,
  getReferralReminderEmail,
  getReferralReminderSubject,
  getReferralLeaderboardEmail,
  getReferralLeaderboardSubject,
} from "./referral-templates";

// ============================================================================
// Types
// ============================================================================

interface SendEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

interface ReferralTrackingData {
  referralId?: string;
  referrerId: string;
  referralCode: string;
  recipientEmail?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

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
  metadata?: Record<string, unknown>;
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
      metadata: params.metadata,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log email:", error);
    return null;
  }

  return data.id;
}

function generateReferralLink(baseUrl: string, referralCode: string): string {
  return `${baseUrl}/signup?ref=${encodeURIComponent(referralCode)}`;
}

function generateSocialShareLinks(
  referralLink: string,
  message: string
): {
  linkedin?: string;
  twitter?: string;
  whatsapp?: string;
  facebook?: string;
} {
  const encodedLink = encodeURIComponent(referralLink);
  const encodedMessage = encodeURIComponent(message);

  return {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedLink}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedLink}`,
    whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedLink}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`,
  };
}

// ============================================================================
// Send Functions
// ============================================================================

/**
 * Send a referral invite email to a friend
 */
export async function sendReferralInviteEmail(
  data: ReferralInviteEmailData,
  tracking?: ReferralTrackingData
): Promise<SendEmailResult> {
  // Check if recipient has unsubscribed
  const unsubscribed = await isEmailUnsubscribed(data.recipientEmail);
  if (unsubscribed) {
    return { success: false, error: "Recipient has unsubscribed from emails" };
  }

  const resend = getResendClient();
  const subject = getReferralInviteSubject(data);

  try {
    const html = await getReferralInviteEmail(data);

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: data.recipientEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "referral_invite" },
        { name: "referrer_id", value: tracking?.referrerId || "" },
        { name: "referral_code", value: tracking?.referralCode || data.referralCode },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(tracking?.referralId
          ? [{ name: "referral_id", value: tracking.referralId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.recipientEmail,
        toName: data.recipientName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "referral_invite",
        organizationId: data.organizationId,
        status: "failed",
        errorMessage: response.error.message,
        metadata: { referralCode: data.referralCode, referrerId: tracking?.referrerId },
      });

      return { success: false, error: response.error.message };
    }

    const emailId = await logEmail({
      toEmail: data.recipientEmail,
      toName: data.recipientName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_invite",
      organizationId: data.organizationId,
      resendMessageId: response.data?.id,
      status: "sent",
      metadata: { referralCode: data.referralCode, referrerId: tracking?.referrerId },
    });

    return { success: true, emailId: emailId || response.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.recipientEmail,
      toName: data.recipientName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_invite",
      organizationId: data.organizationId,
      status: "failed",
      errorMessage,
      metadata: { referralCode: data.referralCode, referrerId: tracking?.referrerId },
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Send notification to referrer when their friend signs up
 */
export async function sendReferralFriendSignedUpEmail(
  data: ReferralFriendSignedUpEmailData,
  tracking?: ReferralTrackingData
): Promise<SendEmailResult> {
  // Check if referrer has unsubscribed
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Referrer has unsubscribed from emails" };
  }

  const resend = getResendClient();
  const subject = getReferralFriendSignedUpSubject(data);

  try {
    const html = await getReferralFriendSignedUpEmail(data);

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "referral_friend_signed_up" },
        { name: "referrer_id", value: tracking?.referrerId || "" },
        { name: "referral_code", value: tracking?.referralCode || "" },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.referrerFullName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "referral_friend_signed_up",
        organizationId: data.organizationId,
        userId: tracking?.referrerId,
        status: "failed",
        errorMessage: response.error.message,
        metadata: { friendName: data.friendName, friendEmail: data.friendEmail },
      });

      return { success: false, error: response.error.message };
    }

    const emailId = await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_friend_signed_up",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      resendMessageId: response.data?.id,
      status: "sent",
      metadata: { friendName: data.friendName, friendEmail: data.friendEmail },
    });

    return { success: true, emailId: emailId || response.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_friend_signed_up",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      status: "failed",
      errorMessage,
      metadata: { friendName: data.friendName, friendEmail: data.friendEmail },
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Send notification to referrer when their friend converts to paid
 */
export async function sendReferralFriendConvertedEmail(
  data: ReferralFriendConvertedEmailData,
  tracking?: ReferralTrackingData
): Promise<SendEmailResult> {
  // Check if referrer has unsubscribed
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Referrer has unsubscribed from emails" };
  }

  const resend = getResendClient();
  const subject = getReferralFriendConvertedSubject(data);

  try {
    const html = await getReferralFriendConvertedEmail(data);

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "referral_friend_converted" },
        { name: "referrer_id", value: tracking?.referrerId || "" },
        { name: "referral_code", value: tracking?.referralCode || "" },
        { name: "reward_earned", value: data.rewardEarned },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.referrerFullName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "referral_friend_converted",
        organizationId: data.organizationId,
        userId: tracking?.referrerId,
        status: "failed",
        errorMessage: response.error.message,
        metadata: {
          friendName: data.friendName,
          friendPlanName: data.friendPlanName,
          rewardEarned: data.rewardEarned,
        },
      });

      return { success: false, error: response.error.message };
    }

    const emailId = await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_friend_converted",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      resendMessageId: response.data?.id,
      status: "sent",
      metadata: {
        friendName: data.friendName,
        friendPlanName: data.friendPlanName,
        rewardEarned: data.rewardEarned,
      },
    });

    return { success: true, emailId: emailId || response.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_friend_converted",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      status: "failed",
      errorMessage,
      metadata: {
        friendName: data.friendName,
        friendPlanName: data.friendPlanName,
        rewardEarned: data.rewardEarned,
      },
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Send notification when referral reward is ready to claim
 */
export async function sendReferralRewardEarnedEmail(
  data: ReferralRewardEarnedEmailData,
  tracking?: ReferralTrackingData
): Promise<SendEmailResult> {
  // Check if referrer has unsubscribed
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Referrer has unsubscribed from emails" };
  }

  const resend = getResendClient();
  const subject = getReferralRewardEarnedSubject(data);

  try {
    const html = await getReferralRewardEarnedEmail(data);

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "referral_reward_earned" },
        { name: "referrer_id", value: tracking?.referrerId || "" },
        { name: "reward_type", value: data.rewardType },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.referrerFullName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "referral_reward_earned",
        organizationId: data.organizationId,
        userId: tracking?.referrerId,
        status: "failed",
        errorMessage: response.error.message,
        metadata: {
          rewardType: data.rewardType,
          rewardDescription: data.rewardDescription,
        },
      });

      return { success: false, error: response.error.message };
    }

    const emailId = await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_reward_earned",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      resendMessageId: response.data?.id,
      status: "sent",
      metadata: {
        rewardType: data.rewardType,
        rewardDescription: data.rewardDescription,
      },
    });

    return { success: true, emailId: emailId || response.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_reward_earned",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      status: "failed",
      errorMessage,
      metadata: {
        rewardType: data.rewardType,
        rewardDescription: data.rewardDescription,
      },
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Send referral reminder to inactive referrers
 */
export async function sendReferralReminderEmail(
  data: ReferralReminderEmailData,
  tracking?: ReferralTrackingData
): Promise<SendEmailResult> {
  // Check if user has unsubscribed
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "User has unsubscribed from emails" };
  }

  const resend = getResendClient();
  const subject = getReferralReminderSubject(data);

  try {
    const html = await getReferralReminderEmail(data);

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "referral_reminder" },
        { name: "referrer_id", value: tracking?.referrerId || "" },
        { name: "days_since_last_referral", value: String(data.daysSinceLastReferral) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.referrerFullName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "referral_reminder",
        organizationId: data.organizationId,
        userId: tracking?.referrerId,
        status: "failed",
        errorMessage: response.error.message,
        metadata: {
          daysSinceLastReferral: data.daysSinceLastReferral,
          totalReferrals: data.totalReferrals,
        },
      });

      return { success: false, error: response.error.message };
    }

    const emailId = await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_reminder",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      resendMessageId: response.data?.id,
      status: "sent",
      metadata: {
        daysSinceLastReferral: data.daysSinceLastReferral,
        totalReferrals: data.totalReferrals,
      },
    });

    return { success: true, emailId: emailId || response.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_reminder",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      status: "failed",
      errorMessage,
      metadata: {
        daysSinceLastReferral: data.daysSinceLastReferral,
        totalReferrals: data.totalReferrals,
      },
    });

    return { success: false, error: errorMessage };
  }
}

/**
 * Send leaderboard update to top referrers
 */
export async function sendReferralLeaderboardEmail(
  data: ReferralLeaderboardEmailData,
  tracking?: ReferralTrackingData
): Promise<SendEmailResult> {
  // Check if user has unsubscribed
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "User has unsubscribed from emails" };
  }

  const resend = getResendClient();
  const subject = getReferralLeaderboardSubject(data);

  try {
    const html = await getReferralLeaderboardEmail(data);

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "referral_leaderboard" },
        { name: "referrer_id", value: tracking?.referrerId || "" },
        { name: "user_rank", value: String(data.userRank) },
        { name: "leaderboard_period", value: data.leaderboardPeriod },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.referrerFullName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "referral_leaderboard",
        organizationId: data.organizationId,
        userId: tracking?.referrerId,
        status: "failed",
        errorMessage: response.error.message,
        metadata: {
          userRank: data.userRank,
          leaderboardPeriod: data.leaderboardPeriod,
          totalReferrals: data.userReferrals,
        },
      });

      return { success: false, error: response.error.message };
    }

    const emailId = await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_leaderboard",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      resendMessageId: response.data?.id,
      status: "sent",
      metadata: {
        userRank: data.userRank,
        leaderboardPeriod: data.leaderboardPeriod,
        totalReferrals: data.userReferrals,
      },
    });

    return { success: true, emailId: emailId || response.data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.referrerFullName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "referral_leaderboard",
      organizationId: data.organizationId,
      userId: tracking?.referrerId,
      status: "failed",
      errorMessage,
      metadata: {
        userRank: data.userRank,
        leaderboardPeriod: data.leaderboardPeriod,
        totalReferrals: data.userReferrals,
      },
    });

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Batch / Cron Functions
// ============================================================================

/**
 * Find inactive referrers and send reminder emails
 * Called by cron job (e.g., weekly)
 */
export async function processReferralReminders(
  daysInactiveThreshold: number = 30,
  batchSize: number = 50
): Promise<{
  processed: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const result = {
    processed: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  const baseUrl = emailConfig.baseUrl;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactiveThreshold);

  // TODO(S094): Implement proper inactive referrer filtering
  // The query below is incomplete - it needs to:
  // 1. Join with referrals table to find users who have made referrals
  // 2. Filter where last referral date < cutoffDate
  // 3. Exclude users who have already received a reminder recently
  //
  // Example of what the query should look like:
  // .from("referrals")
  // .select("referrer_user_id, max(created_at) as last_referral")
  // .lt("max_created_at", cutoffDate.toISOString())
  // .group("referrer_user_id")
  //
  // Find users who:
  // 1. Have made at least one referral
  // 2. Haven't made a referral in X days
  // 3. Want to receive notifications
  const { data: inactiveReferrers, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      organization_id,
      receive_notifications,
      organizations!inner(name)
    `)
    .eq("is_active", true)
    .eq("receive_notifications", true)
    .limit(batchSize);

  if (error) {
    result.errors.push(`Failed to fetch inactive referrers: ${error.message}`);
    return result;
  }

  if (!inactiveReferrers || inactiveReferrers.length === 0) {
    return result;
  }

  for (const user of inactiveReferrers) {
    try {
      // Check if user has unsubscribed
      const unsubscribed = await isEmailUnsubscribed(user.email);
      if (unsubscribed) {
        result.skipped++;
        continue;
      }

      const org = user.organizations as { name: string };
      const firstName = user.full_name?.split(" ")[0] || "there";

      // TODO(S094): Generate referral code from actual referrals table
      // This is a placeholder - real implementation needs to fetch user's actual referral code
      const referralCode = `REF-${user.id.substring(0, 8).toUpperCase()}`;
      const referralLink = generateReferralLink(baseUrl, referralCode);

      const socialMessage = `I've been using Repwell for reputation management and I think you'd love it too. Sign up with my link to get started!`;
      const socialShareLinks = generateSocialShareLinks(referralLink, socialMessage);

      const data: ReferralReminderEmailData = {
        toEmail: user.email,
        toName: user.full_name || undefined,
        referrerFirstName: firstName,
        referrerFullName: user.full_name || firstName,
        referrerEmail: user.email,
        organizationName: org.name,
        organizationId: user.organization_id || undefined,
        referralLink,
        referralCode,
        dashboardUrl: `${baseUrl}/dashboard`,
        referralProgramUrl: `${baseUrl}/dashboard/referrals`,
        unsubscribeUrl: `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`,
        daysSinceLastReferral: daysInactiveThreshold,
        // TODO(S094): Fetch actual referral stats from referrals table
        // These are placeholder values - real implementation needs database queries
        totalReferrals: 0,
        pendingRewards: 0,
        potentialEarnings: "$50",
        rewardPerReferral: "$25",
        socialShareLinks,
        socialMessages: {
          linkedin: socialMessage,
          twitter: socialMessage,
        },
      };

      const sendResult = await sendReferralReminderEmail(data, {
        referrerId: user.id,
        referralCode,
      });

      if (sendResult.success) {
        result.processed++;
      } else {
        result.failed++;
        result.errors.push(`User ${user.id}: ${sendResult.error}`);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `User ${user.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

/**
 * Send leaderboard update emails to top referrers
 * Called by cron job (e.g., weekly or monthly)
 */
export async function processLeaderboardUpdates(
  period: "weekly" | "monthly" | "all_time" = "monthly",
  topN: number = 20
): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const supabase = createAdminClient();
  const result = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  const baseUrl = emailConfig.baseUrl;

  // Fetch top referrers for the period
  // This assumes a leaderboard view or function exists
  const { data: topReferrers, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      full_name,
      organization_id,
      receive_notifications,
      organizations!inner(name)
    `)
    .eq("is_active", true)
    .eq("receive_notifications", true)
    .limit(topN);

  if (error) {
    result.errors.push(`Failed to fetch top referrers: ${error.message}`);
    return result;
  }

  if (!topReferrers || topReferrers.length === 0) {
    return result;
  }

  // TODO(S094): Build leaderboard entries from actual referral tracking data
  // This is mock data - real implementation needs to:
  // 1. Query actual referral counts per user from referrals table
  // 2. Sort by referral count to get actual rankings
  // 3. Include only users with at least one referral
  const leaderboardEntries = topReferrers.map((user, index) => ({
    rank: index + 1,
    name: user.full_name || "Anonymous",
    referrals: Math.max(10 - index, 1),
    isCurrentUser: false,
  }));

  for (let i = 0; i < topReferrers.length; i++) {
    const user = topReferrers[i];

    try {
      // Check if user has unsubscribed
      const unsubscribed = await isEmailUnsubscribed(user.email);
      if (unsubscribed) {
        continue;
      }

      const org = user.organizations as { name: string };
      const firstName = user.full_name?.split(" ")[0] || "there";
      const referralCode = `REF-${user.id.substring(0, 8).toUpperCase()}`;
      const referralLink = generateReferralLink(baseUrl, referralCode);

      // Mark current user in leaderboard
      const personalizedLeaderboard = leaderboardEntries.map((entry, idx) => ({
        ...entry,
        isCurrentUser: idx === i,
      }));

      // Calculate period dates
      const now = new Date();
      const periodStartDate = new Date(now);
      const periodEndDate = new Date(now);
      if (period === "weekly") {
        periodStartDate.setDate(now.getDate() - now.getDay()); // Start of week
        periodEndDate.setDate(periodStartDate.getDate() + 6); // End of week
      } else if (period === "monthly") {
        periodStartDate.setDate(1); // Start of month
        periodEndDate.setMonth(now.getMonth() + 1, 0); // End of month
      } else {
        periodStartDate.setFullYear(now.getFullYear(), 0, 1); // Start of year
        periodEndDate.setFullYear(now.getFullYear(), 11, 31); // End of year
      }

      const data: ReferralLeaderboardEmailData = {
        toEmail: user.email,
        toName: user.full_name || undefined,
        referrerFirstName: firstName,
        referrerFullName: user.full_name || firstName,
        referrerEmail: user.email,
        organizationName: org.name,
        organizationId: user.organization_id || undefined,
        referralLink,
        referralCode,
        dashboardUrl: `${baseUrl}/dashboard`,
        referralProgramUrl: `${baseUrl}/dashboard/referrals`,
        unsubscribeUrl: `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}`,
        leaderboardPeriod: period,
        periodStartDate: periodStartDate.toISOString(),
        periodEndDate: periodEndDate.toISOString(),
        userRank: i + 1,
        previousRank: i + 2, // Mock: assume they moved up
        rankChange: "up",
        userReferrals: leaderboardEntries[i].referrals,
        topReferrers: personalizedLeaderboard.slice(0, 10),
        leaderboardRewards: [
          { rank: "1st", reward: "$500 Amazon Gift Card" },
          { rank: "2nd", reward: "$250 Amazon Gift Card" },
          { rank: "3rd", reward: "$100 Amazon Gift Card" },
        ],
      };

      const sendResult = await sendReferralLeaderboardEmail(data, {
        referrerId: user.id,
        referralCode,
      });

      if (sendResult.success) {
        result.processed++;
      } else {
        result.failed++;
        result.errors.push(`User ${user.id}: ${sendResult.error}`);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `User ${user.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

// ============================================================================
// Utility Exports
// ============================================================================

export { generateReferralLink, generateSocialShareLinks };
