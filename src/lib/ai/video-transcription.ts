// Video Transcription Service using Google Gemini

import { getGeminiClient } from "./client";
import { AI_CONFIG } from "./types";

export interface TranscriptionResult {
  text: string;
  language: string | null;
  duration: number | null;
  cost: number;
}

export interface TranscriptionError {
  code: "API_ERROR" | "TIMEOUT" | "INVALID_INPUT" | "FILE_ERROR" | "UNKNOWN";
  message: string;
  retryable: boolean;
}

export interface TranscribeOptions {
  language?: string; // ISO-639-1 code, or undefined for auto-detect
  prompt?: string; // Optional context to improve accuracy
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download video from URL and return as base64
 */
async function fetchVideoAsBase64(videoUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "video/webm";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return { base64, mimeType: contentType.split(";")[0] };
}

/**
 * Transcribe a video/audio file using Google Gemini
 *
 * @param videoUrl URL of the video to transcribe (supports webm, mp4, mp3, etc.)
 * @param durationSeconds Duration of the video in seconds (for reference)
 * @param options Optional transcription settings
 * @returns Transcription result or throws error
 */
export async function transcribeVideo(
  videoUrl: string,
  durationSeconds: number | null,
  options: TranscribeOptions = {}
): Promise<TranscriptionResult> {
  const client = getGeminiClient();

  // Download video file as base64
  const { base64, mimeType } = await fetchVideoAsBase64(videoUrl);

  // Check file size (Gemini has limits on inline data)
  const fileSizeMB = (base64.length * 0.75) / (1024 * 1024); // base64 is ~33% larger
  if (fileSizeMB > 20) {
    throw createTranscriptionError(
      "INVALID_INPUT",
      `File size (${fileSizeMB.toFixed(1)}MB) exceeds 20MB limit for inline data.`,
      false
    );
  }

  // Build transcription prompt
  const contextPrompt = options.prompt ? `\nContext: ${options.prompt}` : "";
  const languageHint = options.language ? `\nThe audio is in ${options.language}.` : "";

  const systemPrompt = `You are a professional transcription service. Transcribe the audio from this video accurately and completely.${contextPrompt}${languageHint}

Instructions:
- Transcribe exactly what is said, word for word
- Include filler words (um, uh, like) only if they significantly affect meaning
- Use proper punctuation and capitalization
- If multiple speakers, indicate speaker changes with line breaks
- If audio is unclear, indicate with [inaudible]
- Do not add commentary or summaries
- Output ONLY the transcription text, nothing else`;

  const response = await client.models.generateContent({
    model: AI_CONFIG.model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          {
            text: systemPrompt,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.1, // Low temperature for accurate transcription
    },
  });

  const transcriptionText = response.text;
  if (!transcriptionText) {
    throw createTranscriptionError("API_ERROR", "Empty response from Gemini", true);
  }

  return {
    text: transcriptionText.trim(),
    language: options.language || null,
    duration: durationSeconds,
    cost: 0, // Gemini pricing is different, tracked separately
  };
}

/**
 * Transcribe video with retry logic for transient failures
 */
export async function transcribeVideoWithRetry(
  videoUrl: string,
  durationSeconds: number | null,
  options: TranscribeOptions = {}
): Promise<TranscriptionResult> {
  let lastError: TranscriptionError | null = null;

  for (let attempt = 1; attempt <= AI_CONFIG.maxRetries; attempt++) {
    try {
      return await transcribeVideo(videoUrl, durationSeconds, options);
    } catch (error) {
      lastError = parseTranscriptionError(error);
      console.error(`Transcription attempt ${attempt} failed:`, lastError);

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      if (attempt < AI_CONFIG.maxRetries) {
        const delay = AI_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  // If we exhausted retries, throw the last error
  throw lastError || createTranscriptionError("UNKNOWN", "Transcription failed after retries", false);
}

/**
 * Create a structured transcription error
 */
function createTranscriptionError(
  code: TranscriptionError["code"],
  message: string,
  retryable: boolean
): TranscriptionError {
  return { code, message, retryable };
}

/**
 * Parse various error types into TranscriptionError
 */
function parseTranscriptionError(error: unknown): TranscriptionError {
  if (error && typeof error === "object" && "code" in error) {
    // Already a TranscriptionError
    return error as TranscriptionError;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for timeout errors
    if (message.includes("timeout") || message.includes("timed out")) {
      return createTranscriptionError("TIMEOUT", error.message, true);
    }

    // Check for rate limit or server errors (retryable)
    if (
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("500") ||
      message.includes("502") ||
      message.includes("503") ||
      message.includes("504") ||
      message.includes("resource_exhausted")
    ) {
      return createTranscriptionError("API_ERROR", error.message, true);
    }

    // Check for file-related errors
    if (
      message.includes("file") ||
      message.includes("fetch") ||
      message.includes("download")
    ) {
      return createTranscriptionError("FILE_ERROR", error.message, true);
    }

    // Check for invalid input (not retryable)
    if (
      message.includes("invalid") ||
      message.includes("unsupported") ||
      message.includes("400")
    ) {
      return createTranscriptionError("INVALID_INPUT", error.message, false);
    }

    // Check for missing API key
    if (message.includes("api_key") || message.includes("gemini_api_key")) {
      return createTranscriptionError("API_ERROR", error.message, false);
    }

    // Default API error (retryable)
    return createTranscriptionError("API_ERROR", error.message, true);
  }

  return createTranscriptionError("UNKNOWN", String(error), false);
}

/**
 * Format transcription error for storage in database
 */
export function formatTranscriptionError(error: TranscriptionError): string {
  return `[${error.code}] ${error.message}`;
}

/**
 * Check if a transcription error was a transient failure
 */
export function isRetryableError(error: TranscriptionError): boolean {
  return error.retryable;
}
