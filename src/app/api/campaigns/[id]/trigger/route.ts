import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEnterpriseManager } from "@/lib/access";
import { processManualTrigger } from "@/lib/campaigns/trigger-handler";

const ManualTriggerSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(500),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * POST /api/campaigns/:id/trigger
 *
 * Manually enroll specific users into a campaign.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await requireEnterpriseManager();
    const { id } = await params;

    // Validate campaign ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = ManualTriggerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await processManualTrigger(
      id,
      parsed.data.userIds,
      parsed.data.metadata
    );

    return NextResponse.json({
      success: true,
      created: result.created,
      skipped: result.skipped,
      errors: result.errors.slice(0, 10),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
