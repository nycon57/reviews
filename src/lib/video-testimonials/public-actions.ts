"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { cache } from "react";
import type { Json } from "@/types/database.types";
import {
  VALID_RELATIONSHIPS,
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
import { transcribeVideoWithRetry } from "@/lib/ai/video-transcription";
import { generateReviewFromTranscript } from "@/lib/ai/transcript-to-review";

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
// Type Helpers
// ============================================================================

type LoanOfficerData = { id: string; full_name: string; photo_url: string | null; title: string | null };
type OrganizationData = { id: string; name: string; logo_url: string | null; primary_color: string | null };
type RequestSourceMetadata = { customer_display_name?: string; customer_relationship?: string } | null;

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
        loan_officer_id, organization_id,
        loan_officers!inner (id, full_name, photo_url, title),
        organizations!inner (id, name, logo_url, primary_color)
      `)
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Validate request status
    if (request.submitted_at || request.status === "submitted") {
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
      await supabase
        .from("video_testimonial_requests")
        .update({ opened_at: new Date().toISOString(), status: "opened", updated_at: new Date().toISOString() })
        .eq("id", request.id);
    }

    const loanOfficer = request.loan_officers as unknown as LoanOfficerData;
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

    const { token, customerInfo, consents } = validated.data;
    const supabase = createAdminClient();

    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select("id, status, expires_at, submitted_at")
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    // Validate request status
    if (request.submitted_at || request.status === "submitted") {
      return { success: false, error: "This video testimonial has already been submitted" };
    }
    if (request.status === "cancelled") {
      return { success: false, error: "This request has been cancelled" };
    }
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This request has expired" };
    }

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
      .not("status", "in", '("submitted","cancelled")')
      .select("id")
      .single();

    if (updateError || !updatedData) {
      console.error("Error updating video testimonial request:", updateError);
      return { success: false, error: "Unable to save your information. The request may have been updated." };
    }

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
  loanOfficer: { id: string; fullName: string; photoUrl: string | null; title: string | null };
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
        approval_status, loan_officer_id, organization_id,
        video_testimonial_requests!inner (customer_name, source_metadata),
        loan_officers!inner (id, full_name, photo_url, title),
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
    const loanOfficer = video.loan_officers as unknown as LoanOfficerData;
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
      .select(`
        id, thumbnail_url, duration_seconds, ai_generated_text, published_at, approval_status,
        video_testimonial_requests!inner (customer_name, source_metadata),
        loan_officers!inner (full_name),
        organizations!inner (name)
      `)
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video testimonial not found" };
    }

    const request = video.video_testimonial_requests as unknown as { customer_name: string; source_metadata: { customer_display_name?: string } | null };
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
      .select("id, approval_status")
      .eq("id", videoId)
      .eq("approval_status", "published")
      .single();

    if (videoError || !video) {
      return { success: false, error: "Video not found or not published" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.repwell.com";
    return { success: true, data: { shareUrl: `${baseUrl}/testimonials/video/${videoId}` } };
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
  token: string
): Promise<ActionResult<CreateUploadUrlsResult>> {
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

    // Generate unique storage paths
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const basePath = `${request.organization_id}/${request.id}/${timestamp}-${randomSuffix}`;
    const videoStoragePath = `${basePath}.webm`;
    const thumbnailStoragePath = `${basePath}-thumb.jpg`;

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
      },
    };
  } catch (error) {
    console.error("Error creating upload URLs:", error);
    return { success: false, error: "Failed to create upload URLs" };
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
        id, status, organization_id, loan_officer_id, customer_name,
        expires_at, submitted_at, source_metadata,
        loan_officers!inner (full_name)
      `)
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Video testimonial request not found" };
    }

    if (request.status !== "recording") {
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

    // Get public URL for thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (thumbnailPath) {
      const { data: thumbUrlData } = supabase.storage
        .from("video-testimonials")
        .getPublicUrl(thumbnailPath);
      thumbnailUrl = thumbUrlData?.publicUrl || null;
    }

    // Create response record with queued status for AI processing
    const now = new Date().toISOString();
    const { data: response, error: responseError } = await supabase
      .from("video_testimonial_responses")
      .insert({
        request_id: request.id,
        organization_id: request.organization_id,
        loan_officer_id: request.loan_officer_id,
        video_url: videoUrl,
        video_path: storagePath,
        thumbnail_url: thumbnailUrl,
        duration_seconds: durationSeconds,
        mime_type: "video/webm",
        transcription_status: "pending",
        ai_generation_status: "queued",
        approval_status: "pending",
        submitted_at: now,
        created_at: now,
      })
      .select("id")
      .single();

    if (responseError || !response) {
      console.error("Error creating response record:", responseError);
      return { success: false, error: "Failed to create response record" };
    }

    // Update request status to submitted with optimistic locking
    // Only update if status is still "recording" and not already submitted
    const { data: updatedRequest, error: updateError } = await supabase
      .from("video_testimonial_requests")
      .update({ status: "submitted", submitted_at: now, updated_at: now })
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
  videoUrl: string;
  durationSeconds: number | null;
  customerName: string;
  loanOfficerName: string;
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
  const { responseId, videoUrl, durationSeconds, customerName, loanOfficerName } = job;

  try {
    // Mark as processing
    await supabase
      .from("video_testimonial_responses")
      .update({
        transcription_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId);

    let transcription: string | null = null;
    let generatedReview: string | null = null;

    // Run AI transcription
    try {
      const transcriptionResult = await transcribeVideoWithRetry(
        videoUrl,
        durationSeconds,
        { prompt: `Customer testimonial for ${loanOfficerName}` }
      );

      transcription = transcriptionResult.text;

      // Update transcription status
      await supabase
        .from("video_testimonial_responses")
        .update({
          transcription: transcription,
          transcription_status: "completed",
          ai_generation_status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      // Generate review from transcription
      if (transcription && transcription.trim().length > 0) {
        try {
          const reviewResult = await generateReviewFromTranscript({
            transcription,
            customerName,
            loanOfficerName,
          });

          generatedReview = reviewResult.text;

          // Update with generated review
          await supabase
            .from("video_testimonial_responses")
            .update({
              ai_generated_text: generatedReview,
              ai_generation_status: "completed",
              key_phrases: reviewResult.keyPoints,
              updated_at: new Date().toISOString(),
            })
            .eq("id", responseId);
        } catch (genError) {
          console.error("Error generating review:", genError);
          await supabase
            .from("video_testimonial_responses")
            .update({
              ai_generation_status: "failed",
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
      await supabase
        .from("video_testimonial_responses")
        .update({
          transcription_status: "failed",
          ai_generation_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      return {
        success: false,
        responseId,
        error: transcribeError instanceof Error ? transcribeError.message : "Transcription failed",
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
      video_url,
      duration_seconds,
      video_testimonial_requests!inner (
        customer_name,
        source_metadata,
        loan_officers!inner (full_name)
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
      loan_officers: { full_name: string };
    };

    return {
      responseId: row.id,
      videoUrl: row.video_url,
      durationSeconds: row.duration_seconds,
      customerName: request.source_metadata?.customer_display_name || request.customer_name,
      loanOfficerName: request.loan_officers.full_name,
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
