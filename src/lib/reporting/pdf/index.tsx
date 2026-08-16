import type { ReactNode } from "react";
import { existsSync } from "fs";
import { join } from "path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { format } from "date-fns";
import { brandColors } from "@/lib/brand/colors";
import { PERFORMANCE_STATUS_META } from "@/lib/reporting/templates";
import type { GeneratedReport, TeamComparisonRow } from "@/lib/reporting/types";

const COLORS = {
  teal500: brandColors.repwell.teal[500],
  teal400: brandColors.repwell.teal[400],
  teal300: brandColors.repwell.teal[300],
  sage200: brandColors.repwell.sage[200],
  sage100: brandColors.repwell.sage[100],
  background: brandColors.background.subtle,
  muted: brandColors.background.muted,
  border: brandColors.border.default,
  amber: brandColors.accent.warning,
  coral: brandColors.accent.error,
  white: brandColors.background.white,
};

let headingFontFamily = "Helvetica";

try {
  const erstoriaPath = join(process.cwd(), "public/fonts/Erstoria.otf");
  if (existsSync(erstoriaPath)) {
    Font.register({
      family: "Erstoria",
      src: erstoriaPath,
      fontWeight: "normal",
    });
    headingFontFamily = "Erstoria";
  }
} catch (error) {
  console.error("Failed to register Erstoria for report PDF:", error);
}

export const reportPdfHeadingFontFamily = headingFontFamily;

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingHorizontal: 36,
    paddingBottom: 48,
    backgroundColor: COLORS.white,
    color: COLORS.teal500,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.sage100,
    paddingBottom: 18,
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orgName: {
    color: COLORS.teal300,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  generatedAt: {
    color: COLORS.teal300,
    fontSize: 8,
    textAlign: "right",
  },
  title: {
    fontFamily: headingFontFamily,
    color: COLORS.teal500,
    fontSize: 28,
    lineHeight: 1.05,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.teal400,
    fontSize: 11,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: headingFontFamily,
    color: COLORS.teal500,
    fontSize: 17,
    marginBottom: 10,
  },
  sectionDescription: {
    color: COLORS.teal300,
    fontSize: 9,
    marginBottom: 10,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  statCard: {
    width: "33.333%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  statCardInner: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 78,
  },
  statLabel: {
    color: COLORS.teal300,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  statValue: {
    fontFamily: headingFontFamily,
    color: COLORS.teal500,
    fontSize: 23,
    lineHeight: 1,
  },
  statChange: {
    color: COLORS.teal300,
    fontSize: 8,
    marginTop: 7,
  },
  twoColumnGrid: {
    flexDirection: "row",
    marginHorizontal: -5,
  },
  halfColumn: {
    width: "50%",
    paddingHorizontal: 5,
  },
  panel: {
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  breakdownRow: {
    marginBottom: 9,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rowLabel: {
    color: COLORS.teal400,
    fontSize: 9,
  },
  rowValue: {
    color: COLORS.teal500,
    fontSize: 9,
    fontWeight: "bold",
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.muted,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  summaryLine: {
    color: COLORS.teal300,
    fontSize: 8,
    marginTop: 8,
  },
  table: {
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    minHeight: 27,
  },
  tableCell: {
    paddingVertical: 7,
    paddingHorizontal: 6,
    fontSize: 8,
  },
  tableHeadCell: {
    color: COLORS.teal300,
    fontSize: 7,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  right: {
    textAlign: "right",
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 7,
    textTransform: "capitalize",
    alignSelf: "flex-start",
  },
  trendGrid: {
    flexDirection: "row",
    marginHorizontal: -5,
  },
  trendColumn: {
    width: "33.333%",
    paddingHorizontal: 5,
  },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    paddingVertical: 5,
  },
  footerRule: {
    position: "absolute",
    bottom: 42,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 1,
  },
  footerBrand: {
    position: "absolute",
    bottom: 24,
    left: 36,
    color: COLORS.teal300,
    fontSize: 8,
  },
  footerPage: {
    position: "absolute",
    bottom: 24,
    left: 456,
    width: 120,
    color: COLORS.teal300,
    fontSize: 8,
    textAlign: "right",
  },
});

function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatPercent(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}%`;
}

function formatChange(value: number | undefined, suffix = ""): string | null {
  if (value === undefined) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, Math.abs(value) < 10 && value !== 0 ? 1 : 0)}${suffix} vs previous period`;
}

function metricCards(report: GeneratedReport) {
  const summary = report.executiveSummary;
  const comparison = summary.comparisonPeriod;

  return [
    {
      label: "Total Reviews",
      value: formatNumber(summary.totalReviews),
      change: formatChange(comparison?.reviewsChange),
    },
    {
      label: "Average Rating",
      value: formatNumber(summary.averageRating, 1),
      change: formatChange(comparison?.ratingChange),
    },
    {
      label: "NPS Score",
      value: formatNumber(summary.npsScore),
      change: formatChange(comparison?.npsChange),
    },
    {
      label: "CSAT Score",
      value: formatPercent(summary.csatScore, 0),
      change: formatChange(comparison?.csatChange, "%"),
    },
    {
      label: "Response Rate",
      value: formatPercent(summary.responseRate, 1),
      change: "Survey completion",
    },
    {
      label: "Velocity",
      value: formatNumber(summary.reviewVelocity, 1),
      change: "Reviews per month",
    },
  ];
}

function boundedPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function BreakdownRow({
  label,
  count,
  percent,
  color,
}: {
  label: string;
  count: number;
  percent: number;
  color: string;
}) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>
          {formatNumber(count)} ({formatPercent(percent, 1)})
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[styles.barFill, { width: boundedPercent(percent), backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: TeamComparisonRow["performanceStatus"] }) {
  const statusMeta = PERFORMANCE_STATUS_META[status];

  return (
    <Text
      style={[
        styles.statusBadge,
        { backgroundColor: statusMeta.backgroundColor, color: statusMeta.color },
      ]}
    >
      {statusMeta.label}
    </Text>
  );
}

function TrendTable({
  title,
  rows,
  valueSuffix = "",
}: {
  title: string;
  rows: { date: string; value: number }[];
  valueSuffix?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <View style={styles.trendColumn}>
      <View style={styles.panel}>
        <Text style={[styles.sectionTitle, { fontSize: 12, marginBottom: 6 }]}>{title}</Text>
        {rows.map((row) => (
          <View key={`${title}-${row.date}`} style={styles.trendRow}>
            <Text style={styles.rowLabel}>{row.date}</Text>
            <Text style={styles.rowValue}>
              {formatNumber(row.value, valueSuffix ? 0 : 1)}
              {valueSuffix}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function hasTrendContent(report: GeneratedReport): boolean {
  return Boolean(
    report.trends &&
    (report.trends.nps.length > 0 ||
      report.trends.csat.length > 0 ||
      report.trends.reviews.length > 0)
  );
}

function chunkTeamRows(
  rows: TeamComparisonRow[],
  firstChunkSize: number,
  nextChunkSize: number
): TeamComparisonRow[][] {
  if (rows.length === 0) return [];

  const chunks: TeamComparisonRow[][] = [rows.slice(0, firstChunkSize)];
  for (let i = firstChunkSize; i < rows.length; i += nextChunkSize) {
    chunks.push(rows.slice(i, i + nextChunkSize));
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

function ReportPage({
  children,
  pageNumber,
  totalPages,
}: {
  children: ReactNode;
  pageNumber: number;
  totalPages: number;
}) {
  return (
    <Page size="LETTER" style={styles.page}>
      {children}
      <View style={styles.footerRule} />
      <Text style={styles.footerBrand}>RepWell</Text>
      <Text style={styles.footerPage}>
        Page {pageNumber} of {totalPages}
      </Text>
    </Page>
  );
}

function TrendsSection({ report }: { report: GeneratedReport }) {
  if (!hasTrendContent(report) || !report.trends) return null;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Trends</Text>
      <View style={styles.trendGrid}>
        <TrendTable title="NPS" rows={report.trends.nps} />
        <TrendTable title="CSAT" rows={report.trends.csat} valueSuffix="%" />
        <TrendTable title="Reviews" rows={report.trends.reviews} />
      </View>
    </View>
  );
}

function TeamPerformanceTable({
  rows,
  title = "Team Performance",
}: {
  rows: TeamComparisonRow[];
  title?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeadCell, { width: "32%" }]}>Name</Text>
          <Text style={[styles.tableCell, styles.tableHeadCell, styles.right, { width: "13%" }]}>
            Reviews
          </Text>
          <Text style={[styles.tableCell, styles.tableHeadCell, styles.right, { width: "13%" }]}>
            Rating
          </Text>
          <Text style={[styles.tableCell, styles.tableHeadCell, styles.right, { width: "13%" }]}>
            NPS
          </Text>
          <Text style={[styles.tableCell, styles.tableHeadCell, styles.right, { width: "14%" }]}>
            Response
          </Text>
          <Text style={[styles.tableCell, styles.tableHeadCell, { width: "15%" }]}>Status</Text>
        </View>
        {rows.map((member) => (
          <View key={member.userId} style={styles.tableRow} wrap={false}>
            <Text style={[styles.tableCell, { width: "32%" }]}>
              {member.rank}. {member.name}
            </Text>
            <Text style={[styles.tableCell, styles.right, { width: "13%" }]}>
              {formatNumber(member.totalReviews)}
            </Text>
            <Text style={[styles.tableCell, styles.right, { width: "13%" }]}>
              {formatNumber(member.averageRating, 1)}
            </Text>
            <Text style={[styles.tableCell, styles.right, { width: "13%" }]}>
              {formatNumber(member.npsScore)}
            </Text>
            <Text style={[styles.tableCell, styles.right, { width: "14%" }]}>
              {formatPercent(member.responseRate, 0)}
            </Text>
            <View style={[styles.tableCell, { width: "15%" }]}>
              <StatusBadge status={member.performanceStatus} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReportPdfDocument({
  report,
  organizationName,
}: {
  report: GeneratedReport;
  organizationName: string;
}) {
  const generatedAt = format(report.generatedAt, "MMM d, yyyy 'at' h:mm a");
  const trendContent = hasTrendContent(report);
  const teamRows = report.teamComparison || [];
  const teamChunks = chunkTeamRows(teamRows, trendContent ? 12 : 18, 22);
  const detailPageCount =
    trendContent || teamChunks.length > 0 ? Math.max(1, teamChunks.length) : 0;
  const totalPages = 1 + detailPageCount;

  return (
    <Document
      title={`${report.templateName} - ${organizationName}`}
      author="RepWell"
      subject="RepWell performance report"
      creator="RepWell"
    >
      <ReportPage pageNumber={1} totalPages={totalPages}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.orgName}>{organizationName}</Text>
            <Text style={styles.generatedAt}>Generated {generatedAt}</Text>
          </View>
          <Text style={styles.title}>{report.templateName}</Text>
          <Text style={styles.subtitle}>{report.executiveSummary.periodLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.statGrid}>
            {metricCards(report).map((metric) => (
              <View key={metric.label} style={styles.statCard}>
                <View style={styles.statCardInner}>
                  <Text style={styles.statLabel}>{metric.label}</Text>
                  <Text style={styles.statValue}>{metric.value}</Text>
                  {metric.change ? <Text style={styles.statChange}>{metric.change}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        {report.npsBreakdown || report.csatMetrics ? (
          <View style={[styles.section, styles.twoColumnGrid]} wrap={false}>
            {report.npsBreakdown ? (
              <View style={styles.halfColumn}>
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>NPS Breakdown</Text>
                  <Text style={styles.sectionDescription}>
                    {formatNumber(report.npsBreakdown.totalResponses)} responses
                  </Text>
                  <BreakdownRow
                    label="Promoters (9-10)"
                    count={report.npsBreakdown.promoters}
                    percent={report.npsBreakdown.promoterPercentage}
                    color={COLORS.sage200}
                  />
                  <BreakdownRow
                    label="Passives (7-8)"
                    count={report.npsBreakdown.passives}
                    percent={report.npsBreakdown.passivePercentage}
                    color={COLORS.teal300}
                  />
                  <BreakdownRow
                    label="Detractors (0-6)"
                    count={report.npsBreakdown.detractors}
                    percent={report.npsBreakdown.detractorPercentage}
                    color={COLORS.coral}
                  />
                </View>
              </View>
            ) : null}

            {report.csatMetrics ? (
              <View style={styles.halfColumn}>
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>Customer Satisfaction</Text>
                  <Text style={styles.sectionDescription}>
                    Average rating {formatNumber(report.csatMetrics.averageRating, 2)} / 5.0
                  </Text>
                  <BreakdownRow
                    label="Satisfied (4-5)"
                    count={report.csatMetrics.satisfiedCount}
                    percent={report.csatMetrics.satisfiedPercentage}
                    color={COLORS.sage200}
                  />
                  <BreakdownRow
                    label="Neutral (3)"
                    count={report.csatMetrics.neutralCount}
                    percent={report.csatMetrics.neutralPercentage}
                    color={COLORS.amber}
                  />
                  <BreakdownRow
                    label="Dissatisfied (1-2)"
                    count={report.csatMetrics.dissatisfiedCount}
                    percent={report.csatMetrics.dissatisfiedPercentage}
                    color={COLORS.coral}
                  />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </ReportPage>

      {detailPageCount > 0
        ? Array.from({ length: detailPageCount }, (_, index) => (
            <ReportPage
              key={`report-detail-page-${index}`}
              pageNumber={index + 2}
              totalPages={totalPages}
            >
              {index === 0 ? <TrendsSection report={report} /> : null}
              <TeamPerformanceTable
                rows={teamChunks[index] || []}
                title={index === 0 ? "Team Performance" : "Team Performance (continued)"}
              />
            </ReportPage>
          ))
        : null}
    </Document>
  );
}

export async function renderReportPdf(
  report: GeneratedReport,
  organizationName: string
): Promise<Buffer> {
  return renderToBuffer(<ReportPdfDocument report={report} organizationName={organizationName} />);
}
