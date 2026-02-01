// AI/Sentiment Analysis Types

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

// Themes that can be detected in reviews (mortgage/lending focused)
export type ReviewTheme =
  | 'communication'
  | 'process'
  | 'service'
  | 'responsiveness'
  | 'professionalism'
  | 'knowledge'
  | 'rates'
  | 'closing'
  | 'documentation'
  | 'timeliness';

export interface SentimentAnalysisResult {
  sentimentScore: number; // -1 to 1
  sentimentLabel: SentimentLabel;
  confidence: number; // 0 to 1
  keyPhrases: string[];
  themes: ReviewTheme[];
}

export interface BatchAnalysisResult {
  reviewId: string;
  analysis: SentimentAnalysisResult | null;
  error?: string;
}

export interface AnalysisProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  inProgress: boolean;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

// OpenAI API response types
export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Configuration constants
export const AI_CONFIG = {
  model: 'gemini-2.0-flash',
  maxTokens: 1024,
  temperature: 0.7, // Higher for more creative/varied responses
  maxRetries: 3,
  retryDelayMs: 1000,
  batchSize: 10, // Process reviews in batches
} as const;

// Theme descriptions for analysis prompt
export const THEME_DESCRIPTIONS: Record<ReviewTheme, string> = {
  communication: 'Quality of communication and updates',
  process: 'Loan application and approval process',
  service: 'Overall customer service quality',
  responsiveness: 'Speed and timeliness of responses',
  professionalism: 'Professional conduct and demeanor',
  knowledge: 'Expertise and industry knowledge',
  rates: 'Interest rates and pricing',
  closing: 'Closing process and experience',
  documentation: 'Paperwork and document handling',
  timeliness: 'Meeting deadlines and time expectations',
};
