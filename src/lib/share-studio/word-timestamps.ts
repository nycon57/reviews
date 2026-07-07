/**
 * Parser for the word-timestamp payload written by the transcription service
 * to video_testimonial_responses.word_timestamps. Shared by the clip renderer
 * and the legacy render service.
 */

import type { CaptionSegment, WordTimestamp } from "@/remotion/types";

export interface WordTimestampData {
  words: WordTimestamp[];
  segments: CaptionSegment[];
}

export function parseWordTimestampData(value: unknown): WordTimestampData | null {
  if (!value || typeof value !== "object") return null;

  const payload = value as {
    words?: Array<{ word?: string; start_ms?: number; end_ms?: number; confidence?: number }>;
    segments?: Array<{ text?: string; start_ms?: number; end_ms?: number; confidence?: number }>;
  };

  const words: WordTimestamp[] = (payload.words ?? [])
    .flatMap((w) => {
      const text = (w.word ?? "").trim();
      if (!text) return [];
      const startMs = Math.max(0, Math.round(Number(w.start_ms ?? 0)));
      const endMs = Math.max(startMs, Math.round(Number(w.end_ms ?? startMs)));
      return [{ word: text, startMs, endMs, confidence: w.confidence }];
    })
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const segments: CaptionSegment[] = (payload.segments ?? [])
    .flatMap((s) => {
      const text = (s.text ?? "").trim();
      if (!text) return [];
      const startMs = Math.max(0, Math.round(Number(s.start_ms ?? 0)));
      const endMs = Math.max(startMs, Math.round(Number(s.end_ms ?? startMs)));
      return [{ text, startMs, endMs, confidence: s.confidence }];
    })
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  if (!words.length && !segments.length) return null;
  return { words, segments };
}
