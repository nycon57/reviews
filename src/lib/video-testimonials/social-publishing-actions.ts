"use server";

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { formatDuration, formatRelationship, type ActionResult } from "./types";

// ============================================================================
// Types
// ============================================================================

export interface VideoSocialTemplate {
  id: string;
  platform: "facebook" | "linkedin" | "twitter";
  name: string;
  description: string | null;
  templateText: string;
  isDefault: boolean;
  isSystem: boolean;
}

export interface VideoSocialPostPreview {
  content: string;
  platform: "facebook" | "linkedin" | "twitter";
  characterCount: number;
  maxLength: number;
  videoUrl: string;
  thumbnailUrl: string | null;
  pageUrl: string;
}

export interface VideoSocialPost {
  id: string;
  videoResponseId: string;
  platform: "facebook" | "linkedin" | "twitter";
  content: string;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  scheduledFor: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  platformPostUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
}

// ============================================================================
// Constants
// ============================================================================

export const VIDEO_TEMPLATE_PLACEHOLDERS = {
  "{{customer_name}}": "Customer display name",
  "{{customer_relationship}}": "Customer relationship type (e.g., Home Buyer)",
  "{{professional_name}}": "Professional's full name",
  "{{professional_title}}": "Professional's job title",
  /** @deprecated Use {{professional_name}} instead */
  "{{loan_officer_name}}": "Professional's full name (deprecated)",
  /** @deprecated Use {{professional_title}} instead */
  "{{loan_officer_title}}": "Professional's job title (deprecated)",
  "{{organization_name}}": "Organization name",
  "{{video_quote}}": "AI-generated quote from video",
  "{{video_excerpt}}": "Short excerpt from video quote",
  "{{video_link}}": "Link to public video page",
  "{{hashtags}}": "Platform-appropriate hashtags",
  "{{duration}}": "Video duration (e.g., 1:30)",
} as const;

const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  facebook: 63206,
  linkedin: 3000,
};

const DEFAULT_HASHTAGS: Record<string, string[]> = {
  facebook: ["#CustomerTestimonial", "#MortgageSuccess", "#HappyHomeowner"],
  linkedin: ["#CustomerSuccess", "#Mortgage", "#Testimonial", "#RealEstate"],
  twitter: ["#Testimonial", "#Mortgage", "#CustomerReview"],
};

const DEFAULT_TEMPLATES: VideoSocialTemplate[] = [
  {
    id: "video-facebook-default",
    platform: "facebook",
    name: "Facebook Video Story",
    description: "Share customer video testimonial on Facebook",
    templateText: `Hear directly from our valued customer, {{customer_name}}!

"{{video_excerpt}}"

{{customer_name}} worked with {{professional_name}} to achieve their homeownership dreams. Watch their full story:

{{video_link}}

{{hashtags}}`,
    isDefault: true,
    isSystem: true,
  },
  {
    id: "video-linkedin-default",
    platform: "linkedin",
    name: "LinkedIn Professional",
    description: "Professional video testimonial for LinkedIn",
    templateText: `We're honored to share this testimonial from {{customer_name}}, a recent {{customer_relationship}}.

"{{video_excerpt}}"

Thank you, {{customer_name}}, for trusting {{professional_name}} and the {{organization_name}} team with your mortgage journey.

Watch the full video testimonial: {{video_link}}

{{hashtags}}`,
    isDefault: true,
    isSystem: true,
  },
  {
    id: "video-twitter-default",
    platform: "twitter",
    name: "Twitter/X Brief",
    description: "Concise video testimonial for Twitter/X",
    templateText: `"{{video_excerpt}}" - {{customer_name}}

Watch their story: {{video_link}}

{{hashtags}}`,
    isDefault: true,
    isSystem: true,
  },
];

// ============================================================================
// Helpers
// ============================================================================

function fillVideoTemplatePlaceholders(
  template: string,
  data: {
    customerName: string;
    customerRelationship: string | null;
    professionalName: string;
    professionalTitle: string | null;
    /** @deprecated Use professionalName instead */
    loanOfficerName?: string;
    /** @deprecated Use professionalTitle instead */
    loanOfficerTitle?: string | null;
    organizationName: string;
    videoQuote: string | null;
    videoLink: string;
    durationSeconds: number | null;
    platform: string;
  }
): string {
  const excerpt = data.videoQuote
    ? data.videoQuote.length > 100
      ? data.videoQuote.substring(0, 97) + "..."
      : data.videoQuote
    : "";

  const hashtags = DEFAULT_HASHTAGS[data.platform] || [];

  // Support both new and deprecated variable names
  const name = data.professionalName || data.loanOfficerName || "";
  const title = data.professionalTitle || data.loanOfficerTitle || "Professional";

  return template
    .replace(/\{\{customer_name\}\}/g, data.customerName)
    .replace(/\{\{customer_relationship\}\}/g, formatRelationship(data.customerRelationship))
    // New variable names
    .replace(/\{\{professional_name\}\}/g, name)
    .replace(/\{\{professional_title\}\}/g, title)
    // Deprecated variable names (for backward compatibility with existing templates)
    .replace(/\{\{loan_officer_name\}\}/g, name)
    .replace(/\{\{loan_officer_title\}\}/g, title)
    .replace(/\{\{organization_name\}\}/g, data.organizationName)
    .replace(/\{\{video_quote\}\}/g, data.videoQuote || "")
    .replace(/\{\{video_excerpt\}\}/g, excerpt)
    .replace(/\{\{video_link\}\}/g, data.videoLink)
    .replace(/\{\{duration\}\}/g, formatDuration(data.durationSeconds))
    .replace(/\{\{hashtags\}\}/g, hashtags.join(" "))
    .trim();
}

async function requireManagerRole(): Promise<{ userId: string; organizationId: string } | null> {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id || !["admin", "manager"].includes(userData.role)) return null;
  return { userId: userData.id, organizationId: userData.organization_id };
}

// ============================================================================
// Server Actions
// ============================================================================

export async function getVideoSocialTemplates(): Promise<ActionResult<VideoSocialTemplate[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }
  return { success: true, data: DEFAULT_TEMPLATES };
}

export async function generateVideoPostPreview(
  videoResponseId: string,
  platform: "facebook" | "linkedin" | "twitter",
  customContent?: string
): Promise<ActionResult<VideoSocialPostPreview>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createAdminClient();
  const { data: video, error: videoError } = await supabase
    .from("video_testimonial_responses")
    .select(`
      id, video_url, thumbnail_url, duration_seconds, ai_generated_text, approval_status,
      video_testimonial_requests!inner (customer_name, source_metadata),
      users!user_id (full_name, title),
      organizations!inner (name)
    `)
    .eq("id", videoResponseId)
    .eq("organization_id", context.organizationId)
    .single();

  if (videoError || !video) {
    return { success: false, error: "Video testimonial not found" };
  }

  if (!["approved", "published"].includes(video.approval_status)) {
    return { success: false, error: "Video must be approved before publishing to social media" };
  }

  type RequestData = { customer_name: string; source_metadata: { customer_display_name?: string; customer_relationship?: string } | null };
  type ProfessionalData = { full_name: string; title: string | null };
  type OrgData = { name: string };

  const request = video.video_testimonial_requests as unknown as RequestData;
  const professional = video.users as unknown as ProfessionalData;
  const organization = video.organizations as unknown as OrgData;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
  const pageUrl = `${baseUrl}/testimonials/video/${videoResponseId}`;

  let content: string;
  if (customContent) {
    content = customContent;
  } else {
    const template = DEFAULT_TEMPLATES.find((t) => t.platform === platform && t.isDefault);
    if (!template) {
      return { success: false, error: "No template found for platform" };
    }
    content = fillVideoTemplatePlaceholders(template.templateText, {
      customerName: request.source_metadata?.customer_display_name || request.customer_name,
      customerRelationship: request.source_metadata?.customer_relationship || null,
      professionalName: professional.full_name,
      professionalTitle: professional.title,
      organizationName: organization.name,
      videoQuote: video.ai_generated_text,
      videoLink: pageUrl,
      durationSeconds: video.duration_seconds,
      platform,
    });
  }

  return {
    success: true,
    data: {
      content,
      platform,
      characterCount: content.length,
      maxLength: PLATFORM_LIMITS[platform] || 3000,
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url,
      pageUrl,
    },
  };
}

export async function createVideoSocialPost(params: {
  videoResponseId: string;
  connectionId: string;
  content: string;
  platform: "facebook" | "linkedin" | "twitter";
  scheduledFor?: string;
  publishImmediately?: boolean;
}): Promise<ActionResult<VideoSocialPost>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const adminSupabase = createAdminClient();
  const untypedAdmin = createUntypedAdminClient();

  // Verify video exists and is approved/published
  const { data: video, error: videoError } = await adminSupabase
    .from("video_testimonial_responses")
    .select("id, approval_status")
    .eq("id", params.videoResponseId)
    .eq("organization_id", context.organizationId)
    .single();

  if (videoError || !video) {
    return { success: false, error: "Video testimonial not found" };
  }

  if (!["approved", "published"].includes(video.approval_status)) {
    return { success: false, error: "Video must be approved before publishing" };
  }

  // Check character limit
  const maxLength = PLATFORM_LIMITS[params.platform] || 3000;
  if (params.content.length > maxLength) {
    return { success: false, error: `Content exceeds ${params.platform} character limit of ${maxLength}` };
  }

  // Verify social connection
  const { data: connection, error: connError } = await untypedAdmin
    .from("social_connections")
    .select("id, platform, is_active")
    .eq("id", params.connectionId)
    .eq("organization_id", context.organizationId)
    .single();

  if (connError || !connection) {
    return { success: false, error: "Social connection not found" };
  }
  if (!connection.is_active) {
    return { success: false, error: "Social connection is not active" };
  }
  if (connection.platform !== params.platform) {
    return { success: false, error: "Platform mismatch with connection" };
  }

  const status = params.publishImmediately ? "publishing" : params.scheduledFor ? "scheduled" : "draft";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
  const pageUrl = `${baseUrl}/testimonials/video/${params.videoResponseId}`;

  const { data: post, error: insertError } = await untypedAdmin
    .from("social_posts")
    .insert({
      organization_id: context.organizationId,
      connection_id: params.connectionId,
      video_response_id: params.videoResponseId,
      platform: params.platform,
      content: params.content,
      link_url: pageUrl,
      status,
      scheduled_for: params.scheduledFor || null,
      created_by: context.userId,
      is_auto_generated: false,
    })
    .select("*")
    .single();

  if (insertError || !post) {
    console.error("Failed to create social post:", insertError);
    return { success: false, error: "Failed to create social post" };
  }

  if (params.publishImmediately) {
    const { publishSocialPost } = await import("@/lib/social/actions");
    const publishResult = await publishSocialPost(post.id);
    if (!publishResult.success) {
      return { success: false, error: publishResult.error || "Failed to publish" };
    }
  }

  revalidatePath("/dashboard/video-testimonials/library");
  revalidatePath("/dashboard/social");

  return {
    success: true,
    data: {
      id: post.id,
      videoResponseId: params.videoResponseId,
      platform: params.platform,
      content: params.content,
      status: post.status,
      scheduledFor: post.scheduled_for,
      publishedAt: post.published_at,
      platformPostId: post.platform_post_id,
      platformPostUrl: post.platform_post_url,
      errorMessage: post.error_message,
      createdAt: post.created_at,
    },
  };
}

export async function getVideoSocialPosts(
  videoResponseId: string
): Promise<ActionResult<VideoSocialPost[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("video_response_id", videoResponseId)
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "Failed to fetch social posts" };
  }

  const posts: VideoSocialPost[] = (data || []).map((row) => ({
    id: row.id,
    videoResponseId: row.video_response_id,
    platform: row.platform,
    content: row.content,
    status: row.status,
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at,
    platformPostId: row.platform_post_id,
    platformPostUrl: row.platform_post_url,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));

  return { success: true, data: posts };
}

export async function getConnectedPlatforms(): Promise<
  ActionResult<Array<{
    id: string;
    platform: "facebook" | "linkedin" | "twitter" | "instagram";
    displayName: string;
    pageName: string | null;
    isActive: boolean;
  }>>
> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Manager role required" };
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("social_connections")
    .select("id, platform, platform_display_name, page_name, is_active")
    .eq("organization_id", context.organizationId)
    .eq("is_active", true);

  if (error) {
    return { success: false, error: "Failed to fetch connections" };
  }

  const connections = (data || []).map((row) => ({
    id: row.id,
    platform: row.platform as "facebook" | "linkedin" | "twitter" | "instagram",
    displayName: row.platform_display_name || row.platform,
    pageName: row.page_name,
    isActive: row.is_active ?? true,
  }));

  return { success: true, data: connections };
}
