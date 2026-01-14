import { z } from "zod";

// Subscription tiers
export const SUBSCRIPTION_TIERS = ["free", "starter", "professional", "enterprise"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

// Subscription statuses
export const SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due", "cancelled", "paused"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// Address schema
export const addressSchema = z.object({
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});
export type Address = z.infer<typeof addressSchema>;

// Organization limits schema
export const organizationLimitsSchema = z.object({
  max_users: z.number().default(10),
  max_loan_officers: z.number().default(50),
  max_surveys_per_month: z.number().default(1000),
  max_api_calls_per_day: z.number().default(10000),
});
export type OrganizationLimits = z.infer<typeof organizationLimitsSchema>;

// Organization features schema
export const organizationFeaturesSchema = z.object({
  ai_insights: z.boolean().default(false),
  google_integration: z.boolean().default(false),
  custom_branding: z.boolean().default(false),
  api_access: z.boolean().default(false),
  sso: z.boolean().default(false),
  webhooks: z.boolean().default(false),
  white_label: z.boolean().default(false),
  advanced_analytics: z.boolean().default(false),
});
export type OrganizationFeatures = z.infer<typeof organizationFeaturesSchema>;

// Full organization schema
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Organization slug is required"),
  domain: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3B82F6"),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#1E40AF"),
  font_family: z.string().default("Inter"),
  company_email: z.string().email().nullable().optional(),
  company_phone: z.string().nullable().optional(),
  company_address: addressSchema.nullable().optional(),
  timezone: z.string().default("America/New_York"),
  date_format: z.string().default("MM/DD/YYYY"),
  billing_email: z.string().email().nullable().optional(),
  billing_address: addressSchema.nullable().optional(),
  subscription_tier: z.enum(SUBSCRIPTION_TIERS).default("free"),
  subscription_status: z.enum(SUBSCRIPTION_STATUSES).default("active"),
  subscription_started_at: z.string().nullable().optional(),
  subscription_ends_at: z.string().nullable().optional(),
  subscription_cancelled_at: z.string().nullable().optional(),
  trial_ends_at: z.string().nullable().optional(),
  features: organizationFeaturesSchema.optional(),
  limits: organizationLimitsSchema.optional(),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Organization = z.infer<typeof organizationSchema>;

// Update organization settings schema
export const updateOrganizationSettingsSchema = z.object({
  name: z.string().min(1, "Organization name is required").optional(),
  domain: z.string().nullable().optional(),
  company_email: z.string().email("Invalid email").nullable().optional(),
  company_phone: z.string().nullable().optional(),
  company_address: addressSchema.nullable().optional(),
  timezone: z.string().optional(),
  date_format: z.string().optional(),
});
export type UpdateOrganizationSettings = z.infer<typeof updateOrganizationSettingsSchema>;

// Update organization branding schema
export const updateOrganizationBrandingSchema = z.object({
  logo_url: z.string().url("Invalid URL").nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
  font_family: z.string().optional(),
});
export type UpdateOrganizationBranding = z.infer<typeof updateOrganizationBrandingSchema>;

// Update organization billing schema
export const updateOrganizationBillingSchema = z.object({
  billing_email: z.string().email("Invalid email").nullable().optional(),
  billing_address: addressSchema.nullable().optional(),
});
export type UpdateOrganizationBilling = z.infer<typeof updateOrganizationBillingSchema>;

// Invitation schema
export const createInvitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "loan_officer"]),
});
export type CreateInvitation = z.infer<typeof createInvitationSchema>;

export const invitationSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "manager", "loan_officer"]),
  token: z.string(),
  invited_by: z.string().uuid().nullable(),
  expires_at: z.string(),
  accepted_at: z.string().nullable(),
  created_at: z.string(),
});
export type Invitation = z.infer<typeof invitationSchema>;

// Organization member (user in organization context)
export const organizationMemberSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  role: z.enum(["admin", "manager", "loan_officer"]),
  is_active: z.boolean(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
});
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;

// Organization stats
export interface OrganizationStats {
  total_users: number;
  total_loan_officers: number;
  total_reviews: number;
  total_surveys: number;
  active_surveys: number;
  pending_reviews: number;
}

// Audit log schema
export const auditLogSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().nullable(),
  old_values: z.record(z.unknown()).nullable(),
  new_values: z.record(z.unknown()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

// Subscription tier features mapping
export const TIER_FEATURES: Record<SubscriptionTier, OrganizationFeatures> = {
  free: {
    ai_insights: false,
    google_integration: false,
    custom_branding: false,
    api_access: false,
    sso: false,
    webhooks: false,
    white_label: false,
    advanced_analytics: false,
  },
  starter: {
    ai_insights: true,
    google_integration: true,
    custom_branding: false,
    api_access: false,
    sso: false,
    webhooks: false,
    white_label: false,
    advanced_analytics: false,
  },
  professional: {
    ai_insights: true,
    google_integration: true,
    custom_branding: true,
    api_access: true,
    sso: false,
    webhooks: true,
    white_label: false,
    advanced_analytics: true,
  },
  enterprise: {
    ai_insights: true,
    google_integration: true,
    custom_branding: true,
    api_access: true,
    sso: true,
    webhooks: true,
    white_label: true,
    advanced_analytics: true,
  },
};

// Subscription tier limits mapping
export const TIER_LIMITS: Record<SubscriptionTier, OrganizationLimits> = {
  free: {
    max_users: 3,
    max_loan_officers: 5,
    max_surveys_per_month: 100,
    max_api_calls_per_day: 100,
  },
  starter: {
    max_users: 10,
    max_loan_officers: 25,
    max_surveys_per_month: 500,
    max_api_calls_per_day: 1000,
  },
  professional: {
    max_users: 50,
    max_loan_officers: 100,
    max_surveys_per_month: 2500,
    max_api_calls_per_day: 10000,
  },
  enterprise: {
    max_users: -1, // unlimited
    max_loan_officers: -1, // unlimited
    max_surveys_per_month: -1, // unlimited
    max_api_calls_per_day: -1, // unlimited
  },
};
