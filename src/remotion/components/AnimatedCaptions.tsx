/**
 * AnimatedCaptions Component
 *
 * TikTok-style paged captions: short pages of 1-4 words, the active word
 * highlighted in the org's primary color. Uses @remotion/captions for page
 * grouping when word-level timestamps exist; falls back to segment-paged
 * captions (no karaoke) when only estimated segments are available.
 *
 * Caption times are on the SOURCE video timeline; `timeOffsetMs` (the trim
 * start) shifts them onto the played timeline.
 */

import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import type { CaptionSegment, WordTimestamp } from "../types";
import { REPWELL_COLORS } from "../types";

interface CaptionToken {
  text: string;
  fromMs: number;
  toMs: number;
}

interface CaptionPage {
  startMs: number;
  endMs: number;
  tokens: CaptionToken[];
}

interface AnimatedCaptionsProps {
  /** Caption segments with timing information (fallback when no words) */
  captions: CaptionSegment[];
  /** Optional word-level timestamps for exact karaoke timing */
  wordTimestamps?: WordTimestamp[] | null;
  /** Starting frame offset for when captions should begin */
  startFrame: number;
  /** Trim start on the source timeline, in ms. Caption times are shifted by this. */
  timeOffsetMs?: number;
  /** Only show captions up to this source-timeline ms (trim end) */
  maxSourceMs?: number;
  /** Primary color for highlighted words */
  highlightColor?: string;
  /** Text color for non-highlighted words */
  textColor?: string;
  /** Background color for caption pill */
  backgroundColor?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Position from bottom as percentage */
  bottomOffset?: number;
  /** Maximum width as percentage */
  maxWidth?: number;
  /** Style variant */
  style?: "default" | "minimal";
}

/** Group words into TikTok-style pages of at most ~4 words / 1.2s. */
function buildPagesFromWords(
  words: WordTimestamp[],
  timeOffsetMs: number,
  maxSourceMs: number
): CaptionPage[] {
  const inRange = words.filter(
    (w) => w.endMs > timeOffsetMs && w.startMs < maxSourceMs
  );
  if (!inRange.length) return [];

  const asCaptions: Caption[] = inRange.map((w, i) => ({
    text: (i === 0 ? "" : " ") + w.word,
    startMs: Math.max(0, w.startMs - timeOffsetMs),
    endMs: Math.max(0, w.endMs - timeOffsetMs),
    timestampMs: Math.max(0, Math.round((w.startMs + w.endMs) / 2) - timeOffsetMs),
    confidence: w.confidence ?? null,
  }));

  const { pages } = createTikTokStyleCaptions({
    captions: asCaptions,
    combineTokensWithinMilliseconds: 1200,
  });

  return pages.map((page) => ({
    startMs: page.startMs,
    endMs: page.startMs + page.durationMs,
    tokens: page.tokens.map((t) => ({
      text: t.text.trim(),
      fromMs: t.fromMs,
      toMs: t.toMs,
    })),
  }));
}

/** Fallback: each estimated segment becomes one page without karaoke timing. */
function buildPagesFromSegments(
  segments: CaptionSegment[],
  timeOffsetMs: number,
  maxSourceMs: number
): CaptionPage[] {
  return segments
    .filter((s) => s.endMs > timeOffsetMs && s.startMs < maxSourceMs)
    .map((s) => {
      const startMs = Math.max(0, s.startMs - timeOffsetMs);
      const endMs = Math.max(startMs + 400, s.endMs - timeOffsetMs);
      return {
        startMs,
        endMs,
        tokens: [{ text: s.text, fromMs: startMs, toMs: endMs }],
      };
    });
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  captions,
  wordTimestamps,
  startFrame,
  timeOffsetMs = 0,
  maxSourceMs = Number.MAX_SAFE_INTEGER,
  highlightColor = REPWELL_COLORS.teal[300],
  textColor = REPWELL_COLORS.white,
  backgroundColor = "rgba(0, 0, 0, 0.55)",
  fontSize = 48,
  bottomOffset = 15,
  maxWidth = 80,
  style = "default",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pages = useMemo(() => {
    if (wordTimestamps && wordTimestamps.length > 0) {
      return buildPagesFromWords(wordTimestamps, timeOffsetMs, maxSourceMs);
    }
    return buildPagesFromSegments(captions, timeOffsetMs, maxSourceMs);
  }, [captions, wordTimestamps, timeOffsetMs, maxSourceMs]);

  if (!pages.length) return null;

  const playedMs = ((frame - startFrame) / fps) * 1000;
  const page = pages.find((p) => playedMs >= p.startMs && playedMs < p.endMs);
  if (!page) return null;

  // Page entrance: quick pop, deterministic per page via its start frame.
  const pageStartFrame = startFrame + (page.startMs / 1000) * fps;
  const entrance = spring({
    frame: frame - pageStartFrame,
    fps,
    config: { stiffness: 380, damping: 26, mass: 0.7 },
    durationInFrames: Math.max(5, Math.floor(fps * 0.18)),
  });
  const pageScale = interpolate(entrance, [0, 1], [0.92, 1]);
  const pageOpacity = interpolate(entrance, [0, 1], [0, 1]);

  const containerStyles: React.CSSProperties = {
    position: "absolute",
    bottom: `${bottomOffset}%`,
    left: "50%",
    transform: `translateX(-50%) scale(${pageScale})`,
    maxWidth: `${maxWidth}%`,
    opacity: pageOpacity,
    display: "flex",
    flexWrap: "wrap",
    columnGap: `${Math.round(fontSize * 0.28)}px`,
    rowGap: "8px",
    alignItems: "center",
    justifyContent: "center",
    padding: style === "minimal" ? "0" : "14px 26px",
    borderRadius: style === "minimal" ? "0" : "14px",
    backgroundColor: style === "minimal" ? "transparent" : backgroundColor,
  };

  return (
    <div style={containerStyles}>
      {page.tokens.map((token, i) => {
        const isActive = playedMs >= token.fromMs && playedMs < token.toMs;
        const isPast = playedMs >= token.toMs;
        return (
          <span
            key={`${i}-${token.fromMs}`}
            style={{
              fontFamily: "'Source Sans 3', system-ui, sans-serif",
              fontSize: `${fontSize}px`,
              lineHeight: 1.15,
              fontWeight: 700,
              // Active word: brand-color pill with white text, readable on
              // any backdrop regardless of how dark the brand color is.
              color: textColor,
              backgroundColor: isActive ? highlightColor : "transparent",
              padding: isActive ? "2px 14px" : "2px 0",
              borderRadius: 10,
              opacity: isPast ? 0.8 : 1,
              textShadow:
                style === "minimal"
                  ? "0 2px 10px rgba(0, 0, 0, 0.85)"
                  : "0 2px 4px rgba(0, 0, 0, 0.35)",
              display: "inline-block",
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};

export default AnimatedCaptions;
