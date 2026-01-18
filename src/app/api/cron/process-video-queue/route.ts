import { NextRequest, NextResponse } from "next/server";
import { processVideoTestimonialQueue } from "@/lib/video-testimonials/queue-service";

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
 * POST /api/cron/process-video-queue
 *
 * This endpoint processes the video testimonial email distribution queue.
 * It should be called by a cron job at regular intervals (recommended: every 1-5 minutes).
 *
 * Features:
 * - Processes pending video testimonial invitation and reminder emails
 * - Rate limiting to avoid email provider throttling
 * - Automatic retry with exponential backoff for failed sends
 * - Respects organization pause/resume settings
 * - Cancels reminders for already-opened or submitted requests
 *
 * Query Parameters:
 * - batch_size: Number of items to process (default: 50, max: 100)
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
    // Get batch size from query params or use default
    const url = new URL(request.url);
    const batchSize = parseInt(url.searchParams.get("batch_size") || "50", 10);

    // Process the video testimonial queue
    const result = await processVideoTestimonialQueue(
      Math.min(Math.max(batchSize, 1), 100) // Clamp between 1 and 100
    );

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      skipped: result.skipped,
      errors: result.errors.slice(0, 10), // Limit error details returned
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Video testimonial queue cron job error:", error);

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
 * GET /api/cron/process-video-queue
 *
 * Health check endpoint for the video testimonial queue processor.
 * Returns the current status of the endpoint.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "process-video-queue",
    description: "Video testimonial email distribution queue processor",
    timestamp: new Date().toISOString(),
  });
}
