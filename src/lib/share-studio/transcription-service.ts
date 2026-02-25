import { z } from "zod";
import { getGeminiClient } from "@/lib/ai/client";
import type {
  TranscriptionResult,
  TranscriptionSegment,
  WordTimestampRaw,
} from "@/lib/share-studio/template-types";

const MAX_AUDIO_DURATION_SECONDS = 60 * 60;
const LOW_CONFIDENCE_THRESHOLD = 0.5;
const FALLBACK_WORDS_PER_SECOND = 2.6;
const FALLBACK_WORD_CONFIDENCE = 0.75;
const FETCH_TIMEOUT_MS = 30_000;
// Gemini accepts up to 50 MB base64-encoded; raw bytes expand ~4/3x when encoded,
// so the raw file limit is 50 MB / (4/3) ≈ 37.5 MB.
const MAX_GEMINI_FILE_BYTES = Math.floor((50 * 1024 * 1024) / (4 / 3));

const ALLOWED_AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "webm", "mp4"]);

const geminiResponseSchema = z.object({
  full_text: z.string().default(""),
  segments: z
    .array(
      z.object({
        text: z.string(),
        start_ms: z.number().nonnegative(),
        end_ms: z.number().nonnegative(),
        confidence: z.number().min(0).max(1).optional(),
      })
    )
    .default([]),
  words: z
    .array(
      z.object({
        word: z.string(),
        start_ms: z.number().nonnegative(),
        end_ms: z.number().nonnegative(),
        confidence: z.number().min(0).max(1).optional(),
      })
    )
    .default([]),
});

interface DeepgramWord {
  word?: string;
  start?: number;
  end?: number;
  confidence?: number;
}

interface DeepgramSentence {
  text?: string;
  start?: number;
  end?: number;
}

interface DeepgramAlternative {
  transcript?: string;
  words?: DeepgramWord[];
  paragraphs?: {
    paragraphs?: Array<{
      sentences?: DeepgramSentence[];
    }>;
  };
}

interface DeepgramResponse {
  results?: {
    channels?: Array<{
      alternatives?: DeepgramAlternative[];
    }>;
  };
}

interface ProviderInput {
  audioUrl: string;
  durationSeconds: number | null;
  language?: string;
  prompt?: string;
}

type ProviderFn = (input: ProviderInput) => Promise<TranscriptionResult>;

export interface TranscribeWithWordTimestampOptions {
  durationSeconds?: number | null;
  language?: string;
  prompt?: string;
  providers?: {
    deepgram?: ProviderFn;
    gemini?: ProviderFn;
  };
}

export class WordTimestampTranscriptionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "WordTimestampTranscriptionError";
    this.statusCode = statusCode;
  }
}

export function isWordTimestampTranscriptionEnabled(): boolean {
  return Boolean(process.env.DEEPGRAM_API_KEY || process.env.GEMINI_API_KEY);
}

export async function transcribeWithWordTimestamps(
  audioUrl: string,
  options: TranscribeWithWordTimestampOptions = {}
): Promise<TranscriptionResult> {
  validateAudioUrl(audioUrl);

  if (
    typeof options.durationSeconds === "number" &&
    options.durationSeconds > MAX_AUDIO_DURATION_SECONDS
  ) {
    throw new WordTimestampTranscriptionError(
      "Audio duration exceeds 60 minutes and cannot be transcribed.",
      413
    );
  }

  const providerInput: ProviderInput = {
    audioUrl,
    durationSeconds: options.durationSeconds ?? null,
    language: options.language,
    prompt: options.prompt,
  };

  const deepgramProvider = options.providers?.deepgram ?? transcribeWithDeepgram;
  const geminiProvider = options.providers?.gemini ?? transcribeWithGemini;

  const canUseDeepgram = Boolean(options.providers?.deepgram || process.env.DEEPGRAM_API_KEY);
  const canUseGemini = Boolean(options.providers?.gemini || process.env.GEMINI_API_KEY);

  if (!canUseDeepgram && !canUseGemini) {
    throw new WordTimestampTranscriptionError(
      "No transcription provider configured. Set DEEPGRAM_API_KEY or GEMINI_API_KEY.",
      503
    );
  }

  let deepgramError: unknown = null;

  if (canUseDeepgram) {
    try {
      const result = await deepgramProvider(providerInput);
      return normalizeResult(result, options.durationSeconds ?? null);
    } catch (error) {
      deepgramError = error;
      console.warn("[share-studio] Deepgram transcription failed; attempting Gemini fallback.", error);
    }
  }

  if (!canUseGemini) {
    throw normalizeProviderError(
      deepgramError,
      "Deepgram transcription failed and Gemini fallback is unavailable.",
      502
    );
  }

  try {
    const result = await geminiProvider(providerInput);
    return normalizeResult(result, options.durationSeconds ?? null);
  } catch (geminiError) {
    const deepgramMessage = deepgramError ? `Deepgram: ${toErrorMessage(deepgramError)}. ` : "";
    throw normalizeProviderError(
      geminiError,
      `${deepgramMessage}Gemini fallback failed: ${toErrorMessage(geminiError)}`,
      502
    );
  }
}

async function transcribeWithDeepgram(input: ProviderInput): Promise<TranscriptionResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new WordTimestampTranscriptionError("Missing DEEPGRAM_API_KEY.", 503);
  }

  const endpoint = new URL("https://api.deepgram.com/v1/listen");
  endpoint.searchParams.set("model", "nova-2");
  endpoint.searchParams.set("smart_format", "true");
  endpoint.searchParams.set("punctuate", "true");
  endpoint.searchParams.set("filler_words", "true");
  endpoint.searchParams.set("utterances", "true");
  endpoint.searchParams.set("diarize", "false");

  const response = await fetchWithTimeout(endpoint.toString(), {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: input.audioUrl,
    }),
  }, FETCH_TIMEOUT_MS);

  if (!response.ok) {
    throw new WordTimestampTranscriptionError(
      `Deepgram request failed (${response.status} ${response.statusText}).`,
      response.status
    );
  }

  const payload = (await response.json()) as DeepgramResponse;
  const alternative =
    payload.results?.channels?.[0]?.alternatives?.[0] ??
    null;

  if (!alternative) {
    return {
      full_text: "",
      segments: [],
      words: [],
      provider: "deepgram",
      model: "nova-2",
      duration_ms: input.durationSeconds ? Math.round(input.durationSeconds * 1000) : null,
    };
  }

  const words: WordTimestampRaw[] = (alternative.words ?? [])
    .map((word): WordTimestampRaw | null => {
      if (!word.word) return null;
      const startMs = Math.max(0, Math.round((word.start ?? 0) * 1000));
      const endMs = Math.max(startMs, Math.round((word.end ?? word.start ?? 0) * 1000));
      const confidence =
        typeof word.confidence === "number" && Number.isFinite(word.confidence)
          ? clamp(word.confidence, 0, 1)
          : FALLBACK_WORD_CONFIDENCE;
      return {
        word: word.word,
        start_ms: startMs,
        end_ms: endMs,
        confidence,
      };
    })
    .filter((word): word is WordTimestampRaw => word !== null);

  const sentenceSegments: TranscriptionSegment[] = [];
  const paragraphs = alternative.paragraphs?.paragraphs ?? [];
  for (const paragraph of paragraphs) {
    for (const sentence of paragraph.sentences ?? []) {
      const text = (sentence.text ?? "").trim();
      if (!text) continue;
      const startMs = Math.max(0, Math.round((sentence.start ?? 0) * 1000));
      const endMs = Math.max(startMs, Math.round((sentence.end ?? sentence.start ?? 0) * 1000));
      sentenceSegments.push({
        text,
        start_ms: startMs,
        end_ms: endMs,
        confidence: averageConfidenceForRange(words, startMs, endMs),
      });
    }
  }

  const fullText = (alternative.transcript ?? "").trim();

  return {
    full_text: fullText,
    words,
    segments: sentenceSegments,
    provider: "deepgram",
    model: "nova-2",
    duration_ms: input.durationSeconds ? Math.round(input.durationSeconds * 1000) : null,
  };
}

async function transcribeWithGemini(input: ProviderInput): Promise<TranscriptionResult> {
  const { base64, mimeType } = await fetchMediaAsBase64(input.audioUrl);
  const client = getGeminiClient();

  const languageInstruction = input.language
    ? `The audio language is ${input.language}.`
    : "Detect the language automatically.";
  const contextInstruction = input.prompt ? `Context: ${input.prompt}` : "";

  const prompt = `You are a timestamped transcription engine.
Transcribe the provided media and output strict JSON with this exact shape:
{
  "full_text": "string",
  "segments": [{ "text": "string", "start_ms": 0, "end_ms": 0, "confidence": 0.0 }],
  "words": [{ "word": "string", "start_ms": 0, "end_ms": 0, "confidence": 0.0 }]
}

Rules:
- Use millisecond timestamps.
- Keep words in chronological order.
- Confidence must be 0 to 1.
- If the clip is silent or empty, return empty strings/arrays.
- Do not include markdown fences or commentary.
${languageInstruction}
${contextInstruction}`;

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
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
            text: prompt,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0,
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: computeMaxOutputTokens(input.durationSeconds),
    },
  } as Parameters<typeof client.models.generateContent>[0]);

  const textResponse = response.text;
  if (!textResponse || !textResponse.trim()) {
    throw new WordTimestampTranscriptionError("Gemini returned an empty transcription payload.", 502);
  }

  let parsedPayload: z.infer<typeof geminiResponseSchema> | null = null;
  try {
    const parsedJson = JSON.parse(textResponse) as unknown;
    const validated = geminiResponseSchema.safeParse(parsedJson);
    if (validated.success) {
      parsedPayload = validated.data;
    }
  } catch {
    // Fallback below.
  }

  if (!parsedPayload) {
    const fallbackText = stripMarkdownCodeFence(textResponse).trim();
    return buildFallbackResult(fallbackText, input.durationSeconds, "gemini-2.5-flash");
  }

  const words: WordTimestampRaw[] = parsedPayload.words.map((word) => ({
    word: word.word,
    start_ms: Math.round(word.start_ms),
    end_ms: Math.max(Math.round(word.start_ms), Math.round(word.end_ms)),
    confidence: clamp(word.confidence ?? FALLBACK_WORD_CONFIDENCE, 0, 1),
  }));

  const segments: TranscriptionSegment[] = parsedPayload.segments.map((segment) => ({
    text: segment.text,
    start_ms: Math.round(segment.start_ms),
    end_ms: Math.max(Math.round(segment.start_ms), Math.round(segment.end_ms)),
    confidence: clamp(segment.confidence ?? FALLBACK_WORD_CONFIDENCE, 0, 1),
  }));

  return {
    full_text: parsedPayload.full_text.trim(),
    words,
    segments,
    provider: "gemini",
    model: "gemini-2.5-flash",
    duration_ms: input.durationSeconds ? Math.round(input.durationSeconds * 1000) : null,
  };
}

function normalizeResult(
  input: TranscriptionResult,
  durationSeconds: number | null
): TranscriptionResult {
  const normalizedWords: WordTimestampRaw[] = [...(input.words ?? [])]
    .map((word): WordTimestampRaw | null => {
      const text = word.word.trim();
      if (!text) return null;
      const startMs = Math.max(0, Math.round(word.start_ms));
      const endMs = Math.max(startMs, Math.round(word.end_ms));
      const confidence = clamp(
        Number.isFinite(word.confidence) ? word.confidence : FALLBACK_WORD_CONFIDENCE,
        0,
        1
      );

      return {
        word: text,
        start_ms: startMs,
        end_ms: endMs,
        confidence,
        flagged_for_review: confidence < LOW_CONFIDENCE_THRESHOLD,
      };
    })
    .filter((word): word is WordTimestampRaw => Boolean(word))
    .sort((a, b) => a.start_ms - b.start_ms || a.end_ms - b.end_ms);

  let normalizedSegments: TranscriptionSegment[] = [...(input.segments ?? [])]
    .map((segment): TranscriptionSegment | null => {
      const text = segment.text.trim();
      if (!text) return null;
      const startMs = Math.max(0, Math.round(segment.start_ms));
      const endMs = Math.max(startMs, Math.round(segment.end_ms));
      return {
        text,
        start_ms: startMs,
        end_ms: endMs,
        confidence: clamp(
          Number.isFinite(segment.confidence)
            ? segment.confidence
            : averageConfidenceForRange(normalizedWords, startMs, endMs),
          0,
          1
        ),
      };
    })
    .filter((segment): segment is TranscriptionSegment => Boolean(segment))
    .sort((a, b) => a.start_ms - b.start_ms || a.end_ms - b.end_ms);

  let fullText = (input.full_text ?? "").trim();

  if (!normalizedSegments.length && normalizedWords.length) {
    normalizedSegments = buildSegmentsFromWords(normalizedWords);
  }

  if (!normalizedWords.length && normalizedSegments.length) {
    normalizedWords.push(...buildWordsFromSegments(normalizedSegments));
  }

  if (!fullText && normalizedWords.length) {
    fullText = normalizedWords.map((word) => word.word).join(" ").replace(/\s+([,.!?;:])/g, "$1");
  }

  if (!fullText && !normalizedWords.length && !normalizedSegments.length) {
    return {
      full_text: "",
      words: [],
      segments: [],
      provider: input.provider,
      model: input.model,
      duration_ms: durationSeconds ? Math.round(durationSeconds * 1000) : null,
    };
  }

  const durationMsCandidate = Math.max(
    normalizedWords.at(-1)?.end_ms ?? 0,
    normalizedSegments.at(-1)?.end_ms ?? 0
  );

  const durationMs = durationMsCandidate
    ? durationMsCandidate
    : durationSeconds
      ? Math.round(durationSeconds * 1000)
      : null;

  return {
    full_text: fullText,
    words: normalizedWords,
    segments: normalizedSegments,
    provider: input.provider,
    model: input.model,
    duration_ms: durationMs,
  };
}

function buildFallbackResult(
  rawText: string,
  durationSeconds: number | null,
  model: string
): TranscriptionResult {
  const text = rawText.trim();
  if (!text) {
    return {
      full_text: "",
      segments: [],
      words: [],
      provider: "gemini",
      model,
      duration_ms: durationSeconds ? Math.round(durationSeconds * 1000) : null,
    };
  }

  const durationMs = durationSeconds
    ? Math.round(durationSeconds * 1000)
    : Math.round((text.split(/\s+/).length / FALLBACK_WORDS_PER_SECOND) * 1000);

  const words = buildWordsFromText(text, durationMs);
  const segments = buildSegmentsFromWords(words);

  return {
    full_text: text,
    segments,
    words,
    provider: "gemini",
    model,
    duration_ms: durationMs,
  };
}

function buildWordsFromText(text: string, durationMs: number): WordTimestampRaw[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  const wordDuration = Math.max(80, Math.round(durationMs / tokens.length));

  return tokens.map((token, index) => {
    const start = index * wordDuration;
    const end = index === tokens.length - 1 ? durationMs : start + wordDuration;
    return {
      word: token,
      start_ms: start,
      end_ms: Math.max(start, end),
      confidence: FALLBACK_WORD_CONFIDENCE,
    };
  });
}

function buildWordsFromSegments(segments: TranscriptionSegment[]): WordTimestampRaw[] {
  const words: WordTimestampRaw[] = [];
  for (const segment of segments) {
    const tokens = segment.text.split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    const segmentDuration = Math.max(1, segment.end_ms - segment.start_ms);
    const tokenDuration = segmentDuration / tokens.length;

    tokens.forEach((token, index) => {
      const start = Math.round(segment.start_ms + index * tokenDuration);
      const end = Math.round(
        index === tokens.length - 1 ? segment.end_ms : segment.start_ms + (index + 1) * tokenDuration
      );
      words.push({
        word: token,
        start_ms: Math.max(0, start),
        end_ms: Math.max(start, end),
        confidence: segment.confidence,
      });
    });
  }

  return words;
}

function buildSegmentsFromWords(words: WordTimestampRaw[]): TranscriptionSegment[] {
  if (!words.length) return [];

  const segments: TranscriptionSegment[] = [];
  let currentWords: WordTimestampRaw[] = [];
  const MAX_WORDS_PER_SEGMENT = 10;
  const GAP_BREAK_MS = 900;

  const flushSegment = () => {
    if (!currentWords.length) return;
    const text = currentWords.map((word) => word.word).join(" ");
    const startMs = currentWords[0].start_ms;
    const endMs = currentWords[currentWords.length - 1].end_ms;
    const confidence =
      currentWords.reduce((sum, word) => sum + word.confidence, 0) / currentWords.length;
    segments.push({
      text,
      start_ms: startMs,
      end_ms: Math.max(startMs, endMs),
      confidence: clamp(confidence, 0, 1),
    });
    currentWords = [];
  };

  words.forEach((word, index) => {
    const previous = words[index - 1];
    const hasLargeGap = previous ? word.start_ms - previous.end_ms > GAP_BREAK_MS : false;
    const sentenceBreak = /[.!?]$/.test(previous?.word ?? "");

    if (currentWords.length && (hasLargeGap || sentenceBreak || currentWords.length >= MAX_WORDS_PER_SEGMENT)) {
      flushSegment();
    }

    currentWords.push(word);
  });

  flushSegment();
  return segments;
}

function averageConfidenceForRange(words: WordTimestampRaw[], startMs: number, endMs: number): number {
  const overlapping = words.filter((word) => word.end_ms >= startMs && word.start_ms <= endMs);
  if (!overlapping.length) return FALLBACK_WORD_CONFIDENCE;
  const average = overlapping.reduce((sum, word) => sum + word.confidence, 0) / overlapping.length;
  return clamp(average, 0, 1);
}

const ALLOWED_STORAGE_HOSTS = new Set([
  // Supabase storage
  "supabase.co",
  "supabase.com",
  // AWS S3
  "s3.amazonaws.com",
  // Google Cloud Storage
  "storage.googleapis.com",
  // Cloudflare R2
  "r2.cloudflarestorage.com",
]);

function isAllowedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  for (const allowed of ALLOWED_STORAGE_HOSTS) {
    if (lower === allowed || lower.endsWith(`.${allowed}`)) {
      return true;
    }
  }
  return false;
}

function validateAudioUrl(audioUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(audioUrl);
  } catch {
    throw new WordTimestampTranscriptionError("Invalid audio URL format.", 400);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new WordTimestampTranscriptionError(
      "Audio URL must start with http:// or https://.",
      400
    );
  }

  if (!isAllowedHost(parsed.hostname)) {
    throw new WordTimestampTranscriptionError(
      "Audio URL host is not in the allowed storage domains.",
      400
    );
  }

  const extensionMatch = parsed.pathname.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!extensionMatch) {
    throw new WordTimestampTranscriptionError(
      "Audio URL must include a file extension. Allowed formats: mp3, wav, m4a, webm, mp4.",
      400
    );
  }

  if (!ALLOWED_AUDIO_EXTENSIONS.has(extensionMatch[1])) {
    throw new WordTimestampTranscriptionError(
      "Unsupported audio format. Allowed formats: mp3, wav, m4a, webm, mp4.",
      400
    );
  }
}

/**
 * Follows redirects manually so every intermediate URL is validated against
 * the allowed-host list, then downloads audio into memory as base64 for the
 * Gemini inline-data path.  Enforces a size limit (MAX_GEMINI_FILE_BYTES)
 * via Content-Length pre-check to avoid OOM on very large files.
 */
const MAX_REDIRECTS = 5;

async function fetchMediaAsBase64(audioUrl: string): Promise<{ base64: string; mimeType: string }> {
  let currentUrl = audioUrl;

  // Pre-check Content-Length via HEAD, following redirects manually
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const headResponse = await fetchWithTimeout(
      currentUrl,
      { method: "HEAD", redirect: "manual" },
      FETCH_TIMEOUT_MS
    );

    if (headResponse.status >= 300 && headResponse.status < 400) {
      const location = headResponse.headers.get("location");
      if (!location) {
        throw new WordTimestampTranscriptionError("Redirect without Location header.", 502);
      }
      const resolvedUrl = new URL(location, currentUrl).href;
      validateAudioUrl(resolvedUrl);
      currentUrl = resolvedUrl;

      if (i === MAX_REDIRECTS) {
        throw new WordTimestampTranscriptionError("Too many redirects.", 502);
      }
      continue;
    }

    if (headResponse.ok) {
      const contentLength = headResponse.headers.get("content-length");
      if (contentLength && Number(contentLength) > MAX_GEMINI_FILE_BYTES) {
        throw new WordTimestampTranscriptionError(
          `Audio file too large (${Math.round(Number(contentLength) / 1024 / 1024)}MB). Maximum ${Math.round(MAX_GEMINI_FILE_BYTES / 1024 / 1024)}MB.`,
          413
        );
      }
    }
    break;
  }

  // Fetch the actual body, again following redirects manually
  let fetchUrl = currentUrl;
  let response: Response | null = null;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    response = await fetchWithTimeout(fetchUrl, { redirect: "manual" }, FETCH_TIMEOUT_MS);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new WordTimestampTranscriptionError("Redirect without Location header.", 502);
      }
      const resolvedUrl = new URL(location, fetchUrl).href;
      validateAudioUrl(resolvedUrl);
      fetchUrl = resolvedUrl;

      if (i === MAX_REDIRECTS) {
        throw new WordTimestampTranscriptionError("Too many redirects.", 502);
      }
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    const status = response?.status ?? 502;
    const statusText = response?.statusText ?? "Unknown";
    throw new WordTimestampTranscriptionError(
      `Failed to fetch media URL (${status} ${statusText}).`,
      status
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  const mimeType = resolveMimeType(fetchUrl, contentType);

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_GEMINI_FILE_BYTES) {
    throw new WordTimestampTranscriptionError(
      `Audio file too large (${Math.round(arrayBuffer.byteLength / 1024 / 1024)}MB). Maximum ${Math.round(MAX_GEMINI_FILE_BYTES / 1024 / 1024)}MB.`,
      413
    );
  }
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return { base64, mimeType };
}

function resolveMimeType(audioUrl: string, contentType: string): string {
  const normalizedContentType = contentType.split(";")[0].trim().toLowerCase();
  if (normalizedContentType) {
    return normalizedContentType;
  }

  const extensionMatch = audioUrl.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  const extension = extensionMatch?.[1] ?? "";

  const extensionToMime: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    webm: "video/webm",
    mp4: "video/mp4",
  };

  return extensionToMime[extension] ?? "video/webm";
}

function computeMaxOutputTokens(durationSeconds: number | null): number {
  // Each second of audio produces ~2.5 words; each word-level JSON object
  // expands to ~8-10 tokens (key names, numbers, punctuation).  Use ~25
  // tokens/second to cover word + segment JSON and some safety margin.
  const TOKENS_PER_SECOND = 25;
  const JSON_OVERHEAD = 4096;
  const MIN_TOKENS = 8192;
  const MAX_TOKENS = 65536;

  if (!durationSeconds || durationSeconds <= 0) {
    return MIN_TOKENS;
  }

  const estimated = Math.ceil(durationSeconds * TOKENS_PER_SECOND) + JSON_OVERHEAD;
  return Math.min(MAX_TOKENS, Math.max(MIN_TOKENS, estimated));
}

async function fetchWithTimeout(
  url: string,
  init: Record<string, unknown> = {},
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal } as Parameters<typeof fetch>[1]);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new WordTimestampTranscriptionError(
        `Request timed out after ${Math.round(timeoutMs / 1000)}s.`,
        504
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeProviderError(
  error: unknown,
  fallbackMessage: string,
  statusCode: number
): WordTimestampTranscriptionError {
  if (error instanceof WordTimestampTranscriptionError) {
    return new WordTimestampTranscriptionError(
      fallbackMessage || error.message,
      error.statusCode
    );
  }

  return new WordTimestampTranscriptionError(
    fallbackMessage || toErrorMessage(error),
    statusCode
  );
}

function stripMarkdownCodeFence(content: string): string {
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "");
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
