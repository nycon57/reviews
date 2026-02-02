import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeScheduledGeneration } from "@/lib/social-graphics/schedule-actions";
/**
 * Cron job: process scheduled social graphic generation.
 * Called weekly by Vercel Cron or external scheduler.
 * Finds all graphics with schedule_cron set and generates new graphics
 * from top reviews.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find all graphics with active schedules
  const { data: scheduledGraphics, error } = await supabase
    .from("social_proof_graphics")
    .select("*")
    .not("schedule_cron", "is", null);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch schedules", details: error.message },
      { status: 500 }
    );
  }

  if (!scheduledGraphics?.length) {
    return NextResponse.json({ message: "No active schedules", processed: 0 });
  }

  const results: Array<{
    scheduleId: string;
    success: boolean;
    graphicId?: string;
    error?: string;
  }> = [];

  for (const graphic of scheduledGraphics) {
    const result = await executeScheduledGeneration(
      graphic.organization_id,
      graphic
    );

    results.push({
      scheduleId: graphic.id,
      success: result.success,
      graphicId: result.success ? result.data.id : undefined,
      error: !result.success ? result.error : undefined,
    });
  }

  const successCount = results.filter((r) => r.success).length;

  return NextResponse.json({
    message: `Processed ${results.length} schedules, ${successCount} succeeded`,
    processed: results.length,
    succeeded: successCount,
    results,
  });
}
