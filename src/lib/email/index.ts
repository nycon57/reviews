// Email service module - integrates with Resend for transactional emails
export { getResendClient, emailConfig, getFromAddress } from "./client";

export type {
  EmailTemplate,
  BaseEmailData,
  SurveyInvitationEmailData,
  SurveyReminderEmailData,
  NewReviewNotificationEmailData,
  ReviewPendingApprovalEmailData,
  ReviewApprovedEmailData,
  ReviewRejectedEmailData,
  ScheduledReportEmailData,
  NegativeReviewAlertEmailData,
  NotificationDigestEmailData,
  ReviewResponseToReviewerEmailData,
  VideoTestimonialInvitationEmailData,
  VideoTestimonialReminderEmailData,
  VideoTestimonialReceivedEmailData,
  VideoTestimonialApprovedEmailData,
  VideoTestimonialPendingApprovalEmailData,
  EmailSendResult,
  ResendWebhookEventType,
  ResendWebhookPayload,
  EmailLogEntry,
} from "./types";

export {
  sendSurveyInvitationEmail,
  sendSurveyReminderEmail,
  sendNewReviewNotificationEmail,
  sendReviewResponseEmail,
  sendVideoTestimonialInvitationEmail,
  sendVideoTestimonialReminderEmail,
  sendVideoTestimonialReceivedEmail,
  sendVideoTestimonialApprovedEmail,
  sendVideoTestimonialPendingApprovalEmail,
  updateEmailTrackingStatus,
} from "./send";

export {
  getSurveyInvitationEmail,
  getSurveyReminder3DayEmail,
  getSurveyReminder7DayEmail,
  getNewReviewNotificationEmail,
  getReviewPendingApprovalEmail,
  getReviewApprovedEmail,
  getReviewRejectedEmail,
  getScheduledReportEmail,
  getNegativeReviewAlertEmail,
  getNotificationDigestEmail,
  getReviewResponseToReviewerEmail,
  getVideoTestimonialInvitationEmail,
  getVideoTestimonialReminder3DayEmail,
  getVideoTestimonialReminder7DayEmail,
  getVideoTestimonialReceivedEmail,
  getVideoTestimonialApprovedEmail,
  getVideoTestimonialPendingApprovalEmail,
} from "./templates";
