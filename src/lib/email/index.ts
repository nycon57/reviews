// Email service module - integrates with Resend for transactional emails
export { getResendClient, emailConfig, getFromAddress } from "./client";

export type {
  EmailTemplate,
  BaseEmailData,
  SurveyInvitationEmailData,
  SurveyReminderEmailData,
  NewReviewNotificationEmailData,
  EmailSendResult,
  ResendWebhookEventType,
  ResendWebhookPayload,
  EmailLogEntry,
} from "./types";

export {
  sendSurveyInvitationEmail,
  sendSurveyReminderEmail,
  sendNewReviewNotificationEmail,
  updateEmailTrackingStatus,
} from "./send";

export {
  getSurveyInvitationEmail,
  getSurveyReminder3DayEmail,
  getSurveyReminder7DayEmail,
  getNewReviewNotificationEmail,
} from "./templates";
