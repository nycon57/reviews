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
  // Video testimonial lifecycle types (S080)
  VideoTestimonialBaseEmailData,
  VideoProcessingStartedEmailData,
  VideoProcessingCompleteEmailData,
  VideoApprovalNeededEmailData,
  VideoApprovedPublishedEmailData,
  VideoSharedEmailData,
  VideoCustomerThankYouEmailData,
  SurveyCompletionThankYouEmailData,
  SurveyHighRatingFollowUpEmailData,
  SurveyLowRatingFollowUpEmailData,
  SurveyResponseReceivedNotificationEmailData,
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
  sendSurveyCompletionThankYouEmail,
  sendSurveyHighRatingFollowUpEmail,
  sendSurveyLowRatingFollowUpEmail,
  sendSurveyResponseReceivedNotificationEmail,
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
  getSurveyCompletionThankYouEmail,
  getSurveyHighRatingFollowUpEmail,
  getSurveyLowRatingFollowUpEmail,
  getSurveyResponseReceivedNotificationEmail,
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

// Role-based feature onboarding sequence service
export {
  startRoleOnboardingSequence,
  processRoleOnboardingSequenceQueue,
  pauseRoleOnboardingSequence,
  resumeRoleOnboardingSequence,
  getRoleOnboardingSequenceStatus,
} from "./role-onboarding-service";

// Role-based feature onboarding email templates
export {
  getRoleOnboardingLO1DashboardEmail,
  getRoleOnboardingLO2SurveysEmail,
  getRoleOnboardingLO3SharingEmail,
  getRoleOnboardingLO4RespondingEmail,
  getRoleOnboardingLO5VideoEmail,
  getRoleOnboardingLO6MobileEmail,
  getRoleOnboardingLO7GoogleEmail,
  getRoleOnboardingMgr1TeamDashboardEmail,
  getRoleOnboardingMgr2ApprovalsEmail,
  getRoleOnboardingMgr3LeaderboardsEmail,
  getRoleOnboardingMgr4ReportsEmail,
  getRoleOnboardingMgr5CoachingEmail,
  getRoleOnboardingMgr6AnalyticsEmail,
  getRoleOnboardingAdmin1SettingsEmail,
  getRoleOnboardingAdmin2UsersEmail,
  getRoleOnboardingAdmin3IntegrationsEmail,
  getRoleOnboardingAdmin4BillingEmail,
  getRoleOnboardingAdmin5ComplianceEmail,
} from "./role-onboarding-templates";

// Types for role-based feature onboarding
export type {
  RoleOnboardingEmailBaseData,
  RoleOnboardingLO1DashboardEmailData,
  RoleOnboardingLO2SurveysEmailData,
  RoleOnboardingLO3SharingEmailData,
  RoleOnboardingLO4RespondingEmailData,
  RoleOnboardingLO5VideoEmailData,
  RoleOnboardingLO6MobileEmailData,
  RoleOnboardingLO7GoogleEmailData,
  RoleOnboardingMgr1TeamDashboardEmailData,
  RoleOnboardingMgr2ApprovalsEmailData,
  RoleOnboardingMgr3LeaderboardsEmailData,
  RoleOnboardingMgr4ReportsEmailData,
  RoleOnboardingMgr5CoachingEmailData,
  RoleOnboardingMgr6AnalyticsEmailData,
  RoleOnboardingAdmin1SettingsEmailData,
  RoleOnboardingAdmin2UsersEmailData,
  RoleOnboardingAdmin3IntegrationsEmailData,
  RoleOnboardingAdmin4BillingEmailData,
  RoleOnboardingAdmin5ComplianceEmailData,
  RoleOnboardingFeatureStatus,
} from "./types";

// Video testimonial lifecycle templates (S080)
export {
  VideoProcessingStartedEmail,
  VideoProcessingCompleteEmail,
  VideoApprovalNeededEmail,
  VideoApprovedEmail,
  VideoSharedEmail,
  VideoCustomerThankYouEmail,
  renderVideoProcessingStartedEmail,
  renderVideoProcessingCompleteEmail,
  renderVideoApprovalNeededEmail,
  renderVideoApprovedEmail,
  renderVideoSharedEmail,
  renderVideoCustomerThankYouEmail,
} from "./templates/index";
