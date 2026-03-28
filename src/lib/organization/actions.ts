"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/better-auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { Tables } from "@/types/database.types";
import {
  updateOrganizationSettingsSchema,
  updateOrganizationBrandingSchema,
  updateOrganizationBillingSchema,
  createInvitationSchema,
  type Organization,
  type OrganizationMember,
  type OrganizationMemberFull,
  type Invitation,
  type OrganizationStats,
  type AuditLog,
  type UpdateOrganizationSettings,
  type UpdateOrganizationBranding,
  type UpdateOrganizationBilling,
  type CreateInvitation,
  type SubscriptionTier,
  type SubscriptionStatus,
  INTEGRATION_KEYS,
  orgIntegrationsSchema,
  type OrgIntegrations,
  type EmailBrandingConfig,
} from "./types";
import { adminProfileSchema, type AdminProfileInput } from "@/lib/auth/profile-schemas";
import { writeProfileUpdate, writeAvatarUpload, writeBannerUpload } from "@/lib/users/profile-mutations";
import { validateOrgSlug, generateUserSlug, generateUniqueUserSlug } from "@/lib/users/slug-utils";
import { deriveEmailBrandingConfig } from "./email-branding";
import crypto from "crypto";

const IMPERSONATION_SOURCE = "organization_team";
const DEFAULT_DATE_FORMAT = "MM/DD/YYYY";

type ImpersonationAuditAction =
  | "impersonation_started"
  | "impersonation_stopped"
  | "impersonation_start_denied";

function isImpersonationEnabled(): boolean {
  const serverFlag = process.env.ENABLE_USER_IMPERSONATION;
  const publicFlag = process.env.NEXT_PUBLIC_ENABLE_USER_IMPERSONATION;
  return serverFlag !== "false" && publicFlag !== "false";
}

async function writeImpersonationAuditLog({
  organizationId,
  action,
  entityId,
  impersonatorUserId,
  impersonatedUserId,
  reason,
}: {
  organizationId: string | null;
  action: ImpersonationAuditAction;
  entityId: string | null;
  impersonatorUserId: string | null;
  impersonatedUserId: string | null;
  reason?: string;
}) {
  if (!organizationId) return;

  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from("organization_audit_logs")
    .insert({
      organization_id: organizationId,
      user_id: impersonatorUserId,
      action,
      entity_type: "user_session",
      entity_id: entityId,
      new_values: {
        impersonator_user_id: impersonatorUserId,
        impersonated_user_id: impersonatedUserId,
        reason: reason ?? null,
        source: IMPERSONATION_SOURCE,
      },
    });

  if (error) {
    console.error("[Impersonation] Failed to write audit log:", error);
  }
}

// Transform database row to full Organization type
function transformDbOrganization(row: Tables<"organizations">): Organization {
  const settings = row.settings as Record<string, unknown> | null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain ?? null,
    logo_url: row.logo_url ?? null,
    avatar_url: row.avatar_url ?? null,
    banner_url: row.banner_url ?? null,
    primary_color: row.primary_color ?? "#3B82F6",
    secondary_color: row.secondary_color ?? "#1E40AF",
    font_family: row.font_family ?? "Inter",
    company_email: row.company_email ?? null,
    company_phone: row.company_phone ?? null,
    company_address: row.company_address as Organization["company_address"] ?? null,
    timezone: row.timezone ?? "America/New_York",
    date_format: row.date_format ?? DEFAULT_DATE_FORMAT,
    billing_email: row.billing_email ?? null,
    billing_address: row.billing_address as Organization["billing_address"] ?? null,
    mission_statement: row.mission_statement ?? null,
    headquarters_address: row.headquarters_address as Organization["headquarters_address"] ?? null,
    industry: row.industry ?? null,
    subscription_tier: (row.subscription_tier as SubscriptionTier) ?? "basic",
    subscription_status: (row.subscription_status as SubscriptionStatus) ?? "active",
    subscription_started_at: row.subscription_started_at ?? null,
    subscription_ends_at: row.subscription_ends_at ?? null,
    subscription_cancelled_at: row.subscription_cancelled_at ?? null,
    trial_ends_at: row.trial_ends_at ?? null,
    features: settings?.features as Organization["features"],
    limits: settings?.limits as Organization["limits"],
    website_url: row.website_url ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    linkedin_url: row.linkedin_url ?? null,
    facebook_url: row.facebook_url ?? null,
    instagram_url: row.instagram_url ?? null,
    twitter_url: row.twitter_url ?? null,
    headquarters_branch_id: row.headquarters_branch_id ?? null,
    settings: settings ?? undefined,
    metadata: (settings?.metadata as Record<string, unknown>) ?? undefined,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

// Get current user's organization
export async function getCurrentOrganization(): Promise<{
  organization: Organization | null;
  error: string | null
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { organization: null, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization_id
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { organization: null, error: "No organization found" };
  }

  // Get organization details
  const { data: org, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", userData.organization_id)
    .single();

  if (error) {
    return { organization: null, error: error.message };
  }

  return { organization: transformDbOrganization(org), error: null };
}

// Update organization settings
export async function updateOrganizationSettings(
  data: UpdateOrganizationSettings
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Validate input
  const validated = updateOrganizationSettingsSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update organization settings" };
  }

  // Clean empty strings to null for optional URL/email/uuid fields
  const cleanedData = { ...validated.data };
  const nullableFields = [
    "website_url", "email", "linkedin_url", "facebook_url",
    "instagram_url", "twitter_url", "headquarters_branch_id",
    "company_email",
  ] as const;
  for (const key of nullableFields) {
    if (key in cleanedData && (cleanedData as Record<string, unknown>)[key] === "") {
      (cleanedData as Record<string, unknown>)[key] = null;
    }
  }
  if ("phone" in cleanedData && cleanedData.phone === "") {
    cleanedData.phone = null;
  }
  if ("company_phone" in cleanedData && cleanedData.company_phone === "") {
    cleanedData.company_phone = null;
  }

  // Update organization — all fields are now real columns
  const { error } = await supabase
    .from("organizations")
    .update({
      ...cleanedData,
      date_format: cleanedData.date_format ?? DEFAULT_DATE_FORMAT,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Revalidate admin and public profile pages
  revalidatePath("/dashboard/organization");
  const { data: orgData } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", userData.organization_id)
    .single();
  if (orgData?.slug) {
    revalidatePath(`/org/${orgData.slug}`);
  }

  return { success: true, error: null };
}

// Update organization branding
export async function updateOrganizationBranding(
  data: UpdateOrganizationBranding
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Validate input
  const validated = updateOrganizationBrandingSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update organization branding" };
  }

  // Update organization — all fields are now real columns
  const { error } = await supabase
    .from("organizations")
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization");
  return { success: true, error: null };
}

const LOGO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

// Upload organization logo
export async function uploadOrganizationLogo(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can upload organization logo" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPG, PNG, WebP, or SVG image." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File too large. Maximum size is 5MB." };
  }

  // Get old logo URL for cleanup
  const { data: orgData } = await supabase
    .from("organizations")
    .select("logo_url")
    .eq("id", userData.organization_id)
    .single();
  const oldLogoUrl = orgData?.logo_url;

  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${userData.organization_id}/logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    console.error("Logo upload error:", uploadError);
    return { success: false, error: "Failed to upload logo. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from("organizations")
    .update({
      logo_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (dbError) {
    console.error("Logo DB update error:", dbError);
    await supabase.storage.from("logos").remove([fileName]);
    return { success: false, error: "Failed to update organization. Please try again." };
  }

  // Track in media library
  const { trackMediaAsset } = await import("@/lib/media/track");
  await trackMediaAsset({
    organizationId: userData.organization_id,
    uploadedBy: user.id,
    filename: file.name,
    url: publicUrl,
    contentType: file.type,
    sizeBytes: file.size,
    category: "brand",
  });

  // Clean up old logo file
  if (oldLogoUrl && oldLogoUrl.includes("/logos/")) {
    const oldPath = oldLogoUrl.split("/logos/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("logos").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/organization");
  return { success: true, url: publicUrl };
}

// Remove organization logo
export async function removeOrganizationLogo(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can remove organization logo" };
  }

  // Get current logo URL for storage cleanup
  const { data: orgData } = await supabase
    .from("organizations")
    .select("logo_url")
    .eq("id", userData.organization_id)
    .single();

  const { error: dbError } = await supabase
    .from("organizations")
    .update({
      logo_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  // Remove file from storage
  if (orgData?.logo_url && orgData.logo_url.includes("/logos/")) {
    const oldPath = orgData.logo_url.split("/logos/").pop();
    if (oldPath) {
      await supabase.storage.from("logos").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/organization");
  return { success: true };
}

const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Upload organization profile photo (avatar)
export async function uploadOrganizationAvatar(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can upload organization avatar" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPG, PNG, or WebP image." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File too large. Maximum size is 5MB." };
  }

  // Get old avatar URL for cleanup
  const { data: orgData } = await supabase
    .from("organizations")
    .select("avatar_url")
    .eq("id", userData.organization_id)
    .single();
  const oldAvatarUrl = (orgData as unknown as Record<string, unknown>)?.avatar_url as string | null;

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userData.organization_id}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    console.error("Org avatar upload error:", uploadError);
    return { success: false, error: "Failed to upload image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from("organizations")
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", userData.organization_id);

  if (dbError) {
    console.error("Org avatar DB update error:", dbError);
    await supabase.storage.from("logos").remove([fileName]);
    return { success: false, error: "Failed to update organization. Please try again." };
  }

  // Track in media library
  const { trackMediaAsset: trackAvatar } = await import("@/lib/media/track");
  await trackAvatar({
    organizationId: userData.organization_id,
    uploadedBy: user.id,
    filename: file.name,
    url: publicUrl,
    contentType: file.type,
    sizeBytes: file.size,
    category: "brand",
  });

  // Clean up old avatar
  if (oldAvatarUrl && oldAvatarUrl.includes("/logos/")) {
    const oldPath = oldAvatarUrl.split("/logos/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("logos").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/organization");
  return { success: true, url: publicUrl };
}

// Remove organization profile photo (avatar)
export async function removeOrganizationAvatar(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can remove organization avatar" };
  }

  const { data: orgData } = await supabase
    .from("organizations")
    .select("avatar_url")
    .eq("id", userData.organization_id)
    .single();
  const oldAvatarUrl = (orgData as unknown as Record<string, unknown>)?.avatar_url as string | null;

  const { error: dbError } = await supabase
    .from("organizations")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", userData.organization_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  if (oldAvatarUrl && oldAvatarUrl.includes("/logos/")) {
    const oldPath = oldAvatarUrl.split("/logos/").pop();
    if (oldPath) {
      await supabase.storage.from("logos").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/organization");
  return { success: true };
}

// Upload organization cover photo (banner)
export async function uploadOrganizationBanner(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can upload organization banner" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPG, PNG, or WebP image." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: "File too large. Maximum size is 10MB." };
  }

  const { data: orgData } = await supabase
    .from("organizations")
    .select("banner_url")
    .eq("id", userData.organization_id)
    .single();
  const oldBannerUrl = (orgData as unknown as Record<string, unknown>)?.banner_url as string | null;

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userData.organization_id}/banner-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    console.error("Org banner upload error:", uploadError);
    return { success: false, error: "Failed to upload image. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("logos").getPublicUrl(fileName);

  const { error: dbError } = await supabase
    .from("organizations")
    .update({
      banner_url: publicUrl,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", userData.organization_id);

  if (dbError) {
    console.error("Org banner DB update error:", dbError);
    await supabase.storage.from("logos").remove([fileName]);
    return { success: false, error: "Failed to update organization. Please try again." };
  }

  // Track in media library
  const { trackMediaAsset: trackBanner } = await import("@/lib/media/track");
  await trackBanner({
    organizationId: userData.organization_id,
    uploadedBy: user.id,
    filename: file.name,
    url: publicUrl,
    contentType: file.type,
    sizeBytes: file.size,
    category: "brand",
  });

  if (oldBannerUrl && oldBannerUrl.includes("/logos/")) {
    const oldPath = oldBannerUrl.split("/logos/").pop();
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("logos").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/organization");
  return { success: true, url: publicUrl };
}

// Remove organization cover photo (banner)
export async function removeOrganizationBanner(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can remove organization banner" };
  }

  const { data: orgData } = await supabase
    .from("organizations")
    .select("banner_url")
    .eq("id", userData.organization_id)
    .single();
  const oldBannerUrl = (orgData as unknown as Record<string, unknown>)?.banner_url as string | null;

  const { error: dbError } = await supabase
    .from("organizations")
    .update({
      banner_url: null,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq("id", userData.organization_id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  if (oldBannerUrl && oldBannerUrl.includes("/logos/")) {
    const oldPath = oldBannerUrl.split("/logos/").pop();
    if (oldPath) {
      await supabase.storage.from("logos").remove([oldPath]);
    }
  }

  revalidatePath("/dashboard/organization");
  return { success: true };
}

// Update organization billing
export async function updateOrganizationBilling(
  data: UpdateOrganizationBilling
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Validate input
  const validated = updateOrganizationBillingSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update billing information" };
  }

  // Update organization — all fields are now real columns
  const { error } = await supabase
    .from("organizations")
    .update({
      ...validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization");
  return { success: true, error: null };
}

// Get organization members
export async function getOrganizationMembers(): Promise<{
  members: OrganizationMember[];
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { members: [], error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { members: [], error: "No organization found" };
  }

  // Get members (expanded SELECT for profile completion calc)
  const { data: members, error } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, slug, role, is_active, last_login_at, created_at, photo_url, bio, nmls_id, phone, title, branch_id, address, linkedin_url, zillow_profile_url, google_place_id")
    .eq("organization_id", userData.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    return { members: [], error: error.message };
  }

  // Calculate lightweight profile completion % per member (profile fields only)
  const enriched = (members || []).map((m) => {
    const r = m as Record<string, unknown>;
    let filled = 0;
    let total = 0;

    // Profile field checks (matching profile-completion-types point weights roughly)
    const checks: [string, boolean][] = [
      ["photo_url", !!r.photo_url],
      ["full_name", !!r.full_name],
      ["email", !!r.email],
      ["phone", !!r.phone],
      ["title", !!r.title],
      ["bio", !!(r.bio && typeof r.bio === "string" && r.bio.length >= 50)],
      ["nmls_id", !!r.nmls_id],
      ["branch_id", !!r.branch_id],
      ["address", !!(r.address && typeof r.address === "object" && Object.keys(r.address as object).length > 0)],
      ["linkedin_url", !!r.linkedin_url],
      ["zillow_profile_url", !!r.zillow_profile_url],
      ["google_place_id", !!r.google_place_id],
    ];

    for (const [, passed] of checks) {
      total++;
      if (passed) filled++;
    }

    const profile_completion = total > 0 ? Math.round((filled / total) * 100) : 0;

    return {
      id: m.id,
      email: m.email,
      full_name: m.full_name,
      avatar_url: m.avatar_url,
      slug: m.slug,
      role: m.role,
      is_active: m.is_active,
      last_login_at: m.last_login_at,
      created_at: m.created_at,
      profile_completion,
    };
  });

  return { members: enriched as OrganizationMember[], error: null };
}

// Update member role (enterprise accounts only)
export async function updateMemberRole(
  memberId: string,
  newRole: "admin" | "manager" | "user"
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Cannot change your own role
  if (memberId === user.id) {
    return { success: false, error: "Cannot change your own role" };
  }

  const supabase = createAdminClient();

  // Get user's organization, role, and account type
  const { data: userData } = await supabase
    .from("users")
    .select(`
      organization_id,
      role,
      organizations (
        account_type
      )
    `)
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can update member roles" };
  }

  // Role elevation only applies to enterprise accounts
  const orgData = userData.organizations as { account_type?: string } | null;
  if (orgData?.account_type !== "enterprise") {
    return { success: false, error: "Role management is only available for enterprise accounts" };
  }

  // Verify member belongs to same organization
  // Note: Using * and casting because is_owner may not be in generated types yet
  const { data: memberDataRaw } = await supabase
    .from("users")
    .select("*")
    .eq("id", memberId)
    .single();

  const memberData = memberDataRaw as { organization_id?: string; is_owner?: boolean } | null;

  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  // Cannot demote the owner of the organization
  if (memberData?.is_owner && newRole !== "admin") {
    return { success: false, error: "Cannot demote the organization owner" };
  }

  // Update role
  const { error } = await supabase
    .from("users")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  revalidatePath("/dashboard/team");
  return { success: true, error: null };
}

// Update member details (admin only)
export async function updateMemberDetails(
  memberId: string,
  data: { full_name?: string; avatar_url?: string }
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can update member details" };
  }

  // Verify member belongs to same organization
  const { data: memberData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", memberId)
    .single();

  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  // Update member details
  const { error } = await supabase
    .from("users")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  revalidatePath("/dashboard/team");
  return { success: true, error: null };
}

// Deactivate member
export async function deactivateMember(
  memberId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Cannot deactivate yourself
  if (memberId === user.id) {
    return { success: false, error: "Cannot deactivate yourself" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can deactivate members" };
  }

  // Verify member belongs to same organization
  const { data: memberData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", memberId)
    .single();

  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  // Deactivate member
  const { error } = await supabase
    .from("users")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { success: true, error: null };
}

// Reactivate member
export async function reactivateMember(
  memberId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can reactivate members" };
  }

  // Verify member belongs to same organization
  const { data: memberData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", memberId)
    .single();

  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  // Reactivate member
  const { error } = await supabase
    .from("users")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { success: true, error: null };
}

// Create invitation
export async function createInvitation(
  data: CreateInvitation
): Promise<{ invitation: Invitation | null; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { invitation: null, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Validate input
  const validated = createInvitationSchema.safeParse(data);
  if (!validated.success) {
    return { invitation: null, error: validated.error.errors[0].message };
  }

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { invitation: null, error: "Only admins can invite members" };
  }

  // Check if user already exists in organization
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", validated.data.email)
    .eq("organization_id", userData.organization_id)
    .single();

  if (existingUser) {
    return { invitation: null, error: "User already exists in organization" };
  }

  // Check if invitation already exists (using any cast as table not in generated types yet)
  const { data: existingInvite } = await (supabase as any)
    .from("organization_invitations")
    .select("id")
    .eq("email", validated.data.email)
    .eq("organization_id", userData.organization_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existingInvite) {
    return { invitation: null, error: "Pending invitation already exists for this email" };
  }

  // Create invitation (using any cast as table not in generated types yet)
  const { data: invitation, error } = await (supabase as any)
    .from("organization_invitations")
    .insert({
      organization_id: userData.organization_id,
      email: validated.data.email,
      role: validated.data.role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { invitation: null, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { invitation: invitation as Invitation, error: null };
}

// Get pending invitations
export async function getPendingInvitations(): Promise<{
  invitations: Invitation[];
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { invitations: [], error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { invitations: [], error: "Only admins can view invitations" };
  }

  // Get pending invitations (using any cast as table not in generated types yet)
  const { data: invitations, error } = await (supabase as any)
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", userData.organization_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return { invitations: [], error: error.message };
  }

  return { invitations: invitations as Invitation[], error: null };
}

// Revoke invitation
export async function revokeInvitation(
  invitationId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can revoke invitations" };
  }

  // Delete invitation (using any cast as table not in generated types yet)
  const { error } = await (supabase as any)
    .from("organization_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("organization_id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization/team");
  return { success: true, error: null };
}

// Get organization stats
export async function getOrganizationStats(): Promise<{
  stats: OrganizationStats | null;
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { stats: null, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { stats: null, error: "No organization found" };
  }

  // Call the stats function (using any cast as function not in generated types yet)
  const { data: stats, error } = await (supabase as any)
    .rpc("get_organization_stats", { p_organization_id: userData.organization_id })
    .single();

  if (error) {
    // If function doesn't exist, calculate manually
    const [users, los, reviews, surveys, activeSurveys, pendingReviews] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id).eq("is_active", true),
      supabase.from("users").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id).eq("is_active", true),
      supabase.from("reviews").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id),
      supabase.from("surveys").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id),
      supabase.from("surveys").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id).in("status", ["pending", "sent"]),
      supabase.from("reviews").select("id", { count: "exact", head: true })
        .eq("organization_id", userData.organization_id).eq("status", "pending"),
    ]);

    return {
      stats: {
        total_users: users.count || 0,
        total_members: los.count || 0,
        total_reviews: reviews.count || 0,
        total_surveys: surveys.count || 0,
        active_surveys: activeSurveys.count || 0,
        pending_reviews: pendingReviews.count || 0,
      },
      error: null,
    };
  }

  return {
    stats: stats as OrganizationStats,
    error: null
  };
}

// Get audit logs
export async function getAuditLogs(limit = 50): Promise<{
  logs: AuditLog[];
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { logs: [], error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { logs: [], error: "Only admins can view audit logs" };
  }

  // Get audit logs (using any cast as table not in generated types yet)
  const { data: logs, error } = await (supabase as any)
    .from("organization_audit_logs")
    .select("*")
    .eq("organization_id", userData.organization_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { logs: [], error: error.message };
  }

  return { logs: logs as AuditLog[], error: null };
}

/**
 * Start a Better Auth impersonation session for an organization member.
 * Enterprise admins can impersonate active non-admin users in their own organization.
 */
export async function startUserImpersonation(
  targetUserId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isImpersonationEnabled()) {
    return { success: false, error: "User impersonation is currently disabled." };
  }

  const actor = await unifiedGetUser();
  if (!actor) {
    return { success: false, error: "Not authenticated" };
  }

  // Prevent impersonation chaining — block if already in an impersonated session
  const reqHeaders = await headers();
  const currentSessionPayload = await auth.api.getSession({ headers: reqHeaders });
  const impersonatedByField =
    (currentSessionPayload as any)?.session?.impersonatedBy ??
    (currentSessionPayload as any)?.session?.impersonated_by ??
    null;
  if (impersonatedByField) {
    return { success: false, error: "Cannot start impersonation while impersonating another user." };
  }

  const supabase = createAdminClient();
  const permissionError = "You don't have permission to impersonate users.";
  const invalidTargetError = "This user can't be impersonated.";

  const { data: actorRaw, error: actorError } = await supabase
    .from("users")
    .select(`
      id,
      organization_id,
      role,
      organizations (
        account_type
      )
    `)
    .eq("id", actor.id)
    .single();

  const actorProfile = actorRaw as {
    id: string;
    organization_id: string | null;
    role: string | null;
    organizations?: { account_type?: string | null } | null;
  } | null;

  if (actorError || !actorProfile?.organization_id) {
    return { success: false, error: permissionError };
  }

  const actorIsEnterpriseAdmin =
    actorProfile.role === "admin" &&
    actorProfile.organizations?.account_type === "enterprise";

  if (!actorIsEnterpriseAdmin) {
    await writeImpersonationAuditLog({
      organizationId: actorProfile.organization_id,
      action: "impersonation_start_denied",
      entityId: targetUserId,
      impersonatorUserId: actor.id,
      impersonatedUserId: targetUserId,
      reason: "actor_not_enterprise_admin",
    });
    return { success: false, error: permissionError };
  }

  const { data: targetRaw, error: targetError } = await supabase
    .from("users")
    .select("id, organization_id, role, is_active")
    .eq("id", targetUserId)
    .single();

  const target = targetRaw as {
    id: string;
    organization_id: string | null;
    role: string | null;
    is_active: boolean | null;
  } | null;

  const deny = async (reason: string) => {
    await writeImpersonationAuditLog({
      organizationId: actorProfile.organization_id,
      action: "impersonation_start_denied",
      entityId: targetUserId,
      impersonatorUserId: actor.id,
      impersonatedUserId: targetUserId,
      reason,
    });
  };

  if (targetError || !target) {
    await deny("target_not_found");
    return { success: false, error: invalidTargetError };
  }

  if (target.id === actor.id) {
    await deny("self_impersonation_blocked");
    return { success: false, error: invalidTargetError };
  }

  if (target.organization_id !== actorProfile.organization_id) {
    await deny("cross_organization_target_blocked");
    return { success: false, error: invalidTargetError };
  }

  if (!target.is_active) {
    await deny("inactive_target_blocked");
    return { success: false, error: invalidTargetError };
  }

  if (target.role === "admin") {
    await deny("admin_target_blocked");
    return { success: false, error: invalidTargetError };
  }

  try {
    const requestHeaders = await headers();
    await auth.api.impersonateUser({
      body: {
        userId: targetUserId,
      },
      headers: requestHeaders,
    });

    await writeImpersonationAuditLog({
      organizationId: actorProfile.organization_id,
      action: "impersonation_started",
      entityId: targetUserId,
      impersonatorUserId: actor.id,
      impersonatedUserId: targetUserId,
    });

    console.info("[Impersonation] Started", {
      organizationId: actorProfile.organization_id,
      impersonatorUserId: actor.id,
      impersonatedUserId: targetUserId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/organization");
    return { success: true, error: null };
  } catch (error) {
    await deny("impersonation_api_failed");
    console.error("[Impersonation] Failed to start:", error);
    return {
      success: false,
      error: "Couldn't start impersonation. Try again.",
    };
  }
}

/**
 * End the current Better Auth impersonation session and restore the admin account.
 */
export async function stopUserImpersonation(): Promise<{
  success: boolean;
  error: string | null;
}> {
  if (!isImpersonationEnabled()) {
    return { success: false, error: "User impersonation is currently disabled." };
  }

  const requestHeaders = await headers();

  try {
    const sessionPayload = await auth.api.getSession({
      headers: requestHeaders,
    });

    const currentSession = (sessionPayload as {
      session?: {
        impersonatedBy?: string | null;
        impersonated_by?: string | null;
      } | null;
      user?: { id?: string | null } | null;
    } | null)?.session;

    const impersonatorUserId =
      currentSession?.impersonatedBy ??
      currentSession?.impersonated_by ??
      null;
    const impersonatedUserId =
      (sessionPayload as { user?: { id?: string | null } | null } | null)?.user?.id ??
      null;

    if (!impersonatorUserId) {
      return { success: true, error: null };
    }

    if (!impersonatedUserId) {
      await auth.api.stopImpersonating({
        headers: requestHeaders,
      });
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/organization");
      return { success: true, error: null };
    }

    const supabase = createAdminClient();
    const { data: targetProfile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", impersonatedUserId)
      .single();

    await auth.api.stopImpersonating({
      headers: requestHeaders,
    });

    await writeImpersonationAuditLog({
      organizationId: targetProfile?.organization_id ?? null,
      action: "impersonation_stopped",
      entityId: impersonatedUserId,
      impersonatorUserId,
      impersonatedUserId,
    });

    console.info("[Impersonation] Stopped", {
      organizationId: targetProfile?.organization_id ?? null,
      impersonatorUserId,
      impersonatedUserId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/organization");
    return { success: true, error: null };
  } catch (error) {
    console.error("[Impersonation] Failed to stop:", error);
    return {
      success: false,
      error: "Couldn't stop impersonation. Try again.",
    };
  }
}

// Check if user is organization admin
export async function isOrganizationAdmin(): Promise<boolean> {
  const user = await unifiedGetUser();
  if (!user) return false;

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return userData?.role === "admin";
}

/**
 * Update the organization's public URL slug (admin only)
 * @param newSlug The new slug to set
 */
export async function updateOrganizationSlug(
  newSlug: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get user's organization and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update the organization URL" };
  }

  // Get current organization slug for revalidation
  const { data: currentOrg } = await supabase
    .from("organizations")
    .select("slug")
    .eq("id", userData.organization_id)
    .single();

  // Normalize the slug
  const normalizedSlug = newSlug.toLowerCase().trim();

  // Validate the new slug
  const validation = await validateOrgSlug(normalizedSlug, userData.organization_id);
  if (!validation.valid) {
    return { success: false, error: validation.error || "Invalid slug" };
  }

  // Update the slug
  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      slug: normalizedSlug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userData.organization_id);

  if (updateError) {
    // Handle unique constraint violation
    if (updateError.code === "23505") {
      return { success: false, error: "This URL is already taken. Please try a different one." };
    }
    return { success: false, error: updateError.message };
  }

  // Revalidate relevant paths
  revalidatePath("/dashboard/organization");
  if (currentOrg?.slug) {
    revalidatePath(`/org/${currentOrg.slug}`);
  }
  revalidatePath(`/org/${normalizedSlug}`);

  return { success: true, error: null };
}

// Get full member profile for admin edit page
export async function getOrganizationMemberFull(
  memberId: string
): Promise<{ member: OrganizationMemberFull | null; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { member: null, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Get current user's org and role
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { member: null, error: "Only admins can view member details" };
  }

  // Get the member with all profile fields
  const { data: memberData, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", memberId)
    .single();

  if (error || !memberData) {
    return { member: null, error: "Member not found" };
  }

  // Cast to access all fields
  const m = memberData as Record<string, unknown>;

  // Verify same org
  if (m.organization_id !== userData.organization_id) {
    return { member: null, error: "Member not found in organization" };
  }

  return {
    member: {
      id: m.id as string,
      email: (m.email as string) ?? "",
      full_name: (m.full_name as string) ?? null,
      avatar_url: (m.avatar_url as string) ?? null,
      banner_url: (m.banner_url as string) ?? null,
      bio: (m.bio as string) ?? null,
      title: (m.title as string) ?? null,
      nmls_id: (m.nmls_id as string) ?? null,
      phone: (m.phone as string) ?? null,
      personal_website_url: (m.personal_website_url as string) ?? null,
      linkedin_url: (m.linkedin_url as string) ?? null,
      zillow_profile_url: (m.zillow_profile_url as string) ?? null,
      facebook_url: (m.facebook_url as string) ?? null,
      instagram_url: (m.instagram_url as string) ?? null,
      twitter_url: (m.twitter_url as string) ?? null,
      timezone: (m.timezone as string) ?? null,
      branch_id: (m.branch_id as string) ?? null,
      role: (m.role as "admin" | "manager" | "user") ?? "user",
      is_active: (m.is_active as boolean) ?? true,
      is_owner: (m.is_owner as boolean) ?? false,
      slug: (m.slug as string) ?? null,
      cta_button_text: (m.cta_button_text as string) ?? null,
      cta_button_url: (m.cta_button_url as string) ?? null,
      hire_date: (m.hire_date as string) ?? null,
      address: (m.address as string) ?? null,
      industry: (m.industry as string) ?? null,
      created_at: (m.created_at as string) ?? new Date().toISOString(),
    },
    error: null,
  };
}

// Update full member profile (admin only)
export async function updateMemberProfile(
  memberId: string,
  data: AdminProfileInput
): Promise<{ success: boolean; error: string | null }> {
  // Validate with Zod (previously missing!)
  const validated = adminProfileSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  // Parallel: verify admin role + member org membership
  const [{ data: userData }, { data: memberData }] = await Promise.all([
    supabase.from("users").select("organization_id, role").eq("id", user.id).single(),
    supabase.from("users").select("organization_id").eq("id", memberId).single(),
  ]);

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can update member profiles" };
  }
  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  const result = await writeProfileUpdate(memberId, validated.data);
  return { success: result.success, error: result.error ?? null };
}

// Upload avatar for a team member (admin only)
export async function uploadMemberAvatar(
  memberId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const [{ data: userData }, { data: memberData }] = await Promise.all([
    supabase.from("users").select("organization_id, role").eq("id", user.id).single(),
    supabase.from("users").select("organization_id").eq("id", memberId).single(),
  ]);

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can update member avatars" };
  }
  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  return writeAvatarUpload(memberId, formData);
}

// Upload banner for a team member (admin only)
export async function uploadMemberBanner(
  memberId: string,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const [{ data: userData }, { data: memberData }] = await Promise.all([
    supabase.from("users").select("organization_id, role").eq("id", user.id).single(),
    supabase.from("users").select("organization_id").eq("id", memberId).single(),
  ]);

  if (!userData?.organization_id || userData.role !== "admin") {
    return { success: false, error: "Only admins can update member banners" };
  }
  if (memberData?.organization_id !== userData.organization_id) {
    return { success: false, error: "Member not found in organization" };
  }

  return writeBannerUpload(memberId, formData);
}

/**
 * Get a suggested slug for an organization based on its name
 */
export async function getSuggestedOrgSlug(
  name: string,
  excludeOrgId?: string
): Promise<{ slug: string }> {
  const baseSlug = generateUserSlug(name); // Reuse the same slug generation logic
  if (!baseSlug) {
    return { slug: "" };
  }

  // Check if the base slug is available
  const validation = await validateOrgSlug(baseSlug, excludeOrgId);
  if (validation.valid) {
    return { slug: baseSlug };
  }

  // Return suggestion if available
  if (validation.suggestion) {
    return { slug: validation.suggestion };
  }

  // Slug is invalid and no suggestion exists
  return { slug: "" };
}

/**
 * Create a new user account directly in the organization.
 * Returns the new user's ID so the caller can navigate to their profile edit page.
 */
export async function createOrganizationUser(data: {
  email: string;
  fullName: string;
  role: "admin" | "manager" | "user";
}): Promise<{ userId?: string; error?: string }> {
  const authUser = await unifiedGetUser();
  if (!authUser) return { error: "Not authenticated" };

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", authUser.id)
    .single();

  if (!userData?.organization_id || userData.role !== "admin") {
    return { error: "Admin access required" };
  }

  const orgId = userData.organization_id;
  const email = data.email.toLowerCase().trim();

  // Check if email already exists in org
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("organization_id", orgId)
    .eq("email", email)
    .maybeSingle();

  if (existing) return { error: "A user with this email already exists in your organization" };

  // Check global email uniqueness
  const { data: globalExisting } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (globalExisting) return { error: "This email is already registered in the system" };

  // Create auth user with random password
  const randomPassword = crypto.randomBytes(20).toString("hex");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Failed to create user account" };
  }

  // Generate unique slug
  const slug = await generateUniqueUserSlug(data.fullName);

  // Insert into users table
  const { error: insertError } = await supabase.from("users").insert({
    id: authData.user.id,
    organization_id: orgId,
    email,
    full_name: data.fullName.trim(),
    role: data.role,
    is_active: false,
    slug,
  });

  if (insertError) {
    // Clean up orphaned auth user
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
    return { error: insertError.message };
  }

  revalidatePath("/dashboard/organization");

  return { userId: authData.user.id };
}

// ─── Integration Settings ────────────────────────────────────────────

export async function getOrgIntegrationSettings(): Promise<{
  integrations: OrgIntegrations | null;
  error: string | null;
}> {
  const user = await unifiedGetUser();
  if (!user) {
    return { integrations: null, error: "Not authenticated" };
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { integrations: null, error: "No organization found" };
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", userData.organization_id)
    .single();

  if (error) {
    return { integrations: null, error: error.message };
  }

  const settings = org?.settings as Record<string, unknown> | null;
  const raw = settings?.integrations;
  const parsed = orgIntegrationsSchema.safeParse(raw);

  if (!parsed.success || !raw) {
    // Default: all integrations enabled
    const defaults: OrgIntegrations = {};
    for (const key of INTEGRATION_KEYS) {
      defaults[key] = { enabled: true };
    }
    return { integrations: defaults, error: null };
  }

  // Fill missing keys with enabled: true
  const result = { ...parsed.data };
  for (const key of INTEGRATION_KEYS) {
    if (!result[key]) {
      result[key] = { enabled: true };
    }
  }

  return { integrations: result, error: null };
}

export async function updateOrgIntegrationSettings(
  data: OrgIntegrations
): Promise<{ success: boolean; error: string | null }> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const validated = orgIntegrationsSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  const supabase = createAdminClient();

  const { data: userData } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return { success: false, error: "No organization found" };
  }

  if (userData.role !== "admin") {
    return { success: false, error: "Only admins can update integration settings" };
  }

  // Read current settings, merge integrations key
  const { data: org } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", userData.organization_id)
    .single();

  const currentSettings = (org?.settings as Record<string, unknown>) ?? {};
  const updatedSettings = { ...currentSettings, integrations: validated.data };

  const { error } = await supabase
    .from("organizations")
    .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
    .eq("id", userData.organization_id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/organization");
  revalidatePath("/dashboard/settings");

  return { success: true, error: null };
}

// ---------------------------------------------------------------------------
// Email Branding Config (derived from organization settings and branding)
// ---------------------------------------------------------------------------

export async function getEmailBrandingConfig(): Promise<{
  branding: EmailBrandingConfig | null;
  orgLogoUrl: string | null;
  error: string | null;
}> {
  const { organization, error } = await getCurrentOrganization();
  if (!organization) {
    return { branding: null, orgLogoUrl: null, error: error ?? "No organization found" };
  }

  return {
    branding: deriveEmailBrandingConfig(organization),
    orgLogoUrl: organization.logo_url ?? null,
    error: null,
  };
}
