"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  generateReviewFromTranscript,
  isTranscriptionSuitableForReview,
  type GeneratedReviewResult,
  type ReviewGenerationError,
} from "./transcript-to-review";
import { isAIEnabled } from "./client";

// Validation schema for response ID
const responseIdSchema = z.string().uuid("Invalid response ID format");

export interface ReviewGenerationActionResult {
  success: boolean;
  data?: {
    generatedText: string;
    keyPoints: string[];
    confidence: number;
    wordCount: number;
  };
  error?: string;
}

/**
 * Get authenticated user and their organization
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Authentication required");
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    throw new Error("User not found");
  }

  if (!userData.organization_id) {
    throw new Error("User not associated with an organization");
  }

  return { user, organizationId: userData.organization_id, role: userData.role };
}

/**
 * Generate an AI review from a video testimonial response's transcription
 *
 * This is the main entry point for AI review generation, called after transcription completes.
 * It:
 * 1. Validates input and authenticates user
 * 2. Verifies organization ownership
 * 3. Checks transcription exists and is suitable
 * 4. Atomically claims the generation job (prevents concurrent generation)
 * 5. Generates polished review text using Gemini
 * 6. Stores the result in the database
 */
export async function generateReviewFromTestimonial(
  responseId: string
): Promise<ReviewGenerationActionResult> {
  // Validate input
  const validation = responseIdSchema.safeParse(responseId);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid response ID",
    };
  }

  try {
    // Authenticate user and get organization
    const { organizationId } = await getAuthenticatedUser();

    // Check if AI is enabled
    if (!isAIEnabled()) {
      return {
        success: false,
        error: "AI review generation is not enabled. Check GEMINI_API_KEY configuration.",
      };
    }

    const supabase = createAdminClient();

    // Get the video testimonial response with transcription
    // Customer info is on the request table, not response
    const { data: response, error: fetchError } = await supabase
      .from("video_testimonial_responses")
      .select(`
        id,
        transcription,
        transcription_status,
        ai_generation_status,
        organization_id,
        video_testimonial_requests!inner(
          customer_name,
          customer_email,
          loan_officers(first_name, last_name),
          organizations(name)
        )
      `)
      .eq("id", responseId)
      .single();

    if (fetchError || !response) {
      return { success: false, error: "Video testimonial response not found" };
    }

    // Verify organization ownership
    if (response.organization_id !== organizationId) {
      return { success: false, error: "You do not have access to this video testimonial" };
    }

    // Check transcription is complete
    if (response.transcription_status !== "completed" || !response.transcription) {
      return {
        success: false,
        error: "Transcription must be completed before generating review",
      };
    }

    // Check if already generated or currently processing
    if (response.ai_generation_status === "completed") {
      return { success: false, error: "AI review has already been generated" };
    }
    if (response.ai_generation_status === "processing") {
      return { success: false, error: "AI review generation is already in progress" };
    }

    // Check transcription quality
    const suitability = isTranscriptionSuitableForReview(response.transcription);
    if (!suitability.suitable) {
      return {
        success: false,
        error: suitability.reason || "Transcription not suitable for review generation",
      };
    }

    // Atomically claim the job - only update if status is still pending or null
    const { data: claimResult, error: claimError } = await supabase
      .from("video_testimonial_responses")
      .update({
        ai_generation_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId)
      .or("ai_generation_status.is.null,ai_generation_status.eq.pending,ai_generation_status.eq.failed")
      .select("id")
      .single();

    if (claimError || !claimResult) {
      return { success: false, error: "Generation job was already claimed by another request" };
    }

    // Extract context from related data
    const request = response.video_testimonial_requests as unknown as {
      customer_name: string | null;
      customer_email: string | null;
      loan_officers: { first_name: string; last_name: string } | null;
      organizations: { name: string } | null;
    };

    const loanOfficer = request?.loan_officers;
    const organization = request?.organizations;

    // Perform review generation
    let result: GeneratedReviewResult;
    try {
      result = await generateReviewFromTranscript({
        transcription: response.transcription,
        customerName: request?.customer_name || undefined,
        loanOfficerName: loanOfficer
          ? `${loanOfficer.first_name} ${loanOfficer.last_name}`
          : undefined,
        organizationName: organization?.name || undefined,
      });
    } catch (error) {
      // Handle generation failure
      const genError = error as ReviewGenerationError;
      const errorMessage =
        typeof genError === "object" && genError.message
          ? `[${genError.code || "ERROR"}] ${genError.message}`
          : String(error);

      await supabase
        .from("video_testimonial_responses")
        .update({
          ai_generation_status: "failed",
          ai_generation_error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      revalidatePath("/dashboard/video-testimonials");
      return { success: false, error: errorMessage };
    }

    // Store successful generation
    const { error: updateError } = await supabase
      .from("video_testimonial_responses")
      .update({
        ai_generated_text: result.text,
        ai_generation_status: "completed",
        ai_generation_completed_at: new Date().toISOString(),
        ai_generation_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId);

    if (updateError) {
      console.error("Failed to store generated review:", updateError);
      return { success: false, error: "Failed to store generated review" };
    }

    // Log generation for tracking (non-blocking)
    logReviewGeneration(
      response.organization_id,
      responseId,
      result.confidence,
      result.wordCount,
      result.generationAttempt
    ).catch((err) => {
      console.error("Failed to log review generation:", err);
    });

    revalidatePath("/dashboard/video-testimonials");

    return {
      success: true,
      data: {
        generatedText: result.text,
        keyPoints: result.keyPoints,
        confidence: result.confidence,
        wordCount: result.wordCount,
      },
    };
  } catch (error) {
    console.error("Error in generateReviewFromTestimonial:", error);

    // Update status to failed if we can
    try {
      const supabase = createAdminClient();
      await supabase
        .from("video_testimonial_responses")
        .update({
          ai_generation_status: "failed",
          ai_generation_error: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      revalidatePath("/dashboard/video-testimonials");
    } catch {
      // Ignore error in cleanup
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Review generation failed",
    };
  }
}

/**
 * Retry AI review generation for a failed video testimonial
 */
export async function retryReviewGeneration(
  responseId: string
): Promise<ReviewGenerationActionResult> {
  // Validate input
  const validation = responseIdSchema.safeParse(responseId);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Invalid response ID",
    };
  }

  try {
    // Authenticate user and get organization
    const { organizationId } = await getAuthenticatedUser();

    const supabase = createAdminClient();

    // Verify the response exists and is in a failed state
    const { data: response, error: fetchError } = await supabase
      .from("video_testimonial_responses")
      .select("ai_generation_status, organization_id")
      .eq("id", responseId)
      .single();

    if (fetchError || !response) {
      return { success: false, error: "Video testimonial response not found" };
    }

    // Verify organization ownership
    if (response.organization_id !== organizationId) {
      return { success: false, error: "You do not have access to this video testimonial" };
    }

    if (response.ai_generation_status !== "failed") {
      return {
        success: false,
        error: `Cannot retry generation with status: ${response.ai_generation_status || "none"}`,
      };
    }

    // Atomically reset to pending only if still in failed state
    const { data: resetResult, error: resetError } = await supabase
      .from("video_testimonial_responses")
      .update({
        ai_generation_status: "pending",
        ai_generation_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId)
      .eq("ai_generation_status", "failed")
      .select("id")
      .single();

    if (resetError || !resetResult) {
      return { success: false, error: "Retry was already initiated by another request" };
    }

    // Now call generation (which will do its own atomic claim)
    return generateReviewFromTestimonial(responseId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Retry failed",
    };
  }
}

/**
 * Get AI review generation status for a video testimonial response
 */
export async function getReviewGenerationStatus(responseId: string): Promise<{
  status: string | null;
  generatedText: string | null;
  error: string | null;
  completedAt: string | null;
} | null> {
  // Validate input
  const validation = responseIdSchema.safeParse(responseId);
  if (!validation.success) {
    return null;
  }

  try {
    // Authenticate user and get organization
    const { organizationId } = await getAuthenticatedUser();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("video_testimonial_responses")
      .select(
        "ai_generation_status, ai_generated_text, ai_generation_error, ai_generation_completed_at, organization_id"
      )
      .eq("id", responseId)
      .single();

    if (error || !data) {
      return null;
    }

    // Verify organization ownership
    if (data.organization_id !== organizationId) {
      return null;
    }

    return {
      status: data.ai_generation_status,
      generatedText: data.ai_generated_text,
      error: data.ai_generation_error,
      completedAt: data.ai_generation_completed_at,
    };
  } catch {
    return null;
  }
}

/**
 * Log review generation for organization tracking
 * This is a best-effort operation - failures are logged but don't affect the main operation.
 */
async function logReviewGeneration(
  organizationId: string,
  responseId: string,
  confidence: number,
  wordCount: number,
  attempts: number
): Promise<void> {
  try {
    // Log for tracking purposes
    console.log(
      `[Review Generation] org=${organizationId} response=${responseId} ` +
        `confidence=${confidence.toFixed(2)} words=${wordCount} attempts=${attempts}`
    );
  } catch (error) {
    // Logging is non-critical - just log the error
    console.error("Failed to log review generation:", error);
  }
}
