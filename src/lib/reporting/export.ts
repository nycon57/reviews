"use server";

/**
 * Report Export Functions
 * CSV and PDF export functionality for reports
 */

import Papa from "papaparse";
import { format } from "date-fns";
import type { GeneratedReport, ReportCSVRow, TeamComparisonRow } from "./types";
import type { ActionResult } from "@/lib/reviews/types";

/**
 * Export report data to CSV format
 */
export async function exportReportToCSV(
  report: GeneratedReport,
  exportType: "summary" | "team" | "trends" = "summary"
): Promise<ActionResult<string>> {
  try {
    let data: ReportCSVRow[] = [];

    switch (exportType) {
      case "summary":
        data = generateSummaryCSV(report);
        break;
      case "team":
        data = generateTeamCSV(report);
        break;
      case "trends":
        data = generateTrendsCSV(report);
        break;
    }

    if (data.length === 0) {
      return { success: false, error: "No data available for export" };
    }

    const csv = Papa.unparse(data, {
      header: true,
      quotes: true,
    });

    return { success: true, data: csv };
  } catch (error) {
    console.error("Error exporting to CSV:", error);
    return { success: false, error: "Failed to generate CSV" };
  }
}

/**
 * Generate summary CSV data
 */
function generateSummaryCSV(report: GeneratedReport): ReportCSVRow[] {
  const rows: ReportCSVRow[] = [];
  const summary = report.executiveSummary;

  // Report metadata
  rows.push({
    Category: "Report Information",
    Metric: "Report Name",
    Value: report.templateName,
    Period: report.executiveSummary.periodLabel,
  });

  rows.push({
    Category: "Report Information",
    Metric: "Generated At",
    Value: format(report.generatedAt, "yyyy-MM-dd HH:mm:ss"),
    Period: "",
  });

  // Executive summary metrics
  rows.push({
    Category: "Performance Metrics",
    Metric: "Total Reviews",
    Value: summary.totalReviews,
    Period: summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "Average Rating",
    Value: summary.averageRating.toFixed(2),
    Period: summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "NPS Score",
    Value: summary.npsScore,
    Period: summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "CSAT Score",
    Value: `${summary.csatScore}%`,
    Period: summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "Response Rate",
    Value: `${summary.responseRate.toFixed(1)}%`,
    Period: summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "Review Velocity (per month)",
    Value: summary.reviewVelocity.toFixed(1),
    Period: summary.periodLabel,
  });

  // NPS breakdown
  if (report.npsBreakdown) {
    const nps = report.npsBreakdown;
    rows.push({ Category: "NPS Breakdown", Metric: "Promoters", Value: nps.promoters, Period: "" });
    rows.push({ Category: "NPS Breakdown", Metric: "Passives", Value: nps.passives, Period: "" });
    rows.push({
      Category: "NPS Breakdown",
      Metric: "Detractors",
      Value: nps.detractors,
      Period: "",
    });
    rows.push({
      Category: "NPS Breakdown",
      Metric: "Promoter %",
      Value: `${nps.promoterPercentage.toFixed(1)}%`,
      Period: "",
    });
    rows.push({
      Category: "NPS Breakdown",
      Metric: "Passive %",
      Value: `${nps.passivePercentage.toFixed(1)}%`,
      Period: "",
    });
    rows.push({
      Category: "NPS Breakdown",
      Metric: "Detractor %",
      Value: `${nps.detractorPercentage.toFixed(1)}%`,
      Period: "",
    });
  }

  // CSAT breakdown
  if (report.csatMetrics) {
    const csat = report.csatMetrics;
    rows.push({
      Category: "CSAT Breakdown",
      Metric: "Satisfied Count",
      Value: csat.satisfiedCount,
      Period: "",
    });
    rows.push({
      Category: "CSAT Breakdown",
      Metric: "Neutral Count",
      Value: csat.neutralCount,
      Period: "",
    });
    rows.push({
      Category: "CSAT Breakdown",
      Metric: "Dissatisfied Count",
      Value: csat.dissatisfiedCount,
      Period: "",
    });
    rows.push({
      Category: "CSAT Breakdown",
      Metric: "Satisfied %",
      Value: `${csat.satisfiedPercentage.toFixed(1)}%`,
      Period: "",
    });
  }

  // Response rate details
  if (report.responseRateMetrics) {
    const rr = report.responseRateMetrics;
    rows.push({
      Category: "Response Rates",
      Metric: "Total Sent",
      Value: rr.totalSent,
      Period: "",
    });
    rows.push({
      Category: "Response Rates",
      Metric: "Completed",
      Value: rr.totalCompleted,
      Period: "",
    });
    rows.push({
      Category: "Response Rates",
      Metric: "Pending",
      Value: rr.totalPending,
      Period: "",
    });
    rows.push({
      Category: "Response Rates",
      Metric: "Expired",
      Value: rr.totalExpired,
      Period: "",
    });
  }

  return rows;
}

/**
 * Generate team comparison CSV data
 */
function generateTeamCSV(report: GeneratedReport): ReportCSVRow[] {
  if (!report.teamComparison || report.teamComparison.length === 0) {
    return [];
  }

  return report.teamComparison.map((member: TeamComparisonRow) => ({
    Rank: member.rank,
    Name: member.name,
    Branch: member.branch || "N/A",
    "Total Reviews": member.totalReviews,
    "Average Rating": member.averageRating.toFixed(2),
    "NPS Score": member.npsScore,
    "CSAT Score": `${member.csatScore.toFixed(1)}%`,
    "Response Rate": `${member.responseRate.toFixed(1)}%`,
    "Reputation Score": member.reputationScore,
    "Performance Status": member.performanceStatus,
  }));
}

/**
 * Generate trends CSV data
 */
function generateTrendsCSV(report: GeneratedReport): ReportCSVRow[] {
  if (!report.trends) {
    return [];
  }

  const rows: ReportCSVRow[] = [];

  // Combine all trends into rows
  const maxLength = Math.max(
    report.trends.nps.length,
    report.trends.csat.length,
    report.trends.reviews.length
  );

  for (let i = 0; i < maxLength; i++) {
    const npsPoint = report.trends.nps[i];
    const csatPoint = report.trends.csat[i];
    const reviewsPoint = report.trends.reviews[i];

    rows.push({
      Date: npsPoint?.date || csatPoint?.date || reviewsPoint?.date || "",
      "NPS Score": npsPoint?.value ?? null,
      "CSAT Score": csatPoint?.value ?? null,
      "Review Count": reviewsPoint?.value ?? null,
    });
  }

  return rows;
}
