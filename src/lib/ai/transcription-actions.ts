"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  transcribeVideoWithRetry,
  formatTranscriptionError,
  type TranscriptionError,
  type TranscriptionResult,
} from "./video-transcription";
import { isWhisperEnabled } from "./openai-client";

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
 * Transcribe a video testimonial response and store the result
 *
 * This is the main entry point for video transcription, called after video upload.
 * It:
 * 1. Updates status to "processing"
 * 2. Fetches the video and transcribes it
 * 3. Stores the transcription result in the database
 * 4. Logs cost for organization tracking
 */
export async function transcribeVideoTestimonial(
  responseId: string
): Promise<TranscriptionActionResult> {
  const supabase = createAdminClient();

  try {
    // Check if Whisper is enabled
    if (!isWhisperEnabled()) {
      return {
        success: false,
        error: "Video transcription is not enabled. Check OPENAI_API_KEY configuration.",
      };
    }

    // Get the video testimonial response
    const { data: response, error: fetchError } = await supabase
      .from("video_testimonial_responses")
      .select("id, video_url, duration_seconds, transcription_status, organization_id")
      .eq("id", responseId)
      .single();

    if (fetchError || !response) {
      return { success: false, error: "Video testimonial response not found" };
    }

    // Check if already transcribed
    if (response.transcription_status === "completed") {
      return { success: false, error: "Video has already been transcribed" };
    }

    // Update status to processing
    await supabase
      .from("video_testimonial_responses")
      .update({
        transcription_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId);

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
      supabase,
      response.organization_id,
      responseId,
      result.cost,
      result.duration || 0
    ).catch((err) => {
      console.error("Failed to log transcription cost:", err);
    });

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

    // Update status to failed
    await supabase
      .from("video_testimonial_responses")
      .update({
        transcription_status: "failed",
        transcription_error: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", responseId);

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
  const supabase = createAdminClient();

  // Verify the response exists and is in a failed state
  const { data: response, error: fetchError } = await supabase
    .from("video_testimonial_responses")
    .select("transcription_status")
    .eq("id", responseId)
    .single();

  if (fetchError || !response) {
    return { success: false, error: "Video testimonial response not found" };
  }

  if (response.transcription_status !== "failed") {
    return {
      success: false,
      error: `Cannot retry transcription with status: ${response.transcription_status}`,
    };
  }

  // Reset and retry
  await supabase
    .from("video_testimonial_responses")
    .update({
      transcription_status: "pending",
      transcription_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", responseId);

  return transcribeVideoTestimonial(responseId);
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
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("video_testimonial_responses")
    .select("transcription_status, transcription, transcription_error, transcription_completed_at")
    .eq("id", responseId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    status: data.transcription_status,
    transcription: data.transcription,
    error: data.transcription_error,
    completedAt: data.transcription_completed_at,
  };
}

/**
 * Log transcription cost for organization tracking
 * Uses the ai_usage_logs table if it exists, otherwise silently skips
 */
async function logTranscriptionCost(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  responseId: string,
  cost: number,
  durationSeconds: number
): Promise<void> {
  try {
    // Try to insert into ai_usage_logs table
    // This table may not exist yet, so we handle errors gracefully
    await (supabase as unknown as {
      from: (table: string) => {
        insert: (data: Record<string, unknown>) => Promise<{ error: unknown }>;
      };
    })
      .from("ai_usage_logs")
      .insert({
        organization_id: organizationId,
        service: "openai_whisper",
        operation: "transcription",
        resource_id: responseId,
        resource_type: "video_testimonial_response",
        input_tokens: null, // N/A for audio
        output_tokens: null,
        duration_seconds: durationSeconds,
        cost_usd: cost,
        created_at: new Date().toISOString(),
      });
  } catch {
    // Table doesn't exist or other error - silently skip
    // Cost tracking is optional enhancement
  }
}
