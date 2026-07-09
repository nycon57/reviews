import { NextRequest, NextResponse } from "next/server";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createReportShareForOrg,
  exportAndRecordReportForOrg,
  generateReportForOrg,
} from "@/lib/reporting";
import { getScheduledReportEmail } from "@/lib/email/templates";
import { getResendClient, getFromAddress, emailConfig } from "@/lib/email/client";
import type { ScheduleFrequency, ReportFilters } from "@/lib/reporting/types";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

// Verify cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 300;

interface ScheduledReportRow {
  id: string;
  organization_id: string;
  template_id: string;
  name: string;
  recipients: string[];
  schedule: ScheduleFrequency;
  schedule_day_of_week: number | null;
  schedule_day_of_month: number | null;
  schedule_time: string;
  filters: ReportFilters;
  is_active: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  created_by: string | null;
  organizations: {
    name: string;
  };
}

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("reports", async () => {
    try {
      const supabase = createAdminClient();
      const now = new Date();

      // Get all scheduled reports that are due
      const { data: scheduledReports, error: fetchError } = await supabase
        .from("scheduled_reports")
        .select(
          `
        *,
        organizations!inner (
          name
        )
      `
        )
        .eq("is_active", true)
        .lte("next_run_at", now.toISOString());

      if (fetchError) {
        console.error("Error fetching scheduled reports:", fetchError);
        return NextResponse.json(
          { success: false, error: "Failed to fetch scheduled reports" },
          { status: 500 }
        );
      }

      const reports = scheduledReports as unknown as ScheduledReportRow[];
      const results: Array<{ reportId: string; success: boolean; error?: string }> = [];

      for (const scheduledReport of reports) {
        try {
          // Calculate date range based on schedule
          const { dateRange, periodLabel } = getDateRangeForSchedule(scheduledReport.schedule);

          const reportDateRange = {
            preset: "custom",
            start: dateRange.start,
            end: dateRange.end,
          } as const;

          // Generate the report for the schedule's organization.
          const reportResult = await generateReportForOrg({
            organizationId: scheduledReport.organization_id,
            templateId: scheduledReport.template_id,
            dateRange: reportDateRange,
            filters: scheduledReport.filters || {},
          });

          if (!reportResult.success || !reportResult.data) {
            console.error("Failed to generate scheduled report", {
              scheduleId: scheduledReport.id,
              organizationId: scheduledReport.organization_id,
              error: reportResult.error || "Failed to generate report",
            });
            results.push({
              reportId: scheduledReport.id,
              success: false,
              error: reportResult.error || "Failed to generate report",
            });
            continue;
          }

          const report = reportResult.data;

          // Create a shareable link for the report
          const shareResult = await createReportShareForOrg({
            organizationId: scheduledReport.organization_id,
            templateId: scheduledReport.template_id,
            title: `${scheduledReport.name} - ${periodLabel}`,
            dateRange: reportDateRange,
            filters: scheduledReport.filters || {},
            expiresInDays: 30,
            sharedBy: scheduledReport.created_by,
          });

          if (!shareResult.success || !shareResult.data) {
            console.error("Failed to create scheduled report share", {
              scheduleId: scheduledReport.id,
              organizationId: scheduledReport.organization_id,
              error: shareResult.error || "Failed to create share link",
            });
            results.push({
              reportId: scheduledReport.id,
              success: false,
              error: shareResult.error || "Failed to create share link",
            });
            continue;
          }

          const reportUrl = `${emailConfig.baseUrl}/reports/shared/${shareResult.data.shareToken}`;

          const exportResult = await exportAndRecordReportForOrg({
            organizationId: scheduledReport.organization_id,
            templateId: scheduledReport.template_id,
            dateRange: reportDateRange,
            format: "pdf",
            filters: scheduledReport.filters || {},
            report,
            organizationName: scheduledReport.organizations.name,
            createdBy: scheduledReport.created_by ?? null,
          });

          if (!exportResult.success || !exportResult.data) {
            console.error("Failed to export scheduled report PDF", {
              scheduleId: scheduledReport.id,
              organizationId: scheduledReport.organization_id,
              error: exportResult.error || "Failed to export report PDF",
            });
            results.push({
              reportId: scheduledReport.id,
              success: false,
              error: exportResult.error || "Failed to export report PDF",
            });
            continue;
          }

          const pdfBuffer = Buffer.from(exportResult.data.data, "base64");
          const pdfFilename = exportResult.data.filename;

          // Send email to all recipients
          const resend = getResendClient();
          const fromAddress = getFromAddress(scheduledReport.organizations.name);
          const emailResults = await Promise.allSettled(
            scheduledReport.recipients.map(async (recipientEmail) => {
              const { subject, html } = getScheduledReportEmail({
                toEmail: recipientEmail,
                recipientName: recipientEmail.split("@")[0], // Fallback name
                reportName: scheduledReport.name,
                reportPeriod: periodLabel,
                summary: {
                  totalReviews: report.executiveSummary.totalReviews,
                  averageRating: report.executiveSummary.averageRating,
                  npsScore: report.executiveSummary.npsScore,
                  csatScore: report.executiveSummary.csatScore,
                },
                reportUrl,
                organizationName: scheduledReport.organizations.name,
              });

              await resend.emails.send({
                from: fromAddress,
                to: recipientEmail,
                subject,
                html,
                attachments: [
                  {
                    filename: pdfFilename,
                    content: pdfBuffer,
                  },
                ],
                tags: [
                  { name: "template", value: "scheduled_report" },
                  { name: "scheduled_report_id", value: scheduledReport.id },
                ],
              });
            })
          );

          const failedRecipients = emailResults.flatMap((result, index) =>
            result.status === "rejected"
              ? [
                  {
                    recipientEmail: scheduledReport.recipients[index],
                    error: result.reason,
                  },
                ]
              : []
          );

          if (failedRecipients.length > 0) {
            console.error("Failed to send scheduled report emails", {
              scheduleId: scheduledReport.id,
              organizationId: scheduledReport.organization_id,
              failureCount: failedRecipients.length,
              recipientCount: scheduledReport.recipients.length,
              failedRecipients,
            });
          }

          if (failedRecipients.length === scheduledReport.recipients.length) {
            results.push({
              reportId: scheduledReport.id,
              success: false,
              error: "Failed to send report email to all recipients",
            });
            continue;
          }

          // Calculate next run time
          const nextRunAt = calculateNextRunTime(scheduledReport);

          // Update scheduled report with last_run_at and next_run_at
          await supabase
            .from("scheduled_reports")
            .update({
              last_run_at: now.toISOString(),
              next_run_at: nextRunAt.toISOString(),
            })
            .eq("id", scheduledReport.id);

          results.push({
            reportId: scheduledReport.id,
            success: true,
          });
        } catch (reportError) {
          console.error("Error processing scheduled report", {
            scheduleId: scheduledReport.id,
            organizationId: scheduledReport.organization_id,
            error: reportError,
          });
          results.push({
            reportId: scheduledReport.id,
            success: false,
            error: reportError instanceof Error ? reportError.message : "Unknown error",
          });
        }
      }

      return NextResponse.json({
        success: true,
        processed: results.length,
        results,
      });
    } catch (error) {
      console.error("Error in scheduled reports cron:", error);
      return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
  });
}

function getDateRangeForSchedule(schedule: ScheduleFrequency): {
  dateRange: { start: Date; end: Date };
  periodLabel: string;
} {
  const now = new Date();
  const end = now;
  let start: Date;
  let periodLabel: string;

  switch (schedule) {
    case "daily":
      start = subDays(now, 1);
      periodLabel = format(start, "MMMM d, yyyy");
      break;
    case "weekly":
      start = subWeeks(now, 1);
      periodLabel = `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      break;
    case "monthly":
    default:
      start = subMonths(now, 1);
      periodLabel = format(start, "MMMM yyyy");
      break;
  }

  return {
    dateRange: { start, end },
    periodLabel,
  };
}

function calculateNextRunTime(scheduledReport: ScheduledReportRow): Date {
  const now = new Date();
  const scheduleTime = scheduledReport.schedule_time || "09:00:00";
  const [hours, minutes] = scheduleTime.split(":").map(Number);

  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  switch (scheduledReport.schedule) {
    case "daily": {
      // Next day at scheduled time
      next.setDate(next.getDate() + 1);
      break;
    }
    case "weekly": {
      // Next week on the scheduled day
      const targetDay = scheduledReport.schedule_day_of_week ?? 1; // Default to Monday
      const currentDay = next.getDay();
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilTarget);
      break;
    }
    case "monthly": {
      // Next month on the scheduled day
      const targetDate = scheduledReport.schedule_day_of_month ?? 1; // Default to 1st
      next.setMonth(next.getMonth() + 1);
      next.setDate(
        Math.min(targetDate, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate())
      );
      break;
    }
  }

  return next;
}
