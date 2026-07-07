import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { processPendingGoogleReplies } from "@/lib/google";

const cronParamsSchema = z.object({
  batch_size: z.coerce
    .number()
    .int()
    .min(1, "Batch size must be at least 1")
    .max(100, "Batch size cannot exceed 100")
    .default(25),
});

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    console.error("CRON_SECRET is not configured - denying access");
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  const expectedHeader = `Bearer ${cronSecret}`;
  if (authHeader.length !== expectedHeader.length) {
    return false;
  }

  try {
    return timingSafeEqual(
      Buffer.from(authHeader, "utf8"),
      Buffer.from(expectedHeader, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/cron/process-google-replies
 *
 * Drains the `google_review_replies` queue: review responses saved with status
 * 'pending' (by the response composer and the auto-reply processor) are posted
 * to Google here and marked 'sent' or 'failed'.
 *
 * Recommended schedule: every 10 minutes.
 */
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    const result = await processPendingGoogleReplies(parseResult.data.batch_size);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      posted: result.posted,
      failed: result.failed,
      errors: result.errors.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Google reply queue cron job error:", error);
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

// Vercel Cron triggers this endpoint with a GET request (carrying the
// Authorization: Bearer <CRON_SECRET> header). Delegate to POST so the job
// actually runs its work on the scheduled trigger.
export async function GET(request: NextRequest) {
  return POST(request);
}
