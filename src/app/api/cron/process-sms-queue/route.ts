import { NextRequest, NextResponse } from "next/server";
import { processScheduledQueue } from "@/lib/sms/automation/queue-processor";

export const dynamic = "force-dynamic";

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * POST /api/cron/process-sms-queue
 *
 * Processes the SMS scheduled sends queue. Should run every minute.
 * Picks up messages with status = 'queued' and scheduled_at <= now(),
 * sends them through the standard pipeline, and re-schedules any
 * that fall into quiet hours at execution time.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const batchSize = Math.min(
      Math.max(parseInt(url.searchParams.get("batch_size") || "100", 10), 1),
      100
    );

    const result = await processScheduledQueue(batchSize);

    return NextResponse.json({
      success: true,
      ...result,
      errors: result.errors.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SMS Queue Cron] Unexpected error:", error);
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "process-sms-queue",
    timestamp: new Date().toISOString(),
  });
}
