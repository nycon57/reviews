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
