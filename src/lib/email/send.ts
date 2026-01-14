"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type {
  EmailTemplate,
  EmailSendResult,
  SurveyInvitationEmailData,
  SurveyReminderEmailData,
  NewReviewNotificationEmailData,
} from "./types";
import {
  getSurveyInvitationEmail,
  getSurveyReminder3DayEmail,
  getSurveyReminder7DayEmail,
  getNewReviewNotificationEmail,
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
