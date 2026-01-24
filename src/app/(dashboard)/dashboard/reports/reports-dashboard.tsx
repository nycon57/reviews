"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  FileText,
  DownloadSimple as Download,
  Clock,
  ShareNetwork as Share2,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateSelector } from "@/components/reporting/template-selector";
import { DateRangeSelector } from "@/components/reporting/date-range-selector";
import { ReportFiltersPanel } from "@/components/reporting/report-filters";
import { ExportOptions } from "@/components/reporting/export-options";
import { generateReport, exportReportToCSV, generateReportHTML } from "@/lib/reporting";

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
import type {
  ReportTemplate,
  GeneratedReport,
  ReportDateRange,
  ReportFilters as ReportFiltersType,
} from "@/lib/reporting/types";

interface ReportsDashboardProps {
  templates: ReportTemplate[];
  loanOfficers: Array<{ id: string; full_name: string; branch: string | null }>;
  branches: string[];
}

export function ReportsDashboard({
  templates,
  loanOfficers,
  branches,
}: ReportsDashboardProps) {
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

  const handleDateRangeChange = (range: ReportDateRange) => {
    setDateRange(range);
    setGeneratedReport(null); // Clear previous report when parameters change
  };

  const handleFiltersChange = (newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    setGeneratedReport(null); // Clear previous report when parameters change
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      setError("Please select a report template");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateReport(
        selectedTemplate.id,
        dateRange,
        filters
      );

      if (result.success && result.data) {
        setGeneratedReport(result.data);
      } else {
        setError(result.error || "Failed to generate report");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "csv" | "pdf" | "json") => {
    if (!generatedReport) {
      setError("Please generate a report first");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const baseFilename = `report-${generatedReport.templateName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}`;

      if (format === "csv") {
        const result = await exportReportToCSV(generatedReport, "summary");
        if (result.success && result.data) {
          downloadFile(result.data, `${baseFilename}.csv`, "text/csv");
        } else {
          setError(result.error || "Failed to export CSV");
        }
      } else if (format === "pdf") {
        const result = await generateReportHTML(generatedReport, "RepWell");
        if (result.success && result.data) {
          // Download as HTML file that can be opened and printed to PDF
          downloadFile(result.data, `${baseFilename}.html`, "text/html");
        } else {
          setError(result.error || "Failed to generate PDF");
        }
      } else if (format === "json") {
        downloadFile(
          JSON.stringify(generatedReport, null, 2),
          `${baseFilename}.json`,
          "application/json"
        );
      }
    } catch (err) {
      console.error("Error exporting report:", err);
      setError("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export performance reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Scheduled
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Shared Links
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
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
          {/* Configuration Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Template Selection */}
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

            {/* Date Range & Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Parameters</CardTitle>
                <CardDescription>
                  Set the date range and filters for your report
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Date Range
                  </label>
                  <DateRangeSelector
                    value={dateRange}
                    onChange={handleDateRangeChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Filters
                  </label>
                  <ReportFiltersPanel
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    loanOfficers={loanOfficers}
                    branches={branches}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGenerateReport}
                disabled={!selectedTemplate || isGenerating}
              >
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
              <ExportOptions
                onExport={handleExport}
                disabled={isExporting}
              />
            )}
          </div>

          {/* Generated Report View */}
          {generatedReport && (
            <ReportViewer report={generatedReport} />
          )}

          {/* Empty State */}
          {!generatedReport && !isGenerating && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Report Generated</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Select a template, configure your date range and filters, then click
                  &quot;Generate Report&quot; to create your report.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Manage your automated report delivery schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                  Set up automated report delivery to receive reports via email on a
                  daily, weekly, or monthly basis.
                </p>
                <Button variant="outline">
                  Create Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>
                View your previously exported reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg">
                <Download className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Export History</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Your exported reports will appear here for easy access and
                  re-downloading.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
