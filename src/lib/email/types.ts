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
  | "milestone_video"
  // Weekly performance summary emails (S082)
  | "weekly_summary_lo"
  | "weekly_summary_manager"
  // Re-engagement sequence emails (S083)
  | "reengagement_1_miss_you"
  | "reengagement_2_whats_new"
  | "reengagement_3_last_chance"
  | "reengagement_4_final"
  // Profile & Setup reminder emails (S084)
  | "profile_reminder_photo"
  | "profile_reminder_bio"
  | "profile_reminder_final"
  | "setup_reminder_survey_template"
  | "setup_reminder_first_survey"
  | "setup_reminder_google_connect"
  | "setup_reminder_invite_team"
  // Trial ending sequence emails (S085)
  | "trial_ending_1_accomplishments"
  | "trial_ending_2_feature_comparison"
  | "trial_ending_3_final_reminder"
  | "trial_ending_4_grace_period"
  | "trial_ending_5_winback"
  // Failed payment recovery (dunning) sequence emails (S086)
  | "dunning_1_payment_failed"
  | "dunning_2_reminder"
  | "dunning_3_urgent"
  | "dunning_4_final_warning"
  | "dunning_5_suspended"
  // Subscription lifecycle emails (S087)
  | "subscription_upgrade_confirmation"
  | "subscription_downgrade_confirmation"
  | "subscription_renewal_reminder"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "subscription_cancellation_feedback"
  | "subscription_plan_change_scheduled"
  | "subscription_invoice_available"
  | "subscription_price_increase_notice"
  // Product announcement emails (S088)
  | "announcement_feature"
  | "announcement_update"
  | "announcement_maintenance"
  | "announcement_security"
  | "announcement_digest"
  // Manager & Admin Alert Emails (S089)
  | "admin_alert_negative_review"
  | "admin_alert_team_struggling"
  | "admin_alert_compliance_violation"
  | "admin_alert_usage_limit"
  | "admin_alert_team_member_joined"
  | "admin_alert_team_member_left"
  | "admin_alert_unusual_activity"
  | "admin_alert_integration_disconnected"
  | "admin_alert_digest"
  // Abandoned Action Recovery Emails (S093)
  | "abandoned_survey_creation_1"
  | "abandoned_survey_creation_2"
  | "abandoned_survey_send_1"
  | "abandoned_survey_send_2"
  | "abandoned_video_request_1"
  | "abandoned_video_request_2"
  | "abandoned_billing_upgrade_1"
  | "abandoned_billing_upgrade_2"
  | "abandoned_profile_completion_1"
  | "abandoned_profile_completion_2"
  | "abandoned_integration_setup_1"
  | "abandoned_integration_setup_2"
  // Referral Program Emails (S094)
  | "referral_invite"
  | "referral_friend_signed_up"
  | "referral_friend_converted"
  | "referral_reward_earned"
  | "referral_reminder"
  | "referral_leaderboard";

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
  role: "admin" | "manager" | "user";
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
  role: "admin" | "manager" | "user";
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
  role: "admin" | "manager" | "user";
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

// =============================================================================
// WEEKLY PERFORMANCE SUMMARY EMAIL DATA INTERFACES (S082)
// =============================================================================

// Base weekly summary email data (shared fields)
export interface WeeklySummaryEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
  weekStartDate: string;
  weekEndDate: string;
}

// Loan Officer Weekly Summary Email Data
export interface WeeklySummaryLOEmailData extends WeeklySummaryEmailBaseData {
  // Review metrics
  reviewsThisWeek: number;
  reviewsLastWeek: number;
  reviewsTrend: "up" | "down" | "neutral";
  reviewsTrendValue: string;

  // Rating metrics
  averageRatingThisWeek: number | null;
  averageRatingLastWeek: number | null;
  ratingTrend: "up" | "down" | "neutral";
  ratingTrendValue: string;

  // Response metrics
  responseRate: number;
  averageResponseTime: string;

  // Pending actions
  pendingReviewResponses: number;
  pendingSurveys: number;

  // Leaderboard position
  leaderboardRank: number | null;
  leaderboardRankChange: number | null;
  totalMembers: number;

  // Top review highlight
  topReview?: {
    customerName: string;
    rating: number;
    text: string;
    reviewId: string;
  };

  // NPS score if available
  npsScore: number | null;
  npsTrend?: "up" | "down" | "neutral";

  // Survey metrics
  surveysCompleted: number;
  surveyResponseRate: number;
}

// Manager Weekly Summary Email Data
export interface WeeklySummaryManagerEmailData extends WeeklySummaryEmailBaseData {
  // Team aggregate metrics
  teamSize: number;
  teamReviewsThisWeek: number;
  teamReviewsLastWeek: number;
  teamReviewsTrend: "up" | "down" | "neutral";
  teamReviewsTrendValue: string;

  // Team rating metrics
  teamAverageRating: number | null;
  teamAverageRatingLastWeek: number | null;
  teamRatingTrend: "up" | "down" | "neutral";
  teamRatingTrendValue: string;

  // Team response metrics
  teamResponseRate: number;
  teamAverageResponseTime: string;

  // Top performers (top 3)
  topPerformers: Array<{
    name: string;
    photoUrl?: string;
    reviewsCount: number;
    averageRating: number;
    rank: number;
  }>;

  // Bottom performers / needs attention (bottom 3)
  needsAttention: Array<{
    name: string;
    photoUrl?: string;
    reviewsCount: number;
    averageRating: number | null;
    daysWithoutActivity: number;
  }>;

  // Pending approvals
  pendingApprovals: number;

  // Alerts
  alerts: Array<{
    type: "low_rating" | "no_activity" | "high_pending" | "negative_review";
    message: string;
    loanOfficerName?: string;
    actionUrl?: string;
  }>;

  // Team NPS
  teamNpsScore: number | null;
  teamNpsTrend?: "up" | "down" | "neutral";
}

// Weekly summary email preferences
export interface WeeklySummaryEmailPreferences {
  enabled: boolean;
  sendDay: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  sendHour: number; // 0-23 in user's local time
  skipIfNoActivity: boolean;
}

// =============================================================================
// RE-ENGAGEMENT SEQUENCE EMAIL DATA INTERFACES (S083)
// =============================================================================

// Base re-engagement email data (shared across all re-engagement emails)
export interface ReengagementEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  sequenceId: string;
  unsubscribeUrl: string;
  isPaidUser: boolean;
  daysInactive: number;
}

// Email 1: "We Miss You" (Day 7 inactive)
export interface Reengagement1MissYouEmailData extends ReengagementEmailBaseData {
  lastActiveDate: string;
  valueReminder: string; // e.g., "Your reviews dashboard"
  quickActionUrl: string;
}

// Email 2: "What's New" (Day 14 inactive)
export interface Reengagement2WhatsNewEmailData extends ReengagementEmailBaseData {
  lastActiveDate: string;
  newFeatures: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  missedReviewsCount: number;
  viewUpdatesUrl: string;
}

// Email 3: "Last Chance" (Day 30 inactive)
export interface Reengagement3LastChanceEmailData extends ReengagementEmailBaseData {
  lastActiveDate: string;
  missedReviewsCount: number;
  missedMetrics?: {
    totalReviews?: number;
    averageRating?: number;
    pendingResponses?: number;
  };
  incentiveMessage?: string; // For paid users: "Your premium features are waiting"
  urgencyMessage: string;
}

// Email 4: "Final Email" (Day 45 inactive)
export interface Reengagement4FinalEmailData extends ReengagementEmailBaseData {
  lastActiveDate: string;
  missedReviewsCount: number;
  staySubscribedUrl: string;
  unsubscribeUrl: string;
  feedbackUrl?: string;
}

// Re-engagement sequence status (for tracking user state)
export interface ReengagementSequenceStatus {
  is_inactive: boolean;
  days_since_last_active: number;
  last_active_at: string | null;
  has_returned_since_sequence_start: boolean;
}

// Re-engagement email preferences
export interface ReengagementEmailPreferences {
  enabled: boolean;
  // Allow users to opt out of re-engagement emails specifically
  optedOut: boolean;
}

// =============================================================================
// PROFILE & SETUP REMINDER EMAIL DATA INTERFACES (S084)
// =============================================================================

// Base profile/setup reminder email data (shared across all reminder emails)
export interface ProfileSetupReminderEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  sequenceId: string;
  unsubscribeUrl: string;
  completionPercent: number;
}

// Profile Reminder Email 1: Missing Photo (Day 3)
export interface ProfileReminderPhotoEmailData extends ProfileSetupReminderEmailBaseData {
  uploadPhotoUrl: string;
}

// Profile Reminder Email 2: Incomplete Bio (Day 7)
export interface ProfileReminderBioEmailData extends ProfileSetupReminderEmailBaseData {
  editProfileUrl: string;
  bioTips?: string[];
}

// Profile Reminder Email 3: Final Reminder with Impact Stats (Day 14)
export interface ProfileReminderFinalEmailData extends ProfileSetupReminderEmailBaseData {
  profileUrl: string;
  missingItems: Array<{
    label: string;
    actionUrl: string;
  }>;
  impactStats?: {
    moreReviews?: string;
    higherRating?: string;
    moreResponses?: string;
  };
}

// Setup Reminder Email 1: No Survey Template (Day 3)
export interface SetupReminderSurveyTemplateEmailData extends ProfileSetupReminderEmailBaseData {
  createTemplateUrl: string;
  setupProgress: number;
  helpUrl?: string;
}

// Setup Reminder Email 2: No Survey Sent (Day 7)
export interface SetupReminderFirstSurveyEmailData extends ProfileSetupReminderEmailBaseData {
  sendSurveyUrl: string;
  setupProgress: number;
  recentClientName?: string;
}

// Setup Reminder Email 3: No Google Connected (Day 5, Admins Only)
export interface SetupReminderGoogleConnectEmailData extends ProfileSetupReminderEmailBaseData {
  googleConnectUrl: string;
  setupProgress: number;
}

// Setup Reminder Email 4: No Team Members Invited (Day 7, Admins Only)
export interface SetupReminderInviteTeamEmailData extends ProfileSetupReminderEmailBaseData {
  inviteTeamUrl: string;
  setupProgress: number;
  teamLimit?: number;
  currentTeamCount?: number;
}

// Profile/Setup reminder sequence status (for tracking user state)
export interface ProfileSetupReminderStatus {
  has_photo: boolean;
  has_bio: boolean;
  has_survey_template: boolean;
  has_sent_survey: boolean;
  has_google_connected: boolean;
  has_team_members: boolean;
  profile_completion_percent: number;
  setup_completion_percent: number;
  days_since_signup: number;
}

// Profile/Setup reminder email preferences
export interface ProfileSetupReminderPreferences {
  enabled: boolean;
  optedOut: boolean;
}

// =============================================================================
// TRIAL ENDING SEQUENCE EMAIL DATA INTERFACES (S085)
// =============================================================================

// Usage statistics for trial period
export interface TrialUsageStats {
  totalReviews: number;
  averageRating: number | null;
  surveysSent: number;
  surveyResponseRate: number;
  videoTestimonials: number;
  teamMembersAdded: number;
  googleConnected: boolean;
  customBrandingConfigured: boolean;
}

// Feature comparison for free vs paid
export interface TrialFeatureComparison {
  featureName: string;
  description: string;
  includedInFree: boolean;
  includedInPaid: boolean;
  userHasUsed: boolean;
}

// Pricing info for upgrade CTA
export interface TrialPricingInfo {
  planName: string;
  monthlyPrice: number;
  annualPrice: number;
  annualDiscount: number;
  features: string[];
}

// Special offer for high-value prospects
export interface TrialSpecialOffer {
  offerType: "discount" | "extended_trial" | "free_month";
  discountPercent?: number;
  extendedDays?: number;
  expiresAt: string;
  offerCode: string;
}

// Base trial ending email data (shared across all trial ending emails)
export interface TrialEndingEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  sequenceId: string;
  unsubscribeUrl: string;
  trialEndsAt: string;
  daysRemaining: number;
  upgradeUrl: string;
  pricingUrl: string;
}

// Email 1: Trial Ending Soon - What You've Accomplished (7 days before)
export interface TrialEnding1AccomplishmentsEmailData extends TrialEndingEmailBaseData {
  usageStats: TrialUsageStats;
  topAccomplishment?: string;
  roiEstimate?: {
    timeSaved: string;
    reputationImpact: string;
  };
}

// Email 2: Feature Comparison - What You'll Lose vs Keep (3 days before)
export interface TrialEnding2FeatureComparisonEmailData extends TrialEndingEmailBaseData {
  featureComparison: TrialFeatureComparison[];
  featuresUsedCount: number;
  featuresAtRisk: string[];
  pricing: TrialPricingInfo;
}

// Email 3: Final Reminder with Easy Upgrade CTA (1 day before)
export interface TrialEnding3FinalReminderEmailData extends TrialEndingEmailBaseData {
  usageStats: TrialUsageStats;
  pricing: TrialPricingInfo;
  specialOffer?: TrialSpecialOffer;
  // A/B test variant: "urgency" focuses on what they'll lose, "value" focuses on benefits
  messageVariant: "urgency" | "value";
}

// Email 4: Grace Period Notice (trial ended)
export interface TrialEnding4GracePeriodEmailData extends TrialEndingEmailBaseData {
  gracePeriodDays: number;
  gracePeriodEndsAt: string;
  usageStats: TrialUsageStats;
  accountStatus: "grace_period" | "limited_access" | "read_only";
  restrictedFeatures: string[];
}

// Email 5: Win-Back Offer (3 days after trial ended)
export interface TrialEnding5WinbackEmailData extends TrialEndingEmailBaseData {
  daysSinceTrialEnded: number;
  usageStats: TrialUsageStats;
  specialOffer: TrialSpecialOffer;
  isHighValueProspect: boolean;
  competitorMention?: string;
}

// Trial ending sequence status (for tracking user state)
export interface TrialEndingSequenceStatus {
  is_trial_user: boolean;
  trial_ends_at: string | null;
  days_until_trial_end: number | null;
  has_upgraded: boolean;
  is_in_grace_period: boolean;
  grace_period_ends_at: string | null;
}

// Trial ending email preferences
export interface TrialEndingEmailPreferences {
  enabled: boolean;
  optedOut: boolean;
}

// =============================================================================
// FAILED PAYMENT RECOVERY (DUNNING) SEQUENCE EMAIL DATA INTERFACES (S086)
// =============================================================================

// Payment decline reason categories for helpful messaging
export type PaymentDeclineReason =
  | "card_declined"
  | "insufficient_funds"
  | "expired_card"
  | "incorrect_cvc"
  | "processing_error"
  | "fraud_suspected"
  | "unknown";

// Payment method info for display in emails
export interface DunningPaymentMethodInfo {
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
}

// Account summary for dunning emails
export interface DunningAccountSummary {
  totalReviews: number;
  totalSurveys: number;
  teamMembersCount: number;
  currentPlan: string;
  monthlyPrice: number;
}

// Base dunning email data (shared across all dunning emails)
export interface DunningEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  sequenceId: string;
  unsubscribeUrl: string;
  updatePaymentUrl: string;
  supportEmail: string;
  invoiceAmount: number;
  invoiceCurrency: string;
  invoiceNumber: string | null;
  failedAt: string;
  paymentMethod: DunningPaymentMethodInfo | null;
}

// Email 1: Friendly Payment Failed Notice (Day 0 - Immediate)
export interface Dunning1PaymentFailedEmailData extends DunningEmailBaseData {
  declineReason: PaymentDeclineReason;
  declineMessage: string;
  retryDate?: string;
  commonSolutions: string[];
}

// Email 2: Reminder with Easy Update Payment Link (Day 3)
export interface Dunning2ReminderEmailData extends DunningEmailBaseData {
  daysSinceFailure: number;
  accountSummary: DunningAccountSummary;
  featuresAtRisk: string[];
}

// Email 3: Urgent Notice - Service May Be Interrupted (Day 7)
export interface Dunning3UrgentEmailData extends DunningEmailBaseData {
  daysSinceFailure: number;
  daysUntilSuspension: number;
  suspensionDate: string;
  accountSummary: DunningAccountSummary;
  featuresAlreadyLimited: string[];
}

// Email 4: Final Warning Before Suspension (Day 10)
export interface Dunning4FinalWarningEmailData extends DunningEmailBaseData {
  daysSinceFailure: number;
  suspensionDate: string;
  accountSummary: DunningAccountSummary;
  dataRetentionDays: number;
}

// Email 5: Account Suspended Notice with Recovery Path (Day 14)
export interface Dunning5SuspendedEmailData extends DunningEmailBaseData {
  suspendedAt: string;
  accountSummary: DunningAccountSummary;
  dataRetentionEndsAt: string;
  dataRetentionDays: number;
  reactivateUrl: string;
  exportDataUrl: string;
}

// Union type for all dunning email data
export type DunningEmailData =
  | Dunning1PaymentFailedEmailData
  | Dunning2ReminderEmailData
  | Dunning3UrgentEmailData
  | Dunning4FinalWarningEmailData
  | Dunning5SuspendedEmailData;

// Dunning sequence status (for tracking payment recovery state)
export interface DunningSequenceStatus {
  is_past_due: boolean;
  payment_failed_at: string | null;
  days_since_failure: number | null;
  retry_count: number;
  is_suspended: boolean;
  suspended_at: string | null;
  recovery_email_step: number; // 1-5, which email in the sequence
  last_email_sent_at: string | null;
}

// Dunning email preferences
export interface DunningEmailPreferences {
  enabled: boolean;
  optedOut: boolean;
}

// =============================================================================
// SUBSCRIPTION LIFECYCLE EMAIL DATA INTERFACES (S087)
// =============================================================================

// Plan feature details for upgrade/downgrade emails
export interface PlanFeature {
  name: string;
  description: string;
  includedInCurrentPlan: boolean;
  includedInNewPlan: boolean;
  highlight?: boolean;
}

// Invoice/receipt line item
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Invoice details for receipt emails
export interface SubscriptionInvoiceDetails {
  invoiceId: string;
  invoiceNumber: string | null;
  invoiceDate: string;
  dueDate?: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
}

// Payment method summary
export interface PaymentMethodSummary {
  type: "card" | "bank_account" | "other";
  brand?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
}

// Base subscription lifecycle email data (shared across all subscription emails)
export interface SubscriptionEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  billingUrl: string;
  supportEmail: string;
  unsubscribeUrl: string;
}

// Upgrade Confirmation Email Data
export interface SubscriptionUpgradeConfirmationEmailData extends SubscriptionEmailBaseData {
  previousPlanName: string;
  newPlanName: string;
  previousPrice: number;
  newPrice: number;
  billingCycle: "monthly" | "yearly";
  currency: string;
  effectiveDate: string;
  proratedAmount?: number;
  newFeatures: PlanFeature[];
  nextBillingDate: string;
  nextBillingAmount: number;
  paymentMethod?: PaymentMethodSummary;
  invoiceDetails?: SubscriptionInvoiceDetails;
}

// Downgrade Confirmation Email Data
export interface SubscriptionDowngradeConfirmationEmailData extends SubscriptionEmailBaseData {
  previousPlanName: string;
  newPlanName: string;
  previousPrice: number;
  newPrice: number;
  billingCycle: "monthly" | "yearly";
  currency: string;
  effectiveDate: string;
  featuresLosing: PlanFeature[];
  featuresKeeping: PlanFeature[];
  creditAmount?: number;
  nextBillingDate: string;
  nextBillingAmount: number;
  isEndOfPeriod: boolean;
  upgradeUrl: string;
}

// Renewal Reminder Email Data (14 days before annual renewal)
export interface SubscriptionRenewalReminderEmailData extends SubscriptionEmailBaseData {
  planName: string;
  renewalDate: string;
  renewalAmount: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  daysTillRenewal: number;
  paymentMethod?: PaymentMethodSummary;
  updatePaymentUrl: string;
  cancelUrl: string;
  usageSummary?: {
    reviewsCollected: number;
    surveysSent: number;
    teamMembers: number;
  };
}

// Subscription Renewed Email Data (after successful renewal)
export interface SubscriptionRenewedEmailData extends SubscriptionEmailBaseData {
  planName: string;
  renewedDate: string;
  amountPaid: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  nextBillingAmount: number;
  paymentMethod?: PaymentMethodSummary;
  invoiceDetails: SubscriptionInvoiceDetails;
}

// Subscription Cancelled Email Data
export interface SubscriptionCancelledEmailData extends SubscriptionEmailBaseData {
  planName: string;
  cancellationDate: string;
  effectiveEndDate: string;
  daysRemaining: number;
  reason?: string;
  offboardingChecklist: Array<{
    title: string;
    description: string;
    actionUrl?: string;
    completed?: boolean;
  }>;
  dataExportUrl: string;
  reactivateUrl: string;
  feedbackUrl: string;
}

// Cancellation Feedback Request Email Data
export interface SubscriptionCancellationFeedbackEmailData extends SubscriptionEmailBaseData {
  planName: string;
  cancellationDate: string;
  effectiveEndDate: string;
  feedbackUrl: string;
  feedbackOptions: Array<{
    value: string;
    label: string;
  }>;
  specialOfferAvailable?: boolean;
  specialOfferDetails?: {
    discountPercent: number;
    validUntil: string;
    reactivateUrl: string;
  };
}

// Plan Change Scheduled Email Data (for end-of-period changes)
export interface SubscriptionPlanChangeScheduledEmailData extends SubscriptionEmailBaseData {
  currentPlanName: string;
  scheduledPlanName: string;
  currentPrice: number;
  scheduledPrice: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  changeType: "upgrade" | "downgrade";
  scheduledDate: string;
  daysUntilChange: number;
  featureChanges: PlanFeature[];
  cancelChangeUrl: string;
}

// Invoice Available Email Data
export interface SubscriptionInvoiceAvailableEmailData extends SubscriptionEmailBaseData {
  invoiceDetails: SubscriptionInvoiceDetails;
  planName: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  paymentMethod?: PaymentMethodSummary;
  payNowUrl?: string;
}

// Price Increase Notice Email Data (30 days advance for annual)
export interface SubscriptionPriceIncreaseNoticeEmailData extends SubscriptionEmailBaseData {
  planName: string;
  currentPrice: number;
  newPrice: number;
  priceIncreaseAmount: number;
  priceIncreasePercent: number;
  currency: string;
  billingCycle: "monthly" | "yearly";
  effectiveDate: string;
  daysUntilIncrease: number;
  reason?: string;
  newFeatures?: string[];
  cancelUrl: string;
  downgradePlanUrl?: string;
  acknowledgmentRequired?: boolean;
}

// Union type for all subscription lifecycle email data
export type SubscriptionLifecycleEmailData =
  | SubscriptionUpgradeConfirmationEmailData
  | SubscriptionDowngradeConfirmationEmailData
  | SubscriptionRenewalReminderEmailData
  | SubscriptionRenewedEmailData
  | SubscriptionCancelledEmailData
  | SubscriptionCancellationFeedbackEmailData
  | SubscriptionPlanChangeScheduledEmailData
  | SubscriptionInvoiceAvailableEmailData
  | SubscriptionPriceIncreaseNoticeEmailData;

// Subscription lifecycle email preferences
export interface SubscriptionLifecycleEmailPreferences {
  enabled: boolean;
  renewalReminders: boolean;
  invoiceNotifications: boolean;
  priceChangeNotices: boolean;
}

// ============================================================================
// Product Announcement Email Types (S088)
// ============================================================================

// Announcement types
export type AnnouncementType = "feature" | "update" | "maintenance" | "security";

// Announcement audience segments
export type AnnouncementAudience =
  | "all"
  | "admins_only"
  | "managers_only"
  | "users_only"
  | "free_tier"
  | "starter_tier"
  | "professional_tier"
  | "enterprise_tier"
  | "trial_users"
  | "custom";

// Base announcement email data
export interface AnnouncementEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  announcementId: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
  supportEmail: string;
}

// Feature announcement email data (new feature launch)
export interface AnnouncementFeatureEmailData extends AnnouncementEmailBaseData {
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  featureHighlights?: {
    title: string;
    description: string;
    icon?: string;
  }[];
  releaseDate?: string;
}

// Product update digest email data (monthly changelog)
export interface AnnouncementUpdateEmailData extends AnnouncementEmailBaseData {
  title: string;
  subtitle?: string;
  introText?: string;
  changelogEntries: {
    title: string;
    description: string;
    category: "feature" | "improvement" | "bugfix" | "performance" | "security" | "other";
    docsUrl?: string;
    imageUrl?: string;
    version?: string;
    releaseDate?: string;
  }[];
  ctaText?: string;
  ctaUrl?: string;
  period: {
    start: string;
    end: string;
  };
}

// Maintenance notification email data
export interface AnnouncementMaintenanceEmailData extends AnnouncementEmailBaseData {
  title: string;
  content: string;
  maintenanceStart: string;
  maintenanceEnd: string;
  expectedDuration: string;
  affectedServices: string[];
  impactLevel: "minimal" | "partial" | "full";
  workarounds?: string[];
  statusPageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}

// Security update notification email data
export interface AnnouncementSecurityEmailData extends AnnouncementEmailBaseData {
  title: string;
  content: string;
  severity: "critical" | "high" | "medium" | "low";
  actionRequired: boolean;
  requiredActions?: {
    title: string;
    description: string;
    actionUrl?: string;
    deadline?: string;
  }[];
  affectedFeatures?: string[];
  ctaText: string;
  ctaUrl: string;
  securityPageUrl?: string;
}

// Generic announcement email data (for custom announcements)
export interface AnnouncementGenericEmailData extends AnnouncementEmailBaseData {
  type: AnnouncementType;
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

// Union type for all announcement email data
export type AnnouncementEmailData =
  | AnnouncementFeatureEmailData
  | AnnouncementUpdateEmailData
  | AnnouncementMaintenanceEmailData
  | AnnouncementSecurityEmailData
  | AnnouncementGenericEmailData;

// User announcement preferences
export interface AnnouncementEmailPreferences {
  featureAnnouncements: boolean;
  productUpdates: boolean;
  maintenanceNotifications: boolean;
  securityUpdates: boolean; // Cannot be disabled for critical security
  digestOnly: boolean;
}

// Announcement tracking data (for engagement analytics)
export interface AnnouncementTrackingData {
  announcementId: string;
  userId: string;
  email: string;
  status: "pending" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed" | "unsubscribed";
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  clickCount?: number;
  clickedUrls?: { url: string; clickedAt: string }[];
  errorMessage?: string;
}

// =============================================================================
// MANAGER & ADMIN ALERT EMAIL DATA INTERFACES (S089)
// =============================================================================

export type AdminAlertType =
  | "negative_review"
  | "team_struggling"
  | "compliance_violation"
  | "usage_limit"
  | "team_member_joined"
  | "team_member_left"
  | "unusual_activity"
  | "integration_disconnected";

export type AdminAlertSeverity = "low" | "medium" | "high" | "critical";

// Base interface for all admin alert emails
export interface AdminAlertBaseEmailData extends BaseEmailData {
  recipientName: string;
  organizationName: string;
  actionUrl: string;
  unsubscribeUrl: string;
}

// Negative review alert (for managers when team member gets low rating)
export interface AdminAlertNegativeReviewEmailData extends AdminAlertBaseEmailData {
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  reviewDate: string;
  reviewSource?: string;
  suggestedResponse?: string;
}

// Team member struggling alert (below threshold performance)
export interface AdminAlertTeamStrugglingEmailData extends AdminAlertBaseEmailData {
  loanOfficerName: string;
  loanOfficerPhotoUrl?: string;
  currentRating: number;
  previousRating?: number;
  threshold: number;
  reviewCount?: number;
  trend: "declining" | "stagnant" | "volatile";
  recentReviews?: Array<{
    rating: number;
    date: string;
    customerName?: string;
    source?: string;
  }>;
  actionUrl: string;
  coachingUrl: string;
}

// Compliance violation alert (flagged content)
export interface AdminAlertComplianceViolationEmailData extends AdminAlertBaseEmailData {
  loanOfficerName?: string;
  customerName?: string;
  violationType: "profanity" | "pii" | "legal_risk" | "brand_violation" | "other";
  contentSource: "review" | "response" | "testimonial" | "bio";
  flaggedContent: string;
  flaggedAt: string;
  reviewQueueUrl: string;
}

// Usage limit approaching alert
export interface AdminAlertUsageLimitEmailData extends AdminAlertBaseEmailData {
  limitType: "surveys" | "reviews" | "team_members" | "api_calls" | "storage";
  currentUsage: number;
  maxLimit: number;
  percentUsed: number;
  periodEnd?: string;
  actionUrl: string;
  upgradeUrl: string;
  usageDetailsUrl: string;
}

// Team member joined notification
export interface AdminAlertTeamMemberJoinedEmailData extends AdminAlertBaseEmailData {
  newMemberName: string;
  newMemberEmail: string;
  newMemberRole: string;
  newMemberPhotoUrl?: string;
  invitedBy?: string;
  joinedAt: string;
  teamDirectoryUrl: string;
}

// Team member left notification
export interface AdminAlertTeamMemberLeftEmailData extends AdminAlertBaseEmailData {
  departedMemberName: string;
  departedMemberEmail: string;
  departedMemberRole: string;
  leftAt: string;
  reason?: "resigned" | "terminated" | "account_deleted" | "unknown";
  pendingItemsCount?: number;
  reassignUrl?: string;
}

// Unusual activity alert (security-related)
export interface AdminAlertUnusualActivityEmailData extends AdminAlertBaseEmailData {
  activityType: "login_anomaly" | "bulk_action" | "data_export" | "permission_change" | "api_abuse" | "unknown";
  description: string;
  userInvolved?: string;
  userEmail?: string;
  ipAddress?: string;
  location?: string;
  detectedAt: string;
  riskLevel: AdminAlertSeverity;
  securitySettingsUrl: string;
}

// Integration disconnected alert
export interface AdminAlertIntegrationDisconnectedEmailData extends AdminAlertBaseEmailData {
  integrationName: string;
  disconnectedAt: string;
  reason?: "token_expired" | "revoked" | "api_error" | "rate_limited" | "account_suspended" | "unknown";
  affectedFeatures?: string[];
  reconnectUrl: string;
  integrationsUrl: string;
}

// Individual alert item for digest emails
export interface AdminAlertDigestItem {
  alertType: string;
  severity: AdminAlertSeverity;
  title: string;
  summary: string;
  timestamp: string;
  actionUrl: string;
}

// Daily digest of all admin alerts
export interface AdminAlertDigestEmailData extends BaseEmailData {
  recipientName: string;
  organizationName: string;
  digestDate: string;
  alerts: AdminAlertDigestItem[];
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  dashboardUrl: string;
  alertSettingsUrl: string;
  unsubscribeUrl: string;
}

// Admin alert preferences (mirrors database table)
export interface AdminAlertPreferences {
  alertsEnabled: boolean;
  deliveryMode: "immediate" | "daily_digest";
  digestHour: number;
  digestTimezone: string;
  alertNegativeReview: boolean;
  negativeReviewThreshold: number;
  alertTeamStruggling: boolean;
  teamStrugglingRatingThreshold: number;
  alertComplianceViolation: boolean;
  alertUsageLimit: boolean;
  usageLimitThresholdPercent: number;
  alertTeamMemberJoined: boolean;
  alertTeamMemberLeft: boolean;
  alertUnusualActivity: boolean;
  alertIntegrationDisconnected: boolean;
}

// =============================================================================
// ABANDONED ACTION RECOVERY EMAIL DATA INTERFACES (S093)
// =============================================================================

// Abandoned action types
export type AbandonedActionType =
  | "survey_creation"
  | "survey_send"
  | "video_request"
  | "billing_upgrade"
  | "profile_completion"
  | "integration_setup";

// Base abandoned action email data (shared across all abandoned action emails)
export interface AbandonedActionEmailBaseData extends BaseEmailData {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  resumeUrl: string;
  unsubscribeUrl: string;
  actionStartedAt: string;
  emailNumber: 1 | 2;
}

// Abandoned Survey Creation Email Data (started creating survey template, didn't finish)
export interface AbandonedSurveyCreationEmailData extends AbandonedActionEmailBaseData {
  templateName?: string;
  lastStep?: string;
  lastFieldEdited?: string;
  createSurveyUrl: string;
  helpText?: string;
}

// Abandoned Survey Send Email Data (selected contacts but didn't send)
export interface AbandonedSurveySendEmailData extends AbandonedActionEmailBaseData {
  contactsSelected: number;
  templateName?: string;
  sendSurveyUrl: string;
  helpText?: string;
}

// Abandoned Video Request Email Data (started form but didn't submit)
export interface AbandonedVideoRequestEmailData extends AbandonedActionEmailBaseData {
  customerName?: string;
  requestStep?: string;
  createRequestUrl: string;
  helpText?: string;
}

// Abandoned Billing Upgrade Email Data (visited pricing but didn't complete)
export interface AbandonedBillingUpgradeEmailData extends AbandonedActionEmailBaseData {
  targetPlan?: string;
  currentPlan?: string;
  pricingUrl: string;
  upgradeUrl: string;
  featuresHighlight?: string[];
  specialOffer?: {
    discountPercent?: number;
    validUntil?: string;
  };
  helpText?: string;
}

// Abandoned Profile Completion Email Data (started editing but left incomplete)
export interface AbandonedProfileCompletionEmailData extends AbandonedActionEmailBaseData {
  completionPercent: number;
  fieldsIncomplete: string[];
  profileUrl: string;
  benefitStats?: {
    moreInquiries?: string;
    higherTrust?: string;
  };
  helpText?: string;
}

// Abandoned Integration Setup Email Data (started OAuth but didn't complete)
export interface AbandonedIntegrationSetupEmailData extends AbandonedActionEmailBaseData {
  integrationType: string;
  integrationDisplayName: string;
  oauthStep?: string;
  integrationsUrl: string;
  setupGuideUrl?: string;
  integrationBenefits?: string[];
  helpText?: string;
}

// Union type for all abandoned action email data
export type AbandonedActionEmailData =
  | AbandonedSurveyCreationEmailData
  | AbandonedSurveySendEmailData
  | AbandonedVideoRequestEmailData
  | AbandonedBillingUpgradeEmailData
  | AbandonedProfileCompletionEmailData
  | AbandonedIntegrationSetupEmailData;

// Abandoned action tracking record (from database)
export interface AbandonedActionRecord {
  id: string;
  user_id: string;
  organization_id: string;
  action_type: AbandonedActionType;
  status: "started" | "completed" | "abandoned" | "recovered" | "expired";
  context: Record<string, unknown>;
  resume_url?: string;
  recovery_email_1_sent_at?: string;
  recovery_email_2_sent_at?: string;
  recovery_email_1_id?: string;
  recovery_email_2_id?: string;
  started_at: string;
  completed_at?: string;
  abandoned_at?: string;
  recovered_at?: string;
  expired_at?: string;
}

// Abandoned action recovery email preferences
export interface AbandonedActionRecoveryPreferences {
  enabled: boolean;
  optedOut: boolean;
}

// =============================================================================
// REFERRAL PROGRAM EMAILS (S094)
// =============================================================================

// Social sharing link configuration
export interface ReferralSocialShareLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  whatsapp?: string;
  email?: string;
}

// Pre-filled social messages
export interface ReferralSocialMessages {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  whatsapp?: string;
  email?: {
    subject: string;
    body: string;
  };
}

// Base referral email data (shared across all referral emails)
export interface ReferralEmailBaseData extends BaseEmailData {
  referrerFirstName: string;
  referrerFullName: string;
  referrerEmail: string;
  organizationName: string;
  organizationLogoUrl?: string;
  referralLink: string;
  referralCode: string;
  dashboardUrl: string;
  referralProgramUrl: string;
  unsubscribeUrl: string;
}

// Referral invite email (sent by referrer to friends)
export interface ReferralInviteEmailData extends ReferralEmailBaseData {
  recipientName?: string;
  recipientEmail: string;
  personalMessage?: string;
  rewardForReferrer: string;
  rewardForFriend: string;
  signupUrl: string;
  socialShareLinks?: ReferralSocialShareLinks;
  socialMessages?: ReferralSocialMessages;
}

// Referrer notification when friend signs up
export interface ReferralFriendSignedUpEmailData extends ReferralEmailBaseData {
  friendName: string;
  friendEmail: string;
  signedUpAt: string;
  totalReferrals: number;
  pendingRewards: number;
  nextMilestone?: {
    referralsNeeded: number;
    reward: string;
  };
}

// Referrer notification when friend converts to paid
export interface ReferralFriendConvertedEmailData extends ReferralEmailBaseData {
  friendName: string;
  friendPlanName: string;
  convertedAt: string;
  rewardEarned: string;
  rewardType: "credit" | "discount" | "cash" | "points";
  rewardValue: number;
  totalRewardsEarned: number;
  totalSuccessfulReferrals: number;
}

// Reward earned notification (referral credit/discount)
export interface ReferralRewardEarnedEmailData extends ReferralEmailBaseData {
  rewardDescription: string;
  rewardType: "credit" | "discount" | "cash" | "points";
  rewardValue: number;
  rewardExpiresAt?: string;
  howToRedeem: string;
  redeemUrl: string;
  totalRewardsEarned: number;
  availableBalance: number;
  friendName?: string;
}

// Referral program reminder (for inactive referrers)
export interface ReferralReminderEmailData extends ReferralEmailBaseData {
  daysSinceLastReferral: number;
  totalReferrals: number;
  pendingRewards: number;
  potentialEarnings: string;
  rewardPerReferral: string;
  socialShareLinks?: ReferralSocialShareLinks;
  socialMessages?: ReferralSocialMessages;
  topReferrerStats?: {
    name: string;
    referrals: number;
  };
}

// Referral leaderboard update (top referrers)
export interface ReferralLeaderboardEmailData extends ReferralEmailBaseData {
  leaderboardPeriod: "weekly" | "monthly" | "all_time";
  periodStartDate: string;
  periodEndDate: string;
  userRank: number;
  userReferrals: number;
  previousRank?: number;
  rankChange?: "up" | "down" | "same";
  topReferrers: Array<{
    rank: number;
    name: string;
    referrals: number;
    reward?: string;
    isCurrentUser?: boolean;
  }>;
  referralsToNextRank?: number;
  leaderboardRewards?: Array<{
    rank: string;
    reward: string;
  }>;
  socialShareLinks?: ReferralSocialShareLinks;
}

// Referral tracking record (from database)
export interface ReferralRecord {
  id: string;
  referrer_user_id: string;
  referred_user_id?: string;
  referral_code: string;
  referral_link: string;
  status: "pending" | "signed_up" | "converted" | "rewarded" | "expired";
  invite_sent_at?: string;
  signed_up_at?: string;
  converted_at?: string;
  reward_issued_at?: string;
  reward_type?: "credit" | "discount" | "cash" | "points";
  reward_value?: number;
  reward_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Referral program settings (per organization)
export interface ReferralProgramSettings {
  enabled: boolean;
  rewardType: "credit" | "discount" | "cash" | "points";
  referrerReward: number;
  friendReward: number;
  rewardExpirationDays?: number;
  maxReferralsPerUser?: number;
  requirePaidConversion: boolean;
  customMessaging?: {
    inviteSubject?: string;
    inviteBody?: string;
    socialMessages?: ReferralSocialMessages;
  };
}

// Union type for all referral email data
export type ReferralEmailData =
  | ReferralInviteEmailData
  | ReferralFriendSignedUpEmailData
  | ReferralFriendConvertedEmailData
  | ReferralRewardEarnedEmailData
  | ReferralReminderEmailData
  | ReferralLeaderboardEmailData;
