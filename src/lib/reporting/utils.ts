/**
 * Reporting Utilities
 * Client-safe utility functions for reporting
 */

import {
  endOfMonth,
  endOfQuarter,
  format,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";
import { DAYS_OF_WEEK } from "@/lib/constants/days";
import {
  formatDate as formatCanonicalDate,
  formatDateTime as formatCanonicalDateTime,
  formatRelativeTime,
} from "@/lib/utils";
import type { ActionResult } from "@/lib/reviews/types";
import type {
  DateRangePreset,
  ReportDateRange,
  ReportFilters,
  ReportTemplate,
  ScheduleFrequency,
  ScheduledReport,
} from "./types";

/**
 * Convert date range preset to actual dates
 */
export function getDateRangeFromPreset(preset: DateRangePreset): ReportDateRange {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (preset) {
    case "last_7_days":
      start = subDays(now, 7);
      break;
    case "last_30_days":
      start = subDays(now, 30);
      break;
    case "last_90_days":
      start = subDays(now, 90);
      break;
    case "this_month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case "last_month":
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      break;
    case "this_quarter":
      start = startOfQuarter(now);
      end = endOfQuarter(now);
      break;
    case "last_quarter":
      start = startOfQuarter(subMonths(now, 3));
      end = endOfQuarter(subMonths(now, 3));
      break;
    case "this_year":
      start = startOfYear(now);
      break;
    default:
      start = subDays(now, 30);
  }

  return { start, end, preset };
}

/**
 * Get filename for export
 */
export function getExportFilename(
  reportName: string,
  exportFormat: "csv" | "pdf" | "json"
): string {
  const sanitizedName = reportName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const dateStr = format(new Date(), "yyyy-MM-dd");
  return `${sanitizedName}-${dateStr}.${exportFormat}`;
}

export type ScheduleFormState = {
  templateId: string;
  name: string;
  recipients: string[];
  schedule: ScheduleFrequency;
  dayOfWeek: string;
  dayOfMonth: string;
  scheduleTime: string;
  filters: ReportFilters;
};

export type ScheduleDialogMode = { type: "create" } | { type: "edit"; report: ScheduledReport };

type ReportToast = (props: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

type ReportActionMessage<T> = string | ((data: T) => string | undefined);

export async function runReportAction<T>(
  action: () => Promise<ActionResult<T>>,
  {
    toast,
    successTitle,
    successDescription,
    errorTitle,
    errorDescription,
    onSuccess,
    requireData = false,
    showErrorToast = true,
    logLabel,
  }: {
    toast: ReportToast;
    successTitle?: ReportActionMessage<T>;
    successDescription?: ReportActionMessage<T>;
    errorTitle: string;
    errorDescription?: string;
    onSuccess?: (data: T) => void | Promise<void>;
    requireData?: boolean;
    showErrorToast?: boolean;
    logLabel?: string;
  }
): Promise<T | null> {
  try {
    const result = await action();

    if (result.success && (!requireData || (result.data !== undefined && result.data !== null))) {
      const data = result.data as T;
      await onSuccess?.(data);

      const title = typeof successTitle === "function" ? successTitle(data) : successTitle;
      if (title) {
        const description =
          typeof successDescription === "function" ? successDescription(data) : successDescription;
        toast({ title, description });
      }

      return data ?? null;
    }

    if (showErrorToast) {
      toast({
        title: errorTitle,
        description: result.error || errorDescription || "Please try again.",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error(logLabel || errorTitle, error);
    if (showErrorToast) {
      toast({
        title: errorTitle,
        description: errorDescription || "Please try again.",
        variant: "destructive",
      });
    }
  }

  return null;
}

export function normalizeTime(time: string | null | undefined) {
  if (!time) return "09:00";
  return time.slice(0, 5);
}

export function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export function formatReportDate(value: Date | string | null | undefined) {
  return formatCanonicalDate(value, "Never");
}

export function formatReportDateTime(value: Date | string | null | undefined) {
  return formatCanonicalDateTime(value, "Never");
}

export function formatRelativeDate(value: Date | string | null | undefined) {
  const date = toDate(value);
  return date ? formatRelativeTime(date) : "Never";
}

export function formatReportDateRange(start: Date | string, end: Date | string) {
  return `${formatReportDate(start)} - ${formatReportDate(end)}`;
}

const reportWeekDays = [...DAYS_OF_WEEK.slice(1), DAYS_OF_WEEK[0]];

export function formatCadence(report: ScheduledReport | ScheduleFormState) {
  const schedule = report.schedule;
  const time = normalizeTime(report.scheduleTime);

  if (schedule === "daily") {
    return `Daily - ${time}`;
  }

  if (schedule === "weekly") {
    const dayValue =
      "dayOfWeek" in report ? report.dayOfWeek : String(report.scheduleDayOfWeek ?? 1);
    const day = reportWeekDays.find((item) => item.value === dayValue)?.label ?? "Monday";
    return `Weekly - ${day}s - ${time}`;
  }

  const dayOfMonth =
    "dayOfMonth" in report ? report.dayOfMonth : String(report.scheduleDayOfMonth ?? 1);
  return `Monthly - Day ${dayOfMonth} - ${time}`;
}

export function buildShareUrl(token: string) {
  if (typeof window === "undefined") {
    return `/reports/shared/${token}`;
  }
  return `${window.location.origin}/reports/shared/${token}`;
}

export function buildDefaultScheduleForm(
  templates: ReportTemplate[],
  selectedTemplate: ReportTemplate | null,
  report?: ScheduledReport
): ScheduleFormState {
  const fallbackTemplateId = selectedTemplate?.id || templates[0]?.id || "";

  if (!report) {
    return {
      templateId: fallbackTemplateId,
      name: selectedTemplate ? `${selectedTemplate.name} schedule` : "",
      recipients: [],
      schedule: "weekly",
      dayOfWeek: "1",
      dayOfMonth: "1",
      scheduleTime: "09:00",
      filters: {},
    };
  }

  return {
    templateId: report.templateId,
    name: report.name,
    recipients: report.recipients,
    schedule: report.schedule,
    dayOfWeek: String(report.scheduleDayOfWeek ?? 1),
    dayOfMonth: String(report.scheduleDayOfMonth ?? 1),
    scheduleTime: normalizeTime(report.scheduleTime),
    filters: report.filters || {},
  };
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function copyText(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export async function copyReportShareUrl(shareToken: string, toast: ReportToast) {
  try {
    await copyText(buildShareUrl(shareToken));
    toast({
      title: "Link copied",
      description: "The shared report URL is on your clipboard.",
    });
  } catch (error) {
    console.error("Error copying share URL:", error);
    toast({
      title: "Copy failed",
      description: "Could not copy the shared report URL.",
      variant: "destructive",
    });
  }
}

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadBase64File(content: string, filename: string, mimeType: string) {
  const byteCharacters = atob(content);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
