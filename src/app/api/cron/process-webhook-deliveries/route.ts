import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { processWebhookDeliveryQueue } from "@/lib/webhooks/outbound";

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const batchSize = parseInt(url.searchParams.get("batch_size") || "50", 10);
    const result = await processWebhookDeliveryQueue(
      Math.min(Math.max(batchSize, 1), 100)
    );

    return NextResponse.json({
      success: true,
      processed: result.processed,
      delivered: result.delivered,
      retried: result.retried,
      dead: result.dead,
      failed: result.failed,
      errors: result.errors.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Webhook delivery cron error:", error);
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

export async function GET(request: NextRequest) {
  return POST(request);
}
