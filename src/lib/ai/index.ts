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
  SmartActionItem,
  ActionItemType,
  LOPerformanceScorecard,
  MetricTrend,
  ActivityStatus,
  AlertType,
  ActivityAlert,
  LOActivityStatus,
  TeamActivityMonitor,
  ChannelMetrics,
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
  getSmartActionItems,
  getLOPerformanceScorecard,
  getTeamActivityMonitor,
  getChannelEffectiveness,
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

// OpenAI Client (for Whisper transcription)
export {
  getOpenAIClient,
  isWhisperEnabled,
  calculateTranscriptionCost,
  WHISPER_CONFIG,
} from "./openai-client";

// Video Transcription
export {
  transcribeVideo,
  transcribeVideoWithRetry,
  formatTranscriptionError,
  isRetryableError,
  type TranscriptionResult,
  type TranscriptionError,
  type TranscribeOptions,
} from "./video-transcription";

// Transcription Actions
export {
  transcribeVideoTestimonial,
  retryTranscription,
  getTranscriptionStatus,
  type TranscriptionActionResult,
} from "./transcription-actions";

// Transcript to Review Generation
export {
  generateReviewFromTranscript,
  isTranscriptionSuitableForReview,
  type GeneratedReviewResult,
  type TranscriptContext,
  type ReviewGenerationError,
} from "./transcript-to-review";

// Review Generation Actions
export {
  generateReviewFromTestimonial,
  retryReviewGeneration,
  getReviewGenerationStatus,
  type ReviewGenerationActionResult,
} from "./review-generation-actions";
