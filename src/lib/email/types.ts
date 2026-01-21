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
  | "team_invite_5_expiration";

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

// New review notification email data
export interface NewReviewNotificationEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  reviewDate: string;
  dashboardUrl: string;
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
}

// Review approved notification email data (sent to loan officers)
export interface ReviewApprovedEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  rating: number;
  reviewText?: string;
  dashboardUrl: string;
}

// Review rejected notification email data (sent to loan officers)
export interface ReviewRejectedEmailData extends BaseEmailData {
  loanOfficerName: string;
  customerName: string;
  rating: number;
  rejectionReason: string;
  dashboardUrl: string;
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
