import { z } from "zod";

// Subscription tiers
export const SUBSCRIPTION_TIERS = ["basic", "pro", "enterprise"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

// Subscription statuses
export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "cancelled",
  "paused",
] as const;
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
  max_professionals: z.number().default(50),
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

// Integration management
export const INTEGRATION_KEYS = ["google", "social", "slack", "salesforce"] as const;
export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

export const integrationConfigSchema = z.object({
  enabled: z.boolean(),
});
export type IntegrationConfig = z.infer<typeof integrationConfigSchema>;

export const orgIntegrationsSchema = z.object({
  google: integrationConfigSchema.optional(),
  social: integrationConfigSchema.optional(),
  slack: integrationConfigSchema.optional(),
  salesforce: integrationConfigSchema.optional(),
});
export type OrgIntegrations = z.infer<typeof orgIntegrationsSchema>;

// Full organization schema
export const organizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Organization slug is required"),
  domain: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#3B82F6"),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .default("#1E40AF"),
  font_family: z.string().default("Inter"),
  company_email: z.string().email().nullable().optional(),
  company_phone: z.string().nullable().optional(),
  company_address: addressSchema.nullable().optional(),
  timezone: z.string().default("America/New_York"),
  date_format: z.string().default("MM/DD/YYYY"),
  billing_email: z.string().email().nullable().optional(),
  billing_address: addressSchema.nullable().optional(),
  subscription_tier: z.enum(SUBSCRIPTION_TIERS).default("basic"),
  subscription_status: z.enum(SUBSCRIPTION_STATUSES).default("active"),
  subscription_started_at: z.string().nullable().optional(),
  subscription_ends_at: z.string().nullable().optional(),
  subscription_cancelled_at: z.string().nullable().optional(),
  trial_ends_at: z.string().nullable().optional(),
  features: organizationFeaturesSchema.optional(),
  limits: organizationLimitsSchema.optional(),
  website_url: z.string().url().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  facebook_url: z.string().url().nullable().optional(),
  instagram_url: z.string().url().nullable().optional(),
  twitter_url: z.string().url().nullable().optional(),
  mission_statement: z.string().nullable().optional(),
  headquarters_address: addressSchema.nullable().optional(),
  headquarters_branch_id: z.string().uuid().nullable().optional(),
  industry: z.string().nullable().optional(),
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
  website_url: z.string().url("Invalid URL").or(z.literal("")).nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).nullable().optional(),
  linkedin_url: z.string().url("Invalid URL").or(z.literal("")).nullable().optional(),
  facebook_url: z.string().url("Invalid URL").or(z.literal("")).nullable().optional(),
  instagram_url: z.string().url("Invalid URL").or(z.literal("")).nullable().optional(),
  twitter_url: z.string().url("Invalid URL").or(z.literal("")).nullable().optional(),
  headquarters_branch_id: z.string().uuid().or(z.literal("")).nullable().optional(),
});
export type UpdateOrganizationSettings = z.infer<typeof updateOrganizationSettingsSchema>;

// Update organization branding schema
export const updateOrganizationBrandingSchema = z.object({
  logo_url: z.string().url("Invalid URL").nullable().optional(),
  avatar_url: z.string().url("Invalid URL").nullable().optional(),
  banner_url: z.string().url("Invalid URL").nullable().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
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
  role: z.enum(["admin", "manager", "user"]),
});
export type CreateInvitation = z.infer<typeof createInvitationSchema>;

export const invitationSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "manager", "user"]),
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
  slug: z.string().nullable(),
  role: z.enum(["admin", "manager", "user"]),
  is_active: z.boolean(),
  last_login_at: z.string().nullable(),
  created_at: z.string(),
  profile_completion: z.number().min(0).max(100).default(0),
});
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;

// Full member profile (for admin edit page)
export interface OrganizationMemberFull {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  title: string | null;
  nmls_id: string | null;
  phone: string | null;
  personal_website_url: string | null;
  linkedin_url: string | null;
  zillow_profile_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  timezone: string | null;
  branch_id: string | null;
  role: "admin" | "manager" | "user";
  is_active: boolean;
  is_owner: boolean;
  slug: string | null;
  cta_button_text: string | null;
  cta_button_url: string | null;
  hire_date: string | null;
  address: string | null;
  industry: string | null;
  created_at: string;
}

// UpdateMemberProfileData replaced by AdminProfileInput from @/lib/auth/profile-schemas

// Organization stats
export interface OrganizationStats {
  total_users: number;
  total_members: number;
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
  basic: {
    ai_insights: false,
    google_integration: true,
    custom_branding: false,
    api_access: false,
    sso: false,
    webhooks: false,
    white_label: false,
    advanced_analytics: false,
  },
  pro: {
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

// Email branding config shape used by the email builder and renderer
export const emailBrandingConfigSchema = z.object({
  header: z
    .object({
      logoSrc: z.string().default(""),
      logoAlt: z.string().default("Logo"),
      logoHeight: z.number().min(20).max(120).default(42),
      variant: z.enum(["centered", "inline", "social"]).default("centered"),
      navLinks: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
      socialLinks: z
        .object({
          twitter: z.string().optional(),
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          linkedin: z.string().optional(),
        })
        .default({}),
      backgroundColor: z.string().optional(),
      linkColor: z.string().default("rgb(75,85,99)"),
    })
    .default({}),
  footer: z
    .object({
      logoSrc: z.string().default(""),
      logoAlt: z.string().default("Logo"),
      companyName: z.string().default(""),
      tagline: z.string().default(""),
      address: z.string().default(""),
      contactInfo: z.string().default(""),
      variant: z.enum(["centered", "split"]).default("centered"),
      socialLinks: z
        .object({
          facebook: z.string().optional(),
          twitter: z.string().optional(),
          instagram: z.string().optional(),
          linkedin: z.string().optional(),
        })
        .default({}),
      backgroundColor: z.string().optional(),
    })
    .default({}),
  compliance: z
    .object({
      physicalAddress: z.string().default(""),
      unsubscribeText: z.string().default(""),
      copyrightHolder: z.string().default(""),
    })
    .default({}),
  enabled: z.boolean().default(false),
});
export type EmailBrandingConfig = z.infer<typeof emailBrandingConfigSchema>;

// Subscription tier limits mapping
export const TIER_LIMITS: Record<SubscriptionTier, OrganizationLimits> = {
  basic: {
    max_users: 1,
    max_professionals: 1,
    max_surveys_per_month: 200,
    max_api_calls_per_day: 100,
  },
  pro: {
    max_users: 1,
    max_professionals: 1,
    max_surveys_per_month: 1000,
    max_api_calls_per_day: 1000,
  },
  enterprise: {
    max_users: -1, // unlimited
    max_professionals: -1, // unlimited
    max_surveys_per_month: -1, // unlimited
    max_api_calls_per_day: -1, // unlimited
  },
};
