/**
 * AnimatedCaptions Component
 *
 * TikTok-style word-by-word highlighting captions for video testimonials.
 * Supports exact word-level timestamps with fallback to segment-estimated timing.
 */

import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { CaptionSegment, WordTimestamp } from "../types";
import { REPWELL_COLORS } from "../types";
import {
  buildDisplayLines,
  buildTimelineWords,
  findActiveWordIndex,
} from "../utils/caption-timing";

interface AnimatedCaptionsProps {
  /** Caption segments with timing information */
  captions: CaptionSegment[];
  /** Optional word-level timestamps for exact karaoke timing */
  wordTimestamps?: WordTimestamp[] | null;
  /** Starting frame offset for when captions should begin */
  startFrame: number;
  /** Primary color for highlighted words */
  highlightColor?: string;
  /** Text color for non-highlighted words */
  textColor?: string;
  /** Background color for caption container */
  backgroundColor?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Position from bottom as percentage */
  bottomOffset?: number;
  /** Maximum width as percentage */
  maxWidth?: number;
  /** Style variant */
  style?: "default" | "boxed" | "minimal";
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  captions,
  wordTimestamps,
  startFrame,
  highlightColor = REPWELL_COLORS.teal[300],
  textColor = REPWELL_COLORS.white,
  backgroundColor = "rgba(0, 0, 0, 0.7)",
  fontSize = 48,
  bottomOffset = 15,
  maxWidth = 80,
  style = "default",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = useMemo(
    () =>
      buildTimelineWords({
        captions,
        wordTimestamps,
        fps,
        startFrame,
      }),
    [captions, wordTimestamps, fps, startFrame]
  );

  const WORDS_PER_LINE = 4;

  if (!words.length) {
    return null;
  }

  const activeWordIndex = findActiveWordIndex(words, frame);
  const displayLines = buildDisplayLines(words, activeWordIndex, WORDS_PER_LINE, 2);

  if (!displayLines.length) {
    return null;
  }

  const containerOpacity = interpolate(frame - startFrame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const containerStyles: React.CSSProperties = {
    position: "absolute",
    bottom: `${bottomOffset}%`,
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: `${maxWidth}%`,
    opacity: containerOpacity,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
    justifyContent: "center",
    padding: style === "minimal" ? "0" : "16px 24px",
    borderRadius: style === "minimal" ? "0" : "12px",
    backgroundColor: style === "minimal" ? "transparent" : backgroundColor,
    backdropFilter: style === "minimal" ? "none" : "blur(8px)",
  };

  const firstDisplayedWord = displayLines[0]?.[0];
  const displayStartIndex = firstDisplayedWord
    ? words.findIndex(
        (word) =>
          word.startFrame === firstDisplayedWord.startFrame && word.text === firstDisplayedWord.text
      )
    : 0;
  const safeDisplayStartIndex = Math.max(0, displayStartIndex);

  return (
    <div style={containerStyles}>
      {displayLines.map((line, lineIndex) => (
        <div
          key={`line-${lineIndex}`}
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: style === "boxed" ? "8px" : "12px",
            justifyContent: "center",
          }}
        >
          {line.map((word, wordOffset) => {
            const wordIndex = safeDisplayStartIndex + lineIndex * WORDS_PER_LINE + wordOffset;
            return (
              <AnimatedWord
                key={`${wordIndex}-${word.startFrame}`}
                text={word.text}
                wordStartFrame={word.startFrame}
                currentFrame={frame}
                isActive={wordIndex === activeWordIndex}
                isPast={wordIndex < activeWordIndex}
                highlightColor={highlightColor}
                textColor={textColor}
                fontSize={fontSize}
                style={style}
                fps={fps}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

interface AnimatedWordProps {
  text: string;
  wordStartFrame: number;
  currentFrame: number;
  isActive: boolean;
  isPast: boolean;
  highlightColor: string;
  textColor: string;
  fontSize: number;
  style: "default" | "boxed" | "minimal";
  fps: number;
}

const AnimatedWord: React.FC<AnimatedWordProps> = ({
  text,
  wordStartFrame,
  currentFrame,
  isActive,
  isPast,
  highlightColor,
  textColor,
  fontSize,
  style,
  fps,
}) => {
  const entrySpring = spring({
    frame: currentFrame - wordStartFrame,
    fps,
    config: {
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    },
    durationInFrames: Math.max(6, Math.floor(fps * 0.2)),
  });

  const wordScale = isActive ? interpolate(entrySpring, [0, 1], [1, 1.1]) : 1;

  const opacity = isPast ? 0.65 : isActive ? 1 : 0.9;
  const color = isActive ? highlightColor : textColor;

  const wordStyles: React.CSSProperties = {
    fontFamily: "'Source Sans 3', system-ui, sans-serif",
    fontSize: `${fontSize}px`,
    fontWeight: isActive ? 700 : 600,
    color,
    opacity,
    transform: `scale(${wordScale})`,
    transition: "color 0.1s ease-out",
    textShadow:
      style !== "minimal" ? "0 2px 4px rgba(0, 0, 0, 0.3)" : "0 2px 8px rgba(0, 0, 0, 0.8)",
    display: "inline-block",
    ...(style === "boxed" && isActive
      ? {
          backgroundColor: highlightColor,
          color: REPWELL_COLORS.white,
          padding: "4px 12px",
          borderRadius: "6px",
        }
      : {}),
  };

  return <span style={wordStyles}>{text}</span>;
};

export default AnimatedCaptions;
