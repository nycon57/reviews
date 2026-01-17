// AI Transcript to Review Generation Service using Google Gemini
// Transforms video testimonial transcriptions into polished customer reviews

import { createChatCompletion, isAIEnabled } from "./client";
import { AI_CONFIG } from "./types";

export interface GeneratedReviewResult {
  text: string;
  keyPoints: string[];
  confidence: number;
  wordCount: number;
  generationAttempt: number;
}

export interface TranscriptContext {
  transcription: string;
  customerName?: string;
  loanOfficerName?: string;
  organizationName?: string;
  rating?: number; // 1-5 if captured
}

export interface ReviewGenerationError {
  code: "AI_DISABLED" | "TRANSCRIPTION_TOO_SHORT" | "GENERATION_FAILED" | "PARSE_ERROR";
  message: string;
}

// Minimum transcription length for meaningful review generation
const MIN_TRANSCRIPTION_LENGTH = 30;
const MAX_GENERATION_ATTEMPTS = 3;

// Target word count ranges for generated reviews
const REVIEW_WORD_TARGETS = {
  min: 100,
  ideal: 200,
  max: 350,
};

/**
 * Generate system prompt for review generation
 */
function getSystemPrompt(): string {
  return `You are an expert at transforming raw customer testimonial transcriptions into polished, authentic review text suitable for publication.

Your task is to take a video transcription (which may contain verbal tics, incomplete sentences, or casual speech patterns) and transform it into a professional, well-written review that:
1. Preserves the customer's authentic voice and key points
2. Maintains the emotional tone and sentiment of the original
3. Corrects grammar and removes verbal fillers without changing meaning
4. Organizes thoughts into 2-3 coherent paragraphs
5. Highlights specific positive experiences and outcomes
6. Sounds natural - like a thoughtful customer wrote it, not AI

IMPORTANT GUIDELINES:
- Never fabricate details not present in the transcription
- Preserve specific names, numbers, timeframes, or achievements mentioned
- Keep the customer's unique perspective and personality
- If the transcription mentions specific staff or processes, keep those references
- The review should read naturally, avoiding marketing jargon
- Target length: ${REVIEW_WORD_TARGETS.min}-${REVIEW_WORD_TARGETS.max} words (ideally around ${REVIEW_WORD_TARGETS.ideal})

HANDLING UNCLEAR TRANSCRIPTIONS:
- If the transcription is too brief, extract what value you can
- If parts are unclear or incoherent, focus on the clear portions
- Set confidence lower for problematic transcriptions
- Never pad with generic content - shorter authentic content is better

RESPONSE FORMAT (JSON):
{
  "text": "<the polished review text in 2-3 paragraphs>",
  "keyPoints": ["<key point 1>", "<key point 2>", "<key point 3>"],
  "confidence": <0.0 to 1.0 based on transcription quality and resulting review>
}

Confidence scoring guidelines:
- 0.9-1.0: Clear transcription, excellent review with specific details
- 0.7-0.9: Good transcription, solid review with some specifics
- 0.5-0.7: Partial transcription, review covers main points
- 0.3-0.5: Unclear transcription, review is generic but usable
- 0.0-0.3: Very poor transcription, minimal usable content`;
}

/**
 * Generate user prompt with transcription and context
 */
function getUserPrompt(context: TranscriptContext): string {
  const parts: string[] = [];

  parts.push("Transform this video testimonial transcription into a polished customer review:");
  parts.push("");
  parts.push("--- TRANSCRIPTION ---");
  parts.push(context.transcription);
  parts.push("--- END TRANSCRIPTION ---");
  parts.push("");

  if (context.customerName) {
    parts.push(`Customer: ${context.customerName}`);
  }
  if (context.loanOfficerName) {
    parts.push(`Loan Officer mentioned: ${context.loanOfficerName}`);
  }
  if (context.organizationName) {
    parts.push(`Company: ${context.organizationName}`);
  }
  if (context.rating) {
    parts.push(`Rating given: ${context.rating}/5 stars`);
  }

  parts.push("");
  parts.push(`Generate a professional review (${REVIEW_WORD_TARGETS.min}-${REVIEW_WORD_TARGETS.max} words) that preserves the customer's authentic voice.`);

  return parts.join("\n");
}

/**
 * Validate and clean the transcription text
 */
function validateTranscription(transcription: string): { valid: boolean; cleaned: string; error?: ReviewGenerationError } {
  const cleaned = transcription.trim();

  if (!cleaned || cleaned.length < MIN_TRANSCRIPTION_LENGTH) {
    return {
      valid: false,
      cleaned,
      error: {
        code: "TRANSCRIPTION_TOO_SHORT",
        message: `Transcription too short (${cleaned.length} chars, minimum ${MIN_TRANSCRIPTION_LENGTH})`,
      },
    };
  }

  return { valid: true, cleaned };
}

/**
 * Parse and validate AI response
 */
function parseAIResponse(response: string): GeneratedReviewResult {
  const parsed = JSON.parse(response);

  // Validate required fields
  if (!parsed.text || typeof parsed.text !== "string") {
    throw new Error("Invalid response: missing or invalid text field");
  }

  const text = parsed.text.trim();
  const wordCount = text ? text.split(/\s+/).filter((w: string) => w.length > 0).length : 0;

  // Extract key points, ensuring they're strings
  const keyPoints: string[] = Array.isArray(parsed.keyPoints)
    ? parsed.keyPoints.filter((kp: unknown): kp is string => typeof kp === "string").slice(0, 5)
    : [];

  // Parse confidence, defaulting to 0.7 if missing
  const confidence =
    typeof parsed.confidence === "number" ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7;

  return {
    text,
    keyPoints,
    confidence,
    wordCount,
    generationAttempt: 1, // Will be updated by caller
  };
}

/**
 * Generate a fallback review when AI is unavailable or fails
 * Creates a basic cleaned version of the transcription
 */
function generateFallbackReview(context: TranscriptContext): GeneratedReviewResult {
  const transcription = context.transcription.trim();

  // Basic cleaning: capitalize sentences, remove excessive whitespace
  let cleaned = transcription
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/([.!?])\s*([a-z])/g, (_, p, l) => `${p} ${l.toUpperCase()}`) // Capitalize after punctuation
    .replace(/^([a-z])/, (_, l) => l.toUpperCase()); // Capitalize first letter

  // Remove common verbal fillers
  const fillers = /\b(um|uh|like|you know|I mean|basically|actually|so|well)\b,?\s*/gi;
  cleaned = cleaned.replace(fillers, " ").replace(/\s+/g, " ").trim();

  // Extract potential key points (first 3 sentences)
  const sentences = cleaned.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const keyPoints = sentences.slice(0, 3).map((s) => s.trim());

  return {
    text: cleaned,
    keyPoints,
    confidence: 0.3, // Low confidence for fallback
    wordCount: cleaned ? cleaned.split(/\s+/).filter((w: string) => w.length > 0).length : 0,
    generationAttempt: 0, // 0 indicates fallback
  };
}

/**
 * Select the best review from multiple generation attempts
 */
function selectBestReview(attempts: GeneratedReviewResult[]): GeneratedReviewResult {
  if (attempts.length === 0) {
    throw new Error("No review attempts to select from");
  }

  if (attempts.length === 1) {
    return attempts[0];
  }

  // Score each attempt based on multiple factors
  const scored = attempts.map((attempt) => {
    let score = 0;

    // Confidence contributes significantly (0-40 points)
    score += attempt.confidence * 40;

    // Word count in ideal range (0-30 points)
    if (attempt.wordCount >= REVIEW_WORD_TARGETS.min && attempt.wordCount <= REVIEW_WORD_TARGETS.max) {
      // Peak score at ideal word count
      const distanceFromIdeal = Math.abs(attempt.wordCount - REVIEW_WORD_TARGETS.ideal);
      const maxDistance = REVIEW_WORD_TARGETS.max - REVIEW_WORD_TARGETS.min;
      score += 30 * (1 - distanceFromIdeal / maxDistance);
    } else if (attempt.wordCount < REVIEW_WORD_TARGETS.min) {
      // Penalize too short
      score += 10 * (attempt.wordCount / REVIEW_WORD_TARGETS.min);
    } else {
      // Penalize too long (but less than too short)
      score += 20;
    }

    // Key points extracted (0-20 points)
    score += Math.min(attempt.keyPoints.length, 3) * (20 / 3);

    // Paragraph structure bonus (0-10 points)
    const paragraphs = attempt.text.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length >= 2 && paragraphs.length <= 4) {
      score += 10;
    }

    return { attempt, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored[0].attempt;
}

/**
 * Main function: Generate a polished review from video transcription
 *
 * Uses Google Gemini to transform raw transcription into professional review text.
 * Attempts multiple generations and selects the best result.
 *
 * @param context - Transcription text and optional context
 * @returns Generated review result or throws ReviewGenerationError
 */
export async function generateReviewFromTranscript(
  context: TranscriptContext
): Promise<GeneratedReviewResult> {
  // Check if AI is enabled
  if (!isAIEnabled()) {
    console.warn("AI is disabled, using fallback review generation");
    return generateFallbackReview(context);
  }

  // Validate transcription
  const validation = validateTranscription(context.transcription);
  if (!validation.valid) {
    throw validation.error;
  }

  const cleanedContext = {
    ...context,
    transcription: validation.cleaned,
  };

  const systemPrompt = getSystemPrompt();
  const userPrompt = getUserPrompt(cleanedContext);

  const attempts: GeneratedReviewResult[] = [];
  let lastError: Error | null = null;

  // Attempt multiple generations
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      const response = await createChatCompletion(systemPrompt, userPrompt);
      const result = parseAIResponse(response);
      result.generationAttempt = attempt;
      attempts.push(result);

      // If we got a high-confidence result, we can stop early
      if (result.confidence >= 0.85 && result.wordCount >= REVIEW_WORD_TARGETS.min) {
        break;
      }

      // Small delay between attempts
      if (attempt < MAX_GENERATION_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Review generation attempt ${attempt} failed:`, lastError.message);

      // Delay before retry with exponential backoff
      if (attempt < MAX_GENERATION_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, AI_CONFIG.retryDelayMs * attempt));
      }
    }
  }

  // If we have any successful attempts, select the best one
  if (attempts.length > 0) {
    return selectBestReview(attempts);
  }

  // All attempts failed - use fallback
  console.warn("All AI generation attempts failed, using fallback:", lastError?.message);
  return generateFallbackReview(cleanedContext);
}

/**
 * Check if a transcription is suitable for review generation
 */
export function isTranscriptionSuitableForReview(transcription: string): {
  suitable: boolean;
  reason?: string;
  estimatedQuality: "excellent" | "good" | "fair" | "poor";
} {
  const cleaned = transcription.trim();
  const wordCount = cleaned ? cleaned.split(/\s+/).filter((w: string) => w.length > 0).length : 0;

  if (cleaned.length < MIN_TRANSCRIPTION_LENGTH) {
    return {
      suitable: false,
      reason: `Transcription too short (${cleaned.length} characters)`,
      estimatedQuality: "poor",
    };
  }

  // Estimate quality based on length and content
  let quality: "excellent" | "good" | "fair" | "poor";

  if (wordCount >= 100) {
    quality = "excellent";
  } else if (wordCount >= 50) {
    quality = "good";
  } else if (wordCount >= 25) {
    quality = "fair";
  } else {
    quality = "poor";
  }

  // Check for potential issues
  const issues: string[] = [];

  // Check for excessive repetition
  const words = cleaned.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (uniqueWords.size < words.length * 0.4) {
    issues.push("high repetition");
    if (quality === "excellent") {
      quality = "good";
    } else if (quality === "good") {
      quality = "fair";
    } else {
      quality = "poor";
    }
  }

  // Check for common transcription artifacts
  if (/\[inaudible\]|\[unclear\]|\[\?\]/i.test(cleaned)) {
    issues.push("unclear sections");
    if (quality === "excellent") {
      quality = "good";
    }
  }

  return {
    suitable: true,
    reason: issues.length > 0 ? `Note: ${issues.join(", ")}` : undefined,
    estimatedQuality: quality,
  };
}
