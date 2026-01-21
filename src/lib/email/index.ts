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

// Welcome sequence service
export {
  startWelcomeSequence,
  processWelcomeSequenceQueue,
  pauseWelcomeSequence,
  resumeWelcomeSequence,
  getWelcomeSequenceStatus,
} from "./welcome-sequence-service";

// Org onboarding sequence service
export {
  startOrgOnboardingSequence,
  processOrgOnboardingSequenceQueue,
  pauseOrgOnboardingSequence,
  resumeOrgOnboardingSequence,
  getOrgOnboardingSequenceStatus,
  getOrgSetupProgress,
} from "./org-onboarding-service";

// Org onboarding email templates
export {
  getOrgOnboarding1WelcomeEmail,
  getOrgOnboarding2BrandingEmail,
  getOrgOnboarding3TeamEmail,
  getOrgOnboarding4IntegrationsEmail,
  getOrgOnboarding5BillingEmail,
  getOrgOnboarding6AdvancedEmail,
} from "./org-onboarding-templates";

// Types for org onboarding
export type {
  OrgOnboarding1WelcomeEmailData,
  OrgOnboarding2BrandingEmailData,
  OrgOnboarding3TeamEmailData,
  OrgOnboarding4IntegrationsEmailData,
  OrgOnboarding5BillingEmailData,
  OrgOnboarding6AdvancedEmailData,
  OrgOnboardingStatus,
} from "./types";

// Team invite sequence service
export {
  sendTeamInviteInitialEmail,
  sendTeamInviteWelcomeEmail,
  processTeamInviteQueue,
  getInviteFunnelStats,
  resendTeamInvite,
} from "./team-invite-service";

// Team invite email templates
export {
  getTeamInvite1InitialEmail,
  getTeamInvite2ReminderEmail,
  getTeamInvite3FinalReminderEmail,
  getTeamInvite4WelcomeEmail,
  getTeamInvite5ExpirationEmail,
} from "./team-invite-templates";

// Types for team invites
export type {
  TeamInviteEmailBaseData,
  TeamInvite1InitialEmailData,
  TeamInvite2ReminderEmailData,
  TeamInvite3FinalReminderEmailData,
  TeamInvite4WelcomeEmailData,
  TeamInvite5ExpirationEmailData,
} from "./types";
