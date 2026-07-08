// A/B testing module — public API (S131)

export type {
  ABVariant,
  ABTestConfig,
  PageABTestConfig,
  ABTestEvent,
  ABVariantMetrics,
  ABTestMetrics,
  CompetitorPageMetrics,
  TrafficSourceBreakdown,
  WeeklyReportData,
} from "./types";

export {
  abTestConfigs,
  getPageABTestConfig,
  getPageTests,
  getAllActiveTestIds,
} from "./config";

export {
  getVariantAssignment,
  getPageVariantAssignments,
  readVariantFromCookie,
  writeVariantCookie,
  getTestCookieName,
} from "./assignment";

export {
  trackABEvent,
  getStoredABEvents,
  clearStoredABEvents,
  classifyTrafficSource,
} from "./tracking";

export {
  computeABTestMetrics,
  computePageMetrics,
  computeTrafficSources,
  computeSwitchingFromDistribution,
  generateWeeklyReportData,
} from "./metrics";
