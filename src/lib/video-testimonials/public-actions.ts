"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { cache } from "react";
import type { Json } from "@/types/database.types";
import {
  VALID_RELATIONSHIPS,
  type ActionResult,
  type PublicVideoTestimonialRequest,
  type SubmitCustomerInfoInput,
} from "./types";

// ============================================================================
// Security Validation Helpers
// ============================================================================

/**
 * Validate URL is safe for rendering (only http/https protocols)
 * Prevents javascript: and data: URL injection
 */
function validateSafeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null; // Invalid protocol
  } catch {
    return null; // Malformed URL
  }
}

/**
 * Validate hex color format to prevent CSS injection
 * Only accepts formats: #RGB, #RRGGBB, #RRGGBBAA
 */
function validateHexColor(color: string | null): string | null {
  if (!color) return null;
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  return hexPattern.test(color) ? color : null;
}

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

const consentSchema = z.object({
  videoRecordingConsent: z.literal(true, {
    errorMap: () => ({ message: "Video recording consent is required" }),
  }),
  usageRightsConsent: z.literal(true, {
    errorMap: () => ({ message: "Usage rights consent is required" }),
  }),
  aiTextGenerationConsent: z.literal(true, {
    errorMap: () => ({ message: "AI text generation consent is required" }),
  }),
  marketingConsent: z.boolean().optional(),
});

const submitCustomerInfoSchema = z.object({
  token: z.string().min(1, "Token is required"),
  customerInfo: customerInfoSchema,
  consents: consentSchema,
});

// ============================================================================
// Public Server Actions
// ============================================================================

/**
 * Get video testimonial request by token (no auth required)
 * Used for the public video testimonial capture page
 * Cached with React cache() to deduplicate requests within a single render pass
 */
export const getVideoTestimonialByToken = cache(async function getVideoTestimonialByTokenImpl(
  token: string
): Promise<ActionResult<PublicVideoTestimonialRequest>> {
  try {
    if (!token) {
      return { success: false, error: "Request token is required" };
    }

    const supabase = createAdminClient();

    // Fetch the video testimonial request with related data
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select(
        `
        id,
        token,
        status,
        max_duration_seconds,
        prompt_text,
        expires_at,
        submitted_at,
        opened_at,
        customer_name,
        customer_email,
        loan_officer_id,
        organization_id,
        loan_officers!inner (
          id,
          full_name,
          photo_url,
          title
        ),
        organizations!inner (
          id,
          name,
          logo_url,
          primary_color
        )
      `
      )
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Check if request has already been submitted
    if (request.submitted_at || request.status === "submitted") {
      return {
        success: false,
        error: "This video testimonial has already been submitted",
      };
    }

    // Check if request is cancelled
    if (request.status === "cancelled") {
      return { success: false, error: "This video testimonial request has been cancelled" };
    }

    // Check if request is expired
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This video testimonial request has expired" };
    }

    // Update opened_at if not already set
    if (!request.opened_at) {
      const { error: openedError } = await supabase
        .from("video_testimonial_requests")
        .update({
          opened_at: new Date().toISOString(),
          status: "opened",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (openedError) {
        console.error("Error updating opened_at timestamp:", openedError);
        // Non-blocking error - continue serving the request
      }
    }

    const loanOfficer = request.loan_officers as unknown as {
      id: string;
      full_name: string;
      photo_url: string | null;
      title: string | null;
    };

    const organization = request.organizations as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
      primary_color: string | null;
    };

    // Transform to PublicVideoTestimonialRequest format
    // Apply security validation to URLs and colors to prevent XSS/CSS injection
    const publicRequest: PublicVideoTestimonialRequest = {
      id: request.id,
      token: request.token,
      status: request.status,
      maxDurationSeconds: request.max_duration_seconds || 120,
      promptText: request.prompt_text,
      expiresAt: request.expires_at,
      submittedAt: request.submitted_at,
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      loanOfficer: {
        id: loanOfficer.id,
        fullName: loanOfficer.full_name,
        photoUrl: validateSafeUrl(loanOfficer.photo_url),
        title: loanOfficer.title,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        logoUrl: validateSafeUrl(organization.logo_url),
        primaryColor: validateHexColor(organization.primary_color),
      },
    };

    return { success: true, data: publicRequest };
  } catch (error) {
    console.error("Error fetching video testimonial by token:", error);
    return { success: false, error: "Failed to load video testimonial request" };
  }
});

/**
 * Submit customer info and consent for video testimonial
 * Updates the request status to 'recording' to indicate ready for video capture
 * Uses optimistic locking to prevent race conditions
 */
export async function submitCustomerInfoAndConsent(
  input: SubmitCustomerInfoInput
): Promise<ActionResult<{ requestId: string }>> {
  try {
    // Validate input
    const validated = submitCustomerInfoSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || "Validation failed",
      };
    }

    const { token, customerInfo, consents } = validated.data;
    const supabase = createAdminClient();

    // Fetch the request to validate it exists and is in a valid state
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select("id, status, expires_at, submitted_at")
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Check if already submitted
    if (request.submitted_at || request.status === "submitted") {
      return {
        success: false,
        error: "This video testimonial has already been submitted",
      };
    }

    // Check if cancelled
    if (request.status === "cancelled") {
      return { success: false, error: "This request has been cancelled" };
    }

    // Check if expired
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This request has expired" };
    }

    // Update request with customer info and consent, and change status to recording
    // Use optimistic locking: only update if status hasn't changed to submitted/cancelled
    const { data: updatedData, error: updateError } = await supabase
      .from("video_testimonial_requests")
      .update({
        status: "recording",
        source_metadata: {
          customer_display_name: customerInfo.displayName,
          customer_relationship: customerInfo.relationship,
          consent_video_recording: consents.videoRecordingConsent,
          consent_usage_rights: consents.usageRightsConsent,
          consent_ai_text_generation: consents.aiTextGenerationConsent,
          consent_marketing: consents.marketingConsent || false,
          consent_timestamp: new Date().toISOString(),
        } as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id)
      .not("status", "in", '("submitted","cancelled")') // Optimistic lock
      .select("id")
      .single();

    if (updateError || !updatedData) {
      // Race condition detected - status was changed by another request
      console.error("Error updating video testimonial request:", updateError);
      return {
        success: false,
        error: "Unable to save your information. The request may have been updated.",
      };
    }

    return {
      success: true,
      data: { requestId: request.id },
    };
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
  customer: {
    displayName: string;
    relationship: string | null;
  };
  loanOfficer: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    title: string | null;
  };
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
}

// ============================================================================
// Public Video Testimonial Display Actions
// ============================================================================

/**
 * Get a published video testimonial by ID for public display
 * Only returns videos that have been approved and published
 * Cached with React cache() to deduplicate requests within a single render pass
 */
export const getPublicVideoTestimonial = cache(async function getPublicVideoTestimonialImpl(
  videoId: string
): Promise<ActionResult<PublicVideoTestimonial>> {
  try {
    if (!videoId) {
      return { success: false, error: "Video ID is required" };
    }

    const supabase = createAdminClient();

    // Fetch the video testimonial response with related data
    // Only return published videos (approval_status = 'published')
    const { data: video, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select(
        `
        id,
        video_url,
        video_path,
        thumbnail_url,
        duration_seconds,
        transcription,
        ai_generated_text,
        key_phrases,
        sentiment_label,
        submitted_at,
        published_at,
        approval_status,
        loan_officer_id,
        organization_id,
        video_testimonial_requests!inner (
          customer_name,
          source_metadata
        ),
        loan_officers!inner (
          id,
          full_name,
          photo_url,
          title
        ),
        organizations!inner (
          id,
          name,
          logo_url,
          primary_color
        )
      `
      )
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video testimonial not found" };
    }

    const request = video.video_testimonial_requests as unknown as {
      customer_name: string;
      source_metadata: {
        customer_display_name?: string;
        customer_relationship?: string;
      } | null;
    };

    const loanOfficer = video.loan_officers as unknown as {
      id: string;
      full_name: string;
      photo_url: string | null;
      title: string | null;
    };

    const organization = video.organizations as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
      primary_color: string | null;
    };

    // Get signed URL for video playback (public access)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("video-testimonials")
      .createSignedUrl(video.video_path.replace(/^\/+/, ""), 86400); // 24 hour expiry for public page

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating signed URL for public video:", signedUrlError);
      return { success: false, error: "Failed to load video" };
    }

    // Build public response with security validation
    const publicVideo: PublicVideoTestimonial = {
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
      loanOfficer: {
        id: loanOfficer.id,
        fullName: loanOfficer.full_name,
        photoUrl: validateSafeUrl(loanOfficer.photo_url),
        title: loanOfficer.title,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        logoUrl: validateSafeUrl(organization.logo_url),
        primaryColor: validateHexColor(organization.primary_color),
      },
    };

    // Track view (non-blocking)
    trackVideoView(videoId).catch(console.error);

    return { success: true, data: publicVideo };
  } catch (error) {
    console.error("Error fetching public video testimonial:", error);
    return { success: false, error: "Failed to load video testimonial" };
  }
});

/**
 * Track a view of a public video testimonial
 * Non-blocking - logs view events for analytics
 * Note: In production, this would increment a view_count column or insert into an analytics table
 */
async function trackVideoView(videoId: string): Promise<void> {
  // Log view event for analytics (can be enhanced with proper analytics table)
  console.log(`Video view: ${videoId} at ${new Date().toISOString()}`);
}

/**
 * Get public video testimonial metadata for SEO (lighter query)
 * Returns only the data needed for generating metadata
 */
export const getPublicVideoMetadata = cache(async function getPublicVideoMetadataImpl(
  videoId: string
): Promise<ActionResult<{
  title: string;
  description: string;
  customerName: string;
  loanOfficerName: string;
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
      .select(
        `
        id,
        thumbnail_url,
        duration_seconds,
        ai_generated_text,
        published_at,
        approval_status,
        video_testimonial_requests!inner (
          customer_name,
          source_metadata
        ),
        loan_officers!inner (
          full_name
        ),
        organizations!inner (
          name
        )
      `
      )
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video testimonial not found" };
    }

    const request = video.video_testimonial_requests as unknown as {
      customer_name: string;
      source_metadata: {
        customer_display_name?: string;
      } | null;
    };

    const loanOfficer = video.loan_officers as unknown as { full_name: string };
    const organization = video.organizations as unknown as { name: string };

    const customerName = request.source_metadata?.customer_display_name || request.customer_name;
    const description = video.ai_generated_text
      ? video.ai_generated_text.substring(0, 155) + (video.ai_generated_text.length > 155 ? "..." : "")
      : `Watch ${customerName}'s video testimonial about their experience with ${loanOfficer.full_name} at ${organization.name}.`;

    return {
      success: true,
      data: {
        title: `${customerName}'s Experience with ${loanOfficer.full_name}`,
        description,
        customerName,
        loanOfficerName: loanOfficer.full_name,
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

/**
 * Track a share event for a video testimonial
 * Non-blocking - called from client when user shares
 */
export async function trackVideoShare(
  videoId: string,
  platform: SharePlatform
): Promise<ActionResult<void>> {
  try {
    if (!videoId) {
      return { success: false, error: "Video ID is required" };
    }

    const supabase = createAdminClient();

    // First verify video exists and is published
    const { data: video, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select("id, approval_status")
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video not found" };
    }

    // Log share event for analytics (can be enhanced with proper analytics table)
    console.log(`Video share: ${videoId} on ${platform} at ${new Date().toISOString()}`);

    return { success: true };
  } catch (error) {
    console.error("Error tracking video share:", error);
    return { success: false, error: "Failed to track share" };
  }
}

/**
 * Generate a share link for a video
 * Returns the full public URL for the video testimonial
 * Note: Short codes require a share_code column in the database
 */
export async function generateShareLink(
  videoId: string
): Promise<ActionResult<{ shareUrl: string }>> {
  try {
    if (!videoId) {
      return { success: false, error: "Video ID is required" };
    }

    const supabase = createAdminClient();

    // Verify video exists and is published
    const { data: video, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select("id, approval_status")
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video not found or not published" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";

    return {
      success: true,
      data: {
        shareUrl: `${baseUrl}/testimonials/video/${videoId}`,
      },
    };
  } catch (error) {
    console.error("Error generating share link:", error);
    return { success: false, error: "Failed to generate share link" };
  }
}
