import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { processShareRenderJobs } from "@/lib/share-studio/render-worker";

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batchSizeRaw = request.nextUrl.searchParams.get("batch");
  const batchSize = batchSizeRaw ? Number(batchSizeRaw) : 5;

  try {
    const summary = await processShareRenderJobs(
      Number.isFinite(batchSize) ? Math.max(1, Math.min(25, batchSize)) : 5
    );

    return NextResponse.json({
      ok: true,
      ...summary,
    });
  } catch (error) {
    console.error("[share-studio] cron render worker failed", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to process render jobs",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
