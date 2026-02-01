import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { processFollowUps } from "@/lib/sms/automation/follow-up-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/sms-follow-ups
 *
 * Sends auto follow-up SMS for unclicked review requests.
 * Recommended: every 15 minutes.
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
