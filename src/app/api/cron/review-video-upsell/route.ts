import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendReviewVideoUpsellEmails, UPSELL_BATCH_LIMIT } from "@/lib/video-testimonials/upsell";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

// Zod schema for query parameters
const cronParamsSchema = z.object({
  batch_size: z.coerce
    .number()
    .int()
    .min(1, "Batch size must be at least 1")
    .max(UPSELL_BATCH_LIMIT, `Batch size cannot exceed ${UPSELL_BATCH_LIMIT}`)
    .default(UPSELL_BATCH_LIMIT),
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
 * POST /api/cron/review-video-upsell
 *
 * Sweeps direct text reviews published 24 to 72 hours ago that met the
 * organization's celebration threshold and have no video request yet,
 * creates an upsell video testimonial request, and emails the customer
 * an invitation to record a video version. Runs daily.
 *
 * Query Parameters:
 * - batch_size: Number of reviews to process (default and max: 25)
 */
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("review-video-upsell", async () => {
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

      const result = await sendReviewVideoUpsellEmails(batchSize);

      return NextResponse.json({
        success: true,
        processed: result.processed,
        sent: result.sent,
        skipped: result.skipped,
        failed: result.failed,
        errors: result.errors.slice(0, 10), // Limit error details returned
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Review video upsell cron job error:", error);

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
 * GET /api/cron/review-video-upsell
 *
 * Vercel crons send GET requests, so alias to POST.
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
