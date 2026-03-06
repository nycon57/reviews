"use server";

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { cache } from "react";
import type { Json } from "@/types/database.types";
import {
  VALID_RELATIONSHIPS,
  VIDEO_TESTIMONIAL_CONSENT_VERSION,
  VIDEO_TESTIMONIAL_LEGAL_TEXT,
  validateSafeUrl,
  validateHexColor,
  type ActionResult,
  type PublicVideoTestimonialRequest,
  type SubmitCustomerInfoInput,
  type CreateUploadUrlResult,
  type CreateUploadUrlsResult,
  type SubmitVideoInput,
  type VideoSubmissionResult,
} from "./types";
import { generateReviewFromTranscript } from "@/lib/ai/transcript-to-review";
import { transcribeWithWordTimestamps } from "@/lib/share-studio/transcription-service";
import { ensureSmartLinkForSource } from "@/lib/share-studio/service";
import {
  sendVideoTestimonialPendingApprovalEmail,
  sendVideoTestimonialReceivedEmail,
} from "@/lib/email";

// ============================================================================
// Validation Schemas
// ============================================================================

const customerInfoSchema = z.object({
  displayName: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  relationship: z.enum(VALID_RELATIONSHIPS, {
    errorMap: () => ({ message: "Please select a valid relationship type" }),
  }),
});

const consentSchema = z
  .object({
    nilConsent: z.boolean().optional(),
    videoRecordingConsent: z.boolean().optional(),
    usageRightsConsent: z.literal(true, {
      errorMap: () => ({ message: "Usage rights consent is required" }),
    }),
    aiTextGenerationConsent: z.literal(true, {
      errorMap: () => ({ message: "AI text generation consent is required" }),
    }),
    marketingConsent: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.nilConsent !== true && value.videoRecordingConsent !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name, image, and likeness consent is required",
        path: ["nilConsent"],
      });
    }
  });

const submitCustomerInfoSchema = z.object({
  token: z.string().min(1, "Token is required"),
  customerInfo: customerInfoSchema,
  consents: consentSchema,
  consentVersion: z.string().min(1).optional(),
  legalTextSnapshotHash: z.string().min(1).optional(),
  clientInfo: z
    .object({
      ipAddress: z.string().max(64).optional().nullable(),
      userAgent: z.string().max(500).optional().nullable(),
      locale: z.string().max(50).optional().nullable(),
    })
    .optional(),
});

const createUploadUrlsSchema = z.object({
  token: z.string().min(1, "Token is required"),
  mimeType: z.string().max(100).optional(),
  durationMs: z.number().int().min(1).optional(),
  fileSizeBytes: z.number().int().positive().optional(),
});

const recordConsentEventSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  responseId: z.string().uuid("Invalid response ID").optional(),
  consentType: z.enum([
    "name_image_likeness_voice",
    "usage_rights",
    "ai_text_generation",
    "marketing",
  ]),
  granted: z.boolean(),
  consentVersion: z.string().min(1, "Consent version is required"),
  legalTextSnapshot: z.string().min(1, "Legal text snapshot is required"),
  clientInfo: z
    .object({
      ipAddress: z.string().max(64).optional().nullable(),
      userAgent: z.string().max(500).optional().nullable(),
      locale: z.string().max(50).optional().nullable(),
    })
    .optional(),
});

// ============================================================================
// Type Helpers
// ============================================================================

type UserData = { id: string; full_name: string; photo_url: string | null; title: string | null };
type OrganizationData = { id: string; name: string; logo_url: string | null; primary_color: string | null };
type RequestSourceMetadata = { customer_display_name?: string; customer_relationship?: string } | null;

type ConsentType =
  | "name_image_likeness_voice"
  | "usage_rights"
  | "ai_text_generation"
  | "marketing";

function getExtensionForMimeType(mimeType?: string): string {
  if (!mimeType) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("quicktime")) return "mov";
  if (mimeType.includes("webm")) return "webm";
  return "webm";
}

function normalizeMimeType(raw?: string | null): string {
  if (!raw) return "video/webm";
  return raw.split(";")[0]?.trim().toLowerCase() || "video/webm";
}

async function hashConsentSnapshot(
  consentVersion: string,
  legalText: typeof VIDEO_TESTIMONIAL_LEGAL_TEXT
): Promise<string> {
  const payload = JSON.stringify({ consentVersion, legalText });
  const data = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function recordConsentEvents(params: {
  requestId: string;
  responseId?: string;
  consentVersion: string;
  consents: {
    nilConsent: boolean;
    usageRightsConsent: boolean;
    aiTextGenerationConsent: boolean;
    marketingConsent: boolean;
  };
  clientInfo?: {
    ipAddress?: string | null;
    userAgent?: string | null;
    locale?: string | null;
  };
}): Promise<string[]> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const events: Array<{
    request_id: string;
    response_id?: string;
    consent_type: ConsentType;
    granted: boolean;
    consent_version: string;
    legal_text_snapshot: string;
    ip_address?: string | null;
    user_agent?: string | null;
    locale?: string | null;
    created_at: string;
  }> = [
    {
      request_id: params.requestId,
      response_id: params.responseId,
      consent_type: "name_image_likeness_voice",
      granted: params.consents.nilConsent,
      consent_version: params.consentVersion,
      legal_text_snapshot: VIDEO_TESTIMONIAL_LEGAL_TEXT.nilConsent,
      ip_address: params.clientInfo?.ipAddress || null,
      user_agent: params.clientInfo?.userAgent || null,
      locale: params.clientInfo?.locale || null,
      created_at: now,
    },
    {
      request_id: params.requestId,
      response_id: params.responseId,
      consent_type: "usage_rights",
      granted: params.consents.usageRightsConsent,
      consent_version: params.consentVersion,
      legal_text_snapshot: VIDEO_TESTIMONIAL_LEGAL_TEXT.usageRightsConsent,
      ip_address: params.clientInfo?.ipAddress || null,
      user_agent: params.clientInfo?.userAgent || null,
      locale: params.clientInfo?.locale || null,
      created_at: now,
    },
    {
      request_id: params.requestId,
      response_id: params.responseId,
      consent_type: "ai_text_generation",
      granted: params.consents.aiTextGenerationConsent,
      consent_version: params.consentVersion,
      legal_text_snapshot: VIDEO_TESTIMONIAL_LEGAL_TEXT.aiTextGenerationConsent,
      ip_address: params.clientInfo?.ipAddress || null,
      user_agent: params.clientInfo?.userAgent || null,
      locale: params.clientInfo?.locale || null,
      created_at: now,
    },
    {
      request_id: params.requestId,
      response_id: params.responseId,
      consent_type: "marketing",
      granted: params.consents.marketingConsent,
      consent_version: params.consentVersion,
      legal_text_snapshot: VIDEO_TESTIMONIAL_LEGAL_TEXT.marketingConsent,
      ip_address: params.clientInfo?.ipAddress || null,
      user_agent: params.clientInfo?.userAgent || null,
      locale: params.clientInfo?.locale || null,
      created_at: now,
    },
  ];

  const { data, error } = await supabase
    .from("testimonial_consent_events")
    .insert(events)
    .select("id");

  if (error || !data) {
    throw new Error(error?.message || "Failed to record consent events");
  }

  return data.map((event) => event.id);
}

export async function recordConsentEvent(
  input: z.infer<typeof recordConsentEventSchema>
): Promise<ActionResult<{ consentEventId: string }>> {
  try {
    const parsed = recordConsentEventSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message || "Invalid consent event payload" };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("testimonial_consent_events")
      .insert({
        request_id: parsed.data.requestId,
        response_id: parsed.data.responseId || null,
        consent_type: parsed.data.consentType,
        granted: parsed.data.granted,
        consent_version: parsed.data.consentVersion,
        legal_text_snapshot: parsed.data.legalTextSnapshot,
        ip_address: parsed.data.clientInfo?.ipAddress || null,
        user_agent: parsed.data.clientInfo?.userAgent || null,
        locale: parsed.data.clientInfo?.locale || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to record consent event" };
    }

    return { success: true, data: { consentEventId: data.id } };
  } catch (error) {
    console.error("Error recording consent event:", error);
    return { success: false, error: "Failed to record consent event" };
  }
}

// ============================================================================
// Public Server Actions
// ============================================================================

/**
 * Get video testimonial request by token (no auth required)
 * Used for the public video testimonial capture page
 */
export const getVideoTestimonialByToken = cache(async function getVideoTestimonialByTokenImpl(
  token: string
): Promise<ActionResult<PublicVideoTestimonialRequest>> {
  try {
    if (!token) {
      return { success: false, error: "Request token is required" };
    }

    const supabase = createAdminClient();
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select(`
        id, token, status, max_duration_seconds, prompt_text, expires_at,
        submitted_at, opened_at, customer_name, customer_email,
        user_id, organization_id,
        users!user_id (id, full_name, photo_url, title),
        organizations!inner (id, name, logo_url, primary_color)
      `)
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Validate request status
    if (request.submitted_at || request.status === "submitted" || request.status === "completed") {
      return { success: false, error: "This video testimonial has already been submitted" };
    }
    if (request.status === "cancelled") {
      return { success: false, error: "This video testimonial request has been cancelled" };
    }
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This video testimonial request has expired" };
    }

    // Update opened_at if not already set
    if (!request.opened_at) {
      const now = new Date().toISOString();
      await supabase
        .from("video_testimonial_requests")
        .update({
          opened_at: now,
          status: "opened",
          last_transition_at: now,
          last_transition_source: "public_link_open",
          last_transition_reason: "Customer opened invitation link",
          updated_at: now,
        })
        .eq("id", request.id);
    }

    const professional = request.users as unknown as UserData;
    const organization = request.organizations as unknown as OrganizationData;

    return {
      success: true,
      data: {
        id: request.id,
        token: request.token,
        status: request.status,
        maxDurationSeconds: request.max_duration_seconds || 120,
        promptText: request.prompt_text,
        expiresAt: request.expires_at,
        submittedAt: request.submitted_at,
        customerName: request.customer_name,
        customerEmail: request.customer_email,
        professional: {
          id: professional.id,
          fullName: professional.full_name,
          photoUrl: validateSafeUrl(professional.photo_url),
          title: professional.title,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          logoUrl: validateSafeUrl(organization.logo_url),
          primaryColor: validateHexColor(organization.primary_color),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching video testimonial by token:", error);
    return { success: false, error: "Failed to load video testimonial request" };
  }
});

/**
 * Submit customer info and consent for video testimonial
 * Uses optimistic locking to prevent race conditions
 */
export async function submitCustomerInfoAndConsent(
  input: SubmitCustomerInfoInput
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const validated = submitCustomerInfoSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || "Validation failed" };
    }

    const { token, customerInfo, consents, consentVersion, legalTextSnapshotHash, clientInfo } = validated.data;
    const supabase = createAdminClient();
    const normalizedConsents = {
      nilConsent: consents.nilConsent === true || consents.videoRecordingConsent === true,
      usageRightsConsent: consents.usageRightsConsent === true,
      aiTextGenerationConsent: consents.aiTextGenerationConsent === true,
      marketingConsent: consents.marketingConsent === true,
    };
    const effectiveConsentVersion = consentVersion || VIDEO_TESTIMONIAL_CONSENT_VERSION;
    const consentSnapshotHash =
      legalTextSnapshotHash ||
      (await hashConsentSnapshot(effectiveConsentVersion, VIDEO_TESTIMONIAL_LEGAL_TEXT));

    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select("id, status, expires_at, submitted_at")
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Validate request status
    if (request.submitted_at || request.status === "submitted" || request.status === "completed") {
      return { success: false, error: "This video testimonial has already been submitted" };
    }
    if (request.status === "cancelled") {
      return { success: false, error: "This request has been cancelled" };
    }
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This request has expired" };
    }

    const now = new Date().toISOString();
    const { data: updatedData, error: updateError } = await supabase
      .from("video_testimonial_requests")
      .update({
        status: "recording",
        source_metadata: {
          customer_display_name: customerInfo.displayName,
          customer_relationship: customerInfo.relationship,
          consent_version: effectiveConsentVersion,
          consent_snapshot_hash: consentSnapshotHash,
          consent_updated_at: now,
        } as Json,
        last_transition_at: now,
        last_transition_source: "public_consent_form",
        last_transition_reason: "Customer submitted identity and consent form",
        updated_at: now,
      })
      .eq("id", request.id)
      .not("status", "in", '("submitted","cancelled")')
      .select("id")
      .single();

    if (updateError || !updatedData) {
      console.error("Error updating video testimonial request:", updateError);
      return { success: false, error: "Unable to save your information. The request may have been updated." };
    }

    await recordConsentEvents({
      requestId: request.id,
      consentVersion: effectiveConsentVersion,
      consents: normalizedConsents,
      clientInfo,
    });

    return { success: true, data: { requestId: request.id } };
  } catch (error) {
    console.error("Error submitting customer info and consent:", error);
    return { success: false, error: "Failed to submit your information" };
  }
}

// ============================================================================
// Public Video Testimonial Display Types
// ============================================================================

export interface PublicVideoTestimonial {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  transcription: string | null;
  aiGeneratedText: string | null;
  keyPhrases: string[] | null;
  sentimentLabel: string | null;
  submittedAt: string;
  publishedAt: string | null;
  customer: { displayName: string; relationship: string | null };
  professional: { id: string; fullName: string; photoUrl: string | null; title: string | null };
  organization: { id: string; name: string; logoUrl: string | null; primaryColor: string | null };
}

// ============================================================================
// Public Video Testimonial Display Actions
// ============================================================================

/**
 * Get a published video testimonial by ID for public display
 * Only returns videos that have been approved and published
 */
export const getPublicVideoTestimonial = cache(async function getPublicVideoTestimonialImpl(
  videoId: string
): Promise<ActionResult<PublicVideoTestimonial>> {
  try {
    if (!videoId) {
      return { success: false, error: "Video ID is required" };
    }

    const supabase = createAdminClient();
    const { data: video, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select(`
        id, video_url, video_path, thumbnail_url, duration_seconds, transcription,
        ai_generated_text, key_phrases, sentiment_label, submitted_at, published_at,
        approval_status, user_id, organization_id,
        video_testimonial_requests!inner (customer_name, source_metadata),
        users!user_id (id, full_name, photo_url, title),
        organizations!inner (id, name, logo_url, primary_color)
      `)
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video testimonial not found" };
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("video-testimonials")
      .createSignedUrl(video.video_path.replace(/^\/+/, ""), 86400);

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating signed URL for public video:", signedUrlError);
      return { success: false, error: "Failed to load video" };
    }

    const request = video.video_testimonial_requests as unknown as { customer_name: string; source_metadata: RequestSourceMetadata };
    const professional = video.users as unknown as UserData;
    const organization = video.organizations as unknown as OrganizationData;

    trackVideoView(videoId).catch(console.error);

    return {
      success: true,
      data: {
        id: video.id,
        videoUrl: signedUrlData.signedUrl,
        thumbnailUrl: validateSafeUrl(video.thumbnail_url),
        durationSeconds: video.duration_seconds,
        transcription: video.transcription,
        aiGeneratedText: video.ai_generated_text,
        keyPhrases: video.key_phrases,
        sentimentLabel: video.sentiment_label,
        submittedAt: video.submitted_at,
        publishedAt: video.published_at,
        customer: {
          displayName: request.source_metadata?.customer_display_name || request.customer_name,
          relationship: request.source_metadata?.customer_relationship || null,
        },
        professional: {
          id: professional.id,
          fullName: professional.full_name,
          photoUrl: validateSafeUrl(professional.photo_url),
          title: professional.title,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          logoUrl: validateSafeUrl(organization.logo_url),
          primaryColor: validateHexColor(organization.primary_color),
        },
      },
    };
  } catch (error) {
    console.error("Error fetching public video testimonial:", error);
    return { success: false, error: "Failed to load video testimonial" };
  }
});

async function trackVideoView(videoId: string): Promise<void> {
  console.log(`Video view: ${videoId} at ${new Date().toISOString()}`);
}

/**
 * Get public video testimonial metadata for SEO (lighter query)
 */
export const getPublicVideoMetadata = cache(async function getPublicVideoMetadataImpl(
  videoId: string
): Promise<ActionResult<{
  title: string;
  description: string;
  customerName: string;
  professionalName: string;
  organizationName: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
}>> {
  try {
    if (!videoId) {
      return { success: false, error: "Video ID is required" };
    }

    const supabase = createAdminClient();
    const { data: video, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select(`
        id, thumbnail_url, duration_seconds, ai_generated_text, published_at, approval_status,
        video_testimonial_requests!inner (customer_name, source_metadata),
        users!user_id (full_name),
        organizations!inner (name)
      `)
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video testimonial not found" };
    }

    const request = video.video_testimonial_requests as unknown as { customer_name: string; source_metadata: { customer_display_name?: string } | null };
    const professional = video.users as unknown as { full_name: string };
    const organization = video.organizations as unknown as { name: string };

    const customerName = request.source_metadata?.customer_display_name || request.customer_name;
    const description = video.ai_generated_text
      ? video.ai_generated_text.substring(0, 155) + (video.ai_generated_text.length > 155 ? "..." : "")
      : `Watch ${customerName}'s video testimonial about their experience with ${professional.full_name} at ${organization.name}.`;

    return {
      success: true,
      data: {
        title: `${customerName}'s Experience with ${professional.full_name}`,
        description,
        customerName,
        professionalName: professional.full_name,
        organizationName: organization.name,
        thumbnailUrl: validateSafeUrl(video.thumbnail_url),
        durationSeconds: video.duration_seconds,
        publishedAt: video.published_at,
      },
    };
  } catch (error) {
    console.error("Error fetching public video metadata:", error);
    return { success: false, error: "Failed to load video metadata" };
  }
});

// ============================================================================
// Share Tracking
// ============================================================================

export type SharePlatform = "facebook" | "linkedin" | "twitter" | "link" | "embed";

export async function trackVideoShare(
  videoId: string,
  platform: SharePlatform
): Promise<ActionResult<void>> {
  try {
    if (!videoId) {
      return { success: false, error: "Video ID is required" };
    }

    const supabase = createAdminClient();
    const { data: video, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select("id, approval_status")
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video not found" };
    }

    console.log(`Video share: ${videoId} on ${platform} at ${new Date().toISOString()}`);
    return { success: true };
  } catch (error) {
    console.error("Error tracking video share:", error);
    return { success: false, error: "Failed to track share" };
  }
}

export async function generateShareLink(
  videoId: string
): Promise<ActionResult<{ shareUrl: string }>> {
  try {
    if (!videoId) {
      return { success: false, error: "Video ID is required" };
    }

    const supabase = createAdminClient();
    const { data: video, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select("id, approval_status, organization_id, user_id")
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video not found or not published" };
    }

    const ensured = await ensureSmartLinkForSource({
      organizationId: video.organization_id as string,
      sourceType: "video_testimonial",
      sourceId: videoId,
      actorUserId: (video.user_id as string | null) ?? null,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
    return { success: true, data: { shareUrl: `${baseUrl}${ensured.url}` } };
  } catch (error) {
    console.error("Error generating share link:", error);
    return { success: false, error: "Failed to generate share link" };
  }
}

// ============================================================================
// Video Upload & Submission Actions
// ============================================================================

/**
 * Create a signed upload URL for video testimonial upload
 * Returns a presigned URL that allows direct upload to storage
 */
export async function createVideoUploadUrl(
  token: string
): Promise<ActionResult<CreateUploadUrlResult>> {
  try {
    if (!token) {
      return { success: false, error: "Token is required" };
    }

    const supabase = createAdminClient();

    // Validate token and get request
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select("id, status, organization_id, expires_at, submitted_at")
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Validate request is in recording state
    if (request.status !== "recording") {
      return { success: false, error: "Request must be in recording state to upload" };
    }

    if (request.submitted_at) {
      return { success: false, error: "This video testimonial has already been submitted" };
    }

    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This video testimonial request has expired" };
    }

    // Generate unique storage path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storagePath = `${request.organization_id}/${request.id}/${timestamp}-${randomSuffix}.webm`;

    // Create signed upload URL (valid for 10 minutes)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("video-testimonials")
      .createSignedUploadUrl(storagePath);

    if (uploadError || !uploadData) {
      console.error("Error creating signed upload URL:", uploadError);
      return { success: false, error: "Failed to create upload URL" };
    }

    return {
      success: true,
      data: {
        uploadUrl: uploadData.signedUrl,
        storagePath,
      },
    };
  } catch (error) {
    console.error("Error creating video upload URL:", error);
    return { success: false, error: "Failed to create upload URL" };
  }
}

/**
 * Create signed upload URLs for both video and thumbnail
 * Returns presigned URLs that allow direct upload to storage
 */
export async function createVideoUploadUrls(
  input: string | z.infer<typeof createUploadUrlsSchema>
): Promise<ActionResult<CreateUploadUrlsResult>> {
  try {
    const parsedInput = createUploadUrlsSchema.safeParse(
      typeof input === "string" ? { token: input } : input
    );

    if (!parsedInput.success) {
      return { success: false, error: "Token is required" };
    }
    const { token, mimeType } = parsedInput.data;

    const supabase = createAdminClient();

    // Validate token and get request
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select("id, status, organization_id, expires_at, submitted_at")
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Validate request is in recording state
    if (request.status !== "recording") {
      return { success: false, error: "Request must be in recording state to upload" };
    }

    if (request.submitted_at) {
      return { success: false, error: "This video testimonial has already been submitted" };
    }

    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This video testimonial request has expired" };
    }

    // Generate unique storage paths and resumable upload metadata
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const videoExtension = getExtensionForMimeType(normalizeMimeType(mimeType));
    const basePath = `${request.organization_id}/${request.id}/${timestamp}-${randomSuffix}`;
    const videoStoragePath = `${basePath}.${videoExtension}`;
    const thumbnailStoragePath = `${basePath}-thumb.jpg`;
    const uploadSessionId = crypto.randomUUID();
    const resumeToken = `${request.id}:${uploadSessionId}`;

    // Create signed upload URLs (valid for 10 minutes)
    const [videoUploadResult, thumbnailUploadResult] = await Promise.all([
      supabase.storage.from("video-testimonials").createSignedUploadUrl(videoStoragePath),
      supabase.storage.from("video-testimonials").createSignedUploadUrl(thumbnailStoragePath),
    ]);

    if (videoUploadResult.error || !videoUploadResult.data) {
      console.error("Error creating video upload URL:", videoUploadResult.error);
      return { success: false, error: "Failed to create video upload URL" };
    }

    if (thumbnailUploadResult.error || !thumbnailUploadResult.data) {
      console.error("Error creating thumbnail upload URL:", thumbnailUploadResult.error);
      return { success: false, error: "Failed to create thumbnail upload URL" };
    }

    return {
      success: true,
      data: {
        videoUploadUrl: videoUploadResult.data.signedUrl,
        videoStoragePath,
        thumbnailUploadUrl: thumbnailUploadResult.data.signedUrl,
        thumbnailStoragePath,
        uploadSessionId,
        resumeToken,
        recommendedPartSize: 5 * 1024 * 1024,
      },
    };
  } catch (error) {
    console.error("Error creating upload URLs:", error);
    return { success: false, error: "Failed to create upload URLs" };
  }
}

type ConsentEventRow = {
  id: string;
  consent_type: ConsentType;
  granted: boolean;
  consent_version: string;
  created_at: string;
};

function guessMimeTypeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".webm")) return "video/webm";
  return "video/webm";
}

function getLatestConsentSnapshot(events: ConsentEventRow[]) {
  const latestByType = new Map<ConsentType, ConsentEventRow>();
  for (const event of events) {
    if (!latestByType.has(event.consent_type)) {
      latestByType.set(event.consent_type, event);
    }
  }

  const nil = latestByType.get("name_image_likeness_voice");
  const usage = latestByType.get("usage_rights");
  const ai = latestByType.get("ai_text_generation");
  const marketing = latestByType.get("marketing");

  const requiredConsentSatisfied = Boolean(nil?.granted && usage?.granted && ai?.granted);
  const consentVersion =
    nil?.consent_version ||
    usage?.consent_version ||
    ai?.consent_version ||
    VIDEO_TESTIMONIAL_CONSENT_VERSION;
  const consentCapturedAt =
    [nil?.created_at, usage?.created_at, ai?.created_at, marketing?.created_at]
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => (a > b ? -1 : 1))[0] || new Date().toISOString();

  return {
    requiredConsentSatisfied,
    consentVersion,
    consentCapturedAt,
    marketingConsentGranted: marketing?.granted === true,
  };
}

async function getVideoNotificationRecipients(params: {
  organizationId: string;
  ownerUserId: string;
}) {
  const supabase = createAdminClient();
  const [{ data: owner }, { data: managers }] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, role")
      .eq("id", params.ownerUserId)
      .maybeSingle(),
    supabase
      .from("users")
      .select("id, full_name, email, role")
      .eq("organization_id", params.organizationId)
      .in("role", ["admin", "manager"]),
  ]);

  const dedupedManagers =
    (managers || []).filter((manager) => manager.id !== params.ownerUserId) || [];

  return {
    owner: owner || null,
    managers: dedupedManagers,
  };
}

async function notifyVideoSubmitted(params: {
  responseId: string;
  requestId: string;
  organizationId: string;
  ownerUserId: string;
  ownerName: string;
  ownerEmail: string | null;
  customerName: string;
  organizationName: string;
  durationSeconds: number;
}) {
  const supabase = createAdminClient();
  const dashboardBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
  const { owner, managers } = await getVideoNotificationRecipients({
    organizationId: params.organizationId,
    ownerUserId: params.ownerUserId,
  });

  const now = new Date().toISOString();
  const inAppRows = [
    ...(owner
      ? [
          {
            user_id: owner.id,
            organization_id: params.organizationId,
            type: "video_testimonial_submitted",
            title: "New Video Testimonial Submitted",
            message: `${params.customerName} just submitted a video testimonial.`,
            action_url: `/dashboard/video-testimonials/library?id=${params.responseId}`,
            metadata: {
              event: "testimonial_submitted",
              response_id: params.responseId,
              request_id: params.requestId,
              customer_name: params.customerName,
              created_at: now,
            } as Json,
          },
        ]
      : []),
    ...managers.map((manager) => ({
      user_id: manager.id,
      organization_id: params.organizationId,
      type: "video_testimonial_submitted",
      title: "Video Testimonial Awaiting Processing",
      message: `${params.customerName} submitted a video testimonial for ${params.ownerName}.`,
      action_url: `/dashboard/video-testimonials/approval`,
      metadata: {
        event: "testimonial_submitted",
        response_id: params.responseId,
        request_id: params.requestId,
        customer_name: params.customerName,
        owner_user_id: params.ownerUserId,
        created_at: now,
      } as Json,
    })),
  ];

  if (inAppRows.length > 0) {
    await supabase.from("notifications").insert(inAppRows);
  }

  if (params.ownerEmail) {
    await sendVideoTestimonialReceivedEmail({
      toEmail: params.ownerEmail,
      loanOfficerName: params.ownerName,
      customerName: params.customerName,
      submittedAt: now,
      durationSeconds: params.durationSeconds,
      dashboardUrl: `${dashboardBaseUrl}/dashboard/video-testimonials/library`,
      testimonialId: params.responseId,
      organizationId: params.organizationId,
      loanOfficerId: params.ownerUserId,
    });
  }
}

async function notifyVideoReadyForApproval(params: {
  responseId: string;
  requestId: string;
  organizationId: string;
  ownerUserId: string;
  ownerName: string;
  customerName: string;
  durationSeconds: number | null;
}) {
  const supabase = createAdminClient();
  const dashboardBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
  const { owner, managers } = await getVideoNotificationRecipients({
    organizationId: params.organizationId,
    ownerUserId: params.ownerUserId,
  });

  if (!owner && managers.length === 0) return;
  const now = new Date().toISOString();

  const inAppRows = [
    ...(owner
      ? [
          {
            user_id: owner.id,
            organization_id: params.organizationId,
            type: "video_text_ready_for_approval",
            title: "Video Testimonial Ready for Review",
            message: `${params.customerName}'s video and draft text are ready.`,
            action_url: `/dashboard/video-testimonials/library?id=${params.responseId}`,
            metadata: {
              event: "text_ready_for_approval",
              response_id: params.responseId,
              request_id: params.requestId,
              customer_name: params.customerName,
              owner_user_id: params.ownerUserId,
              created_at: now,
            } as Json,
          },
        ]
      : []),
    ...managers.map((manager) => ({
      user_id: manager.id,
      organization_id: params.organizationId,
      type: "video_text_ready_for_approval",
      title: "Video Testimonial Ready for Approval",
      message: `${params.customerName}'s testimonial for ${params.ownerName} is ready to review.`,
      action_url: `/dashboard/video-testimonials/approval`,
      metadata: {
        event: "text_ready_for_approval",
        response_id: params.responseId,
        request_id: params.requestId,
        customer_name: params.customerName,
        owner_user_id: params.ownerUserId,
        created_at: now,
      } as Json,
    }))
  ];

  await supabase.from("notifications").insert(inAppRows);

  await Promise.all(
    managers
      .filter((manager) => !!manager.email)
      .map((manager) =>
        sendVideoTestimonialPendingApprovalEmail({
          toEmail: manager.email as string,
          managerName: manager.full_name || "Manager",
          loanOfficerName: params.ownerName,
          customerName: params.customerName,
          submittedAt: now,
          durationSeconds: params.durationSeconds || undefined,
          approvalQueueUrl: `${dashboardBaseUrl}/dashboard/video-testimonials/approval`,
          testimonialId: params.responseId,
          organizationId: params.organizationId,
          loanOfficerId: params.ownerUserId,
        })
      )
  );
}

async function notifyVideoProcessingFailure(params: {
  responseId: string;
  requestId: string;
  organizationId: string;
  ownerUserId: string;
  ownerName: string;
  customerName: string;
  errorMessage: string;
}) {
  const supabase = createAdminClient();
  const { owner, managers } = await getVideoNotificationRecipients({
    organizationId: params.organizationId,
    ownerUserId: params.ownerUserId,
  });
  const now = new Date().toISOString();
  const rows = [
    ...(owner
      ? [
          {
            user_id: owner.id,
            organization_id: params.organizationId,
            type: "video_transcription_failed",
            title: "Video Processing Failed",
            message: `We could not process ${params.customerName}'s testimonial. Please retry.`,
            action_url: `/dashboard/video-testimonials/library?id=${params.responseId}`,
            metadata: {
              event: "transcription_failed",
              response_id: params.responseId,
              request_id: params.requestId,
              customer_name: params.customerName,
              error: params.errorMessage,
              created_at: now,
            } as Json,
          },
        ]
      : []),
    ...managers.map((manager) => ({
      user_id: manager.id,
      organization_id: params.organizationId,
      type: "video_transcription_failed",
      title: "Video Testimonial Processing Failed",
      message: `${params.customerName}'s testimonial for ${params.ownerName} failed processing.`,
      action_url: `/dashboard/video-testimonials/library?id=${params.responseId}`,
      metadata: {
        event: "transcription_failed",
        response_id: params.responseId,
        request_id: params.requestId,
        customer_name: params.customerName,
        owner_user_id: params.ownerUserId,
        error: params.errorMessage,
        created_at: now,
      } as Json,
    })),
  ];

  if (rows.length > 0) {
    await supabase.from("notifications").insert(rows);
  }
}

/**
 * Submit video testimonial after upload
 * - Creates response record
 * - Enqueues AI processing job (transcription + review generation)
 * - Updates request status with optimistic locking
 * - Returns immediately without waiting for AI processing
 */
export async function submitVideoTestimonial(
  input: SubmitVideoInput
): Promise<VideoSubmissionResult> {
  const { token, storagePath, durationSeconds, thumbnailPath } = input;

  try {
    if (!token || !storagePath) {
      return { success: false, error: "Token and storage path are required" };
    }

    const supabase = createAdminClient();

    // Get and validate request
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select(`
        id, status, organization_id, user_id, customer_name, customer_email,
        expires_at, submitted_at, source_metadata,
        users!user_id (full_name, email),
        organizations!inner(name)
      `)
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    const submissionIdempotencyKey =
      input.idempotencyKey || `${request.id}:${storagePath}:${durationSeconds}`;

    // If this idempotency key already succeeded, return the prior response.
    const { data: existingByKey } = await supabase
      .from("video_testimonial_responses")
      .select("id")
      .eq("request_id", request.id)
      .eq("submission_idempotency_key", submissionIdempotencyKey)
      .maybeSingle();

    if (existingByKey) {
      return { success: true, responseId: existingByKey.id };
    }

    if (request.status !== "recording" && !request.submitted_at) {
      return { success: false, error: "Request must be in recording state" };
    }

    if (request.submitted_at) {
      return { success: false, error: "Already submitted" };
    }

    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "Request has expired" };
    }

    // Get public URL for the video
    const { data: publicUrlData } = supabase.storage
      .from("video-testimonials")
      .getPublicUrl(storagePath);

    if (!publicUrlData?.publicUrl) {
      return { success: false, error: "Failed to get video URL" };
    }

    const videoUrl = publicUrlData.publicUrl;
    const effectiveMimeType = normalizeMimeType(
      input.mediaMetadata?.mimeType || guessMimeTypeFromPath(storagePath)
    );

    // Get public URL for thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (thumbnailPath) {
      const { data: thumbUrlData } = supabase.storage
        .from("video-testimonials")
        .getPublicUrl(thumbnailPath);
      thumbnailUrl = thumbUrlData?.publicUrl || null;
    }

    const eventQuery = supabase
      .from("testimonial_consent_events")
      .select("id, consent_type, granted, consent_version, created_at")
      .eq("request_id", request.id);

    const { data: consentEvents, error: consentEventError } = await (input.consentEventIds?.length
      ? eventQuery.in("id", input.consentEventIds).order("created_at", { ascending: false })
      : eventQuery.order("created_at", { ascending: false }).limit(20));

    if (consentEventError || !consentEvents || consentEvents.length === 0) {
      return { success: false, error: "Required consent records were not found" };
    }

    const consentSnapshot = getLatestConsentSnapshot(consentEvents as ConsentEventRow[]);
    if (!consentSnapshot.requiredConsentSatisfied) {
      return { success: false, error: "Required consent records are incomplete" };
    }

    // Create response record with queued status for AI processing
    const now = new Date().toISOString();
    const { data: response, error: responseError } = await supabase
      .from("video_testimonial_responses")
      .insert({
        request_id: request.id,
        organization_id: request.organization_id,
        user_id: request.user_id,
        submission_idempotency_key: submissionIdempotencyKey,
        upload_session_id: input.uploadSessionId || null,
        video_url: videoUrl,
        video_path: storagePath,
        thumbnail_url: thumbnailUrl,
        duration_seconds: durationSeconds,
        file_size_bytes: input.mediaMetadata?.fileSizeBytes || null,
        width: input.mediaMetadata?.width || null,
        height: input.mediaMetadata?.height || null,
        mime_type: effectiveMimeType,
        media_codec: input.mediaMetadata?.codec || null,
        consent_given: true,
        consent_timestamp: consentSnapshot.consentCapturedAt,
        marketing_consent: consentSnapshot.marketingConsentGranted,
        consent_version: consentSnapshot.consentVersion,
        nil_consent_given: true,
        usage_rights_consent_given: true,
        ai_text_consent_given: true,
        marketing_consent_given: consentSnapshot.marketingConsentGranted,
        consent_captured_at: consentSnapshot.consentCapturedAt,
        consent_source: "public_form",
        transcription_status: "pending",
        ai_generation_status: "pending",
        approval_status: "pending",
        submitted_at: now,
        created_at: now,
      })
      .select("id")
      .single();

    if (responseError || !response) {
      if (responseError?.code === "23505") {
        const { data: retryMatch } = await supabase
          .from("video_testimonial_responses")
          .select("id")
          .eq("request_id", request.id)
          .eq("submission_idempotency_key", submissionIdempotencyKey)
          .maybeSingle();
        if (retryMatch) {
          return { success: true, responseId: retryMatch.id };
        }
      }
      console.error("Error creating response record:", responseError);
      return { success: false, error: "Failed to create response record" };
    }

    // Link consent events to this response once it exists.
    await supabase
      .from("testimonial_consent_events")
      .update({ response_id: response.id })
      .eq("request_id", request.id)
      .is("response_id", null);

    // Update request status to submitted with optimistic locking
    // Only update if status is still "recording" and not already submitted
    const { data: updatedRequest, error: updateError } = await supabase
      .from("video_testimonial_requests")
      .update({
        status: "submitted",
        submitted_at: now,
        last_transition_at: now,
        last_transition_source: "public_submit",
        last_transition_reason: "Customer submitted recorded testimonial",
        updated_at: now,
      })
      .eq("id", request.id)
      .eq("status", "recording")
      .is("submitted_at", null)
      .select("id")
      .maybeSingle();

    // Check for concurrent modification - if no rows updated, another request beat us
    if (updateError) {
      console.error("Error updating request status:", updateError);
      // Clean up the response record we just created
      await supabase.from("video_testimonial_responses").delete().eq("id", response.id);
      return { success: false, error: "Failed to update request status" };
    }

    if (!updatedRequest) {
      // Concurrent modification detected - request was already submitted
      console.warn("Concurrent submission detected for request:", request.id);
      // Clean up the response record we just created
      await supabase.from("video_testimonial_responses").delete().eq("id", response.id);
      return { success: false, error: "This video testimonial has already been submitted" };
    }

    const owner = request.users as unknown as { full_name: string | null; email: string | null };
    const organization = request.organizations as unknown as { name: string };
    await notifyVideoSubmitted({
      responseId: response.id,
      requestId: request.id,
      organizationId: request.organization_id,
      ownerUserId: request.user_id,
      ownerName: owner.full_name || "Team Member",
      ownerEmail: owner.email,
      customerName: request.customer_name,
      organizationName: organization.name,
      durationSeconds,
    });

    // AI processing is now handled by a background worker via cron job
    // The worker will poll for responses with transcription_status="pending"
    // and process them asynchronously

    return {
      success: true,
      responseId: response.id,
      // transcription and generatedReview will be populated by background worker
    };
  } catch (error) {
    console.error("Error submitting video testimonial:", error);
    return { success: false, error: "Failed to submit video testimonial" };
  }
}

// ============================================================================
// AI Processing Job Types and Functions
// ============================================================================

export interface AIProcessingJob {
  responseId: string;
  requestId: string;
  organizationId: string;
  ownerUserId: string;
  ownerEmail: string | null;
  videoUrl: string;
  durationSeconds: number | null;
  customerName: string;
  ownerName: string;
}

export interface AIProcessingResult {
  success: boolean;
  responseId: string;
  transcription?: string;
  generatedReview?: string;
  error?: string;
}

/**
 * Process a single video testimonial AI job
 * Called by background worker to transcribe video and generate review
 */
export async function processVideoTestimonialAIJob(
  job: AIProcessingJob
): Promise<AIProcessingResult> {
  const supabase = createAdminClient();
  const untypedSupabase = createUntypedAdminClient();
  const {
    responseId,
    requestId,
    organizationId,
    ownerUserId,
    videoUrl,
    durationSeconds,
    customerName,
    ownerName,
  } = job;

  try {
    // Mark as processing
    await supabase
      .from("video_testimonial_responses")
      .update({
        transcription_status: "processing",
        processing_error_code: null,
        processing_error_stage: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId);

    let transcription: string | null = null;
    let generatedReview: string | null = null;

    // Run AI transcription
    try {
      const transcriptionResult = await transcribeWithWordTimestamps(videoUrl, {
        durationSeconds,
        prompt: `Customer testimonial for ${ownerName}`,
      });

      transcription = transcriptionResult.full_text;
      const wordTimestampPayload = {
        full_text: transcriptionResult.full_text,
        segments: transcriptionResult.segments.map((segment) => ({ ...segment })),
        words: transcriptionResult.words.map((word) => ({ ...word })),
        provider: transcriptionResult.provider,
        model: transcriptionResult.model,
        created_at: new Date().toISOString(),
        flagged_word_count: transcriptionResult.words.filter(
          (word) => word.flagged_for_review
        ).length,
      } as Json;

      // Update transcription status
      await untypedSupabase
        .from("video_testimonial_responses")
        .update({
          transcription: transcription,
          transcription_status: "completed",
          ai_generation_status: "processing",
          word_timestamps: wordTimestampPayload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      // Generate review from transcription
      if (transcription && transcription.trim().length > 0) {
        try {
          const reviewResult = await generateReviewFromTranscript({
            transcription,
            customerName,
            professionalName: ownerName,
          });

          generatedReview = reviewResult.text;

          // Update with generated review
          await supabase
            .from("video_testimonial_responses")
            .update({
              ai_generated_text: generatedReview,
              ai_generation_status: "completed",
              ai_generation_completed_at: new Date().toISOString(),
              key_phrases: reviewResult.keyPoints,
              updated_at: new Date().toISOString(),
            })
            .eq("id", responseId);

          await supabase
            .from("video_testimonial_requests")
            .update({
              status: "completed",
              last_transition_at: new Date().toISOString(),
              last_transition_source: "ai_worker",
              last_transition_reason: "Transcription and review generation completed",
              updated_at: new Date().toISOString(),
            } as Record<string, unknown>)
            .eq("id", requestId)
            .eq("status", "submitted");

          await notifyVideoReadyForApproval({
            responseId,
            requestId,
            organizationId,
            ownerUserId,
            ownerName,
            customerName,
            durationSeconds,
          });
        } catch (genError) {
          console.error("Error generating review:", genError);
          await supabase
            .from("video_testimonial_responses")
            .update({
              ai_generation_status: "failed",
              processing_error_stage: "generation",
              processing_error_code: "AI_GENERATION_FAILED",
              retry_count: 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", responseId);
        }
      }

      return {
        success: true,
        responseId,
        transcription: transcription || undefined,
        generatedReview: generatedReview || undefined,
      };
    } catch (transcribeError) {
      console.error("Error transcribing video:", transcribeError);
      const transcriptionErrorMessage =
        transcribeError instanceof Error ? transcribeError.message : "Transcription failed";
      await supabase
        .from("video_testimonial_responses")
        .update({
          transcription_status: "failed",
          transcription_error: transcriptionErrorMessage,
          ai_generation_status: "failed",
          processing_error_stage: "transcription",
          processing_error_code: "TRANSCRIPTION_FAILED",
          retry_count: 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      await notifyVideoProcessingFailure({
        responseId,
        requestId,
        organizationId,
        ownerUserId,
        ownerName,
        customerName,
        errorMessage: transcriptionErrorMessage,
      });

      return {
        success: false,
        responseId,
        error: transcriptionErrorMessage,
      };
    }
  } catch (error) {
    console.error("Error processing AI job:", error);
    return {
      success: false,
      responseId,
      error: error instanceof Error ? error.message : "AI processing failed",
    };
  }
}

/**
 * Get pending AI processing jobs
 * Returns video testimonial responses that need transcription/review generation
 */
export async function getPendingAIProcessingJobs(
  limit: number = 10
): Promise<AIProcessingJob[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("video_testimonial_responses")
    .select(`
      id,
      request_id,
      organization_id,
      user_id,
      video_url,
      duration_seconds,
      video_testimonial_requests!inner (
        customer_name,
        source_metadata,
        users!user_id (full_name, email)
      )
    `)
    .eq("transcription_status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error("Error fetching pending AI jobs:", error);
    return [];
  }

  return data.map((row) => {
    const request = row.video_testimonial_requests as unknown as {
      customer_name: string;
      source_metadata: { customer_display_name?: string } | null;
      users: { full_name: string; email: string | null };
    };

    return {
      responseId: row.id,
      requestId: row.request_id,
      organizationId: row.organization_id,
      ownerUserId: row.user_id,
      ownerEmail: request.users.email,
      videoUrl: row.video_url,
      durationSeconds: row.duration_seconds,
      customerName: request.source_metadata?.customer_display_name || request.customer_name,
      ownerName: request.users.full_name,
    };
  });
}

/**
 * Process the video testimonial AI queue
 * Called by cron job to process pending transcription/review jobs
 */
export async function processVideoTestimonialAIQueue(
  batchSize: number = 10
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const jobs = await getPendingAIProcessingJobs(batchSize);
  const results = {
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const job of jobs) {
    try {
      const result = await processVideoTestimonialAIJob(job);

      if (result.success) {
        results.processed++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(`${job.responseId}: ${result.error}`);
        }
      }
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      results.errors.push(`${job.responseId}: ${errorMessage}`);
    }
  }

  return results;
}
