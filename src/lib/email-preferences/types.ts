// Email Preferences Center types

export type EmailFrequencyMode = "immediate" | "daily" | "weekly" | "none";

export interface EmailPreferences {
  // Master email toggle
  email_enabled: boolean;

  // Category toggles
  email_onboarding_enabled: boolean;
  email_weekly_summary_enabled: boolean;
  email_milestones_enabled: boolean;
  email_product_updates_enabled: boolean;
  email_marketing_enabled: boolean;

  // Delivery settings
  email_frequency_mode: EmailFrequencyMode;
  email_timezone: string;

  // Quiet hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface EmailPreferencesWithToken extends EmailPreferences {
  user_id: string;
  email: string;
  is_valid: boolean;
}

export interface EmailPreferenceToken {
  id: string;
  user_id: string;
  email: string;
  token: string;
  expires_at: string;
  created_at: string;
  last_used_at: string | null;
}

export interface EmailCategory {
  id: string;
  label: string;
  description: string;
  field: keyof Pick<
    EmailPreferences,
    | "email_onboarding_enabled"
    | "email_weekly_summary_enabled"
    | "email_milestones_enabled"
    | "email_product_updates_enabled"
    | "email_marketing_enabled"
  >;
  canDisable: boolean;
  previewExamples: string[];
}

// Email categories definition
export const EMAIL_CATEGORIES: EmailCategory[] = [
  {
    id: "transactional",
    label: "Transactional",
    description:
      "Essential emails like password resets, security alerts, and account verification. These cannot be disabled.",
    field: "email_onboarding_enabled", // Placeholder - transactional can't be disabled
    canDisable: false,
    previewExamples: [
      "Password reset requests",
      "Security alerts",
      "Account verification",
      "Payment confirmations",
    ],
  },
  {
    id: "onboarding",
    label: "Onboarding",
    description:
      "Welcome emails and getting started guides to help you make the most of RepWell.",
    field: "email_onboarding_enabled",
    canDisable: true,
    previewExamples: [
      "Welcome to RepWell",
      "Getting started guide",
      "Feature highlights",
      "Setup completion tips",
    ],
  },
  {
    id: "weekly_summary",
    label: "Weekly Summaries",
    description:
      "Weekly digest of your reviews, ratings, and reputation performance.",
    field: "email_weekly_summary_enabled",
    canDisable: true,
    previewExamples: [
      "Weekly review summary",
      "Performance insights",
      "Response rate updates",
      "Rating trends",
    ],
  },
  {
    id: "milestones",
    label: "Milestone Celebrations",
    description:
      "Celebrate your achievements like review milestones, badges earned, and streaks.",
    field: "email_milestones_enabled",
    canDisable: true,
    previewExamples: [
      "100 reviews milestone",
      "New badge earned",
      "Monthly streak achieved",
      "Top performer recognition",
    ],
  },
  {
    id: "product_updates",
    label: "Product Updates",
    description:
      "Stay informed about new features, improvements, and platform updates.",
    field: "email_product_updates_enabled",
    canDisable: true,
    previewExamples: [
      "New feature announcement",
      "Platform improvements",
      "Integration updates",
      "Mobile app updates",
    ],
  },
  {
    id: "marketing",
    label: "Marketing & Promotions",
    description:
      "Promotional offers, tips and tricks, and industry insights to grow your business.",
    field: "email_marketing_enabled",
    canDisable: true,
    previewExamples: [
      "Special offers",
      "Industry insights",
      "Best practices",
      "Webinar invitations",
    ],
  },
];

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  email_enabled: true,
  email_onboarding_enabled: true,
  email_weekly_summary_enabled: true,
  email_milestones_enabled: true,
  email_product_updates_enabled: true,
  email_marketing_enabled: false,
  email_frequency_mode: "immediate",
  email_timezone: "America/New_York",
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

// Common timezones for selection
export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "UTC", label: "UTC" },
];
