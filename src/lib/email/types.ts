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
  | "video_testimonial_pending_approval";

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
