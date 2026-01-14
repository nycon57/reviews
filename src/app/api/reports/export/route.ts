import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReport, exportReportToCSV, generateReportHTML, exportAndRecordReport } from "@/lib/reporting";
import type { DateRangePreset, ExportFormat } from "@/lib/reporting/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's organization for report branding
    const { data: userData } = await supabase
      .from("users")
      .select("organization_id, organizations(name)")
      .eq("id", user.id)
      .single();

    const organizationName = (userData?.organizations as { name: string } | null)?.name || "ReviewHub";

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
    let exportContent: string;
    let contentType: string;
    let fileExtension: string;

    // Generate export content based on format
    if (format === "csv") {
      const csvResult = await exportReportToCSV(report, "summary");
      if (!csvResult.success || !csvResult.data) {
        return NextResponse.json(
          { success: false, error: csvResult.error || "Failed to export CSV" },
          { status: 500 }
        );
      }
      exportContent = csvResult.data;
      contentType = "text/csv";
      fileExtension = "csv";
    } else if (format === "pdf") {
      const htmlResult = await generateReportHTML(report, organizationName);
      if (!htmlResult.success || !htmlResult.data) {
        return NextResponse.json(
          { success: false, error: htmlResult.error || "Failed to generate HTML" },
          { status: 500 }
        );
      }
      exportContent = htmlResult.data;
      contentType = "text/html";
      fileExtension = "html";
    } else {
      exportContent = JSON.stringify(report, null, 2);
      contentType = "application/json";
      fileExtension = "json";
    }

    // Record the export
    await exportAndRecordReport(
      templateId,
      parsedDateRange,
      format as ExportFormat,
      filters || {}
    );

    // Generate filename
    const filename = `report-${report.templateName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.${fileExtension}`;

    return new NextResponse(exportContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
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
