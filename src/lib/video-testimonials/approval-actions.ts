"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./types";
import { generateReviewFromTranscript, type GeneratedReviewResult } from "@/lib/ai/transcript-to-review";

// =============================================================================
// Validation Schemas
// =============================================================================

const tokenSchema = z.string().min(1, "Token is required");

const approveTextSchema = z.object({
  token: z.string().min(1, "Token is required"),
  responseId: z.string().uuid("Invalid response ID"),
  approvedText: z.string().min(10, "Review text must be at least 10 characters").max(2000, "Review text cannot exceed 2000 characters"),
  rating: z.number().int().min(1).max(5),
  editCount: z.number().int().min(0).default(0),
  googleReviewRedirectClicked: z.boolean().default(false),
  finalConsent: z.boolean(),
});

// =============================================================================
// Types
// =============================================================================

export interface TextApprovalData {
  responseId: string;
  aiGeneratedText: string;
  customerName: string;
  loanOfficerName: string;
  organizationName: string;
  organizationLogoUrl: string | null;
  organizationPrimaryColor: string | null;
  googleBusinessProfileUrl: string | null;
  consentVersion: string | null;
}

// =============================================================================
// Security Validation Helpers
// =============================================================================

/**
 * Validate URL is safe for rendering
 */
function validateSafeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate hex color format
 */
function validateHexColor(color: string | null): string | null {
  if (!color) return null;
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  return hexPattern.test(color) ? color : null;
}

/**
 * Build Google Review URL from place_id
 */
function buildGoogleReviewUrl(placeId: string | null): string | null {
  if (!placeId) return null;
  // Validate place_id format (alphanumeric with dashes and underscores)
  if (!/^[A-Za-z0-9_-]+$/.test(placeId)) return null;
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

// =============================================================================
// Public Server Actions
// =============================================================================

/**
 * Get text approval data for the customer approval step
 * Called after video upload and AI text generation is complete
 */
export async function getTextApprovalData(
  token: string
): Promise<ActionResult<TextApprovalData>> {
  try {
    // Validate input
    const validation = tokenSchema.safeParse(token);
    if (!validation.success) {
      return { success: false, error: "Invalid request token" };
    }

    const supabase = createAdminClient();

    // Get the request and its response with AI-generated text
    const { data: request, error: requestError } = await supabase
      .from("video_testimonial_requests")
      .select(`
        id,
        token,
        status,
        customer_name,
        expires_at,
        users!user_id(
          id,
          full_name,
          google_place_id
        ),
        organizations!inner(
          id,
          name,
          logo_url,
          primary_color
        ),
        video_testimonial_responses(
          id,
          ai_generated_text,
          ai_generation_status,
          consent_version
        )
      `)
      .eq("token", token)
      .single();

    if (requestError || !request) {
      return { success: false, error: "Request not found" };
    }

    // Check request is in valid state
    if (request.status === "cancelled") {
      return { success: false, error: "This request has been cancelled" };
    }

    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This request has expired" };
    }

    // Get the response (should be single)
    const responses = request.video_testimonial_responses as unknown as Array<{
      id: string;
      ai_generated_text: string | null;
      ai_generation_status: string | null;
      consent_version: string | null;
    }>;

    const response = responses?.[0];

    if (!response) {
      return { success: false, error: "No video submission found for this request" };
    }

    // Check AI generation is complete
    if (response.ai_generation_status !== "completed" || !response.ai_generated_text) {
      return { success: false, error: "Review text is still being generated. Please wait." };
    }

    // Check if already approved using raw query (column added by migration 34)
    const { data: statusCheck } = await supabase
      .from("video_testimonial_responses")
      .select("id")
      .eq("id", response.id)
      .eq("text_approval_status" as never, "approved")
      .maybeSingle();

    if (statusCheck) {
      return { success: false, error: "Review has already been submitted" };
    }

    const loanOfficer = request.users as unknown as {
      id: string;
      full_name: string;
      google_place_id: string | null;
    };

    const organization = request.organizations as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
      primary_color: string | null;
    };

    return {
      success: true,
      data: {
        responseId: response.id,
        aiGeneratedText: response.ai_generated_text,
        customerName: request.customer_name,
        loanOfficerName: loanOfficer.full_name,
        organizationName: organization.name,
        organizationLogoUrl: validateSafeUrl(organization.logo_url),
        organizationPrimaryColor: validateHexColor(organization.primary_color),
        googleBusinessProfileUrl: buildGoogleReviewUrl(loanOfficer.google_place_id),
        consentVersion: response.consent_version || null,
      },
    };
  } catch (error) {
    console.error("Error getting text approval data:", error);
    return { success: false, error: "Failed to load review data" };
  }
}

/**
 * Submit approved review text with rating and consent
 */
export async function submitApprovedText(
  input: z.infer<typeof approveTextSchema>
): Promise<ActionResult<{ responseId: string }>> {
  try {
    // Validate input
    const validation = approveTextSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0]?.message || "Validation failed",
      };
    }

    const { token, responseId, approvedText, rating, editCount, googleReviewRedirectClicked, finalConsent } = validation.data;

    if (!finalConsent) {
      return { success: false, error: "Consent is required to submit your review" };
    }

    const supabase = createAdminClient();

    // Verify the request and response belong together
    // Note: Using request_id lookup instead of selecting non-existent columns
    const { data: response, error: responseError } = await supabase
      .from("video_testimonial_responses")
      .select(`
        id,
        request_id,
        consent_version,
        video_testimonial_requests!inner(
          token,
          status,
          expires_at
        )
      `)
      .eq("id", responseId)
      .single();

    if (responseError || !response) {
      return { success: false, error: "Response not found" };
    }

    const request = response.video_testimonial_requests as unknown as {
      token: string;
      status: string;
      expires_at: string | null;
    };

    // Verify token matches
    if (request.token !== token) {
      return { success: false, error: "Invalid request token" };
    }

    // Check request status
    if (request.status === "cancelled") {
      return { success: false, error: "This request has been cancelled" };
    }

    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This request has expired" };
    }

    if (!response.consent_version) {
      return {
        success: false,
        error: "Required legal consent version is missing. Please contact support.",
      };
    }

    // Update response with approved text using conditional update to prevent race conditions
    // Only update if text_approval_status is still 'pending' - this prevents double submission
    // Cast to unknown to allow new column names that aren't in types yet
    const updateData = {
      customer_approved_text: approvedText.trim(),
      customer_rating: rating,
      text_approval_status: "approved",
      text_approved_at: new Date().toISOString(),
      text_edit_count: editCount,
      google_review_redirect_shown: rating >= 4,
      google_review_redirect_clicked: googleReviewRedirectClicked,
      final_consent_given: true,
      final_consent_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    // Use conditional update with text_approval_status = 'pending' to prevent TOCTOU race condition
    // If another request already approved, this will update 0 rows
    const { data: updateResult, error: updateError } = await supabase
      .from("video_testimonial_responses")
      .update(updateData)
      .eq("id", responseId)
      .eq("text_approval_status" as never, "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating response:", updateError);
      return { success: false, error: "Failed to submit your review" };
    }

    // If no row was updated, it means the status was not 'pending' (already approved)
    if (!updateResult) {
      return { success: false, error: "Review has already been submitted" };
    }

    // Revalidate the approval page cache
    revalidatePath(`/video-testimonial/${token}/review`);

    return {
      success: true,
      data: { responseId },
    };
  } catch (error) {
    console.error("Error submitting approved text:", error);
    return { success: false, error: "Failed to submit your review" };
  }
}

/**
 * Regenerate AI review text for a video testimonial
 * Called when customer is unsatisfied with the generated text
 */
export async function regenerateReviewText(
  token: string,
  responseId: string
): Promise<ActionResult<{ generatedText: string }>> {
  try {
    // Validate inputs
    const tokenValidation = tokenSchema.safeParse(token);
    const responseIdValidation = z.string().uuid().safeParse(responseId);

    if (!tokenValidation.success || !responseIdValidation.success) {
      return { success: false, error: "Invalid request" };
    }

    const supabase = createAdminClient();

    // Get response with transcription and verify ownership
    const { data: response, error: responseError } = await supabase
      .from("video_testimonial_responses")
      .select(`
        id,
        transcription,
        video_testimonial_requests!inner(
          token,
          status,
          expires_at,
          customer_name,
          users!user_id(full_name),
          organizations(name)
        )
      `)
      .eq("id", responseId)
      .single();

    if (responseError || !response) {
      return { success: false, error: "Response not found" };
    }

    const request = response.video_testimonial_requests as unknown as {
      token: string;
      status: string;
      expires_at: string | null;
      customer_name: string;
      users: { full_name: string } | null;
      organizations: { name: string } | null;
    };

    // Verify token matches
    if (request.token !== token) {
      return { success: false, error: "Invalid request token" };
    }

    // Check request hasn't expired
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      return { success: false, error: "This request has expired" };
    }

    // Check if already approved using raw query (column added by migration 34)
    const { data: statusCheck } = await supabase
      .from("video_testimonial_responses")
      .select("id")
      .eq("id", responseId)
      .eq("text_approval_status" as never, "approved")
      .maybeSingle();

    if (statusCheck) {
      return { success: false, error: "Cannot regenerate after review is submitted" };
    }

    // Check transcription exists
    if (!response.transcription) {
      return { success: false, error: "No transcription available" };
    }

    // Regenerate the review
    let result: GeneratedReviewResult;
    try {
      result = await generateReviewFromTranscript({
        transcription: response.transcription,
        customerName: request.customer_name || undefined,
        professionalName: request.users?.full_name || undefined,
        organizationName: request.organizations?.name || undefined,
      });
    } catch (error) {
      console.error("Error regenerating review:", error);
      return { success: false, error: "Failed to regenerate review. Please try again." };
    }

    // Update the response with new generated text
    // Use conditional update to prevent race condition - only update if still pending
    const { data: updateResult, error: updateError } = await supabase
      .from("video_testimonial_responses")
      .update({
        ai_generated_text: result.text,
        ai_generation_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId)
      .eq("text_approval_status" as never, "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Error updating regenerated text:", updateError);
      return { success: false, error: "Failed to save regenerated review" };
    }

    // If no row was updated, the review was approved while regenerating
    if (!updateResult) {
      return { success: false, error: "Cannot regenerate - review has already been submitted" };
    }

    return {
      success: true,
      data: { generatedText: result.text },
    };
  } catch (error) {
    console.error("Error in regenerateReviewText:", error);
    return { success: false, error: "Failed to regenerate review" };
  }
}
