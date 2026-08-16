import { afterEach, describe, expect, it, vi } from "vitest";
import {
  transcribeWithWordTimestamps,
  WordTimestampTranscriptionError,
} from "@/lib/share-studio/transcription-service";
import type { TranscriptionResult, WordTimestampRaw } from "@/lib/share-studio/template-types";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function buildResult(overrides: Partial<TranscriptionResult> = {}): TranscriptionResult {
  return {
    full_text: "Great service and smooth closing.",
    segments: [
      {
        text: "Great service and smooth closing.",
        start_ms: 0,
        end_ms: 2200,
        confidence: 0.92,
      },
    ],
    words: [
      { word: "Great", start_ms: 0, end_ms: 300, confidence: 0.95 },
      { word: "service", start_ms: 300, end_ms: 700, confidence: 0.45 },
      { word: "and", start_ms: 700, end_ms: 900, confidence: 0.9 },
      { word: "smooth", start_ms: 900, end_ms: 1400, confidence: 0.9 },
      { word: "closing.", start_ms: 1400, end_ms: 2200, confidence: 0.9 },
    ],
    provider: "gemini",
    model: "gemini-2.5-flash",
    duration_ms: 2200,
    ...overrides,
  };
}

describe("transcribeWithWordTimestamps", () => {
  it("falls back to Gemini when Deepgram fails", async () => {
    process.env.DEEPGRAM_API_KEY = "deepgram-test";
    process.env.GEMINI_API_KEY = "gemini-test";
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const deepgram = vi.fn().mockRejectedValue(new Error("Deepgram unavailable"));
    const gemini = vi.fn().mockResolvedValue(buildResult({ provider: "gemini" }));

    const result = await transcribeWithWordTimestamps("https://example.supabase.co/audio.webm", {
      durationSeconds: 12,
      providers: { deepgram, gemini },
    });

    expect(deepgram).toHaveBeenCalledTimes(1);
    expect(gemini).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe("gemini");
    expect(result.words.some((word: WordTimestampRaw) => word.flagged_for_review)).toBe(true);
  });

  it("uses Deepgram as primary provider when available", async () => {
    process.env.DEEPGRAM_API_KEY = "deepgram-test";
    process.env.GEMINI_API_KEY = "gemini-test";

    const deepgram = vi.fn().mockResolvedValue(buildResult({ provider: "deepgram", model: "nova-2" }));
    const gemini = vi.fn().mockResolvedValue(buildResult());

    const result = await transcribeWithWordTimestamps("https://example.supabase.co/audio.mp4", {
      providers: { deepgram, gemini },
    });

    expect(result.provider).toBe("deepgram");
    expect(result.model).toBe("nova-2");
    expect(gemini).not.toHaveBeenCalled();
  });

  it("rejects invalid URLs with status 400", async () => {
    await expect(
      transcribeWithWordTimestamps("not-a-url", {
        providers: { gemini: vi.fn().mockResolvedValue(buildResult()) },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects unsupported formats with status 400", async () => {
    await expect(
      transcribeWithWordTimestamps("https://example.supabase.co/audio.flac", {
        providers: { gemini: vi.fn().mockResolvedValue(buildResult()) },
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects media longer than 60 minutes with status 413", async () => {
    await expect(
      transcribeWithWordTimestamps("https://example.supabase.co/audio.webm", {
        durationSeconds: 3601,
        providers: { gemini: vi.fn().mockResolvedValue(buildResult()) },
      })
    ).rejects.toMatchObject({ statusCode: 413 });
  });

  it("returns empty transcript for silent media", async () => {
    process.env.GEMINI_API_KEY = "gemini-test";
    const gemini = vi.fn().mockResolvedValue(
      buildResult({
        full_text: "",
        words: [],
        segments: [],
        duration_ms: 0,
      })
    );

    const result = await transcribeWithWordTimestamps("https://example.supabase.co/audio.webm", {
      providers: { gemini },
    });

    expect(result.full_text).toBe("");
    expect(result.words).toHaveLength(0);
    expect(result.segments).toHaveLength(0);
  });

  it("throws 503 when no providers are configured", async () => {
    delete process.env.DEEPGRAM_API_KEY;
    delete process.env.GEMINI_API_KEY;

    await expect(
      transcribeWithWordTimestamps("https://example.supabase.co/audio.webm")
    ).rejects.toMatchObject({
      statusCode: 503,
    } satisfies Partial<WordTimestampTranscriptionError>);
  });
});
