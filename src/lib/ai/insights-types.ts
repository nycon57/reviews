// AI Insights Types

import type { ReviewTheme, SentimentLabel } from './types';

// Sentiment trend data point
export interface SentimentTrendPoint {
  date: string;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  averageScore: number;
  totalReviews: number;
}

// Theme frequency data
export interface ThemeFrequency {
  theme: ReviewTheme;
  count: number;
  percentage: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
}

// Key phrase data
export interface KeyPhraseData {
  phrase: string;
  count: number;
  sentiment: SentimentLabel;
  recentOccurrences: number;
}

// AI-generated summary
export interface AIInsightsSummary {
  id: string;
  loanOfficerId: string | null;
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  highlights: string[];
  areasOfImprovement: string[];
  generatedAt: Date;
}

// Improvement recommendation
export interface ImprovementRecommendation {
  id: string;
  category: ReviewTheme | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  basedOn: string; // What feedback it's based on
  potentialImpact: string;
}

// Industry benchmark data
export interface IndustryBenchmark {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;
  trend: 'above' | 'at' | 'below';
}

// Comprehensive AI insights data
export interface AIInsightsData {
  sentimentTrend: SentimentTrendPoint[];
  themeFrequencies: ThemeFrequency[];
  topKeyPhrases: KeyPhraseData[];
  summary: AIInsightsSummary | null;
  recommendations: ImprovementRecommendation[];
  benchmarks: IndustryBenchmark[];
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  };
  periodStart: Date;
  periodEnd: Date;
}

// Export filter options
export interface InsightsExportOptions {
  format: 'pdf' | 'csv' | 'json';
  includeCharts: boolean;
  includeSummary: boolean;
  includeRecommendations: boolean;
  includeBenchmarks: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}

// Insights report data for export
export interface InsightsReport {
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  loanOfficerName?: string;
  organizationName: string;
  insights: AIInsightsData;
}
