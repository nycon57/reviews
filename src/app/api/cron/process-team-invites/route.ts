import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processTeamInviteQueue } from "@/lib/email/team-invite-service";

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
 * POST /api/cron/process-team-invites
 *
 * This endpoint processes the team member invite email sequence queue.
 * It should be called by a cron job at regular intervals (recommended: every hour).
 *
 * Features:
 * - Sends reminder emails for pending invitations
 * - Day 2: First reminder if not accepted
 * - Day 5: Final reminder with urgency
 * - Day 14: Expiration notice
 * - Tracks invite → acceptance → activation funnel
 *
 * Query Parameters:
 * - batch_size: Number of invitations to process (default: 50, max: 100)
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

    // Process the team invite queue
    const result = await processTeamInviteQueue(batchSize);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      expired: result.expired,
      errors: result.errors.slice(0, 10), // Limit error details returned
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Team invite queue cron job error:", error);

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
 * GET /api/cron/process-team-invites
 *
 * Health check endpoint for the team invite queue processor.
 * Returns the current status of the endpoint.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "process-team-invites",
    description: "Team member invite email sequence queue processor",
    schedule: "Every hour",
    features: [
      "Initial invitation email on invite creation",
      "Day 2 reminder for pending invitations",
      "Day 5 final reminder with urgency",
      "Day 14 expiration notice",
      "Role-specific content (loan officer vs manager)",
      "Welcome email on acceptance",
      "Invite funnel tracking",
    ],
    timestamp: new Date().toISOString(),
  });
}
