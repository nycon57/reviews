// OpenAI API Client for Whisper Transcription

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

export interface OpenAIWhisperConfig {
  apiKey: string;
  model: "whisper-1";
  maxRetries: number;
  retryDelayMs: number;
  costPerMinute: number; // USD cost tracking
}

// Configuration for Whisper API
export const WHISPER_CONFIG: Omit<OpenAIWhisperConfig, "apiKey"> = {
  model: "whisper-1",
  maxRetries: 3,
  retryDelayMs: 1000,
  costPerMinute: 0.006, // $0.006 per minute as of 2024
} as const;

function getOpenAIConfig(): { apiKey: string } {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  return { apiKey };
}

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const { apiKey } = getOpenAIConfig();
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export function isWhisperEnabled(): boolean {
  return (
    !!process.env.OPENAI_API_KEY &&
    process.env.FEATURE_VIDEO_TRANSCRIPTION !== "false"
  );
}

/**
 * Calculate estimated cost for transcription
 * @param durationSeconds Duration of audio in seconds
 * @returns Estimated cost in USD
 */
export function calculateTranscriptionCost(durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60;
  return durationMinutes * WHISPER_CONFIG.costPerMinute;
}
