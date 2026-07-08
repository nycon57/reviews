"use server";

/**
 * Report Server Actions
 * Actions for managing reports, schedules, and sharing
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { randomBytes } from "crypto";
import { addDays, addMonths, setHours, setMinutes, startOfDay, nextMonday } from "date-fns";
import type { ActionResult } from "@/lib/reviews/types";
import type { Json } from "@/types/database.types";
import type {
  ScheduledReport,
  ReportShare,
  ReportExport,
  ScheduleFrequency,
  ReportFilters,
  ReportDateRange,
  ExportFormat,
  GeneratedReport,
  ReportExportPayload,
} from "./types";
import { generateReport } from "./engine";
import { exportReportToCSV } from "./export";
import { getExportFilename } from "./utils";

export interface CreateReportShareForOrgParams {
  organizationId: string;
  templateId: string;
  title: string;
  dateRange: ReportDateRange;
  filters?: ReportFilters;
  expiresInDays?: number;
  sharedBy?: string | null;
}

export interface ExportAndRecordReportOptions {
  report?: GeneratedReport;
  organizationName?: string;
}

/**
 * Get user context
 */
async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return null;
  }

  return {
    userId: userData.id,
    organizationId: userData.organization_id!,
    role: userData.role,
  };
}

/**
 * Calculate next run time for scheduled report
 */
function calculateNextRunTime(
  schedule: ScheduleFrequency,
  dayOfWeek?: number,
  dayOfMonth?: number,
  timeStr: string = "09:00"
): Date {
  const now = new Date();
  const [hours, minutes] = timeStr.split(":").map(Number);
  let nextRun: Date;

  switch (schedule) {
    case "daily":
      nextRun = startOfDay(addDays(now, 1));
      break;
    case "weekly":
      nextRun = nextMonday(now);
      if (dayOfWeek !== undefined) {
        nextRun = addDays(startOfDay(nextRun), (dayOfWeek - 1 + 7) % 7);
      }
      break;
    case "monthly":
      nextRun = startOfDay(addMonths(now, 1));
      if (dayOfMonth !== undefined) {
        nextRun.setDate(Math.min(dayOfMonth, 28));
      } else {
        nextRun.setDate(1);
      }
      break;
    default:
      nextRun = addDays(now, 1);
  }

  nextRun = setHours(nextRun, hours);
  nextRun = setMinutes(nextRun, minutes);

  return nextRun;
}

function mapReportShareRow(data: {
  id: string;
  organization_id: string;
  template_id: string;
  share_token: string;
  title: string;
  date_range_start: string;
  date_range_end: string;
  filters: unknown;
  shared_by: string | null;
  expires_at: string | null;
  access_count: number | null;
  last_accessed_at: string | null;
  created_at: string | null;
}): ReportShare {
  return {
    id: data.id,
    organizationId: data.organization_id,
    templateId: data.template_id,
    shareToken: data.share_token,
    title: data.title,
    dateRangeStart: new Date(data.date_range_start),
    dateRangeEnd: new Date(data.date_range_end),
    filters: (data.filters || {}) as ReportFilters,
    sharedBy: data.shared_by,
    expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    accessCount: data.access_count ?? 0,
    lastAccessedAt: data.last_accessed_at ? new Date(data.last_accessed_at) : null,
    createdAt: new Date(data.created_at!),
  };
}

/**
 * Create a scheduled report
 */
export async function createScheduledReport(
  templateId: string,
  name: string,
  recipients: string[],
  schedule: ScheduleFrequency,
  dayOfWeek?: number,
  dayOfMonth?: number,
  scheduleTime: string = "09:00",
  filters?: ReportFilters
): Promise<ActionResult<ScheduledReport>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  if (context.role !== "manager" && context.role !== "admin") {
    return { success: false, error: "Only managers and admins can schedule reports" };
  }

  if (recipients.length === 0) {
    return { success: false, error: "At least one recipient is required" };
  }

  const supabase = createAdminClient();

  const nextRunAt = calculateNextRunTime(schedule, dayOfWeek, dayOfMonth, scheduleTime);

  const { data, error } = await supabase
    .from("scheduled_reports")
    .insert({
      organization_id: context.organizationId,
      template_id: templateId,
      name,
      recipients,
      schedule,
      schedule_day_of_week: dayOfWeek,
      schedule_day_of_month: dayOfMonth,
      schedule_time: scheduleTime,
      filters: (filters || {}) as Json,
      is_active: true,
      next_run_at: nextRunAt.toISOString(),
      created_by: context.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating scheduled report:", error);
    return { success: false, error: "Failed to create scheduled report" };
  }

  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      templateId: data.template_id,
      name: data.name,
      recipients: data.recipients,
      schedule: data.schedule as ScheduleFrequency,
      scheduleDayOfWeek: data.schedule_day_of_week,
      scheduleDayOfMonth: data.schedule_day_of_month,
      scheduleTime: data.schedule_time || "09:00:00",
      filters: data.filters as ReportFilters,
      isActive: data.is_active ?? true,
      nextRunAt: data.next_run_at ? new Date(data.next_run_at) : null,
      lastRunAt: data.last_run_at ? new Date(data.last_run_at) : null,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at!),
      updatedAt: new Date(data.updated_at!),
    },
  };
}

/**
 * Update a scheduled report
 */
export async function updateScheduledReport(
  id: string,
  updates: {
    name?: string;
    recipients?: string[];
    schedule?: ScheduleFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    scheduleTime?: string;
    filters?: ReportFilters;
    isActive?: boolean;
  }
): Promise<ActionResult<ScheduledReport>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  if (context.role !== "manager" && context.role !== "admin") {
    return { success: false, error: "Only managers and admins can update scheduled reports" };
  }

  const supabase = createAdminClient();

  // Calculate new next run if schedule changed
  let nextRunAt: Date | undefined;
  if (updates.schedule || updates.dayOfWeek !== undefined || updates.dayOfMonth !== undefined || updates.scheduleTime) {
    // Get current values if not provided
    const { data: current } = await supabase
      .from("scheduled_reports")
      .select("schedule, schedule_day_of_week, schedule_day_of_month, schedule_time")
      .eq("id", id)
      .single();

    if (current) {
      nextRunAt = calculateNextRunTime(
        (updates.schedule || current.schedule) as ScheduleFrequency,
        updates.dayOfWeek ?? current.schedule_day_of_week ?? undefined,
        updates.dayOfMonth ?? current.schedule_day_of_month ?? undefined,
        updates.scheduleTime || current.schedule_time || "09:00"
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.recipients) updateData.recipients = updates.recipients;
  if (updates.schedule) updateData.schedule = updates.schedule;
  if (updates.dayOfWeek !== undefined) updateData.schedule_day_of_week = updates.dayOfWeek;
  if (updates.dayOfMonth !== undefined) updateData.schedule_day_of_month = updates.dayOfMonth;
  if (updates.scheduleTime) updateData.schedule_time = updates.scheduleTime;
  if (updates.filters) updateData.filters = updates.filters;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
  if (nextRunAt) updateData.next_run_at = nextRunAt.toISOString();

  const { data, error } = await supabase
    .from("scheduled_reports")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", context.organizationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating scheduled report:", error);
    return { success: false, error: "Failed to update scheduled report" };
  }

  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      templateId: data.template_id,
      name: data.name,
      recipients: data.recipients,
      schedule: data.schedule as ScheduleFrequency,
      scheduleDayOfWeek: data.schedule_day_of_week,
      scheduleDayOfMonth: data.schedule_day_of_month,
      scheduleTime: data.schedule_time || "09:00:00",
      filters: data.filters as ReportFilters,
      isActive: data.is_active ?? true,
      nextRunAt: data.next_run_at ? new Date(data.next_run_at) : null,
      lastRunAt: data.last_run_at ? new Date(data.last_run_at) : null,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at!),
      updatedAt: new Date(data.updated_at!),
    },
  };
}

/**
 * Delete a scheduled report
 */
export async function deleteScheduledReport(id: string): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  if (context.role !== "manager" && context.role !== "admin") {
    return { success: false, error: "Only managers and admins can delete scheduled reports" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("scheduled_reports")
    .delete()
    .eq("id", id)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error deleting scheduled report:", error);
    return { success: false, error: "Failed to delete scheduled report" };
  }

  return { success: true, data: undefined };
}

/**
 * Get all scheduled reports for the organization
 */
export async function getScheduledReports(): Promise<ActionResult<ScheduledReport[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("scheduled_reports")
    .select("*")
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching scheduled reports:", error);
    return { success: false, error: "Failed to fetch scheduled reports" };
  }

  const reports: ScheduledReport[] = (data || []).map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    templateId: d.template_id,
    name: d.name,
    recipients: d.recipients,
    schedule: d.schedule as ScheduleFrequency,
    scheduleDayOfWeek: d.schedule_day_of_week,
    scheduleDayOfMonth: d.schedule_day_of_month,
    scheduleTime: d.schedule_time || "09:00:00",
    filters: d.filters as ReportFilters,
    isActive: d.is_active ?? true,
    nextRunAt: d.next_run_at ? new Date(d.next_run_at) : null,
    lastRunAt: d.last_run_at ? new Date(d.last_run_at) : null,
    createdBy: d.created_by,
    createdAt: new Date(d.created_at!),
    updatedAt: new Date(d.updated_at!),
  }));

  return { success: true, data: reports };
}

/**
 * Create a shareable report link
 */
export async function createReportShare(
  templateId: string,
  title: string,
  dateRange: ReportDateRange,
  filters?: ReportFilters,
  expiresInDays?: number
): Promise<ActionResult<ReportShare>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  if (context.role !== "manager" && context.role !== "admin") {
    return { success: false, error: "Only managers and admins can share reports" };
  }

  return createReportShareForOrg({
    organizationId: context.organizationId,
    templateId,
    title,
    dateRange,
    filters,
    expiresInDays,
    sharedBy: context.userId,
  });
}

/**
 * Create a shareable report link for a trusted organization context
 */
export async function createReportShareForOrg({
  organizationId,
  templateId,
  title,
  dateRange,
  filters,
  expiresInDays,
  sharedBy = null,
}: CreateReportShareForOrgParams): Promise<ActionResult<ReportShare>> {
  const supabase = createAdminClient();

  const shareToken = randomBytes(32).toString("hex");
  const expiresAt = expiresInDays
    ? addDays(new Date(), expiresInDays).toISOString()
    : null;

  const { data, error } = await supabase
    .from("report_shares")
    .insert({
      organization_id: organizationId,
      template_id: templateId,
      share_token: shareToken,
      title,
      date_range_start: dateRange.start.toISOString().split("T")[0],
      date_range_end: dateRange.end.toISOString().split("T")[0],
      filters: (filters || {}) as Json,
      shared_by: sharedBy,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating report share:", error);
    return { success: false, error: "Failed to create share link" };
  }

  return {
    success: true,
    data: mapReportShareRow(data),
  };
}

/**
 * Get a report share by token (public - no auth required)
 */
export async function getReportShareByToken(
  token: string
): Promise<ActionResult<ReportShare>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("report_shares")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error) {
    console.error("Error fetching report share:", error);
    return { success: false, error: "Share link not found" };
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { success: false, error: "Share link has expired" };
  }

  // Update access count
  await supabase
    .from("report_shares")
    .update({
      access_count: (data.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return {
    success: true,
    data: {
      id: data.id,
      organizationId: data.organization_id,
      templateId: data.template_id,
      shareToken: data.share_token,
      title: data.title,
      dateRangeStart: new Date(data.date_range_start),
      dateRangeEnd: new Date(data.date_range_end),
      filters: (data.filters || {}) as ReportFilters,
      sharedBy: data.shared_by,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null,
      accessCount: (data.access_count || 0) + 1,
      lastAccessedAt: new Date(),
      createdAt: new Date(data.created_at!),
    },
  };
}

/**
 * Revoke a report share
 */
export async function revokeReportShare(id: string): Promise<ActionResult<void>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("report_shares")
    .delete()
    .eq("id", id)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Error revoking report share:", error);
    return { success: false, error: "Failed to revoke share link" };
  }

  return { success: true, data: undefined };
}

/**
 * Get all report shares for the organization
 */
export async function getReportShares(): Promise<ActionResult<ReportShare[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("report_shares")
    .select("*")
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching report shares:", error);
    return { success: false, error: "Failed to fetch shares" };
  }

  const shares = (data || []).map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    templateId: d.template_id,
    shareToken: d.share_token,
    title: d.title,
    dateRangeStart: new Date(d.date_range_start),
    dateRangeEnd: new Date(d.date_range_end),
    filters: (d.filters || {}) as ReportFilters,
    sharedBy: d.shared_by,
    expiresAt: d.expires_at ? new Date(d.expires_at) : null,
    accessCount: d.access_count ?? 0,
    lastAccessedAt: d.last_accessed_at ? new Date(d.last_accessed_at) : null,
    createdAt: new Date(d.created_at!),
  }));

  return { success: true, data: shares };
}

/**
 * Export a report and record it
 */
export async function exportAndRecordReport(
  templateId: string,
  dateRange: ReportDateRange,
  format: ExportFormat,
  filters?: ReportFilters,
  options: ExportAndRecordReportOptions = {}
): Promise<ActionResult<ReportExportPayload>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const report = options.report || (await generateReport(templateId, dateRange, filters)).data;
  if (!report) {
    return { success: false, error: "Failed to generate report" };
  }

  let exportData: string;
  let mimeType: string;
  let encoding: ReportExportPayload["encoding"];
  let rowCount: number | null = null;

  switch (format) {
    case "csv": {
      const csvResult = await exportReportToCSV(report, "summary");
      if (!csvResult.success || !csvResult.data) {
        return { success: false, error: "Failed to export CSV" };
      }
      exportData = csvResult.data;
      mimeType = "text/csv";
      rowCount = exportData.split("\n").length - 1;
      break;
    }
    case "pdf": {
      const organizationName = options.organizationName || (await getOrganizationName(context.organizationId));
      try {
        const { renderReportPdf } = await import("./pdf");
        const pdfBuffer = await renderReportPdf(report, organizationName);
        exportData = pdfBuffer.toString("base64");
      } catch (error) {
        console.error("Error generating PDF:", error);
        return { success: false, error: "Failed to generate PDF" };
      }
      mimeType = "application/pdf";
      encoding = "base64";
      break;
    }
    case "json": {
      exportData = JSON.stringify(report, null, 2);
      mimeType = "application/json";
      break;
    }
    default:
      return { success: false, error: "Unsupported export format" };
  }

  const filename = getExportFilename(report.templateName, format);

  // Record the export
  const supabase = createAdminClient();
  await supabase.from("report_exports").insert({
    organization_id: context.organizationId,
    template_id: templateId,
    export_format: format,
    file_name: filename,
    date_range_start: dateRange.start.toISOString().split("T")[0],
    date_range_end: dateRange.end.toISOString().split("T")[0],
    filters: (filters || {}) as Json,
    row_count: rowCount,
    created_by: context.userId,
  });

  return {
    success: true,
    data: {
      data: exportData,
      filename,
      mimeType,
      ...(encoding ? { encoding } : {}),
    },
  };
}

async function getOrganizationName(organizationId: string): Promise<string> {
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  return org?.name || "Organization";
}

/**
 * Get export history
 */
export async function getReportExports(): Promise<ActionResult<ReportExport[]>> {
  const context = await getUserContext();
  if (!context) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("report_exports")
    .select("*")
    .eq("organization_id", context.organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching exports:", error);
    return { success: false, error: "Failed to fetch export history" };
  }

  const exports = (data || []).map((d) => ({
    id: d.id,
    organizationId: d.organization_id,
    templateId: d.template_id,
    exportFormat: d.export_format as ExportFormat,
    fileName: d.file_name,
    dateRangeStart: new Date(d.date_range_start),
    dateRangeEnd: new Date(d.date_range_end),
    filters: (d.filters || {}) as ReportFilters,
    rowCount: d.row_count ?? 0,
    createdBy: d.created_by,
    createdAt: new Date(d.created_at!),
  }));

  return { success: true, data: exports };
}
