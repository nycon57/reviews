import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { syncSalesforceConnection } from "@/lib/salesforce/sync-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type SalesforceConnectionRow = {
  id: string;
  organization_id: string;
};

type ConnectionSyncResult = {
  connectionId: string;
  organizationId: string;
  status: "success" | "failed";
  recordsFetched?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsFailed?: number;
  error?: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createUntypedAdminClient();
    const { data: connections, error } = await supabase
      .from("salesforce_connections")
      .select("id, organization_id")
      .eq("is_active", true);

    if (error) {
      console.error("[Salesforce Sync Cron] Failed to fetch connections:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch Salesforce connections" },
        { status: 500 }
      );
    }

    const activeConnections = (connections as SalesforceConnectionRow[] | null) ?? [];
    const results: ConnectionSyncResult[] = [];

    for (const connection of activeConnections) {
      try {
        const result = await syncSalesforceConnection({
          connectionId: connection.id,
          organizationId: connection.organization_id,
          syncType: "incremental",
        });

        if (result.success && result.data) {
          results.push({
            connectionId: connection.id,
            organizationId: connection.organization_id,
            status: "success",
            recordsFetched: result.data.recordsFetched,
            recordsCreated: result.data.recordsCreated,
            recordsUpdated: result.data.recordsUpdated,
            recordsFailed: result.data.recordsFailed,
          });
        } else {
          results.push({
            connectionId: connection.id,
            organizationId: connection.organization_id,
            status: "failed",
            error: result.error || "Salesforce sync failed",
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Salesforce Sync Cron] Connection ${connection.id} failed:`, error);
        results.push({
          connectionId: connection.id,
          organizationId: connection.organization_id,
          status: "failed",
          error: message,
        });
      }
    }

    const successCount = results.filter((result) => result.status === "success").length;
    const failedCount = results.filter((result) => result.status === "failed").length;

    return NextResponse.json({
      success: failedCount === 0,
      message: `Synced ${successCount} Salesforce connection${
        successCount === 1 ? "" : "s"
      }, ${failedCount} failed`,
      totalConnections: activeConnections.length,
      successCount,
      failedCount,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Salesforce Sync Cron] Unexpected error:", error);
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
  return POST(request);
}
