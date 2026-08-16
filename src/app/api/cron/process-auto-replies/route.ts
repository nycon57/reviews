import { NextRequest, NextResponse } from "next/server";
import { processAutoReplyBatch } from "@/lib/reviews/auto-reply-processor";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

// POST /api/cron/process-auto-replies
// Schedule: every 15 minutes.
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("process-auto-replies", async () => {
    try {
      const url = new URL(request.url);
      const parsed = parseInt(url.searchParams.get("batch_size") || "20", 10);
      const batchSize = Number.isNaN(parsed) ? 20 : Math.min(Math.max(parsed, 1), 50);

      const result = await processAutoReplyBatch(batchSize);

      return NextResponse.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Auto-reply cron error:", error);

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
