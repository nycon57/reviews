/**
 * Announcement Email Service (S088)
 *
 * Handles sending product announcements, feature updates,
 * maintenance notifications, and security alerts.
 *
 * Features:
 * - Segmented sending (by role, plan, feature usage)
 * - Preview and test send capability
 * - Scheduled sending
 * - Engagement tracking (opens, clicks, adoption)
 * - Version history
 * - Unsubscribe handling for product updates category
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress, emailConfig } from "./client";
import type { EmailTemplate } from "./types";
import type {
  AnnouncementFeatureEmailData,
  AnnouncementUpdateEmailData,
  AnnouncementMaintenanceEmailData,
  AnnouncementSecurityEmailData,
  AnnouncementType,
  AnnouncementAudience,
} from "./types";
import {
  renderAnnouncementFeatureEmail,
  renderAnnouncementUpdateEmail,
  renderAnnouncementMaintenanceEmail,
  renderAnnouncementSecurityEmail,
} from "./templates/index";

// ============================================================================
// Types
// ============================================================================

interface SendEmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

interface SendAnnouncementResult {
  success: boolean;
  announcementId: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

interface AnnouncementRecipient {
  userId: string;
  email: string;
  firstName: string;
  organizationId: string;
  organizationName: string;
}

interface Announcement {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  contentPlain?: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  customFilter?: Record<string, unknown>;
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  maintenanceStartAt?: string;
  maintenanceEndAt?: string;
  affectedServices?: string[];
  scheduledAt?: string;
  createdBy?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

const SUPPORT_EMAIL = "support@repwell.ai";

/**
 * Check if a user has unsubscribed from announcements
 */
// =============================================================================
// Temporary Database Types (until migration is applied and types regenerated)
// =============================================================================

interface UserAnnouncementPrefs {
  user_id: string;
  feature_announcements: boolean;
  product_updates: boolean;
  maintenance_notifications: boolean;
  security_updates: boolean;
  digest_only: boolean;
}

interface AnnouncementRow {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  content_plain: string | null;
  type: AnnouncementType;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  audience: AnnouncementAudience;
  custom_filter: Record<string, unknown> | null;
  image_url: string | null;
  gif_url: string | null;
  video_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  secondary_cta_text: string | null;
  secondary_cta_url: string | null;
  maintenance_start_at: string | null;
  maintenance_end_at: string | null;
  affected_services: string[] | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string | null;
  version: number;
  parent_id: string | null;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  created_at: string;
  updated_at: string;
}

interface ChangelogEntryRow {
  id: string;
  title: string;
  description: string;
  category: "feature" | "improvement" | "bugfix" | "performance" | "security" | "other";
  docs_url: string | null;
  image_url: string | null;
  version: string | null;
  release_date: string;
  include_in_digest: boolean;
  digest_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

async function isAnnouncementUnsubscribed(
  userId: string,
  announcementType: AnnouncementType
): Promise<boolean> {
  const supabase = createAdminClient();

  // Check user announcement preferences
  // Note: Using type assertion until migration is applied and types regenerated
  const { data: prefs } = await (supabase as any)
    .from("user_announcement_preferences")
    .select("*")
    .eq("user_id", userId)
    .single() as { data: UserAnnouncementPrefs | null };

  if (!prefs) {
    // No preferences set, default to subscribed
    return false;
  }

  // Check based on announcement type
  switch (announcementType) {
    case "feature":
      return !prefs.feature_announcements;
    case "update":
      return !prefs.product_updates;
    case "maintenance":
      return !prefs.maintenance_notifications;
    case "security":
      // Security updates can never be fully unsubscribed
      return false;
    default:
      return false;
  }
}

/**
 * Check if email is globally unsubscribed
 */
async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  return !!data;
}

/**
 * Log email send to database
 */
async function logEmail(params: {
  toEmail: string;
  toName?: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  templateName: EmailTemplate;
  organizationId?: string;
  userId?: string;
  resendMessageId?: string;
  status: string;
  errorMessage?: string;
}): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("email_logs")
    .insert({
      to_email: params.toEmail,
      to_name: params.toName,
      from_email: params.fromEmail,
      from_name: params.fromName,
      subject: params.subject,
      template_name: params.templateName,
      organization_id: params.organizationId,
      resend_message_id: params.resendMessageId,
      status: params.status,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
      error_message: params.errorMessage,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log email:", error);
    return null;
  }

  return data.id;
}

/**
 * Build base URLs for email links
 */
function buildBaseUrls(): {
  baseUrl: string;
  dashboardUrl: string;
  unsubscribeUrl: string;
  preferencesUrl: string;
} {
  const baseUrl = emailConfig.baseUrl;
  return {
    baseUrl,
    dashboardUrl: `${baseUrl}/dashboard`,
    unsubscribeUrl: `${baseUrl}/api/email/unsubscribe?category=announcements`,
    preferencesUrl: `${baseUrl}/dashboard/settings/notifications`,
  };
}

/**
 * Get template name for announcement type
 */
function getTemplateName(type: AnnouncementType): EmailTemplate {
  switch (type) {
    case "feature":
      return "announcement_feature";
    case "update":
      return "announcement_update";
    case "maintenance":
      return "announcement_maintenance";
    case "security":
      return "announcement_security";
    default:
      return "announcement_update";
  }
}

// ============================================================================
// Recipient Fetching
// ============================================================================

/**
 * Get recipients based on audience segment
 */
async function getRecipients(
  audience: AnnouncementAudience,
  customFilter?: Record<string, unknown>
): Promise<AnnouncementRecipient[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("users")
    .select(
      `
      id,
      email,
      full_name,
      role,
      organization_id,
      organizations!inner(id, name, subscription_tier, subscription_status)
    `
    )
    .eq("receive_notifications", true);

  // Apply audience filter
  switch (audience) {
    case "admins_only":
      query = query.eq("role", "admin");
      break;
    case "managers_only":
      query = query.eq("role", "manager");
      break;
    case "loan_officers_only":
      query = query.eq("role", "loan_officer");
      break;
    case "free_tier":
      query = query.eq("organizations.subscription_tier", "free");
      break;
    case "starter_tier":
      query = query.eq("organizations.subscription_tier", "starter");
      break;
    case "professional_tier":
      query = query.eq("organizations.subscription_tier", "professional");
      break;
    case "enterprise_tier":
      query = query.eq("organizations.subscription_tier", "enterprise");
      break;
    case "trial_users":
      query = query.eq("organizations.subscription_status", "trialing");
      break;
    case "custom":
      // Custom filters would be applied via RPC or additional logic
      // For now, we'll apply basic custom filters
      if (customFilter?.roles && Array.isArray(customFilter.roles)) {
        query = query.in("role", customFilter.roles);
      }
      if (customFilter?.tiers && Array.isArray(customFilter.tiers)) {
        query = query.in("organizations.subscription_tier", customFilter.tiers);
      }
      break;
    case "all":
    default:
      // No additional filters
      break;
  }

  const { data: users, error } = await query;

  if (error) {
    console.error("Failed to fetch recipients:", error);
    return [];
  }

  if (!users) {
    return [];
  }

  return users.map((user) => {
    const org = user.organizations as unknown as { id: string; name: string };
    return {
      userId: user.id,
      email: user.email,
      firstName: user.full_name?.split(" ")[0] || "there",
      organizationId: org.id,
      organizationName: org.name,
    };
  });
}

// ============================================================================
// Announcement CRUD
// ============================================================================

/**
 * Create a new announcement
 */
export async function createAnnouncement(params: {
  title: string;
  subtitle?: string;
  content: string;
  contentPlain?: string;
  type: AnnouncementType;
  audience: AnnouncementAudience;
  customFilter?: Record<string, unknown>;
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  maintenanceStartAt?: string;
  maintenanceEndAt?: string;
  affectedServices?: string[];
  scheduledAt?: string;
  createdBy: string;
}): Promise<{ success: boolean; announcementId?: string; error?: string }> {
  const supabase = createAdminClient();

  // Note: Using type assertion until migration is applied and types regenerated
  const { data, error } = await (supabase as any)
    .from("announcements")
    .insert({
      title: params.title,
      subtitle: params.subtitle,
      content: params.content,
      content_plain: params.contentPlain,
      type: params.type,
      audience: params.audience,
      custom_filter: params.customFilter,
      image_url: params.imageUrl,
      gif_url: params.gifUrl,
      video_url: params.videoUrl,
      cta_text: params.ctaText,
      cta_url: params.ctaUrl,
      secondary_cta_text: params.secondaryCtaText,
      secondary_cta_url: params.secondaryCtaUrl,
      maintenance_start_at: params.maintenanceStartAt,
      maintenance_end_at: params.maintenanceEndAt,
      affected_services: params.affectedServices,
      scheduled_at: params.scheduledAt,
      status: params.scheduledAt ? "scheduled" : "draft",
      created_by: params.createdBy,
    })
    .select("id")
    .single() as { data: { id: string } | null; error: { message: string } | null };

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, announcementId: data?.id };
}

/**
 * Get an announcement by ID
 */
export async function getAnnouncement(
  announcementId: string
): Promise<Announcement | null> {
  const supabase = createAdminClient();

  // Note: Using type assertion until migration is applied and types regenerated
  const { data, error } = await (supabase as any)
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .single() as { data: AnnouncementRow | null; error: unknown };

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    subtitle: data.subtitle ?? undefined,
    content: data.content,
    contentPlain: data.content_plain ?? undefined,
    type: data.type,
    audience: data.audience,
    customFilter: data.custom_filter ?? undefined,
    imageUrl: data.image_url ?? undefined,
    gifUrl: data.gif_url ?? undefined,
    videoUrl: data.video_url ?? undefined,
    ctaText: data.cta_text ?? undefined,
    ctaUrl: data.cta_url ?? undefined,
    secondaryCtaText: data.secondary_cta_text ?? undefined,
    secondaryCtaUrl: data.secondary_cta_url ?? undefined,
    maintenanceStartAt: data.maintenance_start_at ?? undefined,
    maintenanceEndAt: data.maintenance_end_at ?? undefined,
    affectedServices: data.affected_services ?? undefined,
    scheduledAt: data.scheduled_at ?? undefined,
    createdBy: data.created_by ?? undefined,
  };
}

/**
 * Update announcement status
 */
async function updateAnnouncementStatus(
  announcementId: string,
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled",
  additionalFields?: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  // Note: Using type assertion until migration is applied and types regenerated
  await (supabase as any)
    .from("announcements")
    .update({
      status,
      ...additionalFields,
    })
    .eq("id", announcementId);
}

// ============================================================================
// Preview and Test Send
// ============================================================================

/**
 * Generate preview HTML for an announcement
 */
export async function previewAnnouncement(params: {
  announcement: Announcement;
  recipientEmail?: string;
  recipientFirstName?: string;
  organizationName?: string;
}): Promise<{ subject: string; html: string }> {
  const { announcement, recipientEmail = "test@example.com", recipientFirstName = "Test", organizationName = "Your Company" } = params;
  const urls = buildBaseUrls();

  switch (announcement.type) {
    case "feature": {
      const data: AnnouncementFeatureEmailData = {
        toEmail: recipientEmail,
        firstName: recipientFirstName,
        organizationName,
        announcementId: announcement.id,
        title: announcement.title,
        subtitle: announcement.subtitle,
        content: announcement.content,
        imageUrl: announcement.imageUrl,
        gifUrl: announcement.gifUrl,
        videoUrl: announcement.videoUrl,
        ctaText: announcement.ctaText || "Learn More",
        ctaUrl: announcement.ctaUrl || urls.dashboardUrl,
        secondaryCtaText: announcement.secondaryCtaText,
        secondaryCtaUrl: announcement.secondaryCtaUrl,
        unsubscribeUrl: urls.unsubscribeUrl,
        preferencesUrl: urls.preferencesUrl,
        supportEmail: SUPPORT_EMAIL,
      };
      return renderAnnouncementFeatureEmail(data);
    }

    case "maintenance": {
      const data: AnnouncementMaintenanceEmailData = {
        toEmail: recipientEmail,
        firstName: recipientFirstName,
        organizationName,
        announcementId: announcement.id,
        title: announcement.title,
        content: announcement.content,
        maintenanceStart: announcement.maintenanceStartAt || new Date().toISOString(),
        maintenanceEnd: announcement.maintenanceEndAt || new Date().toISOString(),
        expectedDuration: "2 hours",
        affectedServices: announcement.affectedServices || [],
        impactLevel: "partial",
        statusPageUrl: `${urls.baseUrl}/status`,
        ctaText: announcement.ctaText,
        ctaUrl: announcement.ctaUrl,
        unsubscribeUrl: urls.unsubscribeUrl,
        preferencesUrl: urls.preferencesUrl,
        supportEmail: SUPPORT_EMAIL,
      };
      return renderAnnouncementMaintenanceEmail(data);
    }

    case "security": {
      const data: AnnouncementSecurityEmailData = {
        toEmail: recipientEmail,
        firstName: recipientFirstName,
        organizationName,
        announcementId: announcement.id,
        title: announcement.title,
        content: announcement.content,
        severity: "medium",
        actionRequired: false,
        ctaText: announcement.ctaText || "Learn More",
        ctaUrl: announcement.ctaUrl || urls.dashboardUrl,
        securityPageUrl: `${urls.baseUrl}/security`,
        unsubscribeUrl: urls.unsubscribeUrl,
        preferencesUrl: urls.preferencesUrl,
        supportEmail: SUPPORT_EMAIL,
      };
      return renderAnnouncementSecurityEmail(data);
    }

    case "update":
    default: {
      const data: AnnouncementUpdateEmailData = {
        toEmail: recipientEmail,
        firstName: recipientFirstName,
        organizationName,
        announcementId: announcement.id,
        title: announcement.title,
        subtitle: announcement.subtitle,
        introText: announcement.content,
        changelogEntries: [
          {
            title: "Sample Update",
            description: "This is a preview of how changelog entries will appear.",
            category: "feature",
          },
        ],
        ctaText: announcement.ctaText,
        ctaUrl: announcement.ctaUrl,
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
        unsubscribeUrl: urls.unsubscribeUrl,
        preferencesUrl: urls.preferencesUrl,
        supportEmail: SUPPORT_EMAIL,
      };
      return renderAnnouncementUpdateEmail(data);
    }
  }
}

/**
 * Send a test email for an announcement
 */
export async function sendTestAnnouncement(params: {
  announcementId: string;
  testEmail: string;
  testFirstName?: string;
  testOrganizationName?: string;
}): Promise<SendEmailResult> {
  const announcement = await getAnnouncement(params.announcementId);
  if (!announcement) {
    return { success: false, error: "Announcement not found" };
  }

  const { subject, html } = await previewAnnouncement({
    announcement,
    recipientEmail: params.testEmail,
    recipientFirstName: params.testFirstName || "Test",
    organizationName: params.testOrganizationName || "Test Company",
  });

  const resend = getResendClient();

  try {
    const response = await resend.emails.send({
      from: getFromAddress(),
      to: params.testEmail,
      subject: `[TEST] ${subject}`,
      html,
      tags: [
        { name: "template", value: getTemplateName(announcement.type) },
        { name: "announcement_id", value: params.announcementId },
        { name: "test", value: "true" },
      ],
    });

    if (response.error) {
      return { success: false, error: response.error.message };
    }

    return { success: true, emailId: response.data?.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// Sending Announcements
// ============================================================================

/**
 * Send an announcement to all recipients
 */
export async function sendAnnouncement(
  announcementId: string
): Promise<SendAnnouncementResult> {
  const result: SendAnnouncementResult = {
    success: false,
    announcementId,
    recipientCount: 0,
    sentCount: 0,
    failedCount: 0,
    errors: [],
  };

  // Get announcement
  const announcement = await getAnnouncement(announcementId);
  if (!announcement) {
    result.errors.push("Announcement not found");
    return result;
  }

  // Update status to sending
  await updateAnnouncementStatus(announcementId, "sending");

  // Get recipients
  const recipients = await getRecipients(
    announcement.audience,
    announcement.customFilter
  );
  result.recipientCount = recipients.length;

  if (recipients.length === 0) {
    result.errors.push("No recipients found for this audience");
    await updateAnnouncementStatus(announcementId, "draft");
    return result;
  }

  // Update total recipients count
  // Note: Using type assertion until migration is applied and types regenerated
  const supabase = createAdminClient() as any;
  await supabase
    .from("announcements")
    .update({ total_recipients: recipients.length })
    .eq("id", announcementId);

  // Create recipient records
  const recipientRecords = recipients.map((r) => ({
    announcement_id: announcementId,
    user_id: r.userId,
    email: r.email,
    status: "pending",
  }));

  await supabase.from("announcement_recipients").insert(recipientRecords);

  // Send to each recipient
  const urls = buildBaseUrls();
  const resend = getResendClient();
  const templateName = getTemplateName(announcement.type);

  for (const recipient of recipients) {
    try {
      // Check unsubscribe status
      const globalUnsubscribed = await isEmailUnsubscribed(recipient.email);
      if (globalUnsubscribed) {
        await supabase
          .from("announcement_recipients")
          .update({ status: "unsubscribed" })
          .eq("announcement_id", announcementId)
          .eq("user_id", recipient.userId);
        continue;
      }

      const announcementUnsubscribed = await isAnnouncementUnsubscribed(
        recipient.userId,
        announcement.type
      );
      if (announcementUnsubscribed) {
        await supabase
          .from("announcement_recipients")
          .update({ status: "unsubscribed" })
          .eq("announcement_id", announcementId)
          .eq("user_id", recipient.userId);
        continue;
      }

      // Render email for this recipient
      const emailData = buildEmailData(announcement, recipient, urls);
      const { subject, html } = await renderEmail(announcement.type, emailData);

      // Send email
      const response = await resend.emails.send({
        from: getFromAddress(),
        to: recipient.email,
        subject,
        html,
        tags: [
          { name: "template", value: templateName },
          { name: "announcement_id", value: announcementId },
          { name: "category", value: "announcement" },
        ],
      });

      if (response.error) {
        result.failedCount++;
        result.errors.push(`${recipient.email}: ${response.error.message}`);
        await supabase
          .from("announcement_recipients")
          .update({
            status: "failed",
            error_message: response.error.message,
          })
          .eq("announcement_id", announcementId)
          .eq("user_id", recipient.userId);
      } else {
        result.sentCount++;
        await supabase
          .from("announcement_recipients")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            resend_message_id: response.data?.id,
          })
          .eq("announcement_id", announcementId)
          .eq("user_id", recipient.userId);

        // Log email
        const emailLogId = await logEmail({
          toEmail: recipient.email,
          toName: recipient.firstName,
          fromEmail: emailConfig.defaultFromEmail,
          subject,
          templateName,
          organizationId: recipient.organizationId,
          userId: recipient.userId,
          resendMessageId: response.data?.id,
          status: "sent",
        });

        // Link to announcement email logs
        if (emailLogId) {
          await supabase.from("announcement_email_logs").insert({
            announcement_id: announcementId,
            email_log_id: emailLogId,
            user_id: recipient.userId,
            email: recipient.email,
            template_name: templateName,
          });
        }
      }
    } catch (error) {
      result.failedCount++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`${recipient.email}: ${errorMessage}`);
      await supabase
        .from("announcement_recipients")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("announcement_id", announcementId)
        .eq("user_id", recipient.userId);
    }
  }

  // Update announcement status
  await updateAnnouncementStatus(announcementId, "sent", {
    sent_at: new Date().toISOString(),
    total_sent: result.sentCount,
  });

  result.success = result.sentCount > 0;
  return result;
}

/**
 * Build email data based on announcement type
 */
function buildEmailData(
  announcement: Announcement,
  recipient: AnnouncementRecipient,
  urls: ReturnType<typeof buildBaseUrls>
): AnnouncementFeatureEmailData | AnnouncementUpdateEmailData | AnnouncementMaintenanceEmailData | AnnouncementSecurityEmailData {
  const base = {
    toEmail: recipient.email,
    firstName: recipient.firstName,
    organizationName: recipient.organizationName,
    announcementId: announcement.id,
    unsubscribeUrl: urls.unsubscribeUrl,
    preferencesUrl: urls.preferencesUrl,
    supportEmail: SUPPORT_EMAIL,
  };

  switch (announcement.type) {
    case "feature":
      return {
        ...base,
        title: announcement.title,
        subtitle: announcement.subtitle,
        content: announcement.content,
        imageUrl: announcement.imageUrl,
        gifUrl: announcement.gifUrl,
        videoUrl: announcement.videoUrl,
        ctaText: announcement.ctaText || "Learn More",
        ctaUrl: announcement.ctaUrl || urls.dashboardUrl,
        secondaryCtaText: announcement.secondaryCtaText,
        secondaryCtaUrl: announcement.secondaryCtaUrl,
      } as AnnouncementFeatureEmailData;

    case "maintenance":
      return {
        ...base,
        title: announcement.title,
        content: announcement.content,
        maintenanceStart: announcement.maintenanceStartAt || "",
        maintenanceEnd: announcement.maintenanceEndAt || "",
        expectedDuration: calculateDuration(
          announcement.maintenanceStartAt,
          announcement.maintenanceEndAt
        ),
        affectedServices: announcement.affectedServices || [],
        impactLevel: "partial" as const,
        statusPageUrl: `${urls.baseUrl}/status`,
        ctaText: announcement.ctaText,
        ctaUrl: announcement.ctaUrl,
      } as AnnouncementMaintenanceEmailData;

    case "security":
      return {
        ...base,
        title: announcement.title,
        content: announcement.content,
        severity: "medium" as const,
        actionRequired: false,
        ctaText: announcement.ctaText || "Learn More",
        ctaUrl: announcement.ctaUrl || urls.dashboardUrl,
        securityPageUrl: `${urls.baseUrl}/security`,
      } as AnnouncementSecurityEmailData;

    case "update":
    default:
      return {
        ...base,
        title: announcement.title,
        subtitle: announcement.subtitle,
        introText: announcement.content,
        changelogEntries: [],
        ctaText: announcement.ctaText,
        ctaUrl: announcement.ctaUrl,
        period: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
        },
      } as AnnouncementUpdateEmailData;
  }
}

/**
 * Calculate duration between two dates
 */
function calculateDuration(start?: string, end?: string): string {
  if (!start || !end) return "TBD";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) {
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `${diffMins} minutes`;
  }
  if (diffHours === 1) return "1 hour";
  return `${diffHours} hours`;
}

/**
 * Render email based on type
 */
async function renderEmail(
  type: AnnouncementType,
  data: AnnouncementFeatureEmailData | AnnouncementUpdateEmailData | AnnouncementMaintenanceEmailData | AnnouncementSecurityEmailData
): Promise<{ subject: string; html: string }> {
  switch (type) {
    case "feature":
      return renderAnnouncementFeatureEmail(data as AnnouncementFeatureEmailData);
    case "maintenance":
      return renderAnnouncementMaintenanceEmail(data as AnnouncementMaintenanceEmailData);
    case "security":
      return renderAnnouncementSecurityEmail(data as AnnouncementSecurityEmailData);
    case "update":
    default:
      return renderAnnouncementUpdateEmail(data as AnnouncementUpdateEmailData);
  }
}

// ============================================================================
// Scheduled Sending
// ============================================================================

/**
 * Process scheduled announcements
 * Called by cron job to send announcements at their scheduled time
 */
export async function processScheduledAnnouncements(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  // Note: Using type assertion until migration is applied and types regenerated
  const supabase = createAdminClient() as any;
  const result = { processed: 0, failed: 0, errors: [] as string[] };

  // Find announcements scheduled to send now or in the past
  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString()) as { data: { id: string }[] | null; error: { message: string } | null };

  if (error) {
    result.errors.push(`Failed to fetch scheduled announcements: ${error.message}`);
    return result;
  }

  if (!announcements || announcements.length === 0) {
    return result;
  }

  for (const announcement of announcements) {
    try {
      const sendResult = await sendAnnouncement(announcement.id);
      if (sendResult.success) {
        result.processed++;
      } else {
        result.failed++;
        result.errors.push(...sendResult.errors);
      }
    } catch (err) {
      result.failed++;
      result.errors.push(
        `Announcement ${announcement.id}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  return result;
}

// ============================================================================
// Product Update Digest
// ============================================================================

/**
 * Generate and send monthly product update digest
 */
export async function sendProductUpdateDigest(params: {
  title?: string;
  introText?: string;
  periodStart: string;
  periodEnd: string;
  createdBy: string;
}): Promise<SendAnnouncementResult> {
  // Note: Using type assertion until migration is applied and types regenerated
  const supabase = createAdminClient() as any;

  // Fetch changelog entries for the period
  const { data: entries, error } = await supabase
    .from("changelog_entries")
    .select("*")
    .gte("release_date", params.periodStart)
    .lte("release_date", params.periodEnd)
    .eq("include_in_digest", true)
    .is("digest_sent_at", null)
    .order("release_date", { ascending: false }) as { data: ChangelogEntryRow[] | null; error: { message: string } | null };

  if (error || !entries || entries.length === 0) {
    return {
      success: false,
      announcementId: "",
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      errors: [error?.message || "No changelog entries found for this period"],
    };
  }

  // Format period for title
  const startDate = new Date(params.periodStart);
  const periodMonth = startDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Create announcement
  const createResult = await createAnnouncement({
    title: params.title || `${periodMonth} Product Updates`,
    content: params.introText || `Here's what's new in RepWell this month.`,
    type: "update",
    audience: "all",
    ctaText: "View All Updates",
    ctaUrl: `${emailConfig.baseUrl}/changelog`,
    createdBy: params.createdBy,
  });

  if (!createResult.success || !createResult.announcementId) {
    return {
      success: false,
      announcementId: "",
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      errors: [createResult.error || "Failed to create announcement"],
    };
  }

  // Send the announcement
  const sendResult = await sendAnnouncement(createResult.announcementId);

  // Mark changelog entries as sent
  if (sendResult.success) {
    await supabase
      .from("changelog_entries")
      .update({ digest_sent_at: new Date().toISOString() })
      .in(
        "id",
        entries.map((e) => e.id)
      );
  }

  return sendResult;
}

// ============================================================================
// Analytics
// ============================================================================

/**
 * Get announcement analytics
 */
export async function getAnnouncementAnalytics(announcementId: string): Promise<{
  totalRecipients: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
}> {
  // Note: Using type assertion until migration is applied and types regenerated
  const supabase = createAdminClient() as any;

  const { data: announcement } = await supabase
    .from("announcements")
    .select("total_recipients, total_sent, total_delivered, total_opened, total_clicked")
    .eq("id", announcementId)
    .single() as { data: { total_recipients: number; total_sent: number; total_delivered: number; total_opened: number; total_clicked: number } | null };

  const { data: statusCounts } = await supabase
    .from("announcement_recipients")
    .select("status")
    .eq("announcement_id", announcementId) as { data: { status: string }[] | null };

  const counts = {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    failed: 0,
    unsubscribed: 0,
  };

  if (statusCounts) {
    for (const row of statusCounts) {
      const status = row.status as keyof typeof counts;
      if (status in counts) {
        counts[status]++;
      }
    }
  }

  const totalRecipients = announcement?.total_recipients || 0;
  const totalSent = announcement?.total_sent || counts.sent;

  return {
    totalRecipients,
    ...counts,
    openRate: totalSent > 0 ? (counts.opened / totalSent) * 100 : 0,
    clickRate: counts.opened > 0 ? (counts.clicked / counts.opened) * 100 : 0,
  };
}

/**
 * Update recipient engagement status (called by webhook)
 */
export async function updateRecipientEngagement(params: {
  resendMessageId: string;
  event: "delivered" | "opened" | "clicked" | "bounced";
  clickedUrl?: string;
}): Promise<void> {
  // Note: Using type assertion until migration is applied and types regenerated
  const supabase = createAdminClient() as any;

  const updateData: Record<string, unknown> = {};

  switch (params.event) {
    case "delivered":
      updateData.status = "delivered";
      updateData.delivered_at = new Date().toISOString();
      break;
    case "opened":
      updateData.status = "opened";
      updateData.opened_at = new Date().toISOString();
      break;
    case "clicked":
      updateData.status = "clicked";
      updateData.clicked_at = new Date().toISOString();
      break;
    case "bounced":
      updateData.status = "bounced";
      break;
  }

  await supabase
    .from("announcement_recipients")
    .update(updateData)
    .eq("resend_message_id", params.resendMessageId);

  // If clicked, also increment click count and log URL
  if (params.event === "clicked" && params.clickedUrl) {
    // This would need a more complex query to append to clicked_urls array
    // For now, just increment click count via RPC
    await supabase.rpc("increment_announcement_click_count", {
      p_resend_message_id: params.resendMessageId,
    });
  }
}
