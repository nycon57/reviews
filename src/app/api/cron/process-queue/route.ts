import { NextRequest, NextResponse } from "next/server";
import { processDistributionQueue } from "@/lib/distribution";

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

// POST /api/cron/process-queue
// This endpoint should be called by a cron job to process the distribution queue
// Recommended frequency: every 1-5 minutes
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

    // Process the queue
    const result = await processDistributionQueue(
      Math.min(Math.max(batchSize, 1), 100) // Clamp between 1 and 100
    );

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      errors: result.errors.slice(0, 10), // Limit error details returned
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);

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

// GET endpoint for health checks

// Vercel Cron triggers this endpoint with a GET request (carrying the
// Authorization: Bearer <CRON_SECRET> header). Delegate to POST so the job
// actually runs its work on the scheduled trigger.
export async function GET(request: NextRequest) {
  return POST(request);
}
