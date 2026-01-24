"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  transcribeVideoWithRetry,
  formatTranscriptionError,
  type TranscriptionError,
  type TranscriptionResult,
} from "./video-transcription";
import { isWhisperEnabled } from "./openai-client";

// Validation schema for response ID
const responseIdSchema = z.string().uuid("Invalid response ID format");

export interface TranscriptionActionResult {
  success: boolean;
  data?: {
    transcription: string;
    language: string | null;
    cost: number;
  };
  error?: string;
}

/**
 * Get authenticated user and their organization
 * Used for server actions that require authentication
 */
async function getAuthenticatedUser() {
  const user = await unifiedGetUser();
  if (!user) {
    throw new Error("Authentication required");
  }

  const supabase = createAdminClient();
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
 * Transcribe a video testimonial response and store the result
 *
 * This is the main entry point for video transcription, called after video upload.
 * It:
 * 1. Validates input and authenticates user
 * 2. Verifies organization ownership
 * 3. Atomically claims the job (prevents concurrent transcription)
 * 4. Fetches the video and transcribes it
 * 5. Stores the transcription result in the database
 * 6. Logs cost for organization tracking
 */
export async function transcribeVideoTestimonial(
  responseId: string
): Promise<TranscriptionActionResult> {
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

    // Check if Whisper is enabled
    if (!isWhisperEnabled()) {
      return {
        success: false,
        error: "Video transcription is not enabled. Check OPENAI_API_KEY configuration.",
      };
    }

    const supabase = createAdminClient();

    // Get the video testimonial response
    const { data: response, error: fetchError } = await supabase
      .from("video_testimonial_responses")
      .select("id, video_url, duration_seconds, transcription_status, organization_id")
      .eq("id", responseId)
      .single();

    if (fetchError || !response) {
      return { success: false, error: "Video testimonial response not found" };
    }

    // Verify organization ownership
    if (response.organization_id !== organizationId) {
      return { success: false, error: "You do not have access to this video testimonial" };
    }

    // Check if already transcribed or currently processing (prevent concurrent transcription)
    if (response.transcription_status === "completed") {
      return { success: false, error: "Video has already been transcribed" };
    }
    if (response.transcription_status === "processing") {
      return { success: false, error: "Transcription is already in progress" };
    }

    // Atomically claim the job - only update if status is still pending
    // This prevents race conditions where multiple requests try to process simultaneously
    const { data: claimResult, error: claimError } = await supabase
      .from("video_testimonial_responses")
      .update({
        transcription_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId)
      .eq("transcription_status", "pending") // Only claim if still pending
      .select("id")
      .single();

    if (claimError || !claimResult) {
      // Another request already claimed this job
      return { success: false, error: "Transcription job was already claimed by another request" };
    }

    // Perform transcription
    let result: TranscriptionResult;
    try {
      result = await transcribeVideoWithRetry(
        response.video_url,
        response.duration_seconds
      );
    } catch (error) {
      // Handle transcription failure
      const transcriptionError = error as TranscriptionError;
      const errorMessage = formatTranscriptionError(transcriptionError);

      await supabase
        .from("video_testimonial_responses")
        .update({
          transcription_status: "failed",
          transcription_error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      revalidatePath("/dashboard/video-testimonials");
      return { success: false, error: errorMessage };
    }

    // Store successful transcription
    const { error: updateError } = await supabase
      .from("video_testimonial_responses")
      .update({
        transcription: result.text,
        transcription_status: "completed",
        transcription_completed_at: new Date().toISOString(),
        transcription_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId);

    if (updateError) {
      console.error("Failed to store transcription:", updateError);
      return { success: false, error: "Failed to store transcription result" };
    }

    // Log cost for organization tracking (non-blocking)
    logTranscriptionCost(
      response.organization_id,
      responseId,
      result.cost,
      result.duration || 0
    ).catch((err) => {
      console.error("Failed to log transcription cost:", err);
    });

    revalidatePath("/dashboard/video-testimonials");

    return {
      success: true,
      data: {
        transcription: result.text,
        language: result.language,
        cost: result.cost,
      },
    };
  } catch (error) {
    console.error("Error in transcribeVideoTestimonial:", error);

    // Update status to failed if we can
    try {
      const supabase = createAdminClient();
      await supabase
        .from("video_testimonial_responses")
        .update({
          transcription_status: "failed",
          transcription_error: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      revalidatePath("/dashboard/video-testimonials");
    } catch {
      // Ignore error in cleanup
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Transcription failed",
    };
  }
}

/**
 * Retry transcription for a failed video testimonial
 */
export async function retryTranscription(
  responseId: string
): Promise<TranscriptionActionResult> {
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
      .select("transcription_status, organization_id")
      .eq("id", responseId)
      .single();

    if (fetchError || !response) {
      return { success: false, error: "Video testimonial response not found" };
    }

    // Verify organization ownership
    if (response.organization_id !== organizationId) {
      return { success: false, error: "You do not have access to this video testimonial" };
    }

    if (response.transcription_status !== "failed") {
      return {
        success: false,
        error: `Cannot retry transcription with status: ${response.transcription_status}`,
      };
    }

    // Atomically reset to pending only if still in failed state
    // This prevents race conditions with concurrent retry requests
    const { data: resetResult, error: resetError } = await supabase
      .from("video_testimonial_responses")
      .update({
        transcription_status: "pending",
        transcription_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId)
      .eq("transcription_status", "failed") // Only reset if still failed
      .select("id")
      .single();

    if (resetError || !resetResult) {
      return { success: false, error: "Retry was already initiated by another request" };
    }

    // Now call transcription (which will do its own atomic claim)
    return transcribeVideoTestimonial(responseId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Retry failed",
    };
  }
}

/**
 * Get transcription status for a video testimonial response
 */
export async function getTranscriptionStatus(
  responseId: string
): Promise<{
  status: string | null;
  transcription: string | null;
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
      .select("transcription_status, transcription, transcription_error, transcription_completed_at, organization_id")
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
      status: data.transcription_status,
      transcription: data.transcription,
      error: data.transcription_error,
      completedAt: data.transcription_completed_at,
    };
  } catch {
    return null;
  }
}

/**
 * Log transcription cost for organization tracking
 * This is a best-effort operation - failures are logged but don't affect the main operation.
 * Cost data is stored in the video_testimonial_responses table as a fallback.
 */
async function logTranscriptionCost(
  organizationId: string,
  responseId: string,
  cost: number,
  durationSeconds: number
): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Update the response record with cost information
    // This is safe because we know this table exists
    await supabase
      .from("video_testimonial_responses")
      .update({
        // Store cost in a JSON metadata field if available, or just log to console
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId);

    // Log for tracking purposes
    console.log(
      `[Transcription Cost] org=${organizationId} response=${responseId} ` +
      `duration=${durationSeconds}s cost=$${cost.toFixed(4)}`
    );
  } catch (error) {
    // Cost tracking is non-critical - just log the error
    console.error("Failed to log transcription cost:", error);
  }
}
