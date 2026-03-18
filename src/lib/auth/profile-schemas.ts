import { z } from "zod";

// -- Reusable field fragments --

const optionalUrl = (label?: string) =>
  z.string().url(label ? `Please enter a valid ${label} URL` : "Please enter a valid URL").optional().or(z.literal(""));
const optionalString = (max: number, label: string) =>
  z.string().max(max, `${label} must be ${max} characters or less`).optional().or(z.literal(""));

// -- Base profile fields shared by self-edit AND admin-edit --

export const profileFieldsSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  title: optionalString(100, "Title"),
  nmlsId: optionalString(50, "License number"),
  bio: optionalString(500, "Bio"),
  phone: z.string()
    .regex(/^[\d\s\-+()]*$/, "Please enter a valid phone number")
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  personalWebsiteUrl: optionalUrl("website"),
  linkedinUrl: optionalUrl("LinkedIn"),
  zillowProfileUrl: optionalUrl("Zillow"),
  facebookUrl: optionalUrl("Facebook"),
  instagramUrl: optionalUrl("Instagram"),
  twitterUrl: optionalUrl("Twitter/X"),
  timezone: z.string().optional().or(z.literal("")),
});

// -- Self-edit: base + avatar/banner URLs --

export const updateProfileSchema = profileFieldsSchema.extend({
  avatarUrl: optionalUrl(),
  bannerUrl: optionalUrl(),
});

// -- Admin-edit: partial base (admins may update a subset) + org-managed fields --

export const adminProfileSchema = profileFieldsSchema.partial().extend({
  ctaButtonText: optionalString(50, "CTA button text"),
  ctaButtonUrl: optionalUrl("CTA button"),
  hireDate: z.string().optional().or(z.literal("")),
});

// -- Org-managed fields (individual users can self-edit these) --

export const orgFieldsSchema = z.object({
  ctaButtonText: optionalString(50, "CTA button text"),
  ctaButtonUrl: optionalUrl("CTA button"),
  hireDate: z.string().optional().or(z.literal("")),
});

export type OrgFieldsInput = z.infer<typeof orgFieldsSchema>;

// -- Password change --

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// -- Inferred types --

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminProfileInput = z.infer<typeof adminProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export interface ProfileResult {
  success: boolean;
  error?: string;
}

// -- Consolidated profile data object for prop drilling --

export interface UserProfileData {
  id?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  title?: string | null;
  nmlsId?: string | null;
  bio?: string | null;
  phone?: string | null;
  personalWebsiteUrl?: string | null;
  linkedinUrl?: string | null;
  zillowProfileUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  timezone?: string | null;
  slug?: string | null;
  role?: string | null;
  accountType?: 'individual' | 'enterprise';
  ctaButtonText?: string | null;
  ctaButtonUrl?: string | null;
  hireDate?: string | null;
  industry?: string | null;
}

/** Map a snake_case DB row (or partial) to UserProfileData. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toUserProfileData(row: Record<string, any> | null | undefined): UserProfileData {
  if (!row) return {};
  return {
    id: row.id ?? undefined,
    email: row.email ?? undefined,
    fullName: row.full_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bannerUrl: row.banner_url ?? undefined,
    title: row.title ?? undefined,
    nmlsId: row.nmls_id ?? undefined,
    bio: row.bio ?? undefined,
    phone: row.phone ?? undefined,
    personalWebsiteUrl: row.personal_website_url ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    zillowProfileUrl: row.zillow_profile_url ?? undefined,
    facebookUrl: row.facebook_url ?? undefined,
    instagramUrl: row.instagram_url ?? undefined,
    twitterUrl: row.twitter_url ?? undefined,
    timezone: row.timezone ?? undefined,
    slug: row.slug ?? undefined,
    role: row.role ?? undefined,
    accountType: row.account_type ?? row.organization?.account_type ?? undefined,
    ctaButtonText: row.cta_button_text ?? undefined,
    ctaButtonUrl: row.cta_button_url ?? undefined,
    hireDate: row.hire_date ?? undefined,
    industry: row.industry ?? undefined,
  };
}
