import type { SmsTemplateCategory } from "../types";

export interface DefaultTemplate {
  name: string;
  category: SmsTemplateCategory;
  body: string;
  merge_fields: string[];
}

/**
 * Default SMS templates created when an organization initializes SMS.
 * These are marked is_default=true and is_locked=true in the database.
 */
export const DEFAULT_SMS_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Review Request",
    category: "review_request",
    body: "Hi {{first_name}}, thanks for working with {{lo_name}} at {{company_name}}! We'd love your feedback. Share your experience here: {{review_link}} Reply STOP to opt out.",
    merge_fields: [
      "first_name",
      "lo_name",
      "company_name",
      "review_link",
    ],
  },
  {
    name: "Follow-Up Reminder",
    category: "follow_up",
    body: "Hi {{first_name}}, just a friendly reminder from {{company_name}}. We'd still love to hear about your experience with {{lo_name}}. Leave a review here: {{review_link}} Reply STOP to opt out.",
    merge_fields: [
      "first_name",
      "company_name",
      "lo_name",
      "review_link",
    ],
  },
  {
    name: "Thank You",
    category: "thank_you",
    body: "Thank you, {{first_name}}! {{lo_name}} at {{company_name}} appreciates your feedback. We're glad we could help. Reply STOP to opt out.",
    merge_fields: [
      "first_name",
      "lo_name",
      "company_name",
    ],
  },
  {
    name: "Video Testimonial Request",
    category: "video_request",
    body: "Hi {{first_name}}, {{lo_name}} at {{company_name}} would love a quick video testimonial from you! It only takes 60 seconds: {{video_link}} Reply STOP to opt out.",
    merge_fields: [
      "first_name",
      "lo_name",
      "company_name",
      "video_link",
    ],
  },
];
