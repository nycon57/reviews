import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processVideoTestimonialAIQueue } from "@/lib/video-testimonials/public-actions";

// Zod schema for query parameters
const cronParamsSchema = z.object({
  batch_size: z.coerce
    .number()
    .int()
    .min(1, "Batch size must be at least 1")
    .max(20, "Batch size cannot exceed 20")
    .default(10),
});

// Verify the request is from a valid cron job source
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is configured, only allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * POST /api/cron/process-video-ai
 *
 * This endpoint processes the video testimonial AI queue (transcription + review generation).
 * It should be called by a cron job at regular intervals (recommended: every 1-2 minutes).
 *
 * Features:
 * - Processes pending video testimonial transcriptions
 * - Generates AI-powered reviews from transcriptions
 * - Handles failures gracefully with status updates
 *
 * Query Parameters:
 * - batch_size: Number of items to process (default: 10, max: 20)
 */
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Validate and parse query params with Zod
    const url = new URL(request.url);
    const parseResult = cronParamsSchema.safeParse({
      batch_size: url.searchParams.get("batch_size") ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || "Invalid parameters",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { batch_size: batchSize } = parseResult.data;

    // Process the video testimonial AI queue
    const result = await processVideoTestimonialAIQueue(batchSize);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      errors: result.errors.slice(0, 10), // Limit error details returned
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Video testimonial AI queue cron job error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-video-ai
 *
 * Vercel crons send GET requests — alias to POST so the cron actually processes the queue.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
