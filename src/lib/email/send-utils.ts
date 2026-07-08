/**
 * Email Sending Utilities
 *
 * Provides reliable email sending with:
 * - Idempotency keys (prevent duplicate sends)
 * - Retry logic with exponential backoff
 * - List-Unsubscribe headers (RFC 8058)
 * - Plain text version generation
 * - Rate limit handling
 * - Timeout handling
 * - Email size monitoring
 */

import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { getResendClient, emailConfig } from "./client";
import { generateEmailPreferenceTokenForUser } from "../email-preferences/actions";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { resolveEmailTypeSend } from "@/lib/email-ab-testing/overrides";

// =============================================================================
// TYPES
// =============================================================================

export interface EmailSendOptions {
  /** Recipient email address */
  to: string;
  /** Recipient name (optional) */
  toName?: string;
  /** From address (defaults to config) */
  from?: string;
  /** Reply-to address (optional) */
  replyTo?: string;
  /** Email subject line */
  subject: string;
  /** React Email component (use this OR html/text) */
  react?: ReactElement;
  /** Pre-rendered HTML (use this OR react) */
  html?: string;
  /** Pre-rendered plain text (optional, auto-generated from html if not provided) */
  text?: string;
  /** Idempotency key to prevent duplicates (REQUIRED for reliability) */
  idempotencyKey: string;
  /** Tags for tracking */
  tags?: Array<{ name: string; value: string }>;
  /** User ID for unsubscribe token generation */
  userId?: string;
  /** Include List-Unsubscribe header (default: true for marketing) */
  includeListUnsubscribe?: boolean;
  /**
   * Explicit List-Unsubscribe URL. When set, headers are included even for a
   * transactional email and this URL is used verbatim (wins over the userId /
   * recipient resolution). Used by acquisition emails to point the machine
   * one-click at the Contact-scoped suppression endpoint.
   */
  listUnsubscribeUrl?: string;
  /** Maximum retries (default: 3) */
  maxRetries?: number;
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  /**
   * Organization + email type enable send-time A/B resolution: an applied
   * winner's subject (email_type_overrides) or a running test's assigned variant
   * subject is swapped in, and the assigned variant ids are returned for logging.
   * Only the subject is swapped — preview text is already baked into the HTML.
   */
  organizationId?: string;
  emailType?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retries?: number;
  htmlSize?: number;
  /** The subject actually sent (may differ from the requested subject after A/B resolution). */
  effectiveSubject?: string;
  /** Set when a running A/B test assigned this send a variant — stamp on email_logs. */
  abTestId?: string;
  abTestVariant?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Gmail clips emails larger than 102KB */
const EMAIL_SIZE_WARNING_THRESHOLD = 90 * 1024; // 90KB
const EMAIL_SIZE_LIMIT = 102 * 1024; // 102KB

/** Default timeout for email API calls */
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/** Physical mailing address for CAN-SPAM compliance */
export const COMPANY_MAILING_ADDRESS = "Repwell Inc., 123 Main Street, Suite 100, San Francisco, CA 94105";

// =============================================================================
// IDEMPOTENCY KEY GENERATORS
// =============================================================================

/**
 * Generate deterministic idempotency key for survey invitation
 */
export function getSurveyInvitationIdempotencyKey(
  surveyId: string,
  recipientEmail: string
): string {
  return `survey-invite-${surveyId}-${recipientEmail.toLowerCase()}`;
}

/**
 * Generate deterministic idempotency key for survey reminder
 */
export function getSurveyReminderIdempotencyKey(
  surveyId: string,
  recipientEmail: string,
  reminderNumber: number
): string {
  return `survey-reminder-${surveyId}-${recipientEmail.toLowerCase()}-${reminderNumber}`;
}

/**
 * Generate deterministic idempotency key for review notification
 */
export function getReviewNotificationIdempotencyKey(
  reviewId: string,
  recipientEmail: string
): string {
  return `review-notify-${reviewId}-${recipientEmail.toLowerCase()}`;
}

/**
 * Generate deterministic idempotency key for video testimonial emails
 */
export function getVideoTestimonialIdempotencyKey(
  requestId: string,
  emailType: string,
  recipientEmail: string
): string {
  return `video-${emailType}-${requestId}-${recipientEmail.toLowerCase()}`;
}

/**
 * Generate deterministic idempotency key for milestone emails
 */
export function getMilestoneIdempotencyKey(
  userId: string,
  milestoneType: string,
  milestoneId: string
): string {
  return `milestone-${milestoneType}-${userId}-${milestoneId}`;
}

/**
 * Generate deterministic idempotency key for welcome sequence
 */
export function getWelcomeSequenceIdempotencyKey(
  userId: string,
  stepNumber: number
): string {
  return `welcome-${userId}-step-${stepNumber}`;
}

/**
 * Generate deterministic idempotency key for weekly summary
 */
export function getWeeklySummaryIdempotencyKey(
  userId: string,
  weekStartDate: string
): string {
  return `weekly-summary-${userId}-${weekStartDate}`;
}

/**
 * Generate deterministic idempotency key for trial ending emails
 */
export function getTrialEndingIdempotencyKey(
  userId: string,
  emailNumber: number
): string {
  return `trial-ending-${userId}-email-${emailNumber}`;
}

/**
 * Generate deterministic idempotency key for dunning emails
 */
export function getDunningIdempotencyKey(
  subscriptionId: string,
  emailNumber: number
): string {
  return `dunning-${subscriptionId}-email-${emailNumber}`;
}

/**
 * Generate deterministic idempotency key for announcement emails
 */
export function getAnnouncementIdempotencyKey(
  announcementId: string,
  recipientEmail: string
): string {
  return `announcement-${announcementId}-${recipientEmail.toLowerCase()}`;
}

/**
 * Generate deterministic idempotency key for referral emails
 */
export function getReferralIdempotencyKey(
  referralId: string,
  emailType: string,
  recipientEmail: string
): string {
  return `referral-${emailType}-${referralId}-${recipientEmail.toLowerCase()}`;
}

// =============================================================================
// UNSUBSCRIBE URL GENERATION
// =============================================================================

/**
 * Generate an unsubscribe URL for a user.
 * Prefers token-based URLs for better privacy.
 *
 * @param userId - User ID for token generation (preferred)
 * @param recipientEmail - Email address (fallback)
 * @returns Unsubscribe URL
 */
export async function getUnsubscribeUrl(
  userId?: string,
  recipientEmail?: string
): Promise<string> {
  // Prefer token-based unsubscribe for privacy
  if (userId) {
    try {
      const token = await generateEmailPreferenceTokenForUser(userId);
      if (token) {
        return `${emailConfig.baseUrl}/unsubscribe/${token}`;
      }
    } catch (error) {
      console.warn("Failed to generate unsubscribe token:", error);
    }
  }

  // Fallback to email-based unsubscribe
  if (recipientEmail) {
    return `${emailConfig.baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
  }

  // Last resort - generic unsubscribed page
  return `${emailConfig.baseUrl}/unsubscribed`;
}

/**
 * Generate an email preferences URL for a user.
 *
 * @param userId - User ID for token generation (preferred)
 * @returns Email preferences URL
 */
export async function getEmailPreferencesUrl(
  userId?: string
): Promise<string> {
  if (userId) {
    try {
      const token = await generateEmailPreferenceTokenForUser(userId);
      if (token) {
        return `${emailConfig.baseUrl}/email-preferences/${token}`;
      }
    } catch (error) {
      console.warn("Failed to generate preferences token:", error);
    }
  }

  // Fallback to settings page (requires auth)
  return `${emailConfig.baseUrl}/settings/notifications`;
}

// =============================================================================
// LIST-UNSUBSCRIBE HEADER GENERATION
// =============================================================================

/**
 * Generate List-Unsubscribe headers for RFC 8058 compliance
 * Required by Gmail/Yahoo since February 2024
 */
export async function getListUnsubscribeHeaders(
  userId?: string,
  recipientEmail?: string,
  explicitUrl?: string
): Promise<Record<string, string>> {
  // An explicit URL (e.g. an acquisition email's Contact-scoped one-click URL)
  // wins over the platform-user token/email resolution.
  const unsubscribeUrl = explicitUrl ?? (await getUnsubscribeUrl(userId, recipientEmail));
  const unsubscribeMailto = "unsubscribe@repwell.ai";

  return {
    "List-Unsubscribe": `<mailto:${unsubscribeMailto}?subject=unsubscribe>, <${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as { statusCode?: number; code?: string; message?: string };

  // Server errors are retryable
  if (err.statusCode && err.statusCode >= 500) return true;

  // Rate limits are retryable
  if (err.statusCode === 429) return true;

  // Network errors are retryable
  if (err.code === "ETIMEDOUT" || err.code === "ECONNRESET" || err.code === "ENOTFOUND") {
    return true;
  }

  // Timeout errors are retryable
  if (err.message?.includes("timeout") || err.message?.includes("aborted")) {
    return true;
  }

  return false;
}

/**
 * Calculate backoff delay with jitter
 */
function getBackoffDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
  // Add jitter (0-1000ms) to prevent thundering herd
  const jitter = Math.random() * 1000;
  return baseDelay + jitter;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert HTML to plain text for email fallback
 * Simple implementation that strips tags and decodes entities
 */
function htmlToPlainText(html: string): string {
  return html
    // Remove style and script tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    // Replace <br> and </p> with newlines
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    // Replace links with text + URL
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// =============================================================================
// EMAIL SIZE MONITORING
// =============================================================================

/**
 * Check email HTML size and warn if approaching Gmail clip threshold
 */
export function checkEmailSize(html: string): { size: number; warning?: string } {
  const size = Buffer.byteLength(html, "utf8");

  if (size > EMAIL_SIZE_LIMIT) {
    return {
      size,
      warning: `Email exceeds Gmail clip threshold (${Math.round(size / 1024)}KB > 102KB). Email will be clipped.`,
    };
  }

  if (size > EMAIL_SIZE_WARNING_THRESHOLD) {
    return {
      size,
      warning: `Email approaching Gmail clip threshold (${Math.round(size / 1024)}KB). Consider reducing content.`,
    };
  }

  return { size };
}

// =============================================================================
// MAIN SEND FUNCTION
// =============================================================================

/**
 * Send email with reliability features:
 * - Idempotency keys
 * - Retry with exponential backoff
 * - List-Unsubscribe headers
 * - Plain text generation
 * - Timeout handling
 * - Size monitoring
 */
export async function sendEmailWithReliability(
  options: EmailSendOptions
): Promise<EmailSendResult> {
  const {
    to,
    toName,
    from = `${emailConfig.defaultFromName} <${emailConfig.defaultFromEmail}>`,
    replyTo,
    subject,
    react,
    html: providedHtml,
    text: providedText,
    idempotencyKey,
    tags = [],
    userId,
    includeListUnsubscribe = true,
    listUnsubscribeUrl,
    maxRetries = 3,
    timeout = DEFAULT_TIMEOUT,
    organizationId,
    emailType,
  } = options;

  // Validate that either react or html is provided
  if (!react && !providedHtml) {
    return {
      success: false,
      error: "Either 'react' or 'html' must be provided",
    };
  }

  // Render HTML and plain text
  let html: string;
  let text: string;

  if (react) {
    // Render from React component
    try {
      html = await render(react);
      text = await render(react, { plainText: true });
    } catch (renderError) {
      console.error("Failed to render email:", renderError);
      return {
        success: false,
        error: `Failed to render email: ${renderError instanceof Error ? renderError.message : "Unknown error"}`,
      };
    }
  } else {
    // Use provided HTML
    html = providedHtml!;
    // Generate plain text from HTML if not provided
    text = providedText || htmlToPlainText(html);
  }

  // Check email size
  const sizeCheck = checkEmailSize(html);
  if (sizeCheck.warning) {
    console.warn(`Email size warning for ${idempotencyKey}: ${sizeCheck.warning}`);
  }

  // Send-time A/B resolution (subject only — the HTML/preheader is already
  // rendered). Applies an applied-winner override or assigns a running test's
  // variant for (organizationId, emailType). Best-effort: failures fall through
  // to the requested subject.
  let effectiveSubject = subject;
  let abTestId: string | undefined;
  let abTestVariant: string | undefined;
  if (organizationId && emailType) {
    const resolution = await resolveEmailTypeSend(createUntypedAdminClient(), {
      organizationId,
      emailType,
      subject,
    });
    effectiveSubject = resolution.subject;
    abTestId = resolution.abTestId;
    abTestVariant = resolution.abTestVariant;
  }

  // Build headers
  const headers: Record<string, string> = {
    "X-Idempotency-Key": idempotencyKey,
  };

  // Add List-Unsubscribe headers for marketing emails, or whenever an explicit
  // unsubscribe URL is supplied (e.g. an acquisition email whose human footer
  // and machine one-click must both hit the Contact suppression system).
  if (includeListUnsubscribe || listUnsubscribeUrl) {
    const unsubscribeHeaders = await getListUnsubscribeHeaders(
      userId,
      to,
      listUnsubscribeUrl
    );
    Object.assign(headers, unsubscribeHeaders);
  }

  const resend = getResendClient();
  let lastError: Error | null = null;
  let retries = 0;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await resend.emails.send({
        from,
        to: toName ? `${toName} <${to}>` : to,
        replyTo,
        subject: effectiveSubject,
        html,
        text,
        tags,
        headers,
      });

      clearTimeout(timeoutId);

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        success: true,
        messageId: response.data?.id,
        retries,
        htmlSize: sizeCheck.size,
        effectiveSubject,
        abTestId,
        abTestVariant,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error) || attempt === maxRetries - 1) {
        break;
      }

      // Log retry attempt
      retries++;
      const delay = getBackoffDelay(attempt);
      console.warn(
        `Email send failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms:`,
        lastError.message
      );

      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError?.message || "Unknown error",
    retries,
    htmlSize: sizeCheck.size,
  };
}

// =============================================================================
// CATEGORY-AWARE SENDING
// =============================================================================

export type EmailCategory =
  | "transactional"
  | "onboarding"
  | "weekly_summary"
  | "milestones"
  | "product_updates"
  | "marketing";

/**
 * Map email templates to categories for preference checking
 */
export const EMAIL_TEMPLATE_CATEGORIES: Record<string, EmailCategory> = {
  // Transactional (always send, no preference check)
  survey_invitation: "transactional",
  survey_reminder_3day: "transactional",
  survey_reminder_7day: "transactional",
  new_review_notification: "transactional",
  review_pending_approval: "transactional",
  review_approved: "transactional",
  review_rejected: "transactional",
  video_testimonial_invitation: "transactional",
  video_testimonial_reminder: "transactional",
  password_reset: "transactional",
  email_verification: "transactional",

  // Onboarding
  welcome_1_access: "onboarding",
  welcome_2_profile: "onboarding",
  welcome_3_first_action: "onboarding",
  welcome_4_social_proof: "onboarding",
  welcome_5_metrics: "onboarding",
  org_onboarding_1: "onboarding",
  org_onboarding_2: "onboarding",
  org_onboarding_3: "onboarding",
  team_invite: "onboarding",
  role_onboarding: "onboarding",

  // Weekly summary
  weekly_summary_lo: "weekly_summary",
  weekly_summary_manager: "weekly_summary",

  // Milestones (both naming conventions for compatibility)
  first_review_milestone: "milestones",
  review_count_milestone: "milestones",
  first_5star_milestone: "milestones",
  leaderboard_milestone: "milestones",
  badge_earned_milestone: "milestones",
  streak_milestone: "milestones",
  video_milestone: "milestones",
  profile_completion_milestone: "milestones",
  rating_improvement_milestone: "milestones",
  nps_improvement_milestone: "milestones",
  // Actual template names used in send functions
  milestone_first_review: "milestones",
  milestone_review_count: "milestones",
  milestone_first_5_star: "milestones",
  milestone_leaderboard: "milestones",
  milestone_badge_earned: "milestones",
  milestone_streak: "milestones",
  milestone_video: "milestones",
  milestone_rating_improvement: "milestones",
  milestone_nps_improvement: "milestones",
  milestone_profile_completion: "milestones",

  // Product updates
  announcement_feature: "product_updates",
  announcement_update: "product_updates",
  announcement_maintenance: "product_updates",
  announcement_security: "product_updates",

  // Marketing
  referral_invite: "marketing",
  referral_reminder: "marketing",
  referral_leaderboard: "marketing",
  reengagement_1: "marketing",
  reengagement_2: "marketing",
  reengagement_3: "marketing",
  trial_ending_1: "marketing",
  trial_ending_2: "marketing",
  trial_ending_3: "marketing",
  trial_ending_4: "marketing",
  trial_ending_5: "marketing",
  // Actual template names used in send functions
  trial_ending_1_accomplishments: "marketing",
  trial_ending_2_feature_comparison: "marketing",
  trial_ending_3_final_reminder: "marketing",
  trial_ending_4_grace_period: "marketing",
  trial_ending_5_winback: "marketing",
  winback: "marketing",
};

/**
 * Get the preference field for a category
 */
export function getCategoryPreferenceField(
  category: EmailCategory
): string | null {
  switch (category) {
    case "transactional":
      return null; // Always send
    case "onboarding":
      return "email_onboarding_enabled";
    case "weekly_summary":
      return "email_weekly_summary_enabled";
    case "milestones":
      return "email_milestones_enabled";
    case "product_updates":
      return "email_product_updates_enabled";
    case "marketing":
      return "email_marketing_enabled";
    default:
      return null;
  }
}

/**
 * Check if an email should be sent based on user preferences.
 *
 * @param templateName - The email template name (e.g., "survey_invitation")
 * @param userId - The user ID to check preferences for (optional)
 * @returns Object with allowed (boolean) and reason (if blocked)
 */
export async function shouldSendEmail(
  templateName: string,
  userId?: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Look up the category for this template
  const category = EMAIL_TEMPLATE_CATEGORIES[templateName];

  // Unknown templates default to allowed (transactional behavior)
  if (!category) {
    return { allowed: true };
  }

  // Transactional emails always send
  if (category === "transactional") {
    return { allowed: true };
  }

  // If no user ID, can't check preferences - default to allowed
  if (!userId) {
    return { allowed: true };
  }

  // Get the preference field name
  const preferenceField = getCategoryPreferenceField(category);
  if (!preferenceField) {
    return { allowed: true };
  }

  // Dynamically import to avoid circular dependency
  const { isEmailCategoryEnabled } = await import("../email-preferences/actions");

  // Check if the category is enabled for this user
  const isEnabled = await isEmailCategoryEnabled(
    userId,
    preferenceField as
      | "email_onboarding_enabled"
      | "email_weekly_summary_enabled"
      | "email_milestones_enabled"
      | "email_product_updates_enabled"
      | "email_marketing_enabled"
  );

  if (!isEnabled) {
    return {
      allowed: false,
      reason: `User has disabled ${category} emails`,
    };
  }

  return { allowed: true };
}

// =============================================================================
// SIMPLE SEND WITH RELIABILITY (for existing code integration)
// =============================================================================

export interface SimpleSendOptions {
  /** Recipient email address */
  to: string;
  /** Recipient name (optional) */
  toName?: string;
  /** From address */
  from: string;
  /** Reply-to address (optional) */
  replyTo?: string;
  /** Email subject line */
  subject: string;
  /** Pre-rendered HTML */
  html: string;
  /** Idempotency key to prevent duplicates */
  idempotencyKey: string;
  /** Tags for tracking */
  tags?: Array<{ name: string; value: string }>;
  /** User ID for unsubscribe token generation */
  userId?: string;
  /** Is this a transactional email (no unsubscribe header)? Default: false */
  isTransactional?: boolean;
  /** Organization for send-time A/B resolution (see EmailSendOptions). */
  organizationId?: string;
  /** Email type / template name for send-time A/B resolution. */
  emailType?: string;
  /**
   * Explicit List-Unsubscribe URL. Forces the header on even for a transactional
   * email — used by acquisition sends to point one-click at the Contact endpoint.
   */
  listUnsubscribeUrl?: string;
}

/**
 * Simple wrapper for sending emails with reliability features.
 * Designed as a drop-in replacement for direct resend.emails.send() calls.
 *
 * Adds:
 * - Idempotency keys (via X-Idempotency-Key header)
 * - Retry with exponential backoff
 * - List-Unsubscribe headers (for non-transactional emails)
 * - Plain text version generation
 * - Timeout handling
 * - Email size monitoring
 */
export async function sendWithReliability(
  options: SimpleSendOptions
): Promise<EmailSendResult> {
  return sendEmailWithReliability({
    to: options.to,
    toName: options.toName,
    from: options.from,
    replyTo: options.replyTo,
    subject: options.subject,
    html: options.html,
    idempotencyKey: options.idempotencyKey,
    tags: options.tags,
    userId: options.userId,
    includeListUnsubscribe: !options.isTransactional,
    listUnsubscribeUrl: options.listUnsubscribeUrl,
    organizationId: options.organizationId,
    emailType: options.emailType,
  });
}
