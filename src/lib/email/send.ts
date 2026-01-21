"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
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
      loan_officer_id: params.loanOfficerId,
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

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getSurveyInvitationEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "survey_invitation" },
        ...(data.surveyId ? [{ name: "survey_id", value: data.surveyId }] : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
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
        templateName: "survey_invitation",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        surveyId: data.surveyId,
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
      templateName: "survey_invitation",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      surveyId: data.surveyId,
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
      templateName: "survey_invitation",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      surveyId: data.surveyId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send survey reminder email (3-day or 7-day)
export async function sendSurveyReminderEmail(
  data: SurveyReminderEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const templateName: EmailTemplate =
    data.reminderNumber === 1 ? "survey_reminder_3day" : "survey_reminder_7day";
  const { subject, html } =
    data.reminderNumber === 1
      ? getSurveyReminder3DayEmail(data)
      : getSurveyReminder7DayEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: templateName },
        ...(data.surveyId ? [{ name: "survey_id", value: data.surveyId }] : []),
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
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
        templateName,
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        surveyId: data.surveyId,
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
      templateName,
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      surveyId: data.surveyId,
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
      templateName,
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      surveyId: data.surveyId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send new review notification email
export async function sendNewReviewNotificationEmail(
  data: NewReviewNotificationEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getNewReviewNotificationEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "new_review_notification" },
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
        templateName: "new_review_notification",
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
      templateName: "new_review_notification",
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
      templateName: "new_review_notification",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
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

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getReviewResponseToReviewerEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
      tags: [
        { name: "template", value: "review_response_to_reviewer" },
        ...(data.organizationId
          ? [{ name: "organization_id", value: data.organizationId }]
          : []),
        ...(data.loanOfficerId
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
        templateName: "review_response_to_reviewer",
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
      templateName: "review_response_to_reviewer",
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
      templateName: "review_response_to_reviewer",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Video Testimonial Email Send Functions
// ============================================================================

// Send video testimonial invitation email
export async function sendVideoTestimonialInvitationEmail(
  data: VideoTestimonialInvitationEmailData
): Promise<EmailSendResult> {
  console.error("[Email] sendVideoTestimonialInvitationEmail called", {
    requestId: data.requestId,
  });

  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    console.error("[Email] Email is unsubscribed", { requestId: data.requestId });
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const { subject, html } = getVideoTestimonialInvitationEmail(data);

  console.error("[Email] Sending via Resend", {
    requestId: data.requestId,
    subject,
    htmlLength: html?.length,
  });

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
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

    console.error("[Email] Resend response", {
      hasError: !!response.error,
      errorMessage: response.error?.message,
      messageId: response.data?.id,
    });

    if (response.error) {
      console.error("[Email] Resend returned error", { error: response.error });
      await logEmail({
        toEmail: data.toEmail,
        toName: data.customerName,
        fromEmail: emailConfig.defaultFromEmail,
        fromName: data.organizationName,
        subject,
        templateName: "video_testimonial_invitation",
        organizationId: data.organizationId,
        loanOfficerId: data.loanOfficerId,
        status: "failed",
        errorMessage: response.error.message,
      });

      return { success: false, error: response.error.message };
    }

    console.error("[Email] Email sent successfully", { messageId: response.data?.id });
    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "video_testimonial_invitation",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      resendMessageId: response.data?.id,
      status: "sent",
    });

    return { success: true, messageId: response.data?.id };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("[Email] Exception sending email", { error: errorMessage });
    await logEmail({
      toEmail: data.toEmail,
      toName: data.customerName,
      fromEmail: emailConfig.defaultFromEmail,
      fromName: data.organizationName,
      subject,
      templateName: "video_testimonial_invitation",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send video testimonial reminder email (3-day or 7-day)
export async function sendVideoTestimonialReminderEmail(
  data: VideoTestimonialReminderEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress(data.organizationName);
  const templateName: EmailTemplate =
    data.reminderNumber === 1
      ? "video_testimonial_reminder_3day"
      : "video_testimonial_reminder_7day";
  const { subject, html } =
    data.reminderNumber === 1
      ? getVideoTestimonialReminder3DayEmail(data)
      : getVideoTestimonialReminder7DayEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
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

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.customerName,
        fromEmail: emailConfig.defaultFromEmail,
        fromName: data.organizationName,
        subject,
        templateName,
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
      templateName,
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
      templateName,
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}

// Send video testimonial received notification email (sent to LO)
export async function sendVideoTestimonialReceivedEmail(
  data: VideoTestimonialReceivedEmailData
): Promise<EmailSendResult> {
  const unsubscribed = await isEmailUnsubscribed(data.toEmail);
  if (unsubscribed) {
    return { success: false, error: "Email is unsubscribed" };
  }

  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const { subject, html } = getVideoTestimonialReceivedEmail(data);

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: data.toEmail,
      subject,
      html,
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

    if (response.error) {
      await logEmail({
        toEmail: data.toEmail,
        toName: data.loanOfficerName,
        fromEmail: emailConfig.defaultFromEmail,
        subject,
        templateName: "video_testimonial_received",
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
      templateName: "video_testimonial_received",
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
      templateName: "video_testimonial_received",
      organizationId: data.organizationId,
      loanOfficerId: data.loanOfficerId,
      status: "failed",
      errorMessage,
    });

    return { success: false, error: errorMessage };
  }
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
          ? [{ name: "loan_officer_id", value: data.loanOfficerId }]
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
