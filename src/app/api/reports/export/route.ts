import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { generateReport, exportAndRecordReport } from "@/lib/reporting";
import type { DateRangePreset, ExportFormat } from "@/lib/reporting/types";
import { verifyNotBot } from "@/lib/botid";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    // Verify request is not from a bot
    const botResponse = await verifyNotBot();
    if (botResponse) return botResponse;

    const user = await unifiedGetUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    // Get user's organization for report branding
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, organizations(name)")
      .eq("id", user.id)
      .single();

    const organizationName = (userData?.organizations as { name: string } | null)?.name || "RepWell";

    const body = await request.json();
    const { templateId, dateRange, filters, format } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "Template ID is required" },
        { status: 400 }
      );
    }

    if (!format || !["csv", "pdf", "json"].includes(format)) {
      return NextResponse.json(
        { success: false, error: "Valid format is required (csv, pdf, json)" },
        { status: 400 }
      );
    }

    // Parse date range
    const parsedDateRange = {
      preset: (dateRange?.preset || "last_30_days") as DateRangePreset,
      start: dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: dateRange?.end ? new Date(dateRange.end) : new Date(),
    };

    // Generate report
    const reportResult = await generateReport(
      templateId,
      parsedDateRange,
      filters || {}
    );

    if (!reportResult.success || !reportResult.data) {
      return NextResponse.json(
        { success: false, error: reportResult.error || "Failed to generate report" },
        { status: 500 }
      );
    }

    const report = reportResult.data;

    const exportResult = await exportAndRecordReport(
      templateId,
      parsedDateRange,
      format as ExportFormat,
      filters || {},
      {
        report,
        organizationName,
      }
    );

    if (!exportResult.success || !exportResult.data) {
      return NextResponse.json(
        { success: false, error: exportResult.error || "Failed to export report" },
        { status: 500 }
      );
    }

    const exportPayload = exportResult.data;
    const responseBody =
      exportPayload.encoding === "base64"
        ? Buffer.from(exportPayload.data, "base64")
        : exportPayload.data;

    return new NextResponse(responseBody, {
      headers: {
        "Content-Type": exportPayload.mimeType,
        "Content-Disposition": `attachment; filename="${exportPayload.filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
