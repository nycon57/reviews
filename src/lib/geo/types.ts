// GEO (Generative Engine Optimization) Platform Types

/**
 * AI Search Platforms that can surface content
 */
export type AISearchPlatform =
  | 'chatgpt'
  | 'perplexity'
  | 'google_ai_overview'
  | 'bing_copilot'
  | 'claude'
  | 'gemini';

/**
 * Content optimization categories for AI search
 */
export type ContentCategory =
  | 'profile'
  | 'reviews'
  | 'faq'
  | 'services'
  | 'location'
  | 'expertise'
  | 'testimonials';

/**
 * Visibility score breakdown categories
 */
export interface VisibilityScoreBreakdown {
  contentCompleteness: number; // 0-100: How complete is the content
  structuredData: number; // 0-100: Schema markup quality
  entityClarity: number; // 0-100: How clear are entity definitions
  citationPotential: number; // 0-100: Likelihood to be cited
  topicalAuthority: number; // 0-100: Expertise signals
  freshness: number; // 0-100: Content recency
}

/**
 * AI Visibility Score for a loan officer or organization
 */
export interface AIVisibilityScore {
  id: string;
  entityType: 'loan_officer' | 'branch' | 'organization';
  entityId: string;
  organizationId: string;

  // Overall score
  overallScore: number; // 0-100
  previousScore: number | null;
  scoreChange: number | null;

  // Score breakdown
  breakdown: VisibilityScoreBreakdown;

  // Platform-specific scores
  platformScores: Record<AISearchPlatform, number>;

  // Timestamps
  calculatedAt: string;
  nextCalculationAt: string | null;
}

/**
 * Content optimization suggestion
 */
export interface OptimizationSuggestion {
  id: string;
  entityType: 'loan_officer' | 'branch' | 'organization';
  entityId: string;

  // Suggestion details
  category: ContentCategory;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue: string | null;
  suggestedValue: string | null;

  // Impact estimation
  estimatedImpact: number; // Points improvement
  estimatedEffort: 'minimal' | 'moderate' | 'significant';

  // Status
  status: 'pending' | 'implemented' | 'dismissed';
  implementedAt: string | null;

  // Metadata
  createdAt: string;
}

/**
 * AI-optimized FAQ for snippet inclusion
 */
export interface AIOptimizedFAQ {
  id: string;
  entityType: 'loan_officer' | 'branch' | 'organization';
  entityId: string;
  organizationId: string;

  // FAQ content
  question: string;
  answer: string;
  category: string;

  // Optimization metadata
  keywords: string[];
  voiceSearchOptimized: boolean;
  snippetReady: boolean;

  // Performance
  impressions: number;
  citations: number;
  lastCitedAt: string | null;

  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Schema markup recommendation
 */
export interface SchemaRecommendation {
  id: string;
  entityType: 'loan_officer' | 'branch' | 'organization';
  entityId: string;

  // Recommendation details
  schemaType: string; // e.g., 'Person', 'LocalBusiness', 'FAQPage'
  priority: 'required' | 'recommended' | 'optional';
  title: string;
  description: string;

  // Current state
  isImplemented: boolean;
  currentMarkup: string | null;
  recommendedMarkup: string;

  // Validation
  validationErrors: string[];
  validationWarnings: string[];

  createdAt: string;
}

/**
 * AI search mention tracking
 */
export interface AISearchMention {
  id: string;
  entityType: 'loan_officer' | 'branch' | 'organization';
  entityId: string;
  organizationId: string;

  // Mention details
  platform: AISearchPlatform;
  query: string;
  context: string; // The context in which entity was mentioned
  mentionType: 'direct' | 'indirect' | 'comparison';
  sentiment: 'positive' | 'neutral' | 'negative';

  // Source
  sourceUrl: string | null;
  sourceTitle: string | null;

  // Timestamps
  detectedAt: string;
  verifiedAt: string | null;
}

/**
 * Competitor AI visibility comparison
 */
export interface CompetitorComparison {
  organizationId: string;
  competitorName: string;
  competitorDomain: string | null;

  // Scores
  ourScore: number;
  competitorScore: number;
  scoreDifference: number;

  // Breakdown comparison
  breakdownComparison: {
    category: keyof VisibilityScoreBreakdown;
    ourValue: number;
    competitorValue: number;
    difference: number;
  }[];

  // Recommendations
  gapAnalysis: string[];
  opportunityAreas: string[];

  comparedAt: string;
}

/**
 * AI search performance tracking
 */
export interface AISearchPerformance {
  entityType: 'loan_officer' | 'branch' | 'organization';
  entityId: string;
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;

  // Metrics
  visibilityScore: number;
  totalMentions: number;
  totalCitations: number;
  platformBreakdown: Record<AISearchPlatform, {
    mentions: number;
    citations: number;
    sentiment: number; // -1 to 1
  }>;

  // Trends
  scoreChange: number;
  mentionsChange: number;
  citationsChange: number;

  // Top queries
  topQueries: {
    query: string;
    count: number;
    platform: AISearchPlatform;
  }[];
}

/**
 * AI-optimized content template
 */
export interface ContentTemplate {
  id: string;
  name: string;
  category: ContentCategory;
  description: string;

  // Template content
  template: string;
  variables: {
    name: string;
    description: string;
    required: boolean;
    example: string;
  }[];

  // Optimization metadata
  targetPlatforms: AISearchPlatform[];
  optimizationTips: string[];

  // Usage
  useCount: number;
  lastUsedAt: string | null;

  isActive: boolean;
  createdAt: string;
}

/**
 * GEO dashboard summary
 */
export interface GEODashboardSummary {
  // Overall visibility
  overallScore: number;
  scoreChange: number;
  scoreTrend: 'up' | 'down' | 'stable';

  // Key metrics
  totalMentions: number;
  mentionsChange: number;
  totalCitations: number;
  citationsChange: number;

  // Optimization status
  pendingSuggestions: number;
  highPrioritySuggestions: number;
  implementedThisMonth: number;

  // Content health
  faqCount: number;
  schemaCompliance: number; // 0-100

  // Platform visibility
  platformVisibility: Record<AISearchPlatform, number>;

  // Recent activity
  recentMentions: AISearchMention[];

  // Top recommendations
  topRecommendations: OptimizationSuggestion[];
}

/**
 * Action result pattern
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Platform display info
 */
export interface PlatformInfo {
  name: string;
  description: string;
  icon: string;
  color: string;
  url: string;
}

/**
 * Platform information mapping
 */
export const AI_PLATFORM_INFO: Record<AISearchPlatform, PlatformInfo> = {
  chatgpt: {
    name: 'ChatGPT',
    description: 'OpenAI\'s conversational AI assistant',
    icon: 'openai',
    color: 'bg-emerald-500',
    url: 'https://chat.openai.com',
  },
  perplexity: {
    name: 'Perplexity AI',
    description: 'AI-powered answer engine',
    icon: 'perplexity',
    color: 'bg-blue-500',
    url: 'https://perplexity.ai',
  },
  google_ai_overview: {
    name: 'Google AI Overview',
    description: 'Google Search AI-generated summaries',
    icon: 'google',
    color: 'bg-red-500',
    url: 'https://google.com',
  },
  bing_copilot: {
    name: 'Microsoft Copilot',
    description: 'Bing\'s AI-powered search assistant',
    icon: 'microsoft',
    color: 'bg-cyan-500',
    url: 'https://copilot.microsoft.com',
  },
  claude: {
    name: 'Claude',
    description: 'Anthropic\'s AI assistant',
    icon: 'anthropic',
    color: 'bg-orange-500',
    url: 'https://claude.ai',
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI model',
    icon: 'gemini',
    color: 'bg-purple-500',
    url: 'https://gemini.google.com',
  },
};

/**
 * Priority colors and labels
 */
export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

export function getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'High Priority';
    case 'medium':
      return 'Medium Priority';
    case 'low':
      return 'Low Priority';
    default:
      return 'Unknown';
  }
}

/**
 * Score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * GEO Configuration constants
 */
export const GEO_CONFIG = {
  // Score calculation weights
  scoreWeights: {
    contentCompleteness: 0.20,
    structuredData: 0.20,
    entityClarity: 0.15,
    citationPotential: 0.20,
    topicalAuthority: 0.15,
    freshness: 0.10,
  },

  // Refresh intervals
  refreshIntervals: {
    visibilityScore: 24 * 60 * 60 * 1000, // 24 hours
    mentions: 60 * 60 * 1000, // 1 hour
    performance: 6 * 60 * 60 * 1000, // 6 hours
  },

  // Limits
  limits: {
    maxFAQsPerEntity: 20,
    maxSuggestionsDisplay: 10,
    maxMentionsDisplay: 50,
  },
} as const;
