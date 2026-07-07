// Notification system types

export type NotificationType =
  | "new_review"
  | "negative_review"
  | "review_approved"
  | "review_rejected"
  | "review_needs_response"
  | "response_posted"
  | "badge_earned"
  | "milestone_reached"
  | "mention"
  | "report_ready"
  | "digest"
  | "system";

export type DigestFrequency = "daily" | "weekly" | "monthly";

export interface Notification {
  id: string;
  user_id: string;
  organization_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  review_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  action_url: string | null;
  priority: number;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;

  // In-app notifications
  in_app_enabled: boolean;
  in_app_new_review: boolean;
  in_app_negative_review: boolean;
  in_app_review_approved: boolean;
  in_app_response_posted: boolean;
  in_app_badge_earned: boolean;
  in_app_mention: boolean;

  // Email notifications
  email_enabled: boolean;
  email_new_review: boolean;
  email_negative_review: boolean;
  email_review_approved: boolean;
  email_response_posted: boolean;
  email_badge_earned: boolean;
  email_mention: boolean;

  // Digest preferences
  digest_enabled: boolean;
  digest_frequency: DigestFrequency;
  digest_day_of_week: number | null;
  digest_hour: number;
  digest_timezone: string;
  last_digest_sent_at: string | null;

  // Instant alerts
  instant_alert_threshold: number;
  instant_alert_enabled: boolean;

  // Slack integration
  slack_enabled: boolean;
  slack_webhook_url: string | null;
  slack_channel: string | null;
  slack_new_review: boolean;
  slack_negative_review: boolean;
  slack_digest: boolean;

  // MS Teams integration
  teams_enabled: boolean;
  teams_webhook_url: string | null;
  teams_new_review: boolean;
  teams_negative_review: boolean;
  teams_digest: boolean;

  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  organizationId?: string;
  reviewId?: string;
  loanOfficerId?: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  priority?: number;
}

export interface NotificationWithDetails extends Notification {
  review?: {
    id: string;
    rating: number;
    customer_name: string | null;
    text: string | null;
  } | null;
  loan_officer?: {
    id: string;
    full_name: string;
    photo_url: string | null;
  } | null;
}

export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  accessory?: {
    type: string;
    text?: {
      type: string;
      text: string;
    };
    url?: string;
    action_id?: string;
  };
  elements?: Array<{
    type: string;
    text?: string | { type: string; text: string };
    url?: string;
    action_id?: string;
  }>;
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

export interface DigestEmailData {
  recipientName: string;
  recipientEmail: string;
  notifications: Array<{
    type: NotificationType;
    title: string;
    message: string;
    actionUrl: string | null;
    createdAt: string;
  }>;
  digestPeriod: string;
  dashboardUrl: string;
}

export interface SlackWebhookLog {
  id: string;
  user_id: string;
  organization_id: string | null;
  notification_id: string | null;
  webhook_url: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface TeamsWebhookLog {
  id: string;
  user_id: string;
  organization_id: string | null;
  notification_id: string | null;
  webhook_url: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface TeamsAdaptiveCardElement {
  type: string;
  text?: string;
  size?: string;
  weight?: string;
  wrap?: boolean;
  color?: string;
  spacing?: string;
  isSubtle?: boolean;
  facts?: Array<{ title: string; value: string }>;
  items?: TeamsAdaptiveCardElement[];
  style?: string;
}

export interface TeamsAdaptiveCard {
  type: "message";
  attachments: Array<{
    contentType: "application/vnd.microsoft.card.adaptive";
    contentUrl?: null;
    content: {
      $schema: string;
      type: "AdaptiveCard";
      version: string;
      body: TeamsAdaptiveCardElement[];
      actions?: Array<{
        type: "Action.OpenUrl";
        title: string;
        url: string;
      }>;
    };
  }>;
}

// Default notification preferences for new users
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  "id" | "user_id" | "created_at" | "updated_at"
> = {
  in_app_enabled: true,
  in_app_new_review: true,
  in_app_negative_review: true,
  in_app_review_approved: true,
  in_app_response_posted: true,
  in_app_badge_earned: true,
  in_app_mention: true,

  email_enabled: true,
  email_new_review: true,
  email_negative_review: true,
  email_review_approved: true,
  email_response_posted: true,
  email_badge_earned: false,
  email_mention: true,

  digest_enabled: false,
  digest_frequency: "daily",
  digest_day_of_week: 1, // Monday
  digest_hour: 9,
  digest_timezone: "America/New_York",
  last_digest_sent_at: null,

  instant_alert_threshold: 3,
  instant_alert_enabled: true,

  slack_enabled: false,
  slack_webhook_url: null,
  slack_channel: null,
  slack_new_review: true,
  slack_negative_review: true,
  slack_digest: false,

  teams_enabled: false,
  teams_webhook_url: null,
  teams_new_review: true,
  teams_negative_review: true,
  teams_digest: false,

  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
};
