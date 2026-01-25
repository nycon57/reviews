"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  DownloadSimple as Download,
  FileCode as FileJson,
  FileXls as FileSpreadsheet,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import type { AIInsightsData } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";

interface ExportInsightsButtonProps {
  data: AIInsightsData;
  loanOfficerName?: string;
  organizationName?: string;
}

export function ExportInsightsButton({
  data,
  loanOfficerName,
  organizationName = "Organization",
}: ExportInsightsButtonProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const generateCSV = () => {
    const rows: string[][] = [];

    // Header
    rows.push(["AI Insights Report"]);
    rows.push([`Generated: ${new Date().toLocaleDateString()}`]);
    rows.push([`Period: ${new Date(data.periodStart).toLocaleDateString()} - ${new Date(data.periodEnd).toLocaleDateString()}`]);
    if (loanOfficerName) rows.push([`Professional: ${loanOfficerName}`]);
    rows.push([]);

    // Sentiment Distribution
    rows.push(["Sentiment Distribution"]);
    rows.push(["Sentiment", "Count", "Percentage"]);
    const total = data.sentimentDistribution.total;
    rows.push(["Positive", String(data.sentimentDistribution.positive), `${total > 0 ? Math.round((data.sentimentDistribution.positive / total) * 100) : 0}%`]);
    rows.push(["Neutral", String(data.sentimentDistribution.neutral), `${total > 0 ? Math.round((data.sentimentDistribution.neutral / total) * 100) : 0}%`]);
    rows.push(["Negative", String(data.sentimentDistribution.negative), `${total > 0 ? Math.round((data.sentimentDistribution.negative / total) * 100) : 0}%`]);
    rows.push([]);

    // Theme Frequencies
    rows.push(["Theme Analysis"]);
    rows.push(["Theme", "Count", "Percentage", "Positive", "Neutral", "Negative", "Trend"]);
    for (const theme of data.themeFrequencies) {
      rows.push([
        theme.theme,
        String(theme.count),
        `${theme.percentage}%`,
        String(theme.sentimentBreakdown.positive),
        String(theme.sentimentBreakdown.neutral),
        String(theme.sentimentBreakdown.negative),
        theme.trend,
      ]);
    }
    rows.push([]);

    // Industry Benchmarks
    rows.push(["Industry Benchmarks"]);
    rows.push(["Metric", "Your Value", "Industry Average", "Top Performers", "Percentile", "Status"]);
    for (const benchmark of data.benchmarks) {
      rows.push([
        benchmark.metric,
        String(benchmark.yourValue),
        String(benchmark.industryAverage),
        String(benchmark.topPerformers),
        `${benchmark.percentile}th`,
        benchmark.trend,
      ]);
    }
    rows.push([]);

    // Summary
    if (data.summary) {
      rows.push(["AI Summary"]);
      rows.push([data.summary.summary]);
      rows.push([]);
      rows.push(["Highlights"]);
      for (const highlight of data.summary.highlights) {
        rows.push([`- ${highlight}`]);
      }
      rows.push([]);
      rows.push(["Areas for Improvement"]);
      for (const area of data.summary.areasOfImprovement) {
        rows.push([`- ${area}`]);
      }
    }

    // Convert to CSV string
    const csvContent = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return csvContent;
  };

  const generateJSON = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      loanOfficerName,
      organizationName,
      sentimentDistribution: data.sentimentDistribution,
      sentimentTrend: data.sentimentTrend,
      themeFrequencies: data.themeFrequencies,
      topKeyPhrases: data.topKeyPhrases,
      benchmarks: data.benchmarks,
      summary: data.summary,
      recommendations: data.recommendations,
    };

    return JSON.stringify(report, null, 2);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      const nameSlug = loanOfficerName
        ? loanOfficerName.toLowerCase().replace(/\s+/g, "-")
        : "organization";

      if (format === "csv") {
        const csv = generateCSV();
        downloadFile(csv, `ai-insights-${nameSlug}-${date}.csv`, "text/csv");
        toast({
          title: "Export successful",
          description: "CSV report downloaded",
        });
      } else {
        const json = generateJSON();
        downloadFile(json, `ai-insights-${nameSlug}-${date}.json`, "application/json");
        toast({
          title: "Export successful",
          description: "JSON report downloaded",
        });
      }
    } catch {
      toast({
        title: "Export failed",
        description: "Could not generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
