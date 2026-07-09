import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  checkAndStartTrialEndingSequences,
  processTrialEndingSequenceQueue,
} from "@/lib/email/trial-ending-service";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

const cronParamsSchema = z.object({
  batch_size: z.coerce
    .number()
    .int()
    .min(1, "Batch size must be at least 1")
    .max(100, "Batch size cannot exceed 100")
    .default(50),
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
    return timingSafeEqual(Buffer.from(authHeader, "utf8"), Buffer.from(expectedHeader, "utf8"));
  } catch {
    return false;
  }
}

/**
 * POST /api/cron/process-trial-ending
 *
 * Runs the trial-ending email sequence:
 * 1. Enrolls organizations whose trial ends in ~7 days.
 * 2. Sends any sequence steps that are now due.
 *
 * Recommended schedule: hourly.
 */
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("process-trial-ending", async () => {
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

      const started = await checkAndStartTrialEndingSequences();
      const processed = await processTrialEndingSequenceQueue(parseResult.data.batch_size);

      return NextResponse.json({
        success: true,
        started: started.started,
        startErrors: started.errors.slice(0, 10),
        processed: processed.processed,
        failed: processed.failed,
        skipped: processed.skipped,
        exited: processed.exited,
        errors: processed.errors.slice(0, 10),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Trial-ending sequence cron job error:", error);
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

// Vercel Cron triggers this endpoint with a GET request (carrying the
// Authorization: Bearer <CRON_SECRET> header). Delegate to POST so the job
// actually runs its work on the scheduled trigger.
export async function GET(request: NextRequest) {
  return POST(request);
}
