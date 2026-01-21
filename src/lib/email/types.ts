// Email template types
export type EmailTemplate =
  | "survey_invitation"
  | "survey_reminder_3day"
  | "survey_reminder_7day"
  | "new_review_notification"
  | "review_pending_approval"
  | "review_approved"
  | "review_rejected"
  | "scheduled_report"
  | "negative_review_alert"
  | "notification_digest"
  | "review_response_to_reviewer"
  | "video_testimonial_invitation"
  | "video_testimonial_reminder_3day"
  | "video_testimonial_reminder_7day"
  | "video_testimonial_received"
  | "video_testimonial_approved"
  | "video_testimonial_pending_approval"
  // Video testimonial lifecycle emails (S080)
  | "video_processing_started"
  | "video_processing_complete"
  | "video_approval_needed"
  | "video_approved_published"
  | "video_shared"
  | "video_customer_thank_you"
  | "welcome_1_access"
  | "welcome_2_profile"
  | "welcome_3_first_action"
  | "welcome_4_social_proof"
  | "welcome_5_metrics"
  | "org_onboarding_1_welcome"
  | "org_onboarding_2_branding"
  | "org_onboarding_3_team"
  | "org_onboarding_4_integrations"
  | "org_onboarding_5_billing"
  | "org_onboarding_6_advanced"
  | "team_invite_1_initial"
  | "team_invite_2_reminder"
  | "team_invite_3_final_reminder"
  | "team_invite_4_welcome"
  | "team_invite_5_expiration"
  // Role-based feature onboarding sequences
  | "role_onboarding_lo_1_dashboard"
  | "role_onboarding_lo_2_surveys"
  | "role_onboarding_lo_3_sharing"
  | "role_onboarding_lo_4_responding"
  | "role_onboarding_lo_5_video"
  | "role_onboarding_lo_6_mobile"
  | "role_onboarding_lo_7_google"
  | "role_onboarding_mgr_1_team_dashboard"
  | "role_onboarding_mgr_2_approvals"
  | "role_onboarding_mgr_3_leaderboards"
  | "role_onboarding_mgr_4_reports"
  | "role_onboarding_mgr_5_coaching"
  | "role_onboarding_mgr_6_analytics"
  | "role_onboarding_admin_1_settings"
  | "role_onboarding_admin_2_users"
  | "role_onboarding_admin_3_integrations"
  | "role_onboarding_admin_4_billing"
  | "role_onboarding_admin_5_compliance"
  // Survey lifecycle emails
  | "survey_completion_thank_you"
  | "survey_high_rating_followup"
  | "survey_low_rating_followup"
  | "survey_response_received_notification"
  // Review lifecycle emails (S079)
  | "review_response_sent_confirmation"
  | "review_published_notification"
  | "review_response_received"
  | "negative_review_alert_enhanced"
  // Milestone & achievement celebration emails (S081)
  | "milestone_first_review"
  | "milestone_review_count"
  | "milestone_first_5_star"
  | "milestone_rating_improvement"
  | "milestone_nps_improvement"
  | "milestone_streak"
  | "milestone_leaderboard"
  | "milestone_badge_earned"
  | "milestone_profile_completion"
  | "milestone_video";

// Base email data
export interface BaseEmailData {
  toEmail: string;
  toName?: string;
  organizationId?: string;
  loanOfficerId?: string;
  surveyId?: string;
}

// Survey invitation email data
export interface SurveyInvitationEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  surveyUrl: string;
  transactionType?: string;
}

// Survey reminder email data
export interface SurveyReminderEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  organizationName: string;
  surveyUrl: string;
  reminderNumber: 1 | 2;
}

// Survey completion thank you email data (sent immediately after submission)
export interface SurveyCompletionThankYouEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  rating: number;
  surveyType: "nps" | "csat" | "post_transaction" | "general";
  feedbackText?: string;
  transactionType?: string;
}

// Survey high-rating follow-up email data (4-5 stars - encourage Google review)
export interface SurveyHighRatingFollowUpEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  rating: number;
  googleReviewUrl?: string;
  surveyType: "nps" | "csat" | "post_transaction" | "general";
  transactionType?: string;
}

// Survey low-rating follow-up email data (1-2 stars - empathy + internal escalation)
export interface SurveyLowRatingFollowUpEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  rating: number;
  feedbackText?: string;
  surveyType: "nps" | "csat" | "post_transaction" | "general";
  transactionType?: string;
  supportContactEmail?: string;
  supportContactPhone?: string;
}

// Survey response received notification email data (sent to LO when response received)
export interface SurveyResponseReceivedNotificationEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  feedbackText?: string;
  surveyType: "nps" | "csat" | "post_transaction" | "general";
  transactionType?: string;
  submittedAt: string;
  dashboardUrl: string;
  surveyResponseId: string;
}

// A/B test subject line configuration
export interface EmailSubjectABTest {
  variant: "question" | "statement";
  questionFormat: string;
  statementFormat: string;
}

// New review notification email data
export interface NewReviewNotificationEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  reviewDate: string;
  dashboardUrl: string;
  organizationName?: string;
  organizationLogoUrl?: string;
  loanOfficerPhotoUrl?: string;
  reviewId?: string;
  transactionType?: string;
}

// Review pending approval email data (sent to managers)
export interface ReviewPendingApprovalEmailData extends BaseEmailData {
  managerName: string;
  loanOfficerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  reviewDate: string;
  approvalQueueUrl: string;
  organizationName?: string;
  reviewId?: string;
  quickApproveUrl?: string;
}

// Review approved notification email data (sent to loan officers)
export interface ReviewApprovedEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  dashboardUrl: string;
  organizationName?: string;
  approvedAt?: string;
  reviewId?: string;
  shareableLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

// Review rejected notification email data (sent to loan officers)
export interface ReviewRejectedEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  rating: number;
  rejectionReason: string;
  dashboardUrl: string;
  organizationName?: string;
  reviewText?: string;
  rejectedAt?: string;
  reviewId?: string;
}

// Scheduled report email data
export interface ScheduledReportEmailData extends BaseEmailData {
  recipientName: string;
  reportName: string;
  reportPeriod: string;
  summary: {
    totalReviews: number;
    averageRating: number;
    npsScore: number;
    csatScore: number;
  };
  reportUrl: string;
  organizationName: string;
}

// Negative review alert email data (instant alert for low ratings)
export interface NegativeReviewAlertEmailData extends BaseEmailData {
  recipientName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  reviewDate: string;
  dashboardUrl: string;
  reviewId: string;
}

// Enhanced negative review alert with AI-suggested response (S079)
export interface NegativeReviewAlertEnhancedEmailData extends BaseEmailData {
  recipientName: string;
  loanOfficerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  reviewDate: string;
  dashboardUrl: string;
  reviewId: string;
  organizationName: string;
  aiSuggestedResponse?: string;
  responseTemplates?: Array<{
    name: string;
    preview: string;
  }>;
}

// Review response sent confirmation email data (sent to customer after LO responds)
export interface ReviewResponseSentConfirmationEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  originalReviewText?: string;
  responseText: string;
  rating: number;
  reviewDate: string;
}

// Review published notification email data (when review is posted to Google)
export interface ReviewPublishedNotificationEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  publishedPlatform: "google" | "zillow" | "facebook" | "yelp" | "other";
  publishedUrl?: string;
  dashboardUrl: string;
  organizationName: string;
  shareableLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

// Review response received notification email data (sent to LO when customer replies to response)
export interface ReviewResponseReceivedEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  customerReplyText: string;
  originalReviewText?: string;
  originalResponseText: string;
  rating: number;
  dashboardUrl: string;
  reviewId: string;
  repliedAt: string;
}

// Notification digest email data
export interface NotificationDigestEmailData extends BaseEmailData {
  recipientName: string;
  digestPeriod: string; // e.g., "Daily", "Weekly", "Monthly"
  notifications: Array<{
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    createdAt: string;
  }>;
  summary: {
    totalNotifications: number;
    newReviews: number;
    negativeReviews: number;
  };
  dashboardUrl: string;
}

// Review response to reviewer email data (sent to customer when LO responds)
export interface ReviewResponseToReviewerEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  organizationName: string;
  originalReviewText: string | null;
  responseText: string;
  rating: number;
}

// Video testimonial invitation email data (sent to customer)
export interface VideoTestimonialInvitationEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  requestUrl: string;
  transactionType?: string;
  maxDurationSeconds?: number;
  promptText?: string;
  requestId?: string;
}

// Video testimonial reminder email data (3-day and 7-day)
export interface VideoTestimonialReminderEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  organizationName: string;
  requestUrl: string;
  reminderNumber: 1 | 2;
  requestId?: string;
}

// Video testimonial received notification email data (sent to LO)
export interface VideoTestimonialReceivedEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  submittedAt: string;
  durationSeconds?: number;
  dashboardUrl: string;
  testimonialId: string;
}

// Video testimonial approved notification email data (sent to LO)
export interface VideoTestimonialApprovedEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  approvedAt: string;
  dashboardUrl: string;
  testimonialId: string;
}

// Video testimonial pending approval notification email data (sent to manager)
export interface VideoTestimonialPendingApprovalEmailData extends BaseEmailData {
  managerName: string;
  loanOfficerName: string;
  customerName: string;
  submittedAt: string;
  durationSeconds?: number;
  approvalQueueUrl: string;
  testimonialId: string;
}

// =============================================================================
// VIDEO TESTIMONIAL LIFECYCLE EMAIL DATA INTERFACES (S080)
// =============================================================================

// Base interface for video testimonial emails with common fields
export interface VideoTestimonialBaseEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  testimonialId: string;
  dashboardUrl: string;
  videoThumbnailUrl?: string;
  videoDurationSeconds?: number;
}

// Video processing started notification email data (sent to LO when processing begins)
export interface VideoProcessingStartedEmailData extends VideoTestimonialBaseEmailData {
  submittedAt: string;
  estimatedProcessingTime?: string;
}

// Video processing complete notification email data (sent to LO with transcription)
export interface VideoProcessingCompleteEmailData extends VideoTestimonialBaseEmailData {
  processedAt: string;
  transcriptionPreview?: string;
  transcriptionFull?: string;
  processingDurationSeconds?: number;
}

// Video approval needed notification email data (sent to manager with thumbnail)
export interface VideoApprovalNeededEmailData extends BaseEmailData {
  managerName: string;
  loanOfficerName: string;
  customerName: string;
  testimonialId: string;
  submittedAt: string;
  approvalQueueUrl: string;
  videoThumbnailUrl?: string;
  videoDurationSeconds?: number;
  transcriptionPreview?: string;
}

// Video approved and published notification email data (sent to LO)
export interface VideoApprovedPublishedEmailData extends VideoTestimonialBaseEmailData {
  approvedAt: string;
  publishedAt?: string;
  shareUrl: string;
  videoPageUrl: string;
  socialShareLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

// Video shared notification email data (sent to LO when video is shared to social)
export interface VideoSharedEmailData extends VideoTestimonialBaseEmailData {
  sharedAt: string;
  platform: "linkedin" | "twitter" | "facebook" | "email" | "embed";
  shareUrl: string;
  videoPageUrl: string;
  sharedBy?: string;
}

// Customer thank you email data (sent to customer after video submission)
export interface VideoCustomerThankYouEmailData extends BaseEmailData {
  customerName: string;
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  organizationName: string;
  organizationLogoUrl?: string;
  submittedAt: string;
  nextStepsMessage?: string;
}

// =============================================================================
// WELCOME SEQUENCE EMAIL DATA INTERFACES
// =============================================================================

// Base welcome email data (shared across all welcome emails)
export interface WelcomeEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  role: "admin" | "manager" | "loan_officer";
  dashboardUrl: string;
  sequenceId: string;
  unsubscribeUrl: string;
}

// Email 1: Welcome + Access (sent immediately on signup)
export interface Welcome1AccessEmailData extends WelcomeEmailBaseData {
  loginUrl: string;
  settingsUrl: string;
}

// Email 2: Profile Setup (Day 1)
export interface Welcome2ProfileEmailData extends WelcomeEmailBaseData {
  profileUrl: string;
  profileCompletionPercent: number;
  missingFields: string[];
}

// Email 3: First Action - Create Survey or Request Video (Day 3)
export interface Welcome3FirstActionEmailData extends WelcomeEmailBaseData {
  createSurveyUrl: string;
  requestVideoUrl: string;
  hasCompletedAction: boolean;
}

// Email 4: Social Proof - Customer Success Story (Day 5)
export interface Welcome4SocialProofEmailData extends WelcomeEmailBaseData {
  successStory: {
    companyName: string;
    personName: string;
    personTitle: string;
    quote: string;
    metric?: string;
    metricLabel?: string;
  };
  viewMoreStoriesUrl: string;
}

// Email 5: Core Value - Metrics Preview (Day 7)
export interface Welcome5MetricsEmailData extends WelcomeEmailBaseData {
  sampleMetrics: {
    averageRating?: number;
    reviewCount?: number;
    npsScore?: number;
    responseRate?: number;
  };
  analyticsUrl: string;
  upgradeUrl?: string;
}

// Email send result
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Resend webhook event types
export type ResendWebhookEventType =
  | "email.sent"
  | "email.delivered"
  | "email.opened"
  | "email.clicked"
  | "email.bounced"
  | "email.complained";

// Resend webhook payload
export interface ResendWebhookPayload {
  type: ResendWebhookEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject?: string;
    broadcast_id?: string;
    template_id?: string;
    tags?: Record<string, string>;
    click?: {
      ipAddress: string;
      link: string;
      timestamp: string;
      userAgent: string;
    };
  };
}

// Email log entry for database
export interface EmailLogEntry {
  id?: string;
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
  status: "pending" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed";
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  errorMessage?: string;
}

// =============================================================================
// ORGANIZATION ONBOARDING SEQUENCE EMAIL DATA INTERFACES
// =============================================================================

// Base org onboarding email data (shared across all org onboarding emails)
export interface OrgOnboardingEmailBaseData extends BaseEmailData {
  adminName: string;
  organizationName: string;
  dashboardUrl: string;
  sequenceId: string;
  unsubscribeUrl: string;
  setupProgress: number; // 0-100
}

// Email 1: Org Created Confirmation + Getting Started Guide (Immediate)
export interface OrgOnboarding1WelcomeEmailData extends OrgOnboardingEmailBaseData {
  loginUrl: string;
  settingsUrl: string;
  helpCenterUrl: string;
}

// Email 2: Branding Setup (Day 1)
export interface OrgOnboarding2BrandingEmailData extends OrgOnboardingEmailBaseData {
  brandingUrl: string;
  surveyPreviewUrl: string;
  hasLogo: boolean;
  hasCustomColor: boolean;
}

// Email 3: Team Setup (Day 2)
export interface OrgOnboarding3TeamEmailData extends OrgOnboardingEmailBaseData {
  teamUrl: string;
  inviteUrl: string;
  teamCount: number;
  teamLimit?: number;
}

// Email 4: Integration Guide - Google Business Profile (Day 4)
export interface OrgOnboarding4IntegrationsEmailData extends OrgOnboardingEmailBaseData {
  integrationsUrl: string;
  googleConnectUrl: string;
  hasGoogleConnected: boolean;
}

// Email 5: Billing Setup Reminder (Day 6) - Conditional
export interface OrgOnboarding5BillingEmailData extends OrgOnboardingEmailBaseData {
  billingUrl: string;
  pricingUrl: string;
  currentPlan: string;
  trialEndsAt?: string;
  daysRemaining?: number;
}

// Email 6: Advanced Features (Day 10)
export interface OrgOnboarding6AdvancedEmailData extends OrgOnboardingEmailBaseData {
  leaderboardsUrl: string;
  reportsUrl: string;
  automationUrl: string;
  analyticsUrl: string;
}

// Organization onboarding status (for conditional skipping)
export interface OrgOnboardingStatus {
  branding_configured: boolean;
  team_invited: boolean;
  google_connected: boolean;
  billing_setup: boolean;
  first_survey_sent: boolean;
}

// =============================================================================
// TEAM MEMBER INVITE SEQUENCE EMAIL DATA INTERFACES
// =============================================================================

// Base team invite email data (shared across all invite emails)
export interface TeamInviteEmailBaseData extends BaseEmailData {
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  organizationLogoUrl?: string;
  role: "admin" | "manager" | "loan_officer";
  invitationId: string;
  acceptUrl: string;
  unsubscribeUrl: string;
}

// Email 1: Initial Invitation (Immediate on invite)
export interface TeamInvite1InitialEmailData extends TeamInviteEmailBaseData {
  expiresAt: string;
  daysUntilExpiration: number;
}

// Email 2: Reminder (Day 2)
export interface TeamInvite2ReminderEmailData extends TeamInviteEmailBaseData {
  expiresAt: string;
  daysUntilExpiration: number;
}

// Email 3: Final Reminder with urgency (Day 5)
export interface TeamInvite3FinalReminderEmailData extends TeamInviteEmailBaseData {
  expiresAt: string;
  daysUntilExpiration: number;
}

// Email 4: Welcome Email (On Accept) - role-specific content
export interface TeamInvite4WelcomeEmailData extends TeamInviteEmailBaseData {
  dashboardUrl: string;
  profileUrl: string;
  // Role-specific URLs
  reviewsUrl?: string; // For loan officers
  leaderboardUrl?: string; // For loan officers
  teamAnalyticsUrl?: string; // For managers
  teamManagementUrl?: string; // For managers
}

// Email 5: Invitation Expired Notice (Day 14)
export interface TeamInvite5ExpirationEmailData extends TeamInviteEmailBaseData {
  expiredAt: string;
  canRequestNewInvite: boolean;
  requestNewInviteUrl?: string;
}

// =============================================================================
// ROLE-BASED FEATURE ONBOARDING SEQUENCE EMAIL DATA INTERFACES
// =============================================================================

// Base role onboarding email data (shared across all role onboarding emails)
export interface RoleOnboardingEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  role: "admin" | "manager" | "loan_officer";
  dashboardUrl: string;
  sequenceId: string;
  unsubscribeUrl: string;
  currentStep: number;
  totalSteps: number;
}

// =============================================================================
// LOAN OFFICER SEQUENCE (7 emails over 30 days - weekly pacing)
// =============================================================================

// LO Email 1 (Day 0): Dashboard tour and key metrics
export interface RoleOnboardingLO1DashboardEmailData extends RoleOnboardingEmailBaseData {
  dashboardTourUrl: string;
  metricsUrl: string;
  currentRating?: number;
  currentReviewCount?: number;
}

// LO Email 2 (Day 7): Sending survey requests manually
export interface RoleOnboardingLO2SurveysEmailData extends RoleOnboardingEmailBaseData {
  createSurveyUrl: string;
  surveyTemplatesUrl: string;
  hasSentSurvey: boolean;
}

// LO Email 3 (Day 14): Sharing positive reviews
export interface RoleOnboardingLO3SharingEmailData extends RoleOnboardingEmailBaseData {
  reviewsUrl: string;
  shareSettingsUrl: string;
  testimonialsUrl: string;
  hasSharedReview: boolean;
}

// LO Email 4 (Day 18): Responding to reviews
export interface RoleOnboardingLO4RespondingEmailData extends RoleOnboardingEmailBaseData {
  reviewsUrl: string;
  responseTemplatesUrl: string;
  hasRespondedToReview: boolean;
  pendingResponseCount?: number;
}

// LO Email 5 (Day 21): Video testimonial requests
export interface RoleOnboardingLO5VideoEmailData extends RoleOnboardingEmailBaseData {
  videoRequestUrl: string;
  videoGalleryUrl: string;
  hasRequestedVideo: boolean;
}

// LO Email 6 (Day 25): Mobile app features
export interface RoleOnboardingLO6MobileEmailData extends RoleOnboardingEmailBaseData {
  appStoreUrl: string;
  playStoreUrl: string;
  mobileGuideUrl: string;
  hasUsedMobile: boolean;
}

// LO Email 7 (Day 30): Google review management
export interface RoleOnboardingLO7GoogleEmailData extends RoleOnboardingEmailBaseData {
  googleConnectUrl: string;
  googleReviewsUrl: string;
  businessListingUrl: string;
  hasConnectedGoogle: boolean;
}

// =============================================================================
// MANAGER SEQUENCE (6 emails over 30 days - weekly pacing)
// =============================================================================

// Manager Email 1 (Day 0): Team dashboard overview
export interface RoleOnboardingMgr1TeamDashboardEmailData extends RoleOnboardingEmailBaseData {
  teamDashboardUrl: string;
  teamMembersUrl: string;
  teamSize: number;
}

// Manager Email 2 (Day 7): Review approval workflow
export interface RoleOnboardingMgr2ApprovalsEmailData extends RoleOnboardingEmailBaseData {
  approvalQueueUrl: string;
  approvalSettingsUrl: string;
  pendingApprovalCount: number;
  hasApprovedReview: boolean;
}

// Manager Email 3 (Day 12): Leaderboards and gamification
export interface RoleOnboardingMgr3LeaderboardsEmailData extends RoleOnboardingEmailBaseData {
  leaderboardUrl: string;
  gamificationSettingsUrl: string;
  hasViewedLeaderboard: boolean;
}

// Manager Email 4 (Day 18): Reports and exports
export interface RoleOnboardingMgr4ReportsEmailData extends RoleOnboardingEmailBaseData {
  reportsUrl: string;
  scheduledReportsUrl: string;
  exportUrl: string;
  hasGeneratedReport: boolean;
}

// Manager Email 5 (Day 23): Team performance coaching tips
export interface RoleOnboardingMgr5CoachingEmailData extends RoleOnboardingEmailBaseData {
  teamAnalyticsUrl: string;
  performanceTipsUrl: string;
  lowPerformersCount?: number;
  topPerformersCount?: number;
}

// Manager Email 6 (Day 30): Advanced analytics
export interface RoleOnboardingMgr6AnalyticsEmailData extends RoleOnboardingEmailBaseData {
  advancedAnalyticsUrl: string;
  trendsUrl: string;
  benchmarksUrl: string;
  hasUsedAdvancedAnalytics: boolean;
}

// =============================================================================
// ADMIN SEQUENCE (5 emails over 30 days - weekly pacing)
// =============================================================================

// Admin Email 1 (Day 0): Settings and configuration
export interface RoleOnboardingAdmin1SettingsEmailData extends RoleOnboardingEmailBaseData {
  settingsUrl: string;
  brandingUrl: string;
  notificationsUrl: string;
  setupProgress: number;
}

// Admin Email 2 (Day 7): User management and permissions
export interface RoleOnboardingAdmin2UsersEmailData extends RoleOnboardingEmailBaseData {
  usersUrl: string;
  inviteUrl: string;
  rolesUrl: string;
  teamCount: number;
  hasInvitedUser: boolean;
}

// Admin Email 3 (Day 14): Integration setup deep dive
export interface RoleOnboardingAdmin3IntegrationsEmailData extends RoleOnboardingEmailBaseData {
  integrationsUrl: string;
  googleConnectUrl: string;
  crmConnectUrl: string;
  webhooksUrl: string;
  connectedIntegrationsCount: number;
}

// Admin Email 4 (Day 21): Billing and subscription management
export interface RoleOnboardingAdmin4BillingEmailData extends RoleOnboardingEmailBaseData {
  billingUrl: string;
  plansUrl: string;
  invoicesUrl: string;
  currentPlan: string;
  billingConfigured: boolean;
}

// Admin Email 5 (Day 30): Compliance and audit features
export interface RoleOnboardingAdmin5ComplianceEmailData extends RoleOnboardingEmailBaseData {
  auditLogUrl: string;
  complianceSettingsUrl: string;
  dataExportUrl: string;
  securitySettingsUrl: string;
}

// Role onboarding feature usage status (for conditional skipping)
export interface RoleOnboardingFeatureStatus {
  // Loan Officer features
  has_sent_survey: boolean;
  has_shared_review: boolean;
  has_responded_to_review: boolean;
  has_requested_video: boolean;
  has_used_mobile: boolean;
  has_connected_google: boolean;
  // Manager features
  has_approved_review: boolean;
  has_viewed_leaderboard: boolean;
  has_generated_report: boolean;
  has_used_advanced_analytics: boolean;
  // Admin features
  has_invited_user: boolean;
  has_configured_integrations: boolean;
  has_configured_billing: boolean;
}

// =============================================================================
// MILESTONE & ACHIEVEMENT EMAIL DATA INTERFACES (S081)
// =============================================================================

// Milestone types for categorization
export type MilestoneType =
  | "first_review"
  | "review_milestone"
  | "first_5_star"
  | "rating_improvement"
  | "nps_improvement"
  | "streak"
  | "leaderboard_achievement"
  | "badge_earned"
  | "profile_completion"
  | "video_milestone";

// Base milestone email data (shared across all milestone emails)
export interface MilestoneEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
  milestoneId: string;
  achievedAt: string;
  // Social sharing
  shareUrl?: string;
  socialShareLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

// First Review Celebration email data
export interface FirstReviewMilestoneEmailData extends MilestoneEmailBaseData {
  customerName: string;
  reviewRating: number;
  reviewText?: string;
  reviewDate: string;
  nextMilestoneCount: number; // e.g., 5
  viewReviewUrl: string;
}

// Review Count Milestone email data (10, 25, 50, 100, 250, 500 reviews)
export interface ReviewCountMilestoneEmailData extends MilestoneEmailBaseData {
  reviewCount: number;
  previousMilestone?: number;
  nextMilestone?: number;
  averageRating: number;
  percentileRank?: number; // e.g., "Top 10%"
  timeToAchieve?: string; // e.g., "3 months"
  viewReviewsUrl: string;
}

// First 5-Star Review Celebration email data
export interface First5StarMilestoneEmailData extends MilestoneEmailBaseData {
  customerName: string;
  reviewText?: string;
  reviewDate: string;
  totalReviews: number;
  viewReviewUrl: string;
}

// Rating Improvement Milestone email data
export interface RatingImprovementMilestoneEmailData extends MilestoneEmailBaseData {
  previousRating: number;
  currentRating: number;
  improvementAmount: number;
  totalReviews: number;
  periodDescription: string; // e.g., "last 30 days"
  viewAnalyticsUrl: string;
}

// NPS Score Improvement Milestone email data
export interface NpsImprovementMilestoneEmailData extends MilestoneEmailBaseData {
  previousNps: number;
  currentNps: number;
  improvementAmount: number;
  totalResponses: number;
  npsCategory: "promoter" | "passive" | "detractor";
  industryBenchmark?: number;
  viewAnalyticsUrl: string;
}

// Response Streak Milestone email data (7, 30, 90 day streaks)
export interface StreakMilestoneEmailData extends MilestoneEmailBaseData {
  streakDays: number;
  streakType: "response" | "review" | "rating";
  streakDescription: string; // e.g., "7 days of responding to reviews"
  nextStreakDays?: number;
  viewStreakUrl: string;
}

// Leaderboard Achievement Milestone email data
export interface LeaderboardMilestoneEmailData extends MilestoneEmailBaseData {
  currentRank: number;
  previousRank?: number;
  rankImprovement?: number;
  totalParticipants: number;
  periodType: "monthly" | "quarterly" | "yearly" | "all_time";
  achievementType: "entered_top_10" | "reached_top_3" | "reached_number_1";
  reputationScore: number;
  viewLeaderboardUrl: string;
}

// Badge Earned Milestone email data
export interface BadgeEarnedMilestoneEmailData extends MilestoneEmailBaseData {
  badgeName: string;
  badgeDescription: string;
  badgeIcon: string;
  badgeCategory: "milestone" | "performance" | "streak" | "special";
  badgeTier?: "bronze" | "silver" | "gold" | "platinum";
  totalBadgesEarned: number;
  totalBadgesAvailable: number;
  nextBadgeName?: string;
  nextBadgeProgress?: number; // 0-100 percent
  viewBadgesUrl: string;
}

// Profile Completion Milestone email data (50%, 75%, 100%)
export interface ProfileCompletionMilestoneEmailData extends MilestoneEmailBaseData {
  completionPercent: number;
  previousPercent: number;
  missingFields?: string[];
  benefitsUnlocked?: string[];
  profileUrl: string;
}

// Video Testimonial Milestone email data (first video, 5, 10 videos)
export interface VideoMilestoneEmailData extends MilestoneEmailBaseData {
  videoCount: number;
  previousMilestone?: number;
  nextMilestone?: number;
  latestVideoCustomerName?: string;
  totalViewsCount?: number;
  viewVideosUrl: string;
}

// Union type for all milestone email data types
export type MilestoneEmailData =
  | FirstReviewMilestoneEmailData
  | ReviewCountMilestoneEmailData
  | First5StarMilestoneEmailData
  | RatingImprovementMilestoneEmailData
  | NpsImprovementMilestoneEmailData
  | StreakMilestoneEmailData
  | LeaderboardMilestoneEmailData
  | BadgeEarnedMilestoneEmailData
  | ProfileCompletionMilestoneEmailData
  | VideoMilestoneEmailData;

// Milestone email preferences (for user settings)
export interface MilestoneEmailPreferences {
  enabled: boolean;
  reviewMilestones: boolean;
  ratingMilestones: boolean;
  streakMilestones: boolean;
  leaderboardMilestones: boolean;
  badgeMilestones: boolean;
  profileMilestones: boolean;
  videoMilestones: boolean;
}
