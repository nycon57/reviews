/**
 * Email A/B Testing System
 * Story S092: Email A/B Testing System
 *
 * Exports all types, actions, and utilities for the A/B testing system.
 */

// Types
export type {
  ActionResult,
  ABTest,
  ABTestResult,
  ABTestWithResults,
  ABTestVariant,
  ABTestStatus,
  ABTestFilters,
  ABTestSummary,
  TestType,
  WinningMetric,
  StatisticalSignificance,
  CreateABTestInput,
  UpdateABTestInput,
  DeclareWinnerInput,
  ABTestFiltersInput,
} from "./types";

// Validation schemas
export {
  createABTestSchema,
  updateABTestSchema,
  declareWinnerSchema,
  abTestFiltersSchema,
} from "./types";

// Type guards and helpers
export {
  isActiveTest,
  isCompletedTest,
  hasWinner,
  canEdit,
  canStart,
  canStop,
  canPause,
  canResume,
  getTestTypeDisplayName,
  getWinningMetricDisplayName,
  getStatusDisplayName,
  getStatusColor,
  formatRate,
  formatConfidenceLevel,
  mapDbTestToTs,
  mapDbResultToTs,
} from "./types";

// Constants
export {
  MIN_SAMPLE_SIZE_PER_VARIANT,
  DEFAULT_CONFIDENCE_LEVEL,
  DEFAULT_ALPHA,
  MAX_VARIANTS,
  MIN_VARIANTS,
  MAX_TEST_DURATION_HOURS,
  MIN_TEST_DURATION_HOURS,
  RECOMMENDED_MDE,
  DEFAULT_TRAFFIC_SPLITS,
} from "./types";

// Server actions
export {
  createABTest,
  updateABTest,
  deleteABTest,
  startABTest,
  stopABTest,
  pauseABTest,
  resumeABTest,
  getABTest,
  getABTestWithResults,
  getABTests,
  getABTestAnalysis,
  getABTestSummary,
  declareWinner,
  applyWinnerToFuture,
  getActiveTestForEmailType,
} from "./actions";

// Statistics utilities
export {
  calculateZScore,
  calculatePValue,
  isSignificant,
  getCriticalZ,
  calculateConfidenceInterval,
  calculateStatisticalSignificance,
  calculateRequiredSampleSize,
  determineWinner,
  calculateUplift,
  checkSampleSizeSufficiency,
  calculatePower,
  estimateTimeRemaining,
  assignVariant,
} from "./statistics";
