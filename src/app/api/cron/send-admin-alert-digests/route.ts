import { withCronHeartbeat } from "@/lib/cron/heartbeat";
/**
 * Admin Alert Digest Cron Job (S089)
 *
 * Sends daily digest emails to managers/admins who prefer batched alerts.
 * Should be run daily, typically in the morning (e.g., 8 AM).
 */

import { NextRequest, NextResponse } from "next/server";
import { sendAdminAlertDigests } from "@/lib/email/services";

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

// POST /api/cron/send-admin-alert-digests
// This endpoint should be called by a cron job to send admin alert digests
// Recommended frequency: daily at 8 AM
export async function POST(request: NextRequest) {
  // Verify the request is authorized
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("send-admin-alert-digests", async () => {
    try {
      const result = await sendAdminAlertDigests();

      return NextResponse.json({
        success: result.success,
        sent: result.sent,
        failed: result.failed,
        errors: result.errors.slice(0, 10), // Limit error details returned
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Admin alert digest cron job error:", error);

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

// GET endpoint for health checks

// Vercel Cron triggers this endpoint with a GET request (carrying the
// Authorization: Bearer <CRON_SECRET> header). Delegate to POST so the job
// actually runs its work on the scheduled trigger.
export async function GET(request: NextRequest) {
  return POST(request);
}
