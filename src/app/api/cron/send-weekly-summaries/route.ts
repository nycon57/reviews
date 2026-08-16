import { withCronHeartbeat } from "@/lib/cron/heartbeat";
/**
 * Weekly Summary Email Cron Job (S082)
 *
 * This endpoint sends weekly performance summary emails to users and managers.
 * Recommended cron schedule: Every Monday at 8:00 AM UTC (adjust for local timezone)
 *
 * Example Vercel cron: "0 8 * * 1" (every Monday at 8:00 AM)
 */

import { NextRequest, NextResponse } from "next/server";
import { sendAllWeeklySummaries } from "@/lib/email/services";

/**
 * Verify the request is from a valid cron job source
 */
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
 * POST /api/cron/send-weekly-summaries
 *
 * Sends weekly summary emails to all eligible users and managers.
 * Call this endpoint weekly (recommended: Monday 8:00 AM local time).
 */
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("send-weekly-summaries", async () => {
    try {
      console.log("[Weekly Summary Cron] Starting weekly summary email processing...");

      const results = await sendAllWeeklySummaries();

      const totalSent = results.user.sent + results.manager.sent;
      const totalFailed = results.user.failed + results.manager.failed;
      const totalSkipped = results.user.skipped + results.manager.skipped;
      const allErrors = [...results.user.errors, ...results.manager.errors];

      console.log(
        `[Weekly Summary Cron] Completed - Sent: ${totalSent}, Failed: ${totalFailed}, Skipped: ${totalSkipped}`
      );

      return NextResponse.json({
        success: results.user.success && results.manager.success,
        summary: {
          totalSent,
          totalFailed,
          totalSkipped,
        },
        details: {
          users: {
            sent: results.user.sent,
            failed: results.user.failed,
            skipped: results.user.skipped,
          },
          managers: {
            sent: results.manager.sent,
            failed: results.manager.failed,
            skipped: results.manager.skipped,
          },
        },
        errors: allErrors.slice(0, 20), // Limit error details
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Weekly Summary Cron] Error:", error);

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
