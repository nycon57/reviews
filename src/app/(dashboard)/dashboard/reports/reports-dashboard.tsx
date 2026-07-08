"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Clock,
  DownloadSimple as Download,
  FileText,
  Plus,
  ShareNetwork as Share2,
  SpinnerGap as Loader2,
  Trash,
} from "@phosphor-icons/react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelector } from "@/components/reporting/template-selector";
import { DateRangeSelector } from "@/components/reporting/date-range-selector";
import { ReportFiltersPanel } from "@/components/reporting/report-filters";
import { ExportOptions } from "@/components/reporting/export-options";
import { ExportHistoryTable } from "@/components/reporting/export-history-table";
import { ScheduleReportDialog } from "@/components/reporting/schedule-report-dialog";
import { ScheduledReportsTable } from "@/components/reporting/scheduled-reports-table";
import { ShareLinksSheet } from "@/components/reporting/share-links-sheet";
import { ShareReportDialog } from "@/components/reporting/share-report-dialog";
import { useReportExports } from "@/components/reporting/use-report-exports";
import { useReportShares } from "@/components/reporting/use-report-shares";
import { useScheduledReports } from "@/components/reporting/use-scheduled-reports";
import { exportAndRecordReport, generateReport } from "@/lib/reporting";
import type {
  ExportFormat,
  GeneratedReport,
  ReportDateRange,
  ReportFilters as ReportFiltersType,
  ReportTemplate,
} from "@/lib/reporting/types";
import {
  downloadBase64File,
  downloadTextFile,
  runReportAction,
  type ScheduleDialogMode,
} from "@/lib/reporting/utils";

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

export function ReportsDashboard({ templates, teamMembers, branches }: ReportsDashboardProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = React.useState<ReportTemplate | null>(
    templates.find((t) => t.isDefault) || templates[0] || null
  );
  const [dateRange, setDateRange] = React.useState<ReportDateRange>(() => ({
    preset: "last_30_days",
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  }));
  const [filters, setFilters] = React.useState<ReportFiltersType>({});
  const [generatedReport, setGeneratedReport] = React.useState<GeneratedReport | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("generate");
  const [scheduleDialogMode, setScheduleDialogMode] = React.useState<ScheduleDialogMode | null>(
    null
  );
  const [sharesOpen, setSharesOpen] = React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const scheduleSectionRef = React.useRef<HTMLDivElement | null>(null);

  const {
    scheduledReports,
    isLoadingSchedules,
    updatingScheduleId,
    scheduleToDelete,
    setScheduleToDelete,
    ensureSchedulesLoaded,
    handleScheduleSaved,
    handleToggleSchedule,
    handleDeleteSchedule,
  } = useScheduledReports();

  const { exportHistory, isLoadingExports, ensureExportsLoaded, prependExport } =
    useReportExports();

  const {
    shares,
    isLoadingShares,
    shareToRevoke,
    revokingShareId,
    setShareToRevoke,
    loadShares,
    handleShareCreated,
    handleCopyShare,
    handleRevokeShare,
  } = useReportShares();

  const templateById = React.useMemo(() => {
    return new Map(templates.map((template) => [template.id, template]));
  }, [templates]);

  const teamMemberById = React.useMemo(() => {
    return new Map(teamMembers.map((member) => [member.id, member.full_name]));
  }, [teamMembers]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "scheduled") {
      ensureSchedulesLoaded();
    }
    if (value === "history") {
      ensureExportsLoaded();
    }
  };

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
      toast({
        title: "Select a report template",
        description: "Choose a template before generating a report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    await runReportAction(() => generateReport(selectedTemplate.id, dateRange, filters), {
      toast,
      successTitle: "Report generated",
      successDescription: (report) => `${report.templateName} is ready to review.`,
      errorTitle: "Report generation failed",
      errorDescription: "An unexpected error occurred.",
      requireData: true,
      logLabel: "Error generating report:",
      onSuccess: setGeneratedReport,
    });

    setIsGenerating(false);
  };

  const handleExport = async (format: ExportFormat) => {
    if (!generatedReport) {
      toast({
        title: "Generate a report first",
        description: "Exports are available after a report has been generated.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    await runReportAction(
      () =>
        exportAndRecordReport(
          generatedReport.templateId,
          generatedReport.dateRange,
          format,
          generatedReport.filters,
          { report: generatedReport }
        ),
      {
        toast,
        successTitle: "Export ready",
        successDescription: (payload) => `${payload.filename} was downloaded and recorded.`,
        errorTitle: "Export failed",
        errorDescription: `Failed to export ${format.toUpperCase()}.`,
        requireData: true,
        logLabel: "Error exporting report:",
        onSuccess: (payload) => {
          if (payload.encoding === "base64") {
            downloadBase64File(payload.data, payload.filename, payload.mimeType);
          } else {
            downloadTextFile(payload.data, payload.filename, payload.mimeType);
          }
          prependExport(payload.exportRecord);
        },
      }
    );

    setIsExporting(false);
  };

  const handleScheduleButtonClick = () => {
    handleTabChange("scheduled");
    window.requestAnimationFrame(() => scheduleSectionRef.current?.focus());
  };

  const handleSharedLinksOpenChange = (open: boolean) => {
    setSharesOpen(open);
    if (open) {
      void loadShares();
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
        key={
          scheduleDialogMode
            ? scheduleDialogMode.type === "edit"
              ? `edit-${scheduleDialogMode.report.id}`
              : "create"
            : "closed"
        }
        mode={scheduleDialogMode}
        templates={templates}
        selectedTemplate={selectedTemplate}
        teamMembers={teamMembers}
        branches={branches}
        onOpenChange={(open) => {
          if (!open) setScheduleDialogMode(null);
        }}
        onSaved={(report, mode) => {
          handleScheduleSaved(report, mode);
          setScheduleDialogMode(null);
        }}
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
        key={shareDialogOpen ? "open" : "closed"}
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
