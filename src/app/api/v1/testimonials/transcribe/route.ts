import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { withApiAuth, type ApiAuthContext } from "@/lib/api-keys/validate";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiInternalError,
  handleOptionsRequest,
} from "@/lib/api/response";
import { z } from "zod";
import {
  transcribeVideoTestimonial,
  retryTranscription,
  getTranscriptionStatus,
} from "@/lib/ai/transcription-actions";
import { isWordTimestampTranscriptionEnabled } from "@/lib/share-studio/transcription-service";

// Validation schema for POST request
const transcribeRequestSchema = z.object({
  response_id: z.string().uuid("Invalid response ID"),
  retry: z.boolean().optional().default(false),
});

// POST /api/v1/testimonials/transcribe - Trigger transcription for a video testimonial
async function handlePost(request: NextRequest, context: ApiAuthContext) {
  // Check if transcription providers are enabled
  if (!isWordTimestampTranscriptionEnabled()) {
    return apiError(
      "SERVICE_UNAVAILABLE",
      "Video transcription service is not available. Configure DEEPGRAM_API_KEY or GEMINI_API_KEY.",
      context.requestId,
      503
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(
      "VALIDATION_ERROR",
      "Invalid JSON body",
      context.requestId,
      400
    );
  }

  const validation = transcribeRequestSchema.safeParse(body);
  if (!validation.success) {
    return apiError(
      "VALIDATION_ERROR",
      validation.error.errors[0]?.message || "Validation failed",
      context.requestId,
      400,
      { errors: validation.error.errors }
    );
  }

  const { response_id, retry } = validation.data;

  // Verify the response exists and belongs to this organization
  const supabase = createAdminClient();
  const { data: response, error: fetchError } = await supabase
    .from("video_testimonial_responses")
    .select("id, organization_id, transcription_status, video_url")
    .eq("id", response_id)
    .single();

  if (fetchError || !response) {
    return apiNotFound("Video testimonial response", context.requestId);
  }

  // Verify organization ownership
  if (response.organization_id !== context.organizationId) {
    return apiError(
      "FORBIDDEN",
      "You do not have access to this video testimonial response",
      context.requestId,
      403
    );
  }

  // Trigger transcription (or retry if requested)
  const result = retry
    ? await retryTranscription(response_id)
    : await transcribeVideoTestimonial(response_id);

  if (!result.success) {
    return apiError(
      "INTERNAL_ERROR",
      result.error || "Transcription failed",
      context.requestId,
      500
    );
  }

  return apiSuccess(
    {
      response_id,
      transcription: result.data?.transcription,
      language: result.data?.language,
      cost: result.data?.cost,
      status: "completed",
    },
    context.requestId,
    200
  );
}

// GET /api/v1/testimonials/transcribe - Get transcription status
async function handleGet(request: NextRequest, context: ApiAuthContext) {
  const { searchParams } = new URL(request.url);
  const responseId = searchParams.get("response_id");

  if (!responseId) {
    return apiError(
      "VALIDATION_ERROR",
      "response_id query parameter is required",
      context.requestId,
      400
    );
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(responseId)) {
    return apiError(
      "VALIDATION_ERROR",
      "Invalid response_id format",
      context.requestId,
      400
    );
  }

  // Verify the response exists and belongs to this organization
  const supabase = createAdminClient();
  const { data: response, error: fetchError } = await supabase
    .from("video_testimonial_responses")
    .select("id, organization_id")
    .eq("id", responseId)
    .single();

  if (fetchError || !response) {
    return apiNotFound("Video testimonial response", context.requestId);
  }

  // Verify organization ownership
  if (response.organization_id !== context.organizationId) {
    return apiError(
      "FORBIDDEN",
      "You do not have access to this video testimonial response",
      context.requestId,
      403
    );
  }

  // Get transcription status
  const status = await getTranscriptionStatus(responseId);

  if (!status) {
    return apiInternalError(context.requestId, "Failed to fetch transcription status");
  }

  return apiSuccess(
    {
      response_id: responseId,
      status: status.status,
      transcription: status.transcription,
      error: status.error,
      completed_at: status.completedAt,
    },
    context.requestId,
    200
  );
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Export authenticated handlers
// Using 'admin' scope since there's no specific testimonials scope
export const POST = withApiAuth(handlePost, ["admin"]);
export const GET = withApiAuth(handleGet, ["admin"]);
