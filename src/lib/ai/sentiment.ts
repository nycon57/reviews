// Sentiment Analysis Service

import { createChatCompletion, isAIEnabled } from './client';
import {
  AI_CONFIG,
  THEME_DESCRIPTIONS,
  type SentimentAnalysisResult,
  type SentimentLabel,
  type ReviewTheme,
} from './types';

const SYSTEM_PROMPT = `You are a sentiment analysis expert specializing in mortgage and lending reviews.
Your task is to analyze customer reviews and extract:
1. Overall sentiment (positive, neutral, negative) with a score from -1 to 1
2. Key phrases that capture the essence of the review
3. Relevant themes from the review

Available themes and their meanings:
${Object.entries(THEME_DESCRIPTIONS)
  .map(([theme, desc]) => `- ${theme}: ${desc}`)
  .join('\n')}

Respond with a JSON object containing:
{
  "sentimentScore": <number from -1 to 1>,
  "sentimentLabel": <"positive" | "neutral" | "negative">,
  "confidence": <number from 0 to 1>,
  "keyPhrases": <array of 2-5 key phrases>,
  "themes": <array of relevant theme names>
}

Be concise with key phrases (3-6 words each). Only include themes that are clearly mentioned or implied.`;

function getSentimentLabel(score: number): SentimentLabel {
  if (score >= 0.2) return 'positive';
  if (score <= -0.2) return 'negative';
  return 'neutral';
}

function validateThemes(themes: string[]): ReviewTheme[] {
  const validThemes: ReviewTheme[] = [
    'communication',
    'process',
    'service',
    'responsiveness',
    'professionalism',
    'knowledge',
    'rates',
    'closing',
    'documentation',
    'timeliness',
  ];

  return themes.filter((theme): theme is ReviewTheme =>
    validThemes.includes(theme as ReviewTheme)
  );
}

export async function analyzeReviewSentiment(
  reviewText: string
): Promise<SentimentAnalysisResult> {
  if (!isAIEnabled()) {
    throw new Error('AI features are not enabled');
  }

  if (!reviewText || reviewText.trim().length === 0) {
    return {
      sentimentScore: 0,
      sentimentLabel: 'neutral',
      confidence: 0,
      keyPhrases: [],
      themes: [],
    };
  }

  const userPrompt = `Analyze this review:\n\n"${reviewText}"`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < AI_CONFIG.maxRetries; attempt++) {
    try {
      const response = await createChatCompletion(SYSTEM_PROMPT, userPrompt);
      const parsed = JSON.parse(response);

      // Validate and normalize the response
      const sentimentScore = Math.max(-1, Math.min(1, Number(parsed.sentimentScore) || 0));
      const sentimentLabel = getSentimentLabel(sentimentScore);
      const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));

      // Extract and validate key phrases
      const keyPhrases = Array.isArray(parsed.keyPhrases)
        ? parsed.keyPhrases.filter((p: unknown): p is string => typeof p === 'string').slice(0, 5)
        : [];

      // Validate themes
      const themes = Array.isArray(parsed.themes)
        ? validateThemes(parsed.themes)
        : [];

      return {
        sentimentScore,
        sentimentLabel,
        confidence,
        keyPhrases,
        themes,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Sentiment analysis attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < AI_CONFIG.maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, AI_CONFIG.retryDelayMs * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Sentiment analysis failed after retries');
}

// Fallback sentiment analysis using simple heuristics
export function analyzeReviewSentimentFallback(
  reviewText: string,
  rating?: number
): SentimentAnalysisResult {
  if (!reviewText || reviewText.trim().length === 0) {
    // Use rating as fallback if available
    if (rating !== undefined) {
      const ratingScore = (rating - 3) / 2; // Convert 1-5 to -1 to 1
      return {
        sentimentScore: ratingScore,
        sentimentLabel: getSentimentLabel(ratingScore),
        confidence: 0.3,
        keyPhrases: [],
        themes: [],
      };
    }

    return {
      sentimentScore: 0,
      sentimentLabel: 'neutral',
      confidence: 0,
      keyPhrases: [],
      themes: [],
    };
  }

  const lowerText = reviewText.toLowerCase();

  // Simple keyword-based sentiment
  const positiveWords = [
    'excellent',
    'amazing',
    'great',
    'wonderful',
    'fantastic',
    'outstanding',
    'helpful',
    'professional',
    'easy',
    'smooth',
    'recommend',
    'best',
    'thank',
    'appreciate',
  ];
  const negativeWords = [
    'terrible',
    'awful',
    'horrible',
    'bad',
    'poor',
    'worst',
    'frustrating',
    'disappointed',
    'slow',
    'rude',
    'unprofessional',
    'difficult',
    'problem',
    'issue',
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) positiveCount++;
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) negativeCount++;
  }

  // Calculate score
  const total = positiveCount + negativeCount;
  let sentimentScore = 0;

  if (total > 0) {
    sentimentScore = (positiveCount - negativeCount) / Math.max(total, 3);
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
  } else if (rating !== undefined) {
    sentimentScore = (rating - 3) / 2;
  }

  // Detect themes using keywords
  const themes: ReviewTheme[] = [];

  const themeKeywords: Record<ReviewTheme, string[]> = {
    communication: ['communication', 'communicated', 'updates', 'informed', 'contact', 'responsive'],
    process: ['process', 'application', 'approval', 'paperwork', 'steps'],
    service: ['service', 'customer service', 'experience', 'treatment'],
    responsiveness: ['responsive', 'quick', 'fast', 'prompt', 'timely', 'responded'],
    professionalism: ['professional', 'professionalism', 'courteous', 'polite', 'respectful'],
    knowledge: ['knowledge', 'knowledgeable', 'expert', 'expertise', 'explained', 'understood'],
    rates: ['rate', 'rates', 'interest', 'apr', 'pricing', 'fees', 'costs'],
    closing: ['closing', 'close', 'closed', 'settlement', 'final'],
    documentation: ['documents', 'documentation', 'paperwork', 'papers', 'forms'],
    timeliness: ['time', 'timely', 'deadline', 'on time', 'schedule', 'delayed'],
  };

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      themes.push(theme as ReviewTheme);
    }
  }

  return {
    sentimentScore,
    sentimentLabel: getSentimentLabel(sentimentScore),
    confidence: 0.4, // Lower confidence for fallback
    keyPhrases: [],
    themes: themes.slice(0, 5),
  };
}
