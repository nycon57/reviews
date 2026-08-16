import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import {
  sendWithReliability,
  getSurveyInvitationIdempotencyKey,
  getSurveyReminderIdempotencyKey,
  getReviewNotificationIdempotencyKey,
  getVideoTestimonialIdempotencyKey,
  getMilestoneIdempotencyKey,
  shouldSendEmail,
} from "./send-utils";
import type { EmailTypeSendResolver } from "@/lib/email-ab-testing/overrides";
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
  RatingImprovementMilestoneEmailData,
  NpsImprovementMilestoneEmailData,
  LeaderboardMilestoneEmailData,
  BadgeEarnedMilestoneEmailData,
  StreakMilestoneEmailData,
  ProfileCompletionMilestoneEmailData,
  VideoMilestoneEmailData,
  // Trial ending email types (S085)
  TrialEnding1AccomplishmentsEmailData,
  TrialEnding2FeatureComparisonEmailData,
  TrialEnding3FinalReminderEmailData,
  TrialEnding4GracePeriodEmailData,
  TrialEnding5WinbackEmailData,
  // Profile referral introduction
  ProfileReferralIntroductionEmailData,
  // Review verification (direct review submissions)
  ReviewVerificationEmailData,
  ReviewVideoUpsellEmailData,
  // Review dispute escalation (individual account disputes)
  ReviewDisputeEscalationEmailData,
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
  renderRatingImprovementMilestoneEmail,
  renderNpsImprovementMilestoneEmail,
  renderLeaderboardMilestoneEmail,
  renderBadgeEarnedMilestoneEmail,
  renderStreakMilestoneEmail,
  renderProfileCompletionMilestoneEmail,
  renderVideoMilestoneEmail,
} from "./templates/milestones";
import {
  getTrialEnding1AccomplishmentsEmail,
  getTrialEnding2FeatureComparisonEmail,
  getTrialEnding3FinalReminderEmail,
  getTrialEnding4GracePeriodEmail,
  getTrialEnding5WinbackEmail,
} from "./trial-ending-templates";
import {
  renderProfileReferralIntroductionEmail,
  renderReviewVerificationEmail,
  renderReviewVideoUpsellEmail,
  renderReviewDisputeEscalationEmail,
} from "./templates/index";
import { resolveTemplateById } from "@/lib/email-builder/template-resolver";
import { contactPageUrlToOneClickUrl } from "@/lib/contacts/tokens";

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
  requestId?: string;
  surveyId?: string;
  resendMessageId?: string;
  status: string;
  errorMessage?: string;
  abTestId?: string;
  abTestVariant?: string;
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
      request_id: params.requestId,
      survey_id: params.surveyId,
      resend_message_id: params.resendMessageId,
      status: params.status,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
      error_message: params.errorMessage,
      ab_test_id: params.abTestId ?? null,
      ab_test_variant: params.abTestVariant ?? null,
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

  // Use custom template if specified, otherwise fall back to default
  let subject: string;
  let html: string;
  if (data.customTemplateId) {
    const resolved = await resolveTemplateById(data.customTemplateId, {
      customer_name: data.customerName,
      customer_first_name: data.customerName.split(" ")[0],
      professional_name: data.loanOfficerName,
      professional_first_name: data.loanOfficerName.split(" ")[0],
      company_name: data.organizationName,
      company_logo_url: data.organizationLogoUrl ?? "",
      survey_link: data.surveyUrl,
      review_link: data.surveyUrl,
      unsubscribe_link: "#",
    });
    subject = resolved.subject;
    html = resolved.html;
  } else {
    const defaultEmail = getSurveyInvitationEmail(data);
    subject = defaultEmail.subject;
    html = defaultEmail.html;
  }

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
    // Enable send-time A/B resolution only for the default template — a custom
    // template's subject is the org's explicit choice and must not be swapped.
    organizationId: data.organizationId,
    emailType: data.customTemplateId ? undefined : "survey_invitation",
    // Contact-linked acquisition sends: machine one-click → Contact suppression.
    listUnsubscribeUrl: data.unsubscribeUrl
      ? (contactPageUrlToOneClickUrl(data.unsubscribeUrl) ?? undefined)
      : undefined,
    tags: [
      { name: "template", value: "survey_invitation" },
      ...(data.surveyId ? [{ name: "survey_id", value: data.surveyId }] : []),
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject: result.effectiveSubject ?? subject,
    templateName: "survey_invitation",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    surveyId: data.surveyId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
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
    data.reminderNumber === 1 ? getSurveyReminder3DayEmail(data) : getSurveyReminder7DayEmail(data);
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
    organizationId: data.organizationId,
    emailType: templateName,
    listUnsubscribeUrl: data.unsubscribeUrl
      ? (contactPageUrlToOneClickUrl(data.unsubscribeUrl) ?? undefined)
      : undefined,
    tags: [
      { name: "template", value: templateName },
      ...(data.surveyId ? [{ name: "survey_id", value: data.surveyId }] : []),
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject: result.effectiveSubject ?? subject,
    templateName,
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    surveyId: data.surveyId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
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
    organizationId: data.organizationId,
    emailType: "new_review_notification",
    tags: [
      { name: "template", value: "new_review_notification" },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.loanOfficerName,
    fromEmail: emailConfig.defaultFromEmail,
    subject: result.effectiveSubject ?? subject,
    templateName: "new_review_notification",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
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
    ? Array.from(
        new Uint8Array(
          await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.responseText))
        )
      )
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
    organizationId: data.organizationId,
    emailType: "review_response_to_reviewer",
    tags: [
      { name: "template", value: "review_response_to_reviewer" },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject: result.effectiveSubject ?? subject,
    templateName: "review_response_to_reviewer",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
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
    organizationId: data.organizationId,
    emailType: "video_testimonial_invitation",
    listUnsubscribeUrl: data.unsubscribeUrl
      ? (contactPageUrlToOneClickUrl(data.unsubscribeUrl) ?? undefined)
      : undefined,
    tags: [
      { name: "template", value: "video_testimonial_invitation" },
      ...(data.requestId ? [{ name: "request_id", value: data.requestId }] : []),
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
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
    subject: result.effectiveSubject ?? subject,
    templateName: "video_testimonial_invitation",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    requestId: data.requestId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
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
    organizationId: data.organizationId,
    emailType: templateName,
    tags: [
      { name: "template", value: templateName },
      ...(data.requestId ? [{ name: "request_id", value: data.requestId }] : []),
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject: result.effectiveSubject ?? subject,
    templateName,
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    requestId: data.requestId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
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
    organizationId: data.organizationId,
    emailType: "video_testimonial_received",
    tags: [
      { name: "template", value: "video_testimonial_received" },
      ...(data.testimonialId ? [{ name: "testimonial_id", value: data.testimonialId }] : []),
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.loanOfficerName,
    fromEmail: emailConfig.defaultFromEmail,
    subject: result.effectiveSubject ?? subject,
    templateName: "video_testimonial_received",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
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
        ...(data.testimonialId ? [{ name: "testimonial_id", value: data.testimonialId }] : []),
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.testimonialId ? [{ name: "testimonial_id", value: data.testimonialId }] : []),
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(subjectVariant ? [{ name: "subject_variant", value: subjectVariant }] : []),
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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

type MilestoneSendData = {
  toEmail: string;
  firstName: string;
  organizationId?: string;
  loanOfficerId?: string;
  milestoneId: string;
};

async function sendRenderedMilestoneEmail(
  data: MilestoneSendData,
  templateName: EmailTemplate,
  subject: string,
  html: string,
  tags: Array<{ name: string; value: string }>,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const preferenceCheck = await shouldSendEmail(templateName, data.loanOfficerId);
  if (!preferenceCheck.allowed) {
    return {
      success: false,
      error: preferenceCheck.reason || "User has disabled milestone emails",
    };
  }

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  try {
    const result = await sendWithReliability({
      to: data.toEmail,
      from: getFromAddress(),
      subject,
      html,
      idempotencyKey: getMilestoneIdempotencyKey(
        data.loanOfficerId || data.toEmail.toLowerCase(),
        templateName,
        data.milestoneId
      ),
      userId: data.loanOfficerId,
      isTransactional: true,
      organizationId: data.organizationId,
      emailType: templateName,
      emailTypeSendResolver,
      tags,
    });

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject: result.effectiveSubject ?? subject,
      templateName,
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: result.messageId,
      status: result.success ? "sent" : "failed",
      errorMessage: result.error,
      abTestId: result.abTestId,
      abTestVariant: result.abTestVariant,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await logEmail({
      toEmail: data.toEmail,
      toName: data.firstName,
      fromEmail: emailConfig.defaultFromEmail,
      subject,
      templateName,
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send first review milestone email
export async function sendFirstReviewMilestoneEmail(
  data: FirstReviewMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderFirstReviewMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_first_review",
    subject,
    html,
    [
      { name: "template", value: "milestone_first_review" },
      { name: "milestone_id", value: data.milestoneId },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send review count milestone email
export async function sendReviewCountMilestoneEmail(
  data: ReviewCountMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderReviewCountMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_review_count",
    subject,
    html,
    [
      { name: "template", value: "milestone_review_count" },
      { name: "milestone_id", value: data.milestoneId },
      { name: "review_count", value: String(data.reviewCount) },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send first 5-star milestone email
export async function sendFirst5StarMilestoneEmail(
  data: First5StarMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderFirst5StarMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_first_5_star",
    subject,
    html,
    [
      { name: "template", value: "milestone_first_5_star" },
      { name: "milestone_id", value: data.milestoneId },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send rating improvement milestone email
export async function sendRatingImprovementMilestoneEmail(
  data: RatingImprovementMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderRatingImprovementMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_rating_improvement",
    subject,
    html,
    [
      { name: "template", value: "milestone_rating_improvement" },
      { name: "milestone_id", value: data.milestoneId },
      { name: "previous_rating", value: String(data.previousRating) },
      { name: "current_rating", value: String(data.currentRating) },
      { name: "improvement_amount", value: String(data.improvementAmount) },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send NPS improvement milestone email
export async function sendNpsImprovementMilestoneEmail(
  data: NpsImprovementMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderNpsImprovementMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_nps_improvement",
    subject,
    html,
    [
      { name: "template", value: "milestone_nps_improvement" },
      { name: "milestone_id", value: data.milestoneId },
      { name: "previous_nps", value: String(data.previousNps) },
      { name: "current_nps", value: String(data.currentNps) },
      { name: "improvement_amount", value: String(data.improvementAmount) },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send leaderboard milestone email
export async function sendLeaderboardMilestoneEmail(
  data: LeaderboardMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderLeaderboardMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_leaderboard",
    subject,
    html,
    [
      { name: "template", value: "milestone_leaderboard" },
      { name: "milestone_id", value: data.milestoneId },
      { name: "achievement_type", value: data.achievementType },
      { name: "current_rank", value: String(data.currentRank) },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send badge earned milestone email
export async function sendBadgeEarnedMilestoneEmail(
  data: BadgeEarnedMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderBadgeEarnedMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_badge_earned",
    subject,
    html,
    [
      { name: "template", value: "milestone_badge_earned" },
      { name: "milestone_id", value: data.milestoneId },
      { name: "badge_name", value: data.badgeName },
      ...(data.badgeTier ? [{ name: "badge_tier", value: data.badgeTier }] : []),
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send streak milestone email
export async function sendStreakMilestoneEmail(
  data: StreakMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderStreakMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_streak",
    subject,
    html,
    [
      { name: "template", value: "milestone_streak" },
      { name: "milestone_id", value: data.milestoneId },
      { name: "streak_days", value: String(data.streakDays) },
      { name: "streak_type", value: data.streakType },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send profile completion milestone email
export async function sendProfileCompletionMilestoneEmail(
  data: ProfileCompletionMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderProfileCompletionMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_profile_completion",
    subject,
    html,
    [
      { name: "template", value: "milestone_profile_completion" },
      { name: "milestone_id", value: data.milestoneId },
      { name: "completion_percent", value: String(data.completionPercent) },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
}

// Send video milestone email
export async function sendVideoMilestoneEmail(
  data: VideoMilestoneEmailData,
  emailTypeSendResolver?: EmailTypeSendResolver
): Promise<EmailSendResult> {
  const { subject, html } = await renderVideoMilestoneEmail(data);
  return sendRenderedMilestoneEmail(
    data,
    "milestone_video",
    subject,
    html,
    [
      { name: "template", value: "milestone_video" },
      { name: "milestone_id", value: data.milestoneId },
      { name: "video_count", value: String(data.videoCount) },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
      ...(data.loanOfficerId ? [{ name: "user_id", value: data.loanOfficerId }] : []),
    ],
    emailTypeSendResolver
  );
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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
        ...(data.specialOffer ? [{ name: "has_special_offer", value: "true" }] : []),
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
  const { subject, html } = await renderProfileReferralIntroductionEmail(data);
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
    organizationId: data.organizationId,
    emailType: "profile_referral_introduction",
    tags: [
      { name: "template", value: "profile_referral_introduction" },
      { name: "referral_id", value: referralId },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.referredName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject: result.effectiveSubject ?? subject,
    templateName: "profile_referral_introduction",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
  });

  return result;
}

// =============================================================================
// REVIEW VERIFICATION EMAIL
// =============================================================================

/**
 * Send review verification email for a direct (pro-page) review submission.
 * The reviewer must click the link to publish their review. This is a
 * consent-critical transactional email, so it intentionally skips the
 * unsubscribe check: without it the reviewer could never verify.
 */
export async function sendReviewVerificationEmail(
  data: ReviewVerificationEmailData
): Promise<EmailSendResult> {
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = await renderReviewVerificationEmail(data);
  const idempotencyKey = `review-verification-${data.reviewId}`;

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.customerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    organizationId: data.organizationId,
    emailType: "review_verification",
    tags: [
      { name: "template", value: "review_verification" },
      { name: "review_id", value: data.reviewId },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject: result.effectiveSubject ?? subject,
    templateName: "review_verification",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
  });

  return result;
}

/**
 * Send the review video upsell email inviting a published text reviewer to
 * record a quick video version. Idempotent per review.
 */
export async function sendReviewVideoUpsellEmail(
  data: ReviewVideoUpsellEmailData
): Promise<EmailSendResult> {
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = await renderReviewVideoUpsellEmail(data);
  const idempotencyKey = `review-video-upsell-${data.reviewId}`;

  const result = await sendWithReliability({
    to: data.toEmail,
    toName: data.customerName,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    userId: data.loanOfficerId,
    isTransactional: true,
    organizationId: data.organizationId,
    emailType: "review_video_upsell",
    tags: [
      { name: "template", value: "review_video_upsell" },
      { name: "review_id", value: data.reviewId },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    toName: data.customerName,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: data.organizationName,
    subject: result.effectiveSubject ?? subject,
    templateName: "review_video_upsell",
    organizationId: data.organizationId,
    loanOfficerId: data.loanOfficerId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
  });

  return result;
}

/**
 * Send a review dispute escalation email to the RepWell moderation team.
 * Used for individual accounts, which cannot adjudicate their own disputes.
 */
export async function sendReviewDisputeEscalationEmail(
  data: ReviewDisputeEscalationEmailData
): Promise<EmailSendResult> {
  const fromAddress = getFromAddress("RepWell");
  const { subject, html } = await renderReviewDisputeEscalationEmail(data);
  const idempotencyKey = `review-dispute-escalation-${data.flagId}`;

  const result = await sendWithReliability({
    to: data.toEmail,
    from: fromAddress,
    subject,
    html,
    idempotencyKey,
    isTransactional: true,
    organizationId: data.organizationId,
    emailType: "review_dispute_escalation",
    tags: [
      { name: "template", value: "review_dispute_escalation" },
      { name: "review_id", value: data.reviewId },
      ...(data.organizationId ? [{ name: "organization_id", value: data.organizationId }] : []),
    ],
  });

  // Log email result
  await logEmail({
    toEmail: data.toEmail,
    fromEmail: emailConfig.defaultFromEmail,
    fromName: "RepWell",
    subject: result.effectiveSubject ?? subject,
    templateName: "review_dispute_escalation",
    organizationId: data.organizationId,
    resendMessageId: result.messageId,
    status: result.success ? "sent" : "failed",
    errorMessage: result.error,
    abTestId: result.abTestId,
    abTestVariant: result.abTestVariant,
  });

  return result;
}
