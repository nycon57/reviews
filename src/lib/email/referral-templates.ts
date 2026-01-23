/**
 * Referral Program Email Templates
 *
 * Functions to render referral program emails using React Email.
 * Each function takes the email data and returns the rendered HTML.
 */

import { render } from "@react-email/render";
import { ReferralInviteEmail } from "./templates/referral-invite";
import { ReferralFriendSignedUpEmail } from "./templates/referral-friend-signed-up";
import { ReferralFriendConvertedEmail } from "./templates/referral-friend-converted";
import { ReferralRewardEarnedEmail } from "./templates/referral-reward-earned";
import { ReferralReminderEmail } from "./templates/referral-reminder";
import { ReferralLeaderboardEmail } from "./templates/referral-leaderboard";
import type {
  ReferralInviteEmailData,
  ReferralFriendSignedUpEmailData,
  ReferralFriendConvertedEmailData,
  ReferralRewardEarnedEmailData,
  ReferralReminderEmailData,
  ReferralLeaderboardEmailData,
} from "./types";

// =============================================================================
// Referral Invite Email
// =============================================================================

export function getReferralInviteSubject(data: ReferralInviteEmailData): string {
  return `${data.referrerFirstName} invited you to try Repwell - Get ${data.rewardForFriend}!`;
}

export async function getReferralInviteEmail(
  data: ReferralInviteEmailData
): Promise<string> {
  return render(ReferralInviteEmail({ data }));
}

// =============================================================================
// Referral Friend Signed Up Email
// =============================================================================

export function getReferralFriendSignedUpSubject(
  data: ReferralFriendSignedUpEmailData
): string {
  return `Great news! ${data.friendName} just signed up using your referral link`;
}

export async function getReferralFriendSignedUpEmail(
  data: ReferralFriendSignedUpEmailData
): Promise<string> {
  return render(ReferralFriendSignedUpEmail({ data }));
}

// =============================================================================
// Referral Friend Converted Email
// =============================================================================

export function getReferralFriendConvertedSubject(
  data: ReferralFriendConvertedEmailData
): string {
  return `You earned ${data.rewardEarned}! ${data.friendName} upgraded to ${data.friendPlanName}`;
}

export async function getReferralFriendConvertedEmail(
  data: ReferralFriendConvertedEmailData
): Promise<string> {
  return render(ReferralFriendConvertedEmail({ data }));
}

// =============================================================================
// Referral Reward Earned Email
// =============================================================================

export function getReferralRewardEarnedSubject(
  data: ReferralRewardEarnedEmailData
): string {
  return `Your referral reward is ready! ${data.rewardDescription}`;
}

export async function getReferralRewardEarnedEmail(
  data: ReferralRewardEarnedEmailData
): Promise<string> {
  return render(ReferralRewardEarnedEmail({ data }));
}

// =============================================================================
// Referral Reminder Email
// =============================================================================

export function getReferralReminderSubject(
  data: ReferralReminderEmailData
): string {
  return `You could be earning ${data.potentialEarnings}! Share Repwell with your network`;
}

export async function getReferralReminderEmail(
  data: ReferralReminderEmailData
): Promise<string> {
  return render(ReferralReminderEmail({ data }));
}

// =============================================================================
// Referral Leaderboard Email
// =============================================================================

export function getReferralLeaderboardSubject(
  data: ReferralLeaderboardEmailData
): string {
  const periodLabel = {
    weekly: "This Week",
    monthly: "This Month",
    all_time: "All Time",
  }[data.leaderboardPeriod];

  return `You're ranked #${data.userRank} on the referral leaderboard! ${periodLabel}`;
}

export async function getReferralLeaderboardEmail(
  data: ReferralLeaderboardEmailData
): Promise<string> {
  return render(ReferralLeaderboardEmail({ data }));
}
