"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Download,
  FileCode2,
  Globe,
  Shield,
  EyeOff,
  Bell,
  FileText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

import { BulkValidation } from "./bulk-validation";
import { ValidationPanel } from "./validation-panel";
import { StructuredDataPreview } from "./structured-data-preview";
import { SerpPreview } from "./serp-preview";

import {
  bulkValidateWidgets,
  getWidgetSeoData,
  exportValidationCsv,
  exportValidationPdf,
  getValidationAlerts,
  type BulkValidationReport,
  type WidgetSeoData,
  type ValidationAlert,
} from "@/lib/widgets/seo-actions";

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SeoDashboard() {
  const [report, setReport] = useState<BulkValidationReport | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<WidgetSeoData | null>(
    null
  );
  const [alerts, setAlerts] = useState<ValidationAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [isLoading, startTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();

  const loadReport = useCallback(() => {
    startTransition(async () => {
      const result = await bulkValidateWidgets();
      if (result.success) {
        setReport(result.data);
      } else {
        toast({
          title: "Validation failed",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }, []);

  const loadAlerts = useCallback(() => {
    startTransition(async () => {
      const result = await getValidationAlerts();
      if (result.success) {
        setAlerts(result.data);
      }
    });
  }, []);

  useEffect(() => {
    loadReport();
    loadAlerts();
  }, [loadReport, loadAlerts]);

  const loadWidgetDetail = useCallback((configId: string) => {
    setSelectedWidgetId(configId);
    startTransition(async () => {
      const result = await getWidgetSeoData(configId);
      if (result.success) {
        setSelectedWidget(result.data);
      } else {
        toast({
          title: "Failed to load widget",
          description: result.error,
          variant: "destructive",
        });
        setSelectedWidgetId(null);
      }
    });
  }, []);

  const handleExportCsv = () => {
    startExportTransition(async () => {
      const result = await exportValidationCsv();
      if (result.success) {
        const blob = new Blob([result.data], { type: "text/csv" });
        downloadBlob(blob, `seo-validation-report-${new Date().toISOString().split("T")[0]}.csv`);
      }
    });
  };

  const handleExportPdf = () => {
    startExportTransition(async () => {
      const result = await exportValidationPdf();
      if (result.success) {
        const blob = new Blob([result.data], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.addEventListener("load", () => {
            printWindow.print();
          });
        }
        // Clean up after a delay to allow the print dialog to load
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    });
  };

  const handleBackToOverview = () => {
    setSelectedWidgetId(null);
    setSelectedWidget(null);
  };

  // Widget detail view
  if (selectedWidgetId && selectedWidget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToOverview}>
            &larr; Back to overview
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            {selectedWidget.widgetName}
          </h1>
        </div>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList variant="underline">
            <TabsTrigger variant="underline" value="preview">
              <FileCode2 size={14} className="mr-1.5" />
              Structured Data
            </TabsTrigger>
            <TabsTrigger variant="underline" value="validation">
              <Shield size={14} className="mr-1.5" />
              Validation
            </TabsTrigger>
            <TabsTrigger variant="underline" value="serp">
              <Search size={14} className="mr-1.5" />
              SERP Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <StructuredDataPreview data={selectedWidget} />
          </TabsContent>

          <TabsContent value="validation">
            <ValidationPanel
              data={selectedWidget}
              configId={selectedWidgetId}
              onRevalidate={() => loadWidgetDetail(selectedWidgetId)}
              onDataUpdate={setSelectedWidget}
            />
          </TabsContent>

          <TabsContent value="serp">
            <SerpPreview data={selectedWidget} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Loading state for widget detail
  if (selectedWidgetId && !selectedWidget) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const hasNoWidgets = !isLoading && report && report.total === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">
            SEO & Structured Data
          </h1>
          <p className="text-sm text-muted-foreground">
            Validate JSON-LD output and monitor rich snippet readiness
          </p>
        </div>
        <div className="flex items-center gap-3">
          {alerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => setShowAlerts(!showAlerts)}
            >
              <Bell size={14} />
              {alerts.length} Alert{alerts.length !== 1 ? "s" : ""}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportCsv}
            disabled={isExporting || !report}
          >
            <Download size={14} />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportPdf}
            disabled={isExporting || !report}
          >
            <FileText size={14} />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={loadReport}
            disabled={isLoading}
          >
            <Shield size={14} />
            Revalidate All
          </Button>
        </div>
      </div>

      {/* Validation alerts banner */}
      {showAlerts && alerts.length > 0 && (
        <ValidationAlertsBanner
          alerts={alerts}
          onSelectWidget={loadWidgetDetail}
          onDismiss={() => setShowAlerts(false)}
        />
      )}

      {/* Empty state */}
      {hasNoWidgets ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 flex items-center justify-center text-repwell-teal-300 mb-4">
            <FileCode2 size={28} />
          </div>
          <h2 className="text-lg font-semibold text-heading mb-2">
            No widgets to validate
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Enable structured data on a widget to validate its JSON-LD and
            track rich snippet readiness.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <SeoSummaryCards report={report} isLoading={isLoading} />

          {/* Bulk validation table */}
          <BulkValidation
            report={report}
            isLoading={isLoading}
            onSelectWidget={loadWidgetDetail}
          />

          {/* Search Console guidance */}
          <SearchConsoleGuidance />
        </>
      )}
    </div>
  );
}

// ── Validation Alerts Banner ─────────────────────────────────────────

function ValidationAlertsBanner({
  alerts,
  onSelectWidget,
  onDismiss,
}: {
  alerts: ValidationAlert[];
  onSelectWidget: (configId: string) => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-red-600" />
            <h3 className="text-sm font-semibold text-red-800">
              Validation Alerts
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-red-600 hover:text-red-800"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
        <p className="text-xs text-red-700 mb-3">
          These widgets have validation errors after recent changes:
        </p>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <button
              key={alert.configId}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-card border border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700/50 transition-colors text-left"
              onClick={() => onSelectWidget(alert.configId)}
            >
              <div>
                <p className="text-sm font-medium text-heading">
                  {alert.widgetName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {alert.newErrors} error{alert.newErrors !== 1 ? "s" : ""}{" "}
                  detected
                </p>
              </div>
              <XCircle size={14} className="text-red-600 shrink-0" />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Summary Cards ────────────────────────────────────────────────────

function SeoSummaryCards({
  report,
  isLoading,
}: {
  report: BulkValidationReport | null;
  isLoading: boolean;
}) {
  const CARDS = [
    {
      key: "total" as const,
      label: "Total Widgets",
      icon: Globe,
      getValue: (r: BulkValidationReport) => r.total,
    },
    {
      key: "valid" as const,
      label: "Valid",
      icon: CheckCircle2,
      getValue: (r: BulkValidationReport) => r.valid,
      color: "text-emerald-600",
    },
    {
      key: "warnings" as const,
      label: "Warnings",
      icon: AlertTriangle,
      getValue: (r: BulkValidationReport) => r.warnings,
      color: "text-amber-600",
    },
    {
      key: "errors" as const,
      label: "Errors",
      icon: XCircle,
      getValue: (r: BulkValidationReport) => r.errors,
      color: "text-red-600",
    },
    {
      key: "disabled" as const,
      label: "Disabled",
      icon: EyeOff,
      getValue: (r: BulkValidationReport) => r.disabled,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CARDS.map((card) => (
          <Card key={card.key} className="border-border">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const value = report ? card.getValue(report) : 0;
        return (
          <Card
            key={card.key}
            className="border-border bg-card hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 flex items-center justify-center text-repwell-teal-300">
                  <Icon size={16} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </span>
              </div>
              <p
                className={`text-2xl font-bold tracking-tight ${card.color ?? "text-heading"}`}
              >
                {value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Search Console Guidance ──────────────────────────────────────────

function SearchConsoleGuidance() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 flex items-center justify-center text-repwell-teal-300 shrink-0">
            <Search size={20} />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-heading">
              Google Search Console Integration
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Submit your widget pages to Google for indexing and rich snippet
              eligibility:
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                Open{" "}
                <span className="font-medium text-label">
                  Google Search Console
                </span>{" "}
                and verify ownership of your domain.
              </li>
              <li>
                Navigate to <strong>URL Inspection</strong> and enter the page
                URL where your widget is embedded.
              </li>
              <li>
                Click <strong>Request Indexing</strong> to submit the page with
                structured data.
              </li>
              <li>
                Use the <strong>Rich Results Test</strong> to verify your
                structured data renders correctly.
              </li>
              <li>
                Monitor the{" "}
                <strong>Enhancements &gt; Review Snippets</strong> report for
                rich snippet status.
              </li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
