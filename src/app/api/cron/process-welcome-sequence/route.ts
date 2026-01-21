import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processWelcomeSequenceQueue } from "@/lib/email/welcome-sequence-service";

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
 * POST /api/cron/process-welcome-sequence
 *
 * This endpoint processes the welcome email sequence queue.
 * It should be called by a cron job at regular intervals (recommended: every 5 minutes).
 *
 * Features:
 * - Processes pending welcome sequence emails
 * - Handles conditional branching (skips emails for completed actions)
 * - A/B tests subject lines for Email 1 and Email 3
 * - Exits sequence early when activation milestone is reached
 * - Respects user email preferences and unsubscribe status
 *
 * Query Parameters:
 * - batch_size: Number of sequences to process (default: 50, max: 100)
 */
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Process the welcome sequence queue
    const result = await processWelcomeSequenceQueue(batchSize);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      skipped: result.skipped,
      exited: result.exited,
      errors: result.errors.slice(0, 10), // Limit error details returned
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Welcome sequence queue cron job error:", error);

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
 * GET /api/cron/process-welcome-sequence
 *
 * Health check endpoint for the welcome sequence queue processor.
 * Returns the current status of the endpoint.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "process-welcome-sequence",
    description: "Welcome email sequence queue processor",
    schedule: "Every 5 minutes",
    features: [
      "5-email welcome sequence",
      "A/B testing for subject lines",
      "Conditional branching",
      "Exit on activation milestone",
    ],
    timestamp: new Date().toISOString(),
  });
}
