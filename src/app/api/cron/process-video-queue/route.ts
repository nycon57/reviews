import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processVideoTestimonialQueue } from "@/lib/video-testimonials/queue-service";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

// Zod schema for query parameters
const cronParamsSchema = z.object({
  batch_size: z.coerce
    .number()
    .int()
    .min(1, "Batch size must be at least 1")
    .max(100, "Batch size cannot exceed 100")
    .default(50),
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("process-video-queue", async () => {
    try {
      // Validate and parse query params with Zod (handles NaN, invalid values, defaults)
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

      // Process the video testimonial queue
      const result = await processVideoTestimonialQueue(batchSize);

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
  });
}

/**
 * GET /api/cron/process-video-queue
 *
 * Vercel crons send GET requests — alias to POST so the cron actually processes the queue.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
