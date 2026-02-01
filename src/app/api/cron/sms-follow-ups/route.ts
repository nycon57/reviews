import { NextRequest, NextResponse } from "next/server";
import { processFollowUps } from "@/lib/sms/automation/follow-up-engine";

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
 * POST /api/cron/sms-follow-ups
 *
 * Processes auto follow-up SMS for review requests that were delivered
 * but not clicked within the configured delay (default 72 hours).
 *
 * Rules:
 * - Max 1 follow-up per borrower per review request
 * - Respects consent and quiet hours
 * - Uses the follow_up template category
 *
 * Recommended frequency: every 15 minutes.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processFollowUps();

    return NextResponse.json({
      success: true,
      ...result,
      errors: result.errors.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[SMS Follow-ups Cron] Unexpected error:", error);
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
    endpoint: "sms-follow-ups",
    timestamp: new Date().toISOString(),
  });
}
