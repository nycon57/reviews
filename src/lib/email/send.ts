"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import {
  sendWithReliability,
  getSurveyInvitationIdempotencyKey,
  getSurveyReminderIdempotencyKey,
  getReviewNotificationIdempotencyKey,
  getVideoTestimonialIdempotencyKey,
  shouldSendEmail,
} from "./send-utils";
import type {
  EmailTemplate,
  EmailSendResult,
  SurveyInvitationEmailData,
  SurveyReminderEmailData,
  NewReviewNotificationEmailData,
  ReviewResponseToReviewerEmailData,
  VideoTestimonialInvitationEmailData,
  VideoTestimonialReminderEmailData,
  VideoTestimonialReceivedEmailData,
  VideoTestimonialApprovedEmailData,
  VideoTestimonialPendingApprovalEmailData,
  SurveyCompletionThankYouEmailData,
  SurveyHighRatingFollowUpEmailData,
  SurveyLowRatingFollowUpEmailData,
  SurveyResponseReceivedNotificationEmailData,
  ReviewPendingApprovalEmailData,
  ReviewApprovedEmailData,
  ReviewRejectedEmailData,
  ReviewResponseSentConfirmationEmailData,
  ReviewPublishedNotificationEmailData,
  ReviewResponseReceivedEmailData,
  NegativeReviewAlertEnhancedEmailData,
  // Milestone email types (S081)
  FirstReviewMilestoneEmailData,
  ReviewCountMilestoneEmailData,
  First5StarMilestoneEmailData,
  LeaderboardMilestoneEmailData,
  BadgeEarnedMilestoneEmailData,
  StreakMilestoneEmailData,
  VideoMilestoneEmailData,
  // Trial ending email types (S085)
  TrialEnding1AccomplishmentsEmailData,
  TrialEnding2FeatureComparisonEmailData,
  TrialEnding3FinalReminderEmailData,
  TrialEnding4GracePeriodEmailData,
  TrialEnding5WinbackEmailData,
  // Profile referral introduction
  ProfileReferralIntroductionEmailData,
} from "./types";
import {
  getSurveyInvitationEmail,
  getSurveyReminder3DayEmail,
  getSurveyReminder7DayEmail,
  getNewReviewNotificationEmail,
  getReviewResponseToReviewerEmail,
  getVideoTestimonialInvitationEmail,
  getVideoTestimonialReminder3DayEmail,
  getVideoTestimonialReminder7DayEmail,
  getVideoTestimonialReceivedEmail,
  getVideoTestimonialApprovedEmail,
  getVideoTestimonialPendingApprovalEmail,
  getSurveyCompletionThankYouEmail,
  getSurveyHighRatingFollowUpEmail,
  getSurveyLowRatingFollowUpEmail,
  getSurveyResponseReceivedNotificationEmail,
  getReviewPendingApprovalEmail,
  getReviewApprovedEmail,
  getReviewRejectedEmail,
  getReviewResponseSentConfirmationEmail,
  getReviewPublishedNotificationEmail,
  getReviewResponseReceivedEmail,
  getNegativeReviewAlertEnhancedEmail,
} from "./templates";
import {
  renderFirstReviewMilestoneEmail,
  renderReviewCountMilestoneEmail,
  renderFirst5StarMilestoneEmail,
  renderLeaderboardMilestoneEmail,
  renderBadgeEarnedMilestoneEmail,
  renderStreakMilestoneEmail,
  renderVideoMilestoneEmail,
} from "./templates/milestones";
import {
  getTrialEnding1AccomplishmentsEmail,
  getTrialEnding2FeatureComparisonEmail,
  getTrialEnding3FinalReminderEmail,
  getTrialEnding4GracePeriodEmail,
  getTrialEnding5WinbackEmail,
} from "./trial-ending-templates";
import { renderProfileReferralIntroductionEmail } from "./templates/index";

// Check if email is unsubscribed
async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  return !!data;
}

// Log email to database
async function logEmail(params: {
  toEmail: string;
  toName?: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  templateName: EmailTemplate;
  organizationId?: string;
  loanOfficerId?: string;
  surveyId?: string;
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
      survey_id: params.surveyId,
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

// Send survey invitation email
export async function sendSurveyInvitationEmail(
  data: SurveyInvitationEmailData
): Promise<EmailSendResult> {
  // Check unsubscribe status
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getSurveyInvitationEmail(data);
  const idempotencyKey = getSurveyInvitationIdempotencyKey(
    data.surveyId || `survey-${Date.now()}`,
    data.toEmail
  );

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.customerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    tags: [
      { name: "template", value: "survey_invitation" },
      ...(data.surveyId ? [{ name: "survey_id", value: data.surveyId }] : []),
      ...(data.organizationId
        ? [{ name: "organization_id", value: data.organizationId }]
        : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject,
    templateName: "survey_invitation",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    surveyId: data.surveyId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
  });

  return result;
}

// Send survey reminder email (3-day or 7-day)
export async function sendSurveyReminderEmail(
  data: SurveyReminderEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const fromAddress = getFromAddress(data.organizationName);
  const templateName: EmailTemplate =
    data.reminderNumber === 1 ? "survey_reminder_3day" : "survey_reminder_7day";
  const { subject, html } =
    data.reminderNumber === 1
      ? getSurveyReminder3DayEmail(data)
      : getSurveyReminder7DayEmail(data);
  const idempotencyKey = getSurveyReminderIdempotencyKey(
    data.surveyId || `survey-${Date.now()}`,
    data.toEmail,
    data.reminderNumber
  );

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.customerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    tags: [
      { name: "template", value: templateName },
      ...(data.surveyId ? [{ name: "survey_id", value: data.surveyId }] : []),
      ...(data.organizationId
        ? [{ name: "organization_id", value: data.organizationId }]
        : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject,
    templateName,
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    surveyId: data.surveyId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
  });

  return result;
}

// Send new review notification email
export async function sendNewReviewNotificationEmail(
  data: NewReviewNotificationEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const fromAddress = getFromAddress();
  const { subject, html } = getNewReviewNotificationEmail(data);
  const idempotencyKey = getReviewNotificationIdempotencyKey(
    data.reviewId || `review-${Date.now()}`,
    data.toEmail
  );

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.loanOfficerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    tags: [
      { name: "template", value: "new_review_notification" },
      ...(data.organizationId
        ? [{ name: "organization_id", value: data.organizationId }]
        : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.loanOfficerName,
    fromEmail: emailConfig.defaultFromEmail,
    subject,
    templateName: "new_review_notification",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
  });

  return result;
}

// Update email log with tracking events
export async function updateEmailTrackingStatus(
  resendMessageId: string,
  status: "delivered" | "opened" | "clicked" | "bounced"
): Promise<void> {
  const supabase = createAdminClient();

  const updateData: Record<string, string> = {
    status,
  };

  if (status === "delivered") {
    updateData.delivered_at = new Date().toISOString();
  } else if (status === "opened") {
    updateData.opened_at = new Date().toISOString();
  } else if (status === "clicked") {
    updateData.clicked_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("email_logs")
    .update(updateData)
    .eq("resend_message_id", resendMessageId);

  if (error) {
    console.error("Failed to update email tracking status:", error);
  }
}

// Send review response notification email to the reviewer
export async function sendReviewResponseEmail(
  data: ReviewResponseToReviewerEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getReviewResponseToReviewerEmail(data);
  // Use organization + user + customer email + response hash for idempotency
  // This prevents duplicate emails for the same response to the same customer
  const responseHash = data.responseText
    ? Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.responseText))))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 16)
    : "default";
  const idempotencyKey = `review-response-${data.organizationId || "org"}-${data.loanOfficerId || "user"}-${data.toEmail.toLowerCase()}-${responseHash}`;

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.customerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    tags: [
      { name: "template", value: "review_response_to_reviewer" },
      ...(data.organizationId
        ? [{ name: "organization_id", value: data.organizationId }]
        : []),
      ...(data.loanOfficerId
        ? [{ name: "user_id", value: data.loanOfficerId }]
        : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject,
    templateName: "review_response_to_reviewer",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
  });

  return result;
}

// ============================================================================
// Video Testimonial Email Send Functions
// ============================================================================

// Send video testimonial invitation email
export async function sendVideoTestimonialInvitationEmail(
  data: VideoTestimonialInvitationEmailData
): Promise<EmailSendResult> {
  console.log("[Email] sendVideoTestimonialInvitationEmail called", {
    requestId: data.requestId,
  });

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    console.log("[Email] Email is unsubscribed", { requestId: data.requestId });
    return { success: false, error: "Email is unsubscribed" };
  }

  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getVideoTestimonialInvitationEmail(data);
  const idempotencyKey = getVideoTestimonialIdempotencyKey(
    data.requestId || `vt-${Date.now()}`,
    "invitation",
    data.toEmail
  );

  console.log("[Email] Sending via Resend with reliability", {
    requestId: data.requestId,
    subject,
    htmlLength: html?.length,
    idempotencyKey,
  });

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.customerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    tags: [
      { name: "template", value: "video_testimonial_invitation" },
      ...(data.requestId
        ? [{ name: "request_id", value: data.requestId }]
        : []),
      ...(data.organizationId
        ? [{ name: "organization_id", value: data.organizationId }]
        : []),
    ],
  });

  console.log("[Email] Send result", {
    requestId: data.requestId,
    success: result.success,
    messageId: result.messageId,
    error: result.error,
    retries: result.retries,
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject,
    templateName: "video_testimonial_invitation",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
  });

  return result;
}

// Send video testimonial reminder email (3-day or 7-day)
export async function sendVideoTestimonialReminderEmail(
  data: VideoTestimonialReminderEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const fromAddress = getFromAddress(data.organizationName);
  const templateName: EmailTemplate =
    data.reminderNumber === 1
      ? "video_testimonial_reminder_3day"
      : "video_testimonial_reminder_7day";
  const { subject, html } =
    data.reminderNumber === 1
      ? getVideoTestimonialReminder3DayEmail(data)
      : getVideoTestimonialReminder7DayEmail(data);
  const idempotencyKey = getVideoTestimonialIdempotencyKey(
    data.requestId || `vt-${Date.now()}`,
    `reminder-${data.reminderNumber}`,
    data.toEmail
  );

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.customerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    tags: [
      { name: "template", value: templateName },
      ...(data.requestId
        ? [{ name: "request_id", value: data.requestId }]
        : []),
      ...(data.organizationId
        ? [{ name: "organization_id", value: data.organizationId }]
        : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject,
    templateName,
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
  });

  return result;
}

// Send video testimonial received notification email (sent to LO)
export async function sendVideoTestimonialReceivedEmail(
  data: VideoTestimonialReceivedEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const fromAddress = getFromAddress();
  const { subject, html } = getVideoTestimonialReceivedEmail(data);
  const idempotencyKey = getVideoTestimonialIdempotencyKey(
    data.testimonialId || `vt-${Date.now()}`,
    "received",
    data.toEmail
  );

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.loanOfficerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    tags: [
      { name: "template", value: "video_testimonial_received" },
      ...(data.testimonialId
        ? [{ name: "testimonial_id", value: data.testimonialId }]
        : []),
      ...(data.organizationId
        ? [{ name: "organization_id", value: data.organizationId }]
        : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.loanOfficerName,
    fromEmail: emailConfig.defaultFromEmail,
    subject,
    templateName: "video_testimonial_received",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
  });

  return result;
}

// Send video testimonial approved notification email (sent to LO)
export async function sendVideoTestimonialApprovedEmail(
  data: VideoTestimonialApprovedEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getVideoTestimonialApprovedEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "video_testimonial_approved" },
        ...(data.testimonialId
          ? [{ name: "testimonial_id", value: data.testimonialId }]
          : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.loanOfficerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "video_testimonial_approved",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "video_testimonial_approved",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "video_testimonial_approved",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send video testimonial pending approval notification email (sent to manager)
export async function sendVideoTestimonialPendingApprovalEmail(
  data: VideoTestimonialPendingApprovalEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getVideoTestimonialPendingApprovalEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "video_testimonial_pending_approval" },
        ...(data.testimonialId
          ? [{ name: "testimonial_id", value: data.testimonialId }]
          : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.managerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "video_testimonial_pending_approval",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.managerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "video_testimonial_pending_approval",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.managerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "video_testimonial_pending_approval",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// SURVEY LIFECYCLE EMAILS (S078)
// =============================================================================

// Send survey completion thank you email
export async function sendSurveyCompletionThankYouEmail(
  data: SurveyCompletionThankYouEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getSurveyCompletionThankYouEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "survey_completion_thank_you" },
        { name: "survey_type", value: data.surveyType },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.customerName,
        fromEmail: emailConfig.defaultFromEmail,
        fromName: data.organizationName,
        subject,
        templateName: "survey_completion_thank_you",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "survey_completion_thank_you",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "survey_completion_thank_you",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send high-rating follow-up email with Google review CTA
// Supports A/B testing subject lines via subjectVariant parameter
export async function sendSurveyHighRatingFollowUpEmail(
  data: SurveyHighRatingFollowUpEmailData,
  subjectVariant?: "question" | "statement"
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getSurveyHighRatingFollowUpEmail({
    ...data,
    subjectVariant,
  });

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "survey_high_rating_followup" },
        { name: "survey_type", value: data.surveyType },
        { name: "rating", value: String(data.rating) },
        ...(subjectVariant
          ? [{ name: "subject_variant", value: subjectVariant }]
          : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.customerName,
        fromEmail: emailConfig.defaultFromEmail,
        fromName: data.organizationName,
        subject,
        templateName: "survey_high_rating_followup",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "survey_high_rating_followup",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "survey_high_rating_followup",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send low-rating follow-up email with empathy messaging
export async function sendSurveyLowRatingFollowUpEmail(
  data: SurveyLowRatingFollowUpEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getSurveyLowRatingFollowUpEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "survey_low_rating_followup" },
        { name: "survey_type", value: data.surveyType },
        { name: "rating", value: String(data.rating) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.customerName,
        fromEmail: emailConfig.defaultFromEmail,
        fromName: data.organizationName,
        subject,
        templateName: "survey_low_rating_followup",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "survey_low_rating_followup",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "survey_low_rating_followup",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send survey response notification to loan officer
export async function sendSurveyResponseReceivedNotificationEmail(
  data: SurveyResponseReceivedNotificationEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getSurveyResponseReceivedNotificationEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "survey_response_received_notification" },
        { name: "survey_type", value: data.surveyType },
        { name: "rating", value: String(data.rating) },
        ...(data.surveyResponseId
          ? [{ name: "survey_response_id", value: data.surveyResponseId }]
          : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.loanOfficerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "survey_response_received_notification",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "survey_response_received_notification",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "survey_response_received_notification",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// REVIEW LIFECYCLE EMAILS (S079)
// =============================================================================

// Send review pending approval notification to manager
export async function sendReviewPendingApprovalEmail(
  data: ReviewPendingApprovalEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getReviewPendingApprovalEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "review_pending_approval" },
        { name: "rating", value: String(data.rating) },
        ...(data.reviewId ? [{ name: "review_id", value: data.reviewId }] : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.managerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "review_pending_approval",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.managerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_pending_approval",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.managerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_pending_approval",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send review approved notification to loan officer
export async function sendReviewApprovedEmail(
  data: ReviewApprovedEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getReviewApprovedEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "review_approved" },
        { name: "rating", value: String(data.rating) },
        ...(data.reviewId ? [{ name: "review_id", value: data.reviewId }] : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.loanOfficerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "review_approved",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_approved",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_approved",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send review rejected notification to loan officer
export async function sendReviewRejectedEmail(
  data: ReviewRejectedEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getReviewRejectedEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "review_rejected" },
        { name: "rating", value: String(data.rating) },
        ...(data.reviewId ? [{ name: "review_id", value: data.reviewId }] : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.loanOfficerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "review_rejected",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_rejected",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_rejected",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send review response confirmation to customer
export async function sendReviewResponseSentConfirmationEmail(
  data: ReviewResponseSentConfirmationEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getReviewResponseSentConfirmationEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "review_response_sent_confirmation" },
        { name: "rating", value: String(data.rating) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.customerName,
        fromEmail: emailConfig.defaultFromEmail,
        fromName: data.organizationName,
        subject,
        templateName: "review_response_sent_confirmation",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "review_response_sent_confirmation",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "review_response_sent_confirmation",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send review published notification to loan officer
export async function sendReviewPublishedNotificationEmail(
  data: ReviewPublishedNotificationEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getReviewPublishedNotificationEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "review_published_notification" },
        { name: "rating", value: String(data.rating) },
        { name: "platform", value: data.publishedPlatform },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.loanOfficerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "review_published_notification",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_published_notification",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_published_notification",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send review response received notification to loan officer
export async function sendReviewResponseReceivedEmail(
  data: ReviewResponseReceivedEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getReviewResponseReceivedEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "review_response_received" },
        { name: "rating", value: String(data.rating) },
        ...(data.reviewId ? [{ name: "review_id", value: data.reviewId }] : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.loanOfficerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "review_response_received",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_response_received",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.loanOfficerName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "review_response_received",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send enhanced negative review alert with AI suggestions
export async function sendNegativeReviewAlertEnhancedEmail(
  data: NegativeReviewAlertEnhancedEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getNegativeReviewAlertEnhancedEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "negative_review_alert_enhanced" },
        { name: "rating", value: String(data.rating) },
        ...(data.reviewId ? [{ name: "review_id", value: data.reviewId }] : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.recipientName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "negative_review_alert_enhanced",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.recipientName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "negative_review_alert_enhanced",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.recipientName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "negative_review_alert_enhanced",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// MILESTONE & ACHIEVEMENT EMAIL SEND FUNCTIONS (S081)
// =============================================================================

// Send first review milestone email
export async function sendFirstReviewMilestoneEmail(
  data: FirstReviewMilestoneEmailData
): Promise<EmailSendResult> {
  // Check user email preferences for milestone category
  const preferenceCheck = await shouldSendEmail("milestone_first_review", data.loanOfficerId);
  if (!preferenceCheck.allowed) {
    return { success: false, error: preferenceCheck.reason || "User has disabled milestone emails" };
  }

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = await renderFirstReviewMilestoneEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "milestone_first_review" },
        { name: "milestone_id", value: data.milestoneId },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "milestone_first_review",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_first_review",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_first_review",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send review count milestone email
export async function sendReviewCountMilestoneEmail(
  data: ReviewCountMilestoneEmailData
): Promise<EmailSendResult> {
  // Check user email preferences for milestone category
  const preferenceCheck = await shouldSendEmail("milestone_review_count", data.loanOfficerId);
  if (!preferenceCheck.allowed) {
    return { success: false, error: preferenceCheck.reason || "User has disabled milestone emails" };
  }

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = await renderReviewCountMilestoneEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "milestone_review_count" },
        { name: "milestone_id", value: data.milestoneId },
        { name: "review_count", value: String(data.reviewCount) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "milestone_review_count",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_review_count",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_review_count",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send first 5-star milestone email
export async function sendFirst5StarMilestoneEmail(
  data: First5StarMilestoneEmailData
): Promise<EmailSendResult> {
  // Check user email preferences for milestone category
  const preferenceCheck = await shouldSendEmail("milestone_first_5_star", data.loanOfficerId);
  if (!preferenceCheck.allowed) {
    return { success: false, error: preferenceCheck.reason || "User has disabled milestone emails" };
  }

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = await renderFirst5StarMilestoneEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "milestone_first_5_star" },
        { name: "milestone_id", value: data.milestoneId },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "milestone_first_5_star",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_first_5_star",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_first_5_star",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send leaderboard milestone email
export async function sendLeaderboardMilestoneEmail(
  data: LeaderboardMilestoneEmailData
): Promise<EmailSendResult> {
  // Check user email preferences for milestone category
  const preferenceCheck = await shouldSendEmail("milestone_leaderboard", data.loanOfficerId);
  if (!preferenceCheck.allowed) {
    return { success: false, error: preferenceCheck.reason || "User has disabled milestone emails" };
  }

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = await renderLeaderboardMilestoneEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "milestone_leaderboard" },
        { name: "milestone_id", value: data.milestoneId },
        { name: "achievement_type", value: data.achievementType },
        { name: "current_rank", value: String(data.currentRank) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "milestone_leaderboard",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_leaderboard",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_leaderboard",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send badge earned milestone email
export async function sendBadgeEarnedMilestoneEmail(
  data: BadgeEarnedMilestoneEmailData
): Promise<EmailSendResult> {
  // Check user email preferences for milestone category
  const preferenceCheck = await shouldSendEmail("milestone_badge_earned", data.loanOfficerId);
  if (!preferenceCheck.allowed) {
    return { success: false, error: preferenceCheck.reason || "User has disabled milestone emails" };
  }

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = await renderBadgeEarnedMilestoneEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "milestone_badge_earned" },
        { name: "milestone_id", value: data.milestoneId },
        { name: "badge_name", value: data.badgeName },
        ...(data.badgeTier ? [{ name: "badge_tier", value: data.badgeTier }] : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "milestone_badge_earned",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_badge_earned",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_badge_earned",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send streak milestone email
export async function sendStreakMilestoneEmail(
  data: StreakMilestoneEmailData
): Promise<EmailSendResult> {
  // Check user email preferences for milestone category
  const preferenceCheck = await shouldSendEmail("milestone_streak", data.loanOfficerId);
  if (!preferenceCheck.allowed) {
    return { success: false, error: preferenceCheck.reason || "User has disabled milestone emails" };
  }

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = await renderStreakMilestoneEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "milestone_streak" },
        { name: "milestone_id", value: data.milestoneId },
        { name: "streak_days", value: String(data.streakDays) },
        { name: "streak_type", value: data.streakType },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "milestone_streak",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_streak",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_streak",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send video milestone email
export async function sendVideoMilestoneEmail(
  data: VideoMilestoneEmailData
): Promise<EmailSendResult> {
  // Check user email preferences for milestone category
  const preferenceCheck = await shouldSendEmail("milestone_video", data.loanOfficerId);
  if (!preferenceCheck.allowed) {
    return { success: false, error: preferenceCheck.reason || "User has disabled milestone emails" };
  }

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = await renderVideoMilestoneEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "milestone_video" },
        { name: "milestone_id", value: data.milestoneId },
        { name: "video_count", value: String(data.videoCount) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "user_id", value: data.loanOfficerId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "milestone_video",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_video",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "milestone_video",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Trial Ending Sequence Emails (S085)
// ============================================================================

// Send trial ending email 1 - Accomplishments summary (7 days before)
export async function sendTrialEnding1AccomplishmentsEmail(
  data: TrialEnding1AccomplishmentsEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getTrialEnding1AccomplishmentsEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "trial_ending_1_accomplishments" },
        { name: "days_remaining", value: String(data.daysRemaining) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "trial_ending_1_accomplishments",
        organizationId: data.organizationId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_1_accomplishments",
      organizationId: data.organizationId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_1_accomplishments",
      organizationId: data.organizationId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send trial ending email 2 - Feature comparison (3 days before)
export async function sendTrialEnding2FeatureComparisonEmail(
  data: TrialEnding2FeatureComparisonEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getTrialEnding2FeatureComparisonEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "trial_ending_2_feature_comparison" },
        { name: "days_remaining", value: String(data.daysRemaining) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "trial_ending_2_feature_comparison",
        organizationId: data.organizationId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_2_feature_comparison",
      organizationId: data.organizationId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_2_feature_comparison",
      organizationId: data.organizationId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send trial ending email 3 - Final reminder (1 day before)
export async function sendTrialEnding3FinalReminderEmail(
  data: TrialEnding3FinalReminderEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getTrialEnding3FinalReminderEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "trial_ending_3_final_reminder" },
        { name: "days_remaining", value: String(data.daysRemaining) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        { name: "ab_variant", value: data.messageVariant },
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "trial_ending_3_final_reminder",
        organizationId: data.organizationId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_3_final_reminder",
      organizationId: data.organizationId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_3_final_reminder",
      organizationId: data.organizationId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send trial ending email 4 - Grace period (trial ended)
export async function sendTrialEnding4GracePeriodEmail(
  data: TrialEnding4GracePeriodEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getTrialEnding4GracePeriodEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "trial_ending_4_grace_period" },
        { name: "grace_period_days", value: String(data.gracePeriodDays) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "trial_ending_4_grace_period",
        organizationId: data.organizationId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_4_grace_period",
      organizationId: data.organizationId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_4_grace_period",
      organizationId: data.organizationId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send trial ending email 5 - Win-back offer (3 days after)
export async function sendTrialEnding5WinbackEmail(
  data: TrialEnding5WinbackEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getTrialEnding5WinbackEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "trial_ending_5_winback" },
        { name: "days_since_trial_ended", value: String(data.daysSinceTrialEnded) },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.specialOffer
          ? [{ name: "has_special_offer", value: "true" }]
          : []),
        { name: "is_high_value", value: String(data.isHighValueProspect) },
      ],
    });

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.firstName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "trial_ending_5_winback",
        organizationId: data.organizationId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_5_winback",
      organizationId: data.organizationId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName: "trial_ending_5_winback",
      organizationId: data.organizationId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// =============================================================================
// PROFILE REFERRAL INTRODUCTION EMAIL
// =============================================================================

/**
 * Send profile referral introduction email.
 * Called when someone refers a friend via a professional's public profile page.
 */
export async function sendProfileReferralIntroductionEmail(
  data: ProfileReferralIntroductionEmailData,
  referralId: string
): Promise<EmailSendResult> {
  // Check unsubscribe status
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } =
    await renderProfileReferralIntroductionEmail(data);
  const idempotencyKey = `profile-referral-intro-${referralId}`;

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.referredName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    tags: [
      { name: "template", value: "profile_referral_introduction" },
      { name: "referral_id", value: referralId },
      ...(data.organizationId
        ? [{ name: "organization_id", value: data.organizationId }]
        : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.referredName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject,
    templateName: "profile_referral_introduction",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
  });

  return result;
}
