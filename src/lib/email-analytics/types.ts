/**
 * Types for Email Analytics Dashboard
 */

export type EmailStatus = "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed";

export type TimePeriod = "7d" | "30d" | "90d" | "all";

export interface EmailMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  // Changes vs previous period
  sentChange: number;
  deliveryRateChange: number;
  openRateChange: number;
  clickRateChange: number;
}

export interface EmailTrendPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
}

export interface EmailTypePerformance {
  templateName: string;
  displayName: string;
  category: string;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
}

export interface UnsubscribeMetrics {
  total: number;
  byReason: {
    reason: string;
    count: number;
  }[];
  rate: number;
  rateChange: number;
}

export interface SequenceFunnelStep {
  step: number;
  name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  dropoffRate: number;
}

export interface SequencePerformance {
  sequenceType: string;
  displayName: string;
  totalStarted: number;
  totalCompleted: number;
  totalCancelled: number;
  completionRate: number;
  averageStepsCompleted: number;
  funnel: SequenceFunnelStep[];
}

// Industry benchmarks for email performance
export const INDUSTRY_BENCHMARKS = {
  deliveryRate: 95,
  openRate: 21.5,
  clickRate: 2.5,
  bounceRate: 2.5,
  unsubscribeRate: 0.3,
} as const;

// Email template categories for grouping
export const EMAIL_TEMPLATE_CATEGORIES: Record<string, string> = {
  // Survey emails
  survey_invitation: "Survey",
  survey_reminder_3day: "Survey",
  survey_reminder_7day: "Survey",
  survey_completion_thank_you: "Survey",
  survey_high_rating_follow_up: "Survey",
  survey_low_rating_follow_up: "Survey",
  survey_response_received_notification: "Survey",
  // Review emails
  review_pending_approval: "Review",
  review_approved: "Review",
  review_rejected: "Review",
  review_published_notification: "Review",
  review_response_sent_confirmation: "Review",
  review_response_received: "Review",
  new_review_notification: "Review",
  negative_review_alert: "Review",
  negative_review_alert_enhanced: "Review",
  review_response_to_reviewer: "Review",
  // Video testimonial emails
  video_testimonial_invitation: "Video Testimonial",
  video_testimonial_reminder_3day: "Video Testimonial",
  video_testimonial_reminder_7day: "Video Testimonial",
  video_testimonial_received: "Video Testimonial",
  video_testimonial_approved: "Video Testimonial",
  video_testimonial_pending_approval: "Video Testimonial",
  // Welcome/onboarding emails
  welcome_1_access: "Welcome Sequence",
  welcome_2_profile: "Welcome Sequence",
  welcome_3_first_action: "Welcome Sequence",
  welcome_4_social_proof: "Welcome Sequence",
  welcome_5_metrics: "Welcome Sequence",
  org_onboarding_1_welcome: "Org Onboarding",
  org_onboarding_2_setup: "Org Onboarding",
  org_onboarding_3_team: "Org Onboarding",
  org_onboarding_4_integration: "Org Onboarding",
  org_onboarding_5_launch: "Org Onboarding",
  org_onboarding_6_success: "Org Onboarding",
  // Notification emails
  milestone_first_review: "Milestone",
  milestone_review_count: "Milestone",
  milestone_5_star: "Milestone",
  milestone_leaderboard: "Milestone",
  milestone_badge_earned: "Milestone",
  milestone_streak: "Milestone",
  milestone_video: "Milestone",
  weekly_summary_lo: "Summary",
  weekly_summary_manager: "Summary",
  // Trial/subscription emails
  trial_ending_1_accomplishments: "Trial",
  trial_ending_2_feature_comparison: "Trial",
  trial_ending_3_final_reminder: "Trial",
  trial_ending_4_grace_period: "Trial",
  trial_ending_5_winback: "Trial",
  // Other
  team_invite: "Team",
  password_reset: "Transactional",
  email_verification: "Transactional",
} as const;

// Helper to get display name from template name
export function getTemplateDisplayName(templateName: string): string {
  return templateName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper to get category from template name
export function getTemplateCategory(templateName: string): string {
  return EMAIL_TEMPLATE_CATEGORIES[templateName] || "Other";
}
