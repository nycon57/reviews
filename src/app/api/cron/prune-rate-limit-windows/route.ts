import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("prune-rate-limit-windows", async () => {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.rpc("prune_rate_limit_windows");

      if (error) {
        console.error("Rate-limit window prune failed:", error);
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Rate-limit window prune cron error:", error);
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
