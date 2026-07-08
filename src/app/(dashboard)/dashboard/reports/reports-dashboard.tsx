"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  ArrowSquareOut,
  Clock,
  Copy,
  DownloadSimple as Download,
  EnvelopeSimple,
  FileText,
  LinkSimple,
  PencilSimple,
  Plus,
  ShareNetwork as Share2,
  SpinnerGap as Loader2,
  Trash,
  X,
} from "@phosphor-icons/react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelector } from "@/components/reporting/template-selector";
import { DateRangeSelector } from "@/components/reporting/date-range-selector";
import { ReportFiltersPanel } from "@/components/reporting/report-filters";
import { ExportOptions } from "@/components/reporting/export-options";
import {
  createReportShare,
  createScheduledReport,
  deleteScheduledReport,
  exportAndRecordReport,
  generateReport,
  getReportExports,
  getReportShares,
  getScheduledReports,
  revokeReportShare,
  updateScheduledReport,
} from "@/lib/reporting";
import type {
  ExportFormat,
  GeneratedReport,
  ReportDateRange,
  ReportExport,
  ReportFilters as ReportFiltersType,
  ReportShare,
  ReportTemplate,
  ScheduleFrequency,
  ScheduledReport,
} from "@/lib/reporting/types";

// Dynamic import for ReportViewer with recharts
const ReportViewer = dynamic(
  () => import("@/components/reporting/report-viewer").then((mod) => mod.ReportViewer),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    ),
  }
);

interface ReportsDashboardProps {
  templates: ReportTemplate[];
  teamMembers: Array<{ id: string; full_name: string; branch: string | null }>;
  branches: string[];
}

type ScheduleFormState = {
  templateId: string;
  name: string;
  recipients: string[];
  schedule: ScheduleFrequency;
  dayOfWeek: string;
  dayOfMonth: string;
  scheduleTime: string;
  filters: ReportFiltersType;
};

type ScheduleDialogMode = { type: "create" } | { type: "edit"; report: ScheduledReport };

const weekDays = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

const expiryOptions = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

function normalizeTime(time: string | null | undefined) {
  if (!time) return "09:00";
  return time.slice(0, 5);
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function formatDate(value: Date | string | null | undefined) {
  const date = toDate(value);
  return date ? format(date, "MMM d, yyyy") : "Never";
}

function formatDateTime(value: Date | string | null | undefined) {
  const date = toDate(value);
  return date ? format(date, "MMM d, yyyy h:mm a") : "Never";
}

function formatRelativeDate(value: Date | string | null | undefined) {
  const date = toDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "Never";
}

function formatReportDateRange(start: Date | string, end: Date | string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatCadence(report: ScheduledReport | ScheduleFormState) {
  const schedule = report.schedule;
  const time = normalizeTime(report.scheduleTime);

  if (schedule === "daily") {
    return `Daily - ${time}`;
  }

  if (schedule === "weekly") {
    const dayValue =
      "dayOfWeek" in report ? report.dayOfWeek : String(report.scheduleDayOfWeek ?? 1);
    const day = weekDays.find((item) => item.value === dayValue)?.label ?? "Monday";
    return `Weekly - ${day}s - ${time}`;
  }

  const dayOfMonth =
    "dayOfMonth" in report ? report.dayOfMonth : String(report.scheduleDayOfMonth ?? 1);
  return `Monthly - Day ${dayOfMonth} - ${time}`;
}

function buildShareUrl(token: string) {
  if (typeof window === "undefined") {
    return `/reports/shared/${token}`;
  }
  return `${window.location.origin}/reports/shared/${token}`;
}

function buildDefaultScheduleForm(
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
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

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

function downloadBase64File(content: string, filename: string, mimeType: string) {
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

export function ReportsDashboard({ templates, teamMembers, branches }: ReportsDashboardProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = React.useState<ReportTemplate | null>(
    templates.find((t) => t.isDefault) || templates[0] || null
  );
  const [dateRange, setDateRange] = React.useState<ReportDateRange>({
    preset: "last_30_days",
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [filters, setFilters] = React.useState<ReportFiltersType>({});
  const [generatedReport, setGeneratedReport] = React.useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("generate");
  const [scheduledReports, setScheduledReports] = React.useState<ScheduledReport[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = React.useState(true);
  const [scheduleDialogMode, setScheduleDialogMode] = React.useState<ScheduleDialogMode | null>(
    null
  );
  const [updatingScheduleId, setUpdatingScheduleId] = React.useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = React.useState<ScheduledReport | null>(null);
  const [exportHistory, setExportHistory] = React.useState<ReportExport[]>([]);
  const [isLoadingExports, setIsLoadingExports] = React.useState(true);
  const [shares, setShares] = React.useState<ReportShare[]>([]);
  const [sharesOpen, setSharesOpen] = React.useState(false);
  const [isLoadingShares, setIsLoadingShares] = React.useState(false);
  const [shareToRevoke, setShareToRevoke] = React.useState<ReportShare | null>(null);
  const [revokingShareId, setRevokingShareId] = React.useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const scheduleSectionRef = React.useRef<HTMLDivElement | null>(null);

  const templateById = React.useMemo(() => {
    return new Map(templates.map((template) => [template.id, template]));
  }, [templates]);

  const teamMemberById = React.useMemo(() => {
    return new Map(teamMembers.map((member) => [member.id, member.full_name]));
  }, [teamMembers]);

  const loadSchedules = React.useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoadingSchedules(true);
      }

      const result = await getScheduledReports();

      if (result.success) {
        setScheduledReports(result.data || []);
      } else {
        toast({
          title: "Could not load schedules",
          description: result.error || "Scheduled reports are unavailable.",
          variant: "destructive",
        });
      }

      if (!silent) {
        setIsLoadingSchedules(false);
      }
    },
    [toast]
  );

  const loadExports = React.useCallback(
    async (silent = false) => {
      if (!silent) {
        setIsLoadingExports(true);
      }

      const result = await getReportExports();

      if (result.success) {
        setExportHistory(result.data || []);
      } else if (!silent) {
        toast({
          title: "Could not load export history",
          description: result.error || "Export history is unavailable.",
          variant: "destructive",
        });
      }

      if (!silent) {
        setIsLoadingExports(false);
      }
    },
    [toast]
  );

  const loadShares = React.useCallback(async () => {
    setIsLoadingShares(true);

    const result = await getReportShares();

    if (result.success) {
      setShares(result.data || []);
    } else {
      toast({
        title: "Could not load shared links",
        description: result.error || "Shared links are unavailable.",
        variant: "destructive",
      });
    }

    setIsLoadingShares(false);
  }, [toast]);

  React.useEffect(() => {
    void loadSchedules();
    void loadExports();
  }, [loadSchedules, loadExports]);

  const handleDateRangeChange = (range: ReportDateRange) => {
    setDateRange(range);
    setGeneratedReport(null);
  };

  const handleFiltersChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    setGeneratedReport(null);
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      setError("Please select a report template");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateReport(selectedTemplate.id, dateRange, filters);

      if (result.success && result.data) {
        setGeneratedReport(result.data);
        toast({
          title: "Report generated",
          description: `${result.data.templateName} is ready to review.`,
        });
      } else {
        const message = result.error || "Failed to generate report";
        setError(message);
        toast({
          title: "Report generation failed",
          description: message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError("An unexpected error occurred");
      toast({
        title: "Report generation failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!generatedReport) {
      setError("Please generate a report first");
      toast({
        title: "Generate a report first",
        description: "Exports are available after a report has been generated.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const result = await exportAndRecordReport(
        generatedReport.templateId,
        generatedReport.dateRange,
        format,
        generatedReport.filters,
        { report: generatedReport }
      );

      if (!result.success || !result.data) {
        const message = result.error || `Failed to export ${format.toUpperCase()}`;
        setError(message);
        toast({
          title: "Export failed",
          description: message,
          variant: "destructive",
        });
        return;
      }

      if (result.data.encoding === "base64") {
        downloadBase64File(result.data.data, result.data.filename, result.data.mimeType);
      } else {
        downloadTextFile(result.data.data, result.data.filename, result.data.mimeType);
      }

      toast({
        title: "Export ready",
        description: `${result.data.filename} was downloaded and recorded.`,
      });
      await loadExports(true);
    } catch (err) {
      console.error("Error exporting report:", err);
      setError("Failed to export report");
      toast({
        title: "Export failed",
        description: "Failed to export report.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleButtonClick = () => {
    setActiveTab("scheduled");
    window.requestAnimationFrame(() => scheduleSectionRef.current?.focus());
  };

  const handleSharedLinksOpenChange = (open: boolean) => {
    setSharesOpen(open);
    if (open) {
      void loadShares();
    }
  };

  const handleCopyShare = async (share: ReportShare) => {
    try {
      await copyText(buildShareUrl(share.shareToken));
      toast({
        title: "Link copied",
        description: "The shared report URL is on your clipboard.",
      });
    } catch (err) {
      console.error("Error copying share URL:", err);
      toast({
        title: "Copy failed",
        description: "Could not copy the shared report URL.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleSaved = (report: ScheduledReport, mode: ScheduleDialogMode["type"]) => {
    setScheduledReports((current) => {
      if (mode === "edit") {
        return current.map((item) => (item.id === report.id ? report : item));
      }
      return [report, ...current];
    });
    setScheduleDialogMode(null);
  };

  const handleToggleSchedule = async (report: ScheduledReport, isActive: boolean) => {
    setUpdatingScheduleId(report.id);

    try {
      const result = await updateScheduledReport(report.id, { isActive });

      if (result.success && result.data) {
        setScheduledReports((current) =>
          current.map((item) => (item.id === report.id ? result.data! : item))
        );
        toast({
          title: isActive ? "Schedule activated" : "Schedule paused",
          description: report.name,
        });
      } else {
        toast({
          title: "Schedule update failed",
          description: result.error || "Could not update the scheduled report.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error updating scheduled report:", err);
      toast({
        title: "Schedule update failed",
        description: "Could not update the scheduled report.",
        variant: "destructive",
      });
    } finally {
      setUpdatingScheduleId(null);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    setUpdatingScheduleId(scheduleToDelete.id);

    try {
      const result = await deleteScheduledReport(scheduleToDelete.id);

      if (result.success) {
        setScheduledReports((current) => current.filter((item) => item.id !== scheduleToDelete.id));
        toast({
          title: "Schedule deleted",
          description: scheduleToDelete.name,
        });
        setScheduleToDelete(null);
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Could not delete the scheduled report.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error deleting scheduled report:", err);
      toast({
        title: "Delete failed",
        description: "Could not delete the scheduled report.",
        variant: "destructive",
      });
    } finally {
      setUpdatingScheduleId(null);
    }
  };

  const handleShareCreated = (share: ReportShare) => {
    setShares((current) => [share, ...current.filter((item) => item.id !== share.id)]);
  };

  const handleRevokeShare = async () => {
    if (!shareToRevoke) return;

    setRevokingShareId(shareToRevoke.id);

    try {
      const result = await revokeReportShare(shareToRevoke.id);

      if (result.success) {
        setShares((current) => current.filter((item) => item.id !== shareToRevoke.id));
        toast({
          title: "Shared link revoked",
          description: shareToRevoke.title,
        });
        setShareToRevoke(null);
      } else {
        toast({
          title: "Revoke failed",
          description: result.error || "Could not revoke the shared link.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error revoking shared link:", err);
      toast({
        title: "Revoke failed",
        description: "Could not revoke the shared link.",
        variant: "destructive",
      });
    } finally {
      setRevokingShareId(null);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and export performance reports</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleScheduleButtonClick}>
            <Clock className="mr-2 h-4 w-4" />
            Scheduled
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSharedLinksOpenChange(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Shared Links
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate" className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Reports
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Download className="h-4 w-4" />
            Export History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Report Template</CardTitle>
                <CardDescription>
                  Choose a pre-built template or create a custom report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateSelector
                  templates={templates}
                  selectedId={selectedTemplate?.id}
                  onSelect={setSelectedTemplate}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
                <CardDescription>Set the date range and filters for your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Date Range</label>
                  <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Filters</label>
                  <ReportFiltersPanel
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    teamMembers={teamMembers}
                    branches={branches}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={handleGenerateReport} disabled={!selectedTemplate || isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {generatedReport && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShareDialogOpen(true)}
                  disabled={isExporting}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <ExportOptions onExport={handleExport} disabled={isExporting} />
              </div>
            )}
          </div>

          {generatedReport && <ReportViewer report={generatedReport} />}

          {!generatedReport && !isGenerating && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10">
                  <FileText weight="duotone" className="h-7 w-7 text-repwell-teal-300" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No Report Generated</h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  Select a template, configure your date range and filters, then click
                  &quot;Generate Report&quot; to create your report.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card ref={scheduleSectionRef} tabIndex={-1}>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>Manage automated report delivery schedules</CardDescription>
                </div>
                <Button
                  onClick={() => setScheduleDialogMode({ type: "create" })}
                  disabled={templates.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScheduledReportsTable
                reports={scheduledReports}
                templates={templateById}
                isLoading={isLoadingSchedules}
                updatingId={updatingScheduleId}
                onToggleActive={handleToggleSchedule}
                onEdit={(report) => setScheduleDialogMode({ type: "edit", report })}
                onDelete={setScheduleToDelete}
                onCreate={() => setScheduleDialogMode({ type: "create" })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>View previously exported reports</CardDescription>
            </CardHeader>
            <CardContent>
              <ExportHistoryTable
                exports={exportHistory}
                templates={templateById}
                teamMembers={teamMemberById}
                isLoading={isLoadingExports}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ScheduleReportDialog
        mode={scheduleDialogMode}
        templates={templates}
        selectedTemplate={selectedTemplate}
        teamMembers={teamMembers}
        branches={branches}
        onOpenChange={(open) => {
          if (!open) setScheduleDialogMode(null);
        }}
        onSaved={handleScheduleSaved}
      />

      <ShareLinksSheet
        open={sharesOpen}
        onOpenChange={handleSharedLinksOpenChange}
        shares={shares}
        templates={templateById}
        isLoading={isLoadingShares}
        onCopy={handleCopyShare}
        onRevoke={setShareToRevoke}
      />

      <ShareReportDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        report={generatedReport}
        onShareCreated={handleShareCreated}
      />

      <AlertDialog
        open={!!scheduleToDelete}
        onOpenChange={(open) => {
          if (!open) setScheduleToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled report?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {scheduleToDelete?.name} from automated delivery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!updatingScheduleId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeleteSchedule();
              }}
              disabled={!!updatingScheduleId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updatingScheduleId === scheduleToDelete?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!shareToRevoke}
        onOpenChange={(open) => {
          if (!open) setShareToRevoke(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke shared link?</AlertDialogTitle>
            <AlertDialogDescription>
              The public URL for {shareToRevoke?.title} will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!revokingShareId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleRevokeShare();
              }}
              disabled={!!revokingShareId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokingShareId === shareToRevoke?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="mr-2 h-4 w-4" />
              )}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ScheduledReportsTable({
  reports,
  templates,
  isLoading,
  updatingId,
  onToggleActive,
  onEdit,
  onDelete,
  onCreate,
}: {
  reports: ScheduledReport[];
  templates: Map<string, ReportTemplate>;
  isLoading: boolean;
  updatingId: string | null;
  onToggleActive: (report: ScheduledReport, isActive: boolean) => void;
  onEdit: (report: ScheduledReport) => void;
  onDelete: (report: ScheduledReport) => void;
  onCreate: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-repwell-sage-100/10 p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10">
          <Clock weight="duotone" className="h-7 w-7 text-repwell-teal-300" />
        </div>
        <h3 className="mb-2 text-lg font-medium">No Scheduled Reports</h3>
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">
          Set up automated report delivery by email on a daily, weekly, or monthly basis.
        </p>
        <Button variant="outline" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Cadence</TableHead>
          <TableHead>Recipients</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Next / Last Run</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => {
          const template = templates.get(report.templateId);
          const isUpdating = updatingId === report.id;

          return (
            <TableRow key={report.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-heading">{report.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template?.name || "Unknown template"}
                  </div>
                </div>
              </TableCell>
              <TableCell className="min-w-[180px]">{formatCadence(report)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  <EnvelopeSimple className="h-3 w-3" />
                  {report.recipients.length}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={report.isActive}
                    disabled={isUpdating}
                    onCheckedChange={(checked) => onToggleActive(report, checked)}
                    aria-label={`${report.name} active status`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {report.isActive ? "Active" : "Paused"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <div>{formatDateTime(report.nextRunAt)}</div>
                  <div className="text-xs text-muted-foreground">
                    Last: {formatDateTime(report.lastRunAt)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(report)}
                    disabled={isUpdating}
                    aria-label={`Edit ${report.name}`}
                  >
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(report)}
                    disabled={isUpdating}
                    aria-label={`Delete ${report.name}`}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function ScheduleReportDialog({
  mode,
  templates,
  selectedTemplate,
  teamMembers,
  branches,
  onOpenChange,
  onSaved,
}: {
  mode: ScheduleDialogMode | null;
  templates: ReportTemplate[];
  selectedTemplate: ReportTemplate | null;
  teamMembers: Array<{ id: string; full_name: string; branch: string | null }>;
  branches: string[];
  onOpenChange: (open: boolean) => void;
  onSaved: (report: ScheduledReport, mode: ScheduleDialogMode["type"]) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = React.useState<ScheduleFormState>(() =>
    buildDefaultScheduleForm(templates, selectedTemplate)
  );
  const [emailInput, setEmailInput] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const isOpen = !!mode;
  const isEdit = mode?.type === "edit";

  React.useEffect(() => {
    if (!mode) return;
    setForm(
      buildDefaultScheduleForm(
        templates,
        selectedTemplate,
        mode.type === "edit" ? mode.report : undefined
      )
    );
    setEmailInput("");
    setEmailError(null);
  }, [mode, selectedTemplate, templates]);

  const selectedTemplateName =
    templates.find((template) => template.id === form.templateId)?.name || "Select template";

  const addEmails = (value: string) => {
    const candidates = value
      .split(/[\s,;]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (candidates.length === 0) return;

    const invalid = candidates.find((email) => !isValidEmail(email));
    if (invalid) {
      setEmailError(`${invalid} is not a valid email address.`);
      return;
    }

    setForm((current) => ({
      ...current,
      recipients: Array.from(new Set([...current.recipients, ...candidates])),
    }));
    setEmailInput("");
    setEmailError(null);
  };

  const removeEmail = (email: string) => {
    setForm((current) => ({
      ...current,
      recipients: current.recipients.filter((item) => item !== email),
    }));
  };

  const handleEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Tab" || event.key === ",") {
      if (event.key === "Tab" && !emailInput.trim()) {
        return;
      }
      event.preventDefault();
      addEmails(emailInput);
    }
  };

  const validateForm = () => {
    if (!form.templateId) return "Select a report template.";
    if (!form.name.trim()) return "Enter a schedule name.";
    if (emailInput.trim()) {
      const invalidInput = emailInput.trim();
      if (!isValidEmail(invalidInput)) {
        return `${invalidInput} is not a valid email address.`;
      }
    }
    if (form.recipients.length === 0 && !emailInput.trim()) {
      return "Add at least one recipient.";
    }
    if (form.schedule === "monthly") {
      const day = Number(form.dayOfMonth);
      if (!Number.isInteger(day) || day < 1 || day > 28) {
        return "Choose a day of month from 1 to 28.";
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setEmailError(validationError);
      toast({
        title: "Schedule not saved",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const recipients = emailInput.trim()
      ? Array.from(new Set([...form.recipients, emailInput.trim().toLowerCase()]))
      : form.recipients;
    const dayOfWeek = form.schedule === "weekly" ? Number(form.dayOfWeek) : undefined;
    const dayOfMonth = form.schedule === "monthly" ? Number(form.dayOfMonth) : undefined;

    setIsSaving(true);

    try {
      const result =
        mode?.type === "edit"
          ? await updateScheduledReport(mode.report.id, {
              name: form.name.trim(),
              recipients,
              schedule: form.schedule,
              dayOfWeek,
              dayOfMonth,
              scheduleTime: form.scheduleTime,
              filters: form.filters,
            })
          : await createScheduledReport(
              form.templateId,
              form.name.trim(),
              recipients,
              form.schedule,
              dayOfWeek,
              dayOfMonth,
              form.scheduleTime,
              form.filters
            );

      if (result.success && result.data) {
        toast({
          title: mode?.type === "edit" ? "Schedule updated" : "Schedule created",
          description: result.data.name,
        });
        onSaved(result.data, mode?.type || "create");
      } else {
        toast({
          title: "Schedule not saved",
          description: result.error || "Could not save the scheduled report.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error saving scheduled report:", err);
      toast({
        title: "Schedule not saved",
        description: "Could not save the scheduled report.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Schedule" : "Create Schedule"}</DialogTitle>
          <DialogDescription>Configure automated report delivery.</DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="schedule-template">Template</Label>
              <Select
                value={form.templateId}
                disabled={isEdit}
                onValueChange={(templateId) =>
                  setForm((current) => {
                    const template = templates.find((item) => item.id === templateId);
                    return {
                      ...current,
                      templateId,
                      name:
                        current.name.trim().length > 0
                          ? current.name
                          : template
                            ? `${template.name} schedule`
                            : current.name,
                    };
                  })
                }
              >
                <SelectTrigger id="schedule-template">
                  <SelectValue placeholder={selectedTemplateName} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-name">Name</Label>
              <Input
                id="schedule-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Monthly performance summary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-recipients">Recipients</Label>
            <Input
              id="schedule-recipients"
              value={emailInput}
              onChange={(event) => {
                setEmailInput(event.target.value);
                setEmailError(null);
              }}
              onKeyDown={handleEmailKeyDown}
              onBlur={() => addEmails(emailInput)}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData("text");
                if (/[\s,;]/.test(pasted)) {
                  event.preventDefault();
                  addEmails(pasted);
                }
              }}
              placeholder="name@example.com"
              type="email"
            />
            {form.recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={`Remove ${email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {emailError && <p className="text-sm text-destructive">{emailError}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="schedule-cadence">Cadence</Label>
              <Select
                value={form.schedule}
                onValueChange={(schedule: ScheduleFrequency) =>
                  setForm((current) => ({ ...current, schedule }))
                }
              >
                <SelectTrigger id="schedule-cadence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.schedule === "weekly" && (
              <div className="space-y-2">
                <Label htmlFor="schedule-weekday">Day</Label>
                <Select
                  value={form.dayOfWeek}
                  onValueChange={(dayOfWeek) => setForm((current) => ({ ...current, dayOfWeek }))}
                >
                  <SelectTrigger id="schedule-weekday">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.schedule === "monthly" && (
              <div className="space-y-2">
                <Label htmlFor="schedule-month-day">Day of Month</Label>
                <Input
                  id="schedule-month-day"
                  type="number"
                  min={1}
                  max={28}
                  value={form.dayOfMonth}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dayOfMonth: event.target.value }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={form.scheduleTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, scheduleTime: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Filters</Label>
            <ReportFiltersPanel
              filters={form.filters}
              onFiltersChange={(newFilters) =>
                setForm((current) => ({ ...current, filters: newFilters }))
              }
              teamMembers={teamMembers}
              branches={branches}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShareLinksSheet({
  open,
  onOpenChange,
  shares,
  templates,
  isLoading,
  onCopy,
  onRevoke,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shares: ReportShare[];
  templates: Map<string, ReportTemplate>;
  isLoading: boolean;
  onCopy: (share: ReportShare) => void;
  onRevoke: (share: ReportShare) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Shared Links</SheetTitle>
          <SheetDescription>Review public report links and revoke access.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </>
          )}

          {!isLoading && shares.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/50 bg-repwell-sage-100/10 p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <LinkSimple weight="duotone" className="h-6 w-6 text-repwell-teal-300" />
              </div>
              <h3 className="mb-2 font-medium">No Shared Links</h3>
              <p className="text-sm text-muted-foreground">Shared report URLs will appear here.</p>
            </div>
          )}

          {!isLoading &&
            shares.map((share) => {
              const template = templates.get(share.templateId);
              const shareUrl = buildShareUrl(share.shareToken);

              return (
                <div
                  key={share.id}
                  className="rounded-xl border border-border/60 bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="truncate font-medium text-heading">{share.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {template?.name || "Unknown template"} - Created{" "}
                        {formatDate(share.createdAt)}
                      </div>
                    </div>
                    <Badge variant="secondary">{share.accessCount} views</Badge>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                    <div>
                      Expires {share.expiresAt ? formatRelativeDate(share.expiresAt) : "Never"}
                      {share.expiresAt ? ` (${formatDate(share.expiresAt)})` : ""}
                    </div>
                    <div className="truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                      {shareUrl}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onCopy(share)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={shareUrl} target="_blank" rel="noreferrer">
                        <ArrowSquareOut className="mr-2 h-4 w-4" />
                        Open
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRevoke(share)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ShareReportDialog({
  open,
  onOpenChange,
  report,
  onShareCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: GeneratedReport | null;
  onShareCreated: (share: ReportShare) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [expiresInDays, setExpiresInDays] = React.useState("30");
  const [createdShare, setCreatedShare] = React.useState<ReportShare | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    if (!open || !report) return;
    setTitle(
      `${report.templateName} - ${formatReportDateRange(report.dateRange.start, report.dateRange.end)}`
    );
    setExpiresInDays("30");
    setCreatedShare(null);
  }, [open, report]);

  const shareUrl = createdShare ? buildShareUrl(createdShare.shareToken) : "";

  const handleCreateShare = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!report) return;

    if (!title.trim()) {
      toast({
        title: "Share not created",
        description: "Enter a title for the shared report.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const result = await createReportShare(
        report.templateId,
        title.trim(),
        report.dateRange,
        report.filters,
        Number(expiresInDays)
      );

      if (result.success && result.data) {
        setCreatedShare(result.data);
        onShareCreated(result.data);
        toast({
          title: "Shared link created",
          description: "The report URL is ready to copy.",
        });
      } else {
        toast({
          title: "Share not created",
          description: result.error || "Could not create the shared report link.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error creating share link:", err);
      toast({
        title: "Share not created",
        description: "Could not create the shared report link.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await copyText(shareUrl);
      toast({
        title: "Link copied",
        description: "The shared report URL is on your clipboard.",
      });
    } catch (err) {
      console.error("Error copying share URL:", err);
      toast({
        title: "Copy failed",
        description: "Could not copy the shared report URL.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>Create a public URL for the generated report.</DialogDescription>
        </DialogHeader>

        {createdShare ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted px-3 py-2 font-mono text-xs">
              {shareUrl}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Done
              </Button>
              <Button type="button" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy URL
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleCreateShare}>
            <div className="space-y-2">
              <Label htmlFor="share-title">Title</Label>
              <Input
                id="share-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-expiry">Expiry</Label>
              <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                <SelectTrigger id="share-expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {expiryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !report}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Link
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExportHistoryTable({
  exports,
  templates,
  teamMembers,
  isLoading,
}: {
  exports: ReportExport[];
  templates: Map<string, ReportTemplate>;
  teamMembers: Map<string, string>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (exports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-repwell-sage-100/10 p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10">
          <Download weight="duotone" className="h-7 w-7 text-repwell-teal-300" />
        </div>
        <h3 className="mb-2 text-lg font-medium">No Export History</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Recorded PDF, CSV, and JSON exports will appear here.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Date Range</TableHead>
          <TableHead>Rows</TableHead>
          <TableHead>Exported</TableHead>
          <TableHead>By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exports.map((item) => {
          const template = templates.get(item.templateId);
          const exportedBy = item.createdBy
            ? teamMembers.get(item.createdBy) || `User ${item.createdBy.slice(0, 8)}`
            : "Unknown";

          return (
            <TableRow key={item.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-heading">{item.fileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {template?.name || "Unknown template"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={item.exportFormat === "pdf" ? "default" : "secondary"}>
                  {item.exportFormat.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>{formatReportDateRange(item.dateRangeStart, item.dateRangeEnd)}</TableCell>
              <TableCell>{item.rowCount && item.rowCount > 0 ? item.rowCount : "-"}</TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <div>{formatDateTime(item.createdAt)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeDate(item.createdAt)}
                  </div>
                </div>
              </TableCell>
              <TableCell>{exportedBy}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
