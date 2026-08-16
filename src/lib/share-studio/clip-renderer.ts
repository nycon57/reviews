/**
 * Clip renderer: turns an approved video testimonial response into a branded
 * Clip (see CONTEXT.md § Asset Generation) via the VideoTestimonial Remotion
 * composition.
 *
 * Pipeline per render:
 *   1. Load response + request + professional + org branding
 *   2. Sign the private source video URL
 *   3. Loudness-normalize audio with ffmpeg (skipped if ffmpeg unavailable)
 *   4. Probe source dimensions/duration for adaptive framing
 *   5. Auto-trim silence from word timestamps (manual override wins)
 *   6. Build End Card contact + smart-link QR
 *   7. Render through the configured backend (local / Lambda per ADR 0003)
 */

import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { parseMedia } from "@remotion/media-parser";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { ensureSmartLinkForSource } from "@/lib/share-studio/service";
import { formatRelationship } from "@/lib/video-testimonials/types";
import { parseWordTimestampData } from "@/lib/share-studio/word-timestamps";
import { resolveBrandTokens } from "@/lib/share-studio/template-resolver";
import {
  renderComposition,
  type CompositionRenderResult,
} from "@/lib/share-studio/render-backend";
import type {
  VideoTestimonialProps,
  CaptionSegment,
  WordTimestamp,
  VideoFormat,
  ClipMusic,
} from "@/remotion/types";

const AUTO_TRIM_PADDING_MS = 500;
const SIGNED_URL_TTL_SEC = 3600;

export type ClipFraming = "auto" | "crop" | "card";

export interface ClipRenderOptions {
  format?: VideoFormat;
  /**
   * Source framing: "crop" center-crops to fill the frame (default),
   * "card" forces the card layout, "auto" picks by source aspect ratio.
   */
  framing?: ClipFraming;
  showCaptions?: boolean;
  showIntro?: boolean;
  showOutro?: boolean;
  /** "default" uses the org's configured track; "off" renders without music */
  music?: "default" | "off" | ClipMusic;
  /** Manual trim overrides (source timeline, ms) */
  trimStartMs?: number;
  trimEndMs?: number;
  /** Caption Correction: corrected transcript text; timings are preserved */
  correctedTranscript?: string;
}

export interface ClipRenderOutcome extends CompositionRenderResult {
  responseId: string;
  format: VideoFormat;
  /** Effective options after defaults, recorded on the asset for regenerate */
  appliedOptions: Required<
    Pick<
      ClipRenderOptions,
      "format" | "framing" | "showCaptions" | "showIntro" | "showOutro"
    >
  > & {
    music: ClipMusic | null;
    trimStartMs: number;
    trimEndMs: number;
    correctedTranscript: string | null;
  };
}

function sanitizeStoragePath(p: string): string {
  return p.replace(/^\/+/, "");
}

/**
 * The quote highlight card wants one strong line, not the full AI review.
 * Take whole sentences up to ~180 chars.
 */
export function extractQuoteExcerpt(text: string | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length <= 180) return trimmed;

  const sentences = trimmed.match(/[^.!?]+[.!?]+/g) ?? [trimmed];
  let excerpt = "";
  for (const sentence of sentences) {
    if (excerpt && (excerpt + sentence).length > 180) break;
    excerpt += sentence;
    if (excerpt.length >= 80) break;
  }
  return (excerpt || sentences[0]).trim().slice(0, 220);
}

/** Estimated segment timing when no word-level data exists (2.5 words/sec). */
function estimateSegmentsFromTranscript(transcription: string | null): CaptionSegment[] {
  if (!transcription) return [];
  const phrases = transcription.split(/[.!?]+/).filter((p) => p.trim());
  const segments: CaptionSegment[] = [];
  let currentMs = 0;
  for (const phrase of phrases) {
    const trimmed = phrase.trim();
    if (!trimmed) continue;
    const durationMs = (trimmed.split(/\s+/).length / 2.5) * 1000;
    segments.push({ text: trimmed, startMs: currentMs, endMs: currentMs + durationMs });
    currentMs += durationMs + 200;
  }
  return segments;
}

/**
 * Caption Correction: apply corrected transcript text onto existing word
 * timings. Word-count-preserving edits map 1:1; otherwise timings are
 * redistributed evenly across the original speech window.
 */
export function applyTranscriptCorrection(
  words: WordTimestamp[],
  correctedTranscript: string
): WordTimestamp[] {
  const correctedWords = correctedTranscript.trim().split(/\s+/).filter(Boolean);
  if (!correctedWords.length || !words.length) return words;

  if (correctedWords.length === words.length) {
    return words.map((w, i) => ({ ...w, word: correctedWords[i] }));
  }

  const startMs = words[0].startMs;
  const endMs = words[words.length - 1].endMs;
  const span = Math.max(1, endMs - startMs);
  const per = span / correctedWords.length;
  return correctedWords.map((word, i) => ({
    word,
    startMs: Math.round(startMs + i * per),
    endMs: Math.round(startMs + (i + 1) * per),
  }));
}

// ---------------------------------------------------------------------------
// Audio preparation (loudness normalization)
// ---------------------------------------------------------------------------

async function hasFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    proc.on("error", () => resolve(false));
    proc.on("exit", (code) => resolve(code === 0));
  });
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += String(d);
    });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-500)}`));
    });
  });
}

/**
 * Loudness-normalize the source audio to about -16 LUFS (social standard) and
 * upload the prepared file next to the original. Returns a signed URL for the
 * prepared file, or null when preparation isn't possible (no ffmpeg, errors).
 * The prepared file is cached per response: re-renders reuse it.
 */
async function prepareNormalizedSource(params: {
  responseId: string;
  videoPath: string;
  signedSourceUrl: string;
}): Promise<string | null> {
  const storage = createAdminClient().storage.from("video-testimonials");
  const preparedPath = sanitizeStoragePath(
    `prepared/${params.responseId}/loudnorm.mp4`
  );

  // Reuse a previously prepared file
  const existing = await storage.createSignedUrl(preparedPath, SIGNED_URL_TTL_SEC);
  if (!existing.error && existing.data?.signedUrl) {
    return existing.data.signedUrl;
  }

  if (!(await hasFfmpeg())) {
    console.warn("[clip-renderer] ffmpeg not available; skipping loudness normalization", {
      responseId: params.responseId,
    });
    return null;
  }

  const tmpIn = path.join("/tmp", `clip-src-${crypto.randomUUID()}.mp4`);
  const tmpOut = path.join("/tmp", `clip-norm-${crypto.randomUUID()}.mp4`);

  try {
    const res = await fetch(params.signedSourceUrl);
    if (!res.ok) throw new Error(`source fetch failed: ${res.status}`);
    await fs.writeFile(tmpIn, Buffer.from(await res.arrayBuffer()));

    await runFfmpeg([
      "-y",
      "-i", tmpIn,
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "128k",
      tmpOut,
    ]);

    const prepared = await fs.readFile(tmpOut);
    const { error: uploadError } = await storage.upload(preparedPath, prepared, {
      upsert: true,
      contentType: "video/mp4",
    });
    if (uploadError) throw new Error(uploadError.message);

    const signed = await storage.createSignedUrl(preparedPath, SIGNED_URL_TTL_SEC);
    if (signed.error || !signed.data?.signedUrl) {
      throw new Error(signed.error?.message || "failed to sign prepared file");
    }
    return signed.data.signedUrl;
  } catch (err) {
    console.error("[clip-renderer] loudness normalization failed; using original audio", {
      responseId: params.responseId,
      error: err,
    });
    return null;
  } finally {
    await fs.unlink(tmpIn).catch(() => undefined);
    await fs.unlink(tmpOut).catch(() => undefined);
  }
}

// ---------------------------------------------------------------------------
// Source probing
// ---------------------------------------------------------------------------

async function probeSource(url: string): Promise<{
  width: number | null;
  height: number | null;
  durationMs: number | null;
}> {
  try {
    const result = await parseMedia({
      src: url,
      fields: { dimensions: true, durationInSeconds: true },
      acknowledgeRemotionLicense: true,
    });
    return {
      width: result.dimensions?.width ?? null,
      height: result.dimensions?.height ?? null,
      durationMs: result.durationInSeconds
        ? Math.round(result.durationInSeconds * 1000)
        : null,
    };
  } catch (err) {
    console.warn("[clip-renderer] media probe failed; assuming 16:9", { error: err });
    return { width: null, height: null, durationMs: null };
  }
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

function compositionIdForFormat(format: VideoFormat): string {
  if (format === "9:16") return "VideoTestimonial-9-16";
  if (format === "1:1") return "VideoTestimonial-1-1";
  return "VideoTestimonial-16-9";
}

/** Org-level default music from organizations.settings.clipMusic. */
function resolveOrgMusic(settings: Record<string, unknown> | null): ClipMusic | null {
  const clipMusic = settings?.clipMusic as { url?: unknown; volume?: unknown } | undefined;
  if (!clipMusic || typeof clipMusic.url !== "string" || !clipMusic.url) return null;
  return {
    url: clipMusic.url,
    volume: typeof clipMusic.volume === "number" ? clipMusic.volume : undefined,
  };
}

export async function renderClipForResponse(
  responseId: string,
  organizationId: string,
  options: ClipRenderOptions = {}
): Promise<ClipRenderOutcome> {
  const supabase = createUntypedAdminClient();

  const { data: response, error } = await supabase
    .from("video_testimonial_responses")
    .select(
      `
      id, video_path, duration_seconds, transcription, ai_generated_text, word_timestamps,
      approval_status, quarantined, user_id,
      video_testimonial_requests!inner (customer_name, source_metadata),
      users!user_id (id, full_name, title, photo_url, phone, cta_button_text, personal_website_url),
      organizations!organization_id (id, name, logo_url, primary_color, settings)
    `
    )
    .eq("id", responseId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !response) {
    throw new Error(error?.message || `Video response not found: ${responseId}`);
  }

  const request = (response.video_testimonial_requests ?? null) as {
    customer_name?: string | null;
    source_metadata?: {
      customer_display_name?: string;
      customer_relationship?: string;
    } | null;
  } | null;
  const professional = (response.users ?? null) as {
    id?: string;
    full_name?: string | null;
    title?: string | null;
    photo_url?: string | null;
    phone?: string | null;
    cta_button_text?: string | null;
    personal_website_url?: string | null;
  } | null;
  const org = (response.organizations ?? null) as {
    id?: string;
    name?: string | null;
    logo_url?: string | null;
    primary_color?: string | null;
    settings?: Record<string, unknown> | null;
  } | null;

  const brand = resolveBrandTokens({
    primary_color: org?.primary_color ?? null,
    logo_url: org?.logo_url ?? null,
    settings: org?.settings ?? null,
  });

  // 1. Signed URL for the private source video
  const storage = createAdminClient().storage.from("video-testimonials");
  const signedSource = await storage.createSignedUrl(
    sanitizeStoragePath(String(response.video_path ?? "")),
    SIGNED_URL_TTL_SEC
  );
  if (signedSource.error || !signedSource.data?.signedUrl) {
    throw new Error(signedSource.error?.message || "Failed to sign source video URL");
  }
  const sourceUrl = signedSource.data.signedUrl;

  // 2. Loudness normalization (graceful skip) + 3. probe, in parallel
  const [normalizedUrl, probe] = await Promise.all([
    prepareNormalizedSource({
      responseId,
      videoPath: String(response.video_path ?? ""),
      signedSourceUrl: sourceUrl,
    }),
    probeSource(sourceUrl),
  ]);
  const videoUrl = normalizedUrl ?? sourceUrl;

  const videoDurationMs =
    probe.durationMs ?? Math.round(Number(response.duration_seconds ?? 60) * 1000);

  // 4. Captions: words + segments, with optional Caption Correction
  const timestampData = parseWordTimestampData(response.word_timestamps);
  let words = timestampData?.words ?? [];
  let segments = timestampData?.segments ?? [];
  if (!words.length && !segments.length) {
    segments = estimateSegmentsFromTranscript(response.transcription as string | null);
  }
  if (options.correctedTranscript) {
    if (words.length) {
      words = applyTranscriptCorrection(words, options.correctedTranscript);
      segments = [];
    } else {
      segments = estimateSegmentsFromTranscript(options.correctedTranscript);
    }
  }

  // 5. Auto-trim from word timestamps; manual overrides win
  const autoTrimStart = words.length
    ? Math.max(0, words[0].startMs - AUTO_TRIM_PADDING_MS)
    : 0;
  const autoTrimEnd = words.length
    ? Math.min(videoDurationMs, words[words.length - 1].endMs + AUTO_TRIM_PADDING_MS)
    : videoDurationMs;
  const trimStartMs = Math.max(0, options.trimStartMs ?? autoTrimStart);
  const trimEndMs = Math.min(videoDurationMs, options.trimEndMs ?? autoTrimEnd);

  // 6. End Card: contact block + smart-link QR (skip QR when link unavailable)
  let qrUrl: string | null = null;
  try {
    const link = await ensureSmartLinkForSource({
      organizationId,
      sourceType: "video_testimonial",
      sourceId: responseId,
    });
    qrUrl = link.url;
  } catch (err) {
    console.warn("[clip-renderer] smart link unavailable; rendering End Card without QR", {
      responseId,
      error: err instanceof Error ? err.message : err,
    });
  }

  const professionalName = professional?.full_name || "Professional";

  // Music: explicit "off" disables; a specific track wins; "default" or an
  // unset option falls back to the org default via resolveOrgMusic(org.settings).
  let music: ClipMusic | null = null;
  if (options.music && options.music !== "off") {
    music =
      options.music === "default" ? resolveOrgMusic(org?.settings ?? null) : options.music;
  } else if (options.music === undefined) {
    music = resolveOrgMusic(org?.settings ?? null);
  }

  const format = options.format ?? "9:16";
  const framing = options.framing ?? "crop";

  const props: VideoTestimonialProps = {
    videoUrl,
    captions: segments,
    wordTimestamps: words.length ? words : null,
    transcription: (response.transcription as string | null) ?? "",
    aiQuote: extractQuoteExcerpt((response.ai_generated_text as string | null) ?? null),
    customer: {
      displayName:
        request?.source_metadata?.customer_display_name ||
        request?.customer_name ||
        "Verified Customer",
      relationship: request?.source_metadata?.customer_relationship
        ? formatRelationship(request.source_metadata.customer_relationship)
        : null,
    },
    loanOfficer: {
      fullName: professionalName,
      title: professional?.title ?? null,
      photoUrl: professional?.photo_url ?? null,
    },
    organization: {
      name: org?.name || "Organization",
      logoUrl: brand.logoUrl,
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
    },
    template: "modern",
    format,
    showCaptions: options.showCaptions ?? true,
    showIntro: options.showIntro ?? true,
    showOutro: options.showOutro ?? true,
    videoDurationMs,
    trimStartMs,
    trimEndMs,
    sourceWidth: probe.width,
    sourceHeight: probe.height,
    framing,
    music,
    endCard: {
      professionalName,
      professionalTitle: professional?.title ?? null,
      professionalPhotoUrl: professional?.photo_url ?? null,
      ctaText: professional?.cta_button_text ?? null,
      qrUrl,
      phone: professional?.phone ?? null,
      website: professional?.personal_website_url
        ? professional.personal_website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")
        : null,
    },
  };

  const result = await renderComposition({
    compositionId: compositionIdForFormat(format),
    // Spread copy: the render backend takes an open input-prop bag, which a
    // declared interface cannot satisfy directly.
    inputProps: { ...props },
    outputName: `clip-${responseId.slice(0, 8)}`,
  });

  return {
    ...result,
    responseId,
    format,
    appliedOptions: {
      format,
      framing,
      showCaptions: props.showCaptions,
      showIntro: props.showIntro,
      showOutro: props.showOutro,
      music,
      trimStartMs,
      trimEndMs,
      correctedTranscript: options.correctedTranscript ?? null,
    },
  };
}
