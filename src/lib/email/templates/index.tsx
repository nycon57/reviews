/**
 * Email Templates
 *
 * React Email templates for various email types.
 * Uses S073 email design system components.
 */

import { render } from "@react-email/components";

// Video Testimonial Templates (S080)
import { VideoProcessingStartedEmail } from "./video-processing-started";
import { VideoProcessingCompleteEmail } from "./video-processing-complete";
import { VideoApprovalNeededEmail } from "./video-approval-needed";
import { VideoApprovedEmail } from "./video-approved";
import { VideoSharedEmail } from "./video-shared";
import { VideoCustomerThankYouEmail } from "./video-customer-thank-you";

// Weekly Summary Templates (S082)
import { WeeklySummaryLOEmail } from "./weekly-summary-lo";
import { WeeklySummaryManagerEmail } from "./weekly-summary-manager";

// Announcement Templates (S088)
import { AnnouncementFeatureEmail } from "./announcement-feature";
import { AnnouncementUpdateEmail } from "./announcement-update";
import { AnnouncementMaintenanceEmail } from "./announcement-maintenance";
import { AnnouncementSecurityEmail } from "./announcement-security";

// Profile Referral Introduction Template
import { ProfileReferralIntroductionEmail } from "./profile-referral-introduction";

// Review Verification Template (direct review submissions)
import { ReviewVerificationEmail } from "./review-verification";

// Review Video Upsell Template (invite published text reviewers to record video)
import { ReviewVideoUpsellEmail } from "./review-video-upsell";

// Review Dispute Escalation Template (individual account disputes)
import { ReviewDisputeEscalationEmail } from "./review-dispute-escalation";

// Admin Alert Templates (S089)
export {
  AdminAlertNegativeReviewEmail,
  AdminAlertTeamStrugglingEmail,
  AdminAlertComplianceViolationEmail,
  AdminAlertUsageLimitEmail,
  AdminAlertTeamMemberJoinedEmail,
  AdminAlertTeamMemberLeftEmail,
  AdminAlertUnusualActivityEmail,
  AdminAlertIntegrationDisconnectedEmail,
  AdminAlertDigestEmail,
} from "./admin-alerts";

export {
  // Video templates
  VideoProcessingStartedEmail,
  VideoProcessingCompleteEmail,
  VideoApprovalNeededEmail,
  VideoApprovedEmail,
  VideoSharedEmail,
  VideoCustomerThankYouEmail,
  // Weekly summary templates
  WeeklySummaryLOEmail,
  WeeklySummaryManagerEmail,
  // Announcement templates (S088)
  AnnouncementFeatureEmail,
  AnnouncementUpdateEmail,
  AnnouncementMaintenanceEmail,
  AnnouncementSecurityEmail,
  // Profile referral introduction
  ProfileReferralIntroductionEmail,
  // Review verification (direct review submissions)
  ReviewVerificationEmail,
  // Review video upsell (invite published text reviewers to record video)
  ReviewVideoUpsellEmail,
  // Review dispute escalation (individual account disputes)
  ReviewDisputeEscalationEmail,
};

// Types
import type {
  VideoProcessingStartedEmailData,
  VideoProcessingCompleteEmailData,
  VideoApprovalNeededEmailData,
  VideoApprovedPublishedEmailData,
  VideoSharedEmailData,
  VideoCustomerThankYouEmailData,
  WeeklySummaryLOEmailData,
  WeeklySummaryManagerEmailData,
  // Announcement types (S088)
  AnnouncementFeatureEmailData,
  AnnouncementUpdateEmailData,
  AnnouncementMaintenanceEmailData,
  AnnouncementSecurityEmailData,
  // Profile referral introduction
  ProfileReferralIntroductionEmailData,
  // Review verification (direct review submissions)
  ReviewVerificationEmailData,
  // Review video upsell (invite published text reviewers to record video)
  ReviewVideoUpsellEmailData,
  // Review dispute escalation (individual account disputes)
  ReviewDisputeEscalationEmailData,
} from "../types";

// =============================================================================
// RENDERING FUNCTIONS
// =============================================================================

/**
 * Render Video Processing Started email to HTML
 */
export async function renderVideoProcessingStartedEmail(
  data: VideoProcessingStartedEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Video testimonial from ${data.customerName} is being processed`;
  const html = await render(<VideoProcessingStartedEmail data={data} />);
  return { subject, html };
}

/**
 * Render Video Processing Complete email to HTML
 */
export async function renderVideoProcessingCompleteEmail(
  data: VideoProcessingCompleteEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Video from ${data.customerName} is ready for review`;
  const html = await render(<VideoProcessingCompleteEmail data={data} />);
  return { subject, html };
}

/**
 * Render Video Approval Needed email to HTML
 */
export async function renderVideoApprovalNeededEmail(
  data: VideoApprovalNeededEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Action Required: Video testimonial from ${data.customerName} needs approval`;
  const html = await render(<VideoApprovalNeededEmail data={data} />);
  return { subject, html };
}

/**
 * Render Video Approved email to HTML
 */
export async function renderVideoApprovedEmail(
  data: VideoApprovedPublishedEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Your video testimonial from ${data.customerName} is approved and ready to share!`;
  const html = await render(<VideoApprovedEmail data={data} />);
  return { subject, html };
}

/**
 * Render Video Shared email to HTML
 */
export async function renderVideoSharedEmail(
  data: VideoSharedEmailData
): Promise<{ subject: string; html: string }> {
  const platformNames: Record<string, string> = {
    linkedin: "LinkedIn",
    twitter: "Twitter/X",
    facebook: "Facebook",
    email: "email",
    embed: "your website",
  };
  const platformName = platformNames[data.platform] || data.platform;
  const subject = `Your video testimonial was shared on ${platformName}`;
  const html = await render(<VideoSharedEmail data={data} />);
  return { subject, html };
}

/**
 * Render Video Customer Thank You email to HTML
 */
export async function renderVideoCustomerThankYouEmail(
  data: VideoCustomerThankYouEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Thank you for sharing your experience, ${data.customerName}!`;
  const html = await render(<VideoCustomerThankYouEmail data={data} />);
  return { subject, html };
}

// =============================================================================
// WEEKLY SUMMARY EMAIL RENDERING FUNCTIONS (S082)
// =============================================================================

/**
 * Render Weekly Summary LO email to HTML
 */
export async function renderWeeklySummaryLOEmail(
  data: WeeklySummaryLOEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Your weekly performance summary: ${data.reviewsThisWeek} review${data.reviewsThisWeek !== 1 ? "s" : ""} this week`;
  const html = await render(<WeeklySummaryLOEmail data={data} />);
  return { subject, html };
}

/**
 * Render Weekly Summary Manager email to HTML
 */
export async function renderWeeklySummaryManagerEmail(
  data: WeeklySummaryManagerEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Team weekly summary: ${data.teamReviewsThisWeek} reviews from ${data.teamSize} team members`;
  const html = await render(<WeeklySummaryManagerEmail data={data} />);
  return { subject, html };
}

// =============================================================================
// ANNOUNCEMENT EMAIL RENDERING FUNCTIONS (S088)
// =============================================================================

/**
 * Render Feature Announcement email to HTML
 */
export async function renderAnnouncementFeatureEmail(
  data: AnnouncementFeatureEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `New Feature: ${data.title}`;
  const html = await render(<AnnouncementFeatureEmail data={data} />);
  return { subject, html };
}

/**
 * Render Product Update Digest email to HTML
 */
export async function renderAnnouncementUpdateEmail(
  data: AnnouncementUpdateEmailData
): Promise<{ subject: string; html: string }> {
  const entryCount = data.changelogEntries.length;
  const subject = `Product Update: ${data.title} (${entryCount} update${entryCount !== 1 ? "s" : ""})`;
  const html = await render(<AnnouncementUpdateEmail data={data} />);
  return { subject, html };
}

/**
 * Render Maintenance Notification email to HTML
 */
export async function renderAnnouncementMaintenanceEmail(
  data: AnnouncementMaintenanceEmailData
): Promise<{ subject: string; html: string }> {
  const impactPrefix =
    data.impactLevel === "full"
      ? "Service Outage: "
      : data.impactLevel === "partial"
        ? "Partial Outage: "
        : "";
  const subject = `${impactPrefix}Scheduled Maintenance - ${data.title}`;
  const html = await render(<AnnouncementMaintenanceEmail data={data} />);
  return { subject, html };
}

/**
 * Render Security Update email to HTML
 */
export async function renderAnnouncementSecurityEmail(
  data: AnnouncementSecurityEmailData
): Promise<{ subject: string; html: string }> {
  const severityLabels: Record<string, string> = {
    critical: "[CRITICAL]",
    high: "[HIGH]",
    medium: "[MEDIUM]",
    low: "[LOW]",
  };
  const severityPrefix = severityLabels[data.severity] || "";
  const actionText = data.actionRequired ? " - Action Required" : "";
  const subject = `${severityPrefix} Security Update: ${data.title}${actionText}`;
  const html = await render(<AnnouncementSecurityEmail data={data} />);
  return { subject, html };
}

// =============================================================================
// PROFILE REFERRAL INTRODUCTION EMAIL RENDERING FUNCTION
// =============================================================================

/**
 * Render Profile Referral Introduction email to HTML
 */
export async function renderProfileReferralIntroductionEmail(
  data: ProfileReferralIntroductionEmailData
): Promise<{ subject: string; html: string }> {
  const subject = data.subject;
  const html = await render(
    <ProfileReferralIntroductionEmail data={data} />
  );
  return { subject, html };
}

// =============================================================================
// REVIEW VERIFICATION EMAIL RENDERING FUNCTION
// =============================================================================

/**
 * Render Review Verification email to HTML
 */
export async function renderReviewVerificationEmail(
  data: ReviewVerificationEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Confirm your review of ${data.professionalName}`;
  const html = await render(<ReviewVerificationEmail data={data} />);
  return { subject, html };
}

// =============================================================================
// REVIEW VIDEO UPSELL EMAIL RENDERING FUNCTION
// =============================================================================

/**
 * Render Review Video Upsell email to HTML
 */
export async function renderReviewVideoUpsellEmail(
  data: ReviewVideoUpsellEmailData
): Promise<{ subject: string; html: string }> {
  const subject = "Your review is making an impact";
  const html = await render(<ReviewVideoUpsellEmail data={data} />);
  return { subject, html };
}

// =============================================================================
// REVIEW DISPUTE ESCALATION EMAIL RENDERING FUNCTION
// =============================================================================

/**
 * Render Review Dispute Escalation email to HTML
 */
export async function renderReviewDisputeEscalationEmail(
  data: ReviewDisputeEscalationEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `Review dispute escalated by ${data.organizationName}`;
  const html = await render(<ReviewDisputeEscalationEmail data={data} />);
  return { subject, html };
}
