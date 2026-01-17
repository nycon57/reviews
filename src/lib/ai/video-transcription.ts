// Video Transcription Service using OpenAI Whisper API

import { getOpenAIClient, WHISPER_CONFIG, calculateTranscriptionCost } from "./openai-client";
import type { Uploadable } from "openai/uploads";

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
  responseFormat?: "json" | "text" | "srt" | "verbose_json" | "vtt";
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download file from URL and return as File object for OpenAI API
 */
async function fetchVideoAsFile(videoUrl: string): Promise<File> {
  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "video/webm";
  const blob = await response.blob();

  // Extract filename from URL or use default
  const urlPath = new URL(videoUrl).pathname;
  const filename = urlPath.split("/").pop() || "video.webm";

  return new File([blob], filename, { type: contentType });
}

/**
 * Transcribe a video/audio file using OpenAI Whisper API
 *
 * @param videoUrl URL of the video to transcribe (supports webm, mp4, mp3, etc.)
 * @param durationSeconds Duration of the video in seconds (for cost calculation)
 * @param options Optional transcription settings
 * @returns Transcription result or throws error
 */
export async function transcribeVideo(
  videoUrl: string,
  durationSeconds: number | null,
  options: TranscribeOptions = {}
): Promise<TranscriptionResult> {
  const client = getOpenAIClient();

  // Download video file
  const videoFile = await fetchVideoAsFile(videoUrl);

  // Whisper API supports files up to 25MB directly
  // For larger files, chunking would be needed (not implemented yet)
  const fileSizeMB = videoFile.size / (1024 * 1024);
  if (fileSizeMB > 25) {
    throw createTranscriptionError(
      "INVALID_INPUT",
      `File size (${fileSizeMB.toFixed(1)}MB) exceeds 25MB limit. Chunking not yet implemented.`,
      false
    );
  }

  const transcription = await client.audio.transcriptions.create({
    file: videoFile as Uploadable,
    model: WHISPER_CONFIG.model,
    language: options.language, // undefined = auto-detect
    prompt: options.prompt,
    response_format: options.responseFormat || "verbose_json",
  });

  // Calculate cost based on duration
  const duration = durationSeconds || (transcription as { duration?: number }).duration || 0;
  const cost = calculateTranscriptionCost(duration);

  return {
    text: transcription.text,
    language: (transcription as { language?: string }).language || null,
    duration,
    cost,
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

  for (let attempt = 1; attempt <= WHISPER_CONFIG.maxRetries; attempt++) {
    try {
      return await transcribeVideo(videoUrl, durationSeconds, options);
    } catch (error) {
      lastError = parseTranscriptionError(error);

      // Don't retry non-retryable errors
      if (!lastError.retryable) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      if (attempt < WHISPER_CONFIG.maxRetries) {
        const delay = WHISPER_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
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
      message.includes("504")
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
