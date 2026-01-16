// GEO (Generative Engine Optimization) Platform

// Types
export type {
  AISearchPlatform,
  ContentCategory,
  VisibilityScoreBreakdown,
  AIVisibilityScore,
  OptimizationSuggestion,
  AIOptimizedFAQ,
  SchemaRecommendation,
  AISearchMention,
  CompetitorComparison,
  AISearchPerformance,
  ContentTemplate,
  GEODashboardSummary,
  ActionResult,
  PlatformInfo,
} from "./types";

export {
  AI_PLATFORM_INFO,
  getPriorityColor,
  getPriorityLabel,
  getScoreColor,
  getScoreLabel,
  getScoreBgColor,
  GEO_CONFIG,
} from "./types";

// Actions
export {
  calculateVisibilityScore,
  generateOptimizationSuggestions,
  generateAIOptimizedFAQs,
  generateSchemaRecommendations,
  getAISearchPerformance,
  getGEODashboardSummary,
  getContentTemplates,
  getCompetitors,
  addCompetitor,
  removeCompetitor,
  compareWithCompetitor,
  saveFAQ,
  getSavedFAQs,
  updateFAQ,
  deleteFAQ,
  recordPerformanceSnapshot,
  getPerformanceHistory,
  getOrganizationEntities,
} from "./actions";
