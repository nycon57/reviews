import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { processWebhookDeliveryQueue } from "@/lib/webhooks/outbound";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("process-webhook-deliveries", async () => {
    try {
      const url = new URL(request.url);
      const batchSize = parseInt(url.searchParams.get("batch_size") || "50", 10);
      const result = await processWebhookDeliveryQueue(batchSize);

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
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
