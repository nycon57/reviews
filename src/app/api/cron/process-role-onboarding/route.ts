import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processRoleOnboardingSequenceQueue } from "@/lib/email/role-onboarding-service";

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
 * POST /api/cron/process-role-onboarding
 *
 * This endpoint processes the role-based feature onboarding email sequence queue.
 * It should be called by a cron job at regular intervals (recommended: every hour).
 *
 * Features:
 * - Role-specific sequences (Loan Officer: 7 emails, Manager: 6 emails, Admin: 5 emails)
 * - Weekly pacing to avoid email fatigue
 * - Skips emails for features already used
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

    // Process the role onboarding sequence queue
    const result = await processRoleOnboardingSequenceQueue(batchSize);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      failed: result.failed,
      skipped: result.skipped,
      completed: result.completed,
      errors: result.errors.slice(0, 10), // Limit error details returned
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Role onboarding sequence queue cron job error:", error);

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
 * GET /api/cron/process-role-onboarding
 *
 * Health check endpoint for the role onboarding sequence queue processor.
 * Returns the current status of the endpoint.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "process-role-onboarding",
    description: "Role-based feature onboarding email sequence queue processor",
    schedule: "Every hour",
    features: [
      "Loan Officer: 7 emails (dashboard, surveys, sharing, responding, video, mobile, Google)",
      "Manager: 6 emails (team dashboard, approvals, leaderboards, reports, coaching, analytics)",
      "Admin: 5 emails (settings, users, integrations, billing, compliance)",
      "Weekly pacing to avoid fatigue",
      "Skips emails for features already used",
    ],
    timestamp: new Date().toISOString(),
  });
}
