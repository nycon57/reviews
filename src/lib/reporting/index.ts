/**
 * Reporting Module Exports
 *
 * Note: Only async server functions and types are exported from this barrel.
 * For templates/constants, import directly from "@/lib/reporting/templates"
 * For client-safe utils, import directly from "@/lib/reporting/utils"
 */

// Types
export type {
  ReportTemplateType,
  ScheduleFrequency,
  ExportFormat,
  DateRangePreset,
  ReportDateRange,
  ReportFilters,
  ReportTemplateConfig,
  ReportSection,
  ReportMetric,
  ReportChart,
  ReportTemplate,
  ScheduledReport,
  ReportShare,
  ReportExport,
  ExecutiveSummary,
  TeamComparisonRow,
  GeneratedReport,
  ReportCSVRow,
  ReportExportPayload,
  PDFReportData,
} from "./types";

// Engine (server actions)
export {
  getReportTemplate,
  getReportTemplates,
  generateReportForOrg,
  generateReport,
  initializeDefaultTemplates,
} from "./engine";

// Export functions (server actions)
export {
  exportReportToCSV,
  generateReportHTML,
} from "./export";

// Actions (server actions)
export {
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getScheduledReports,
  createReportShare,
  createReportShareForOrg,
  getReportShareByToken,
  revokeReportShare,
  getReportShares,
  exportAndRecordReport,
  getReportExports,
} from "./actions";
