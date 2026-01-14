// Email template types
export type EmailTemplate =
  | "survey_invitation"
  | "survey_reminder_3day"
  | "survey_reminder_7day"
  | "new_review_notification"
  | "review_pending_approval"
  | "review_approved"
  | "review_rejected";

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
