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
    "Period": report.executiveSummary.periodLabel,
  });

  rows.push({
    Category: "Report Information",
    Metric: "Generated At",
    Value: format(report.generatedAt, "yyyy-MM-dd HH:mm:ss"),
    "Period": "",
  });

  // Executive summary metrics
  rows.push({
    Category: "Performance Metrics",
    Metric: "Total Reviews",
    Value: summary.totalReviews,
    "Period": summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "Average Rating",
    Value: summary.averageRating.toFixed(2),
    "Period": summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "NPS Score",
    Value: summary.npsScore,
    "Period": summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "CSAT Score",
    Value: `${summary.csatScore}%`,
    "Period": summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "Response Rate",
    Value: `${summary.responseRate.toFixed(1)}%`,
    "Period": summary.periodLabel,
  });

  rows.push({
    Category: "Performance Metrics",
    Metric: "Review Velocity (per month)",
    Value: summary.reviewVelocity.toFixed(1),
    "Period": summary.periodLabel,
  });

  // NPS breakdown
  if (report.npsBreakdown) {
    const nps = report.npsBreakdown;
    rows.push({ Category: "NPS Breakdown", Metric: "Promoters", Value: nps.promoters, "Period": "" });
    rows.push({ Category: "NPS Breakdown", Metric: "Passives", Value: nps.passives, "Period": "" });
    rows.push({ Category: "NPS Breakdown", Metric: "Detractors", Value: nps.detractors, "Period": "" });
    rows.push({ Category: "NPS Breakdown", Metric: "Promoter %", Value: `${nps.promoterPercentage.toFixed(1)}%`, "Period": "" });
    rows.push({ Category: "NPS Breakdown", Metric: "Passive %", Value: `${nps.passivePercentage.toFixed(1)}%`, "Period": "" });
    rows.push({ Category: "NPS Breakdown", Metric: "Detractor %", Value: `${nps.detractorPercentage.toFixed(1)}%`, "Period": "" });
  }

  // CSAT breakdown
  if (report.csatMetrics) {
    const csat = report.csatMetrics;
    rows.push({ Category: "CSAT Breakdown", Metric: "Satisfied Count", Value: csat.satisfiedCount, "Period": "" });
    rows.push({ Category: "CSAT Breakdown", Metric: "Neutral Count", Value: csat.neutralCount, "Period": "" });
    rows.push({ Category: "CSAT Breakdown", Metric: "Dissatisfied Count", Value: csat.dissatisfiedCount, "Period": "" });
    rows.push({ Category: "CSAT Breakdown", Metric: "Satisfied %", Value: `${csat.satisfiedPercentage.toFixed(1)}%`, "Period": "" });
  }

  // Response rate details
  if (report.responseRateMetrics) {
    const rr = report.responseRateMetrics;
    rows.push({ Category: "Response Rates", Metric: "Total Sent", Value: rr.totalSent, "Period": "" });
    rows.push({ Category: "Response Rates", Metric: "Completed", Value: rr.totalCompleted, "Period": "" });
    rows.push({ Category: "Response Rates", Metric: "Pending", Value: rr.totalPending, "Period": "" });
    rows.push({ Category: "Response Rates", Metric: "Expired", Value: rr.totalExpired, "Period": "" });
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

/**
 * Generate HTML for PDF export
 * This creates a printable HTML document that can be saved as PDF
 */
export async function generateReportHTML(
  report: GeneratedReport,
  organizationName: string
): Promise<ActionResult<string>> {
  try {
    const summary = report.executiveSummary;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.templateName} - ${organizationName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #18181b;
      background: #ffffff;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e4e4e7;
    }
    .header-left h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .header-left .subtitle {
      color: #71717a;
      font-size: 14px;
    }
    .header-right {
      text-align: right;
      color: #71717a;
      font-size: 14px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #18181b;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e4e7;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #f4f4f5;
      border-radius: 8px;
      padding: 20px;
    }
    .metric-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #71717a;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      color: #18181b;
    }
    .metric-change {
      font-size: 12px;
      margin-top: 4px;
    }
    .metric-change.positive {
      color: #16a34a;
    }
    .metric-change.negative {
      color: #dc2626;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e4e4e7;
    }
    th {
      background: #f4f4f5;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #71717a;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
    .status-excellent {
      background: #dcfce7;
      color: #166534;
    }
    .status-good {
      background: #dbeafe;
      color: #1e40af;
    }
    .status-needs_attention {
      background: #fef3c7;
      color: #92400e;
    }
    .status-at_risk {
      background: #fee2e2;
      color: #991b1b;
    }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f4f4f5;
    }
    .breakdown-label {
      color: #52525b;
    }
    .breakdown-value {
      font-weight: 600;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e4e4e7;
      text-align: center;
      color: #71717a;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${report.templateName}</h1>
      <div class="subtitle">${organizationName} • ${summary.periodLabel}</div>
    </div>
    <div class="header-right">
      <div>Generated: ${format(report.generatedAt, "MMM d, yyyy 'at' h:mm a")}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Executive Summary</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Reviews</div>
        <div class="metric-value">${summary.totalReviews}</div>
        ${summary.comparisonPeriod ? `<div class="metric-change ${summary.comparisonPeriod.reviewsChange >= 0 ? 'positive' : 'negative'}">${summary.comparisonPeriod.reviewsChange >= 0 ? '↑' : '↓'} ${Math.abs(summary.comparisonPeriod.reviewsChange)} vs prev period</div>` : ''}
      </div>
      <div class="metric-card">
        <div class="metric-label">Average Rating</div>
        <div class="metric-value">${summary.averageRating.toFixed(1)}</div>
        ${summary.comparisonPeriod ? `<div class="metric-change ${summary.comparisonPeriod.ratingChange >= 0 ? 'positive' : 'negative'}">${summary.comparisonPeriod.ratingChange >= 0 ? '↑' : '↓'} ${Math.abs(summary.comparisonPeriod.ratingChange).toFixed(2)}</div>` : ''}
      </div>
      <div class="metric-card">
        <div class="metric-label">NPS Score</div>
        <div class="metric-value">${summary.npsScore}</div>
        ${summary.comparisonPeriod ? `<div class="metric-change ${summary.comparisonPeriod.npsChange >= 0 ? 'positive' : 'negative'}">${summary.comparisonPeriod.npsChange >= 0 ? '↑' : '↓'} ${Math.abs(summary.comparisonPeriod.npsChange)}</div>` : ''}
      </div>
      <div class="metric-card">
        <div class="metric-label">CSAT Score</div>
        <div class="metric-value">${summary.csatScore}%</div>
        ${summary.comparisonPeriod ? `<div class="metric-change ${summary.comparisonPeriod.csatChange >= 0 ? 'positive' : 'negative'}">${summary.comparisonPeriod.csatChange >= 0 ? '↑' : '↓'} ${Math.abs(summary.comparisonPeriod.csatChange)}%</div>` : ''}
      </div>
      <div class="metric-card">
        <div class="metric-label">Response Rate</div>
        <div class="metric-value">${summary.responseRate.toFixed(1)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Monthly Velocity</div>
        <div class="metric-value">${summary.reviewVelocity.toFixed(1)}</div>
      </div>
    </div>
  </div>

  ${report.npsBreakdown ? `
  <div class="section">
    <h2 class="section-title">NPS Breakdown</h2>
    <div class="breakdown-row">
      <span class="breakdown-label">Promoters (9-10)</span>
      <span class="breakdown-value">${report.npsBreakdown.promoters} (${report.npsBreakdown.promoterPercentage.toFixed(1)}%)</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Passives (7-8)</span>
      <span class="breakdown-value">${report.npsBreakdown.passives} (${report.npsBreakdown.passivePercentage.toFixed(1)}%)</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Detractors (0-6)</span>
      <span class="breakdown-value">${report.npsBreakdown.detractors} (${report.npsBreakdown.detractorPercentage.toFixed(1)}%)</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Total Responses</span>
      <span class="breakdown-value">${report.npsBreakdown.totalResponses}</span>
    </div>
  </div>
  ` : ''}

  ${report.csatMetrics ? `
  <div class="section">
    <h2 class="section-title">Customer Satisfaction</h2>
    <div class="breakdown-row">
      <span class="breakdown-label">Satisfied (4-5 stars)</span>
      <span class="breakdown-value">${report.csatMetrics.satisfiedCount} (${report.csatMetrics.satisfiedPercentage.toFixed(1)}%)</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Neutral (3 stars)</span>
      <span class="breakdown-value">${report.csatMetrics.neutralCount} (${report.csatMetrics.neutralPercentage.toFixed(1)}%)</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Dissatisfied (1-2 stars)</span>
      <span class="breakdown-value">${report.csatMetrics.dissatisfiedCount} (${report.csatMetrics.dissatisfiedPercentage.toFixed(1)}%)</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Average Rating</span>
      <span class="breakdown-value">${report.csatMetrics.averageRating.toFixed(2)} / 5.0</span>
    </div>
  </div>
  ` : ''}

  ${report.teamComparison && report.teamComparison.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Team Performance</h2>
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Branch</th>
          <th>Reviews</th>
          <th>Rating</th>
          <th>NPS</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.teamComparison.map(member => `
        <tr>
          <td>${member.rank}</td>
          <td>${member.name}</td>
          <td>${member.branch || 'N/A'}</td>
          <td>${member.totalReviews}</td>
          <td>${member.averageRating.toFixed(1)}</td>
          <td>${member.npsScore}</td>
          <td><span class="status-badge status-${member.performanceStatus}">${member.performanceStatus.replace('_', ' ')}</span></td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by RepWell • ${format(new Date(), "MMMM d, yyyy")}</p>
  </div>
</body>
</html>
`;

    return { success: true, data: html };
  } catch (error) {
    console.error("Error generating HTML:", error);
    return { success: false, error: "Failed to generate report HTML" };
  }
}
