import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processOrgOnboardingSequenceQueue } from "@/lib/email/org-onboarding-service";
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
 * POST /api/cron/process-org-onboarding
 *
 * This endpoint processes the org onboarding email sequence queue.
 * It should be called by a cron job at regular intervals (recommended: every 5 minutes).
 *
 * Features:
 * - 6-email onboarding sequence for organization admins
 * - Conditional branching (skip billing if subscribed, skip integration if connected)
 * - Tracks org setup completion percentage
 * - Exit on activation milestone (first survey sent)
 * - Respects user email preferences and unsubscribe status
 *
 * Schedule:
 * - Email 1 (Immediate): Org created confirmation + admin getting started guide
 * - Email 2 (Day 1): Branding setup - upload logo, set colors
 * - Email 3 (Day 2): Team setup - invite loan officers and managers
 * - Email 4 (Day 4): Integration guide - connect Google Business Profile
 * - Email 5 (Day 6): Billing setup reminder (conditional)
 * - Email 6 (Day 10): Advanced features - leaderboards, reports, automation
 *
 * Query Parameters:
 * - batch_size: Number of sequences to process (default: 50, max: 100)
 */
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("process-org-onboarding", async () => {
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

      // Process the org onboarding sequence queue
      const result = await processOrgOnboardingSequenceQueue(batchSize);

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
      console.error("Org onboarding sequence queue cron job error:", error);

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
