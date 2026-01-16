// AI/Sentiment Analysis Module

// Types
export type {
  SentimentLabel,
  ReviewTheme,
  SentimentAnalysisResult,
  BatchAnalysisResult,
  AnalysisProgress,
  OpenAIConfig,
  OpenAIChatMessage,
  OpenAIChatResponse,
} from "./types";

export { AI_CONFIG, THEME_DESCRIPTIONS } from "./types";

// Insights Types
export type {
  SentimentTrendPoint,
  ThemeFrequency,
  KeyPhraseData,
  AIInsightsSummary,
  ImprovementRecommendation,
  IndustryBenchmark,
  AIInsightsData,
  InsightsExportOptions,
  InsightsReport,
} from "./insights-types";

// Client
export { getGeminiClient, isAIEnabled, createChatCompletion } from "./client";

// Sentiment
export {
  analyzeReviewSentiment,
  analyzeReviewSentimentFallback,
} from "./sentiment";

// Actions
export {
  analyzeNewReview,
  analyzeReview,
  analyzeReviewText,
  getUnanalyzedReviews,
  batchAnalyzeReviews,
  getAnalysisStats,
  analyzeAllUnanalyzedReviews,
  checkAIStatus,
} from "./actions";

// Insights Actions
export {
  getSentimentTrend,
  getThemeFrequencies,
  getTopKeyPhrases,
  getSentimentDistribution,
  generateAISummary,
  getImprovementRecommendations,
  getIndustryBenchmarks,
  getAIInsightsData,
} from "./insights-actions";

// Response Suggestions
export {
  generateResponseSuggestion,
  generateMultipleResponseSuggestions,
  improveResponseWithContext,
  type ResponseTone,
  type ResponseSuggestion,
  type ReviewContext,
} from "./response-suggestions";

// Testimonial Types
export type {
  TestimonialFormat,
  TestimonialStatus,
  Testimonial,
  TestimonialGraphic,
  TestimonialTemplate,
  TestimonialReviewContext,
  GeneratedTestimonial,
  TestimonialGenerationResult,
  GraphicGenerationOptions,
  GeneratedGraphic,
  ExportFormat,
  ExportPlatform,
  TestimonialExportOptions,
  TestimonialExportResult,
  TestimonialFilters,
  TestimonialStats,
  TestimonialActionResult,
  BatchGenerationRequest,
  BatchGenerationResult,
} from "./testimonial-types";

// Testimonial Generator
export {
  generateTestimonial,
  generateMultipleFormats,
  generateTestimonialGraphic,
  isReviewSuitableForTestimonial,
  analyzeBestTestimonialOpportunities,
} from "./testimonial-generator";

// Testimonial Actions
export {
  generateTestimonialFromReview,
  generateMultipleTestimonialFormats,
  batchGenerateTestimonials,
  getTestimonials,
  getTestimonialStats,
  updateTestimonialStatus,
  bulkUpdateTestimonialStatus,
  updateTestimonialContent,
  deleteTestimonial,
  generateGraphicForTestimonial,
  exportTestimonial,
  getBestTestimonialCandidates,
  getTestimonialTemplates,
} from "./testimonial-actions";
