/**
 * AnimatedCaptions Component
 *
 * TikTok-style word-by-word highlighting captions for video testimonials.
 * Words highlight as they're spoken based on timing data.
 */

import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { CaptionSegment } from "../types";
import { REPWELL_COLORS } from "../types";

interface AnimatedCaptionsProps {
  /** Caption segments with timing information */
  captions: CaptionSegment[];
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

interface Word {
  text: string;
  startFrame: number;
  endFrame: number;
  segmentIndex: number;
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  captions,
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

  // Parse captions into individual words with timing
  const words = parseWordsFromCaptions(captions, fps, startFrame);

  // Find current segment based on frame
  const currentSegmentIndex = findCurrentSegment(captions, frame, fps, startFrame);
  const currentSegment = currentSegmentIndex >= 0 ? captions[currentSegmentIndex] : null;

  // Get words for current segment
  const currentWords = words.filter((w) => w.segmentIndex === currentSegmentIndex);

  // Find currently highlighted word
  const currentWordIndex = currentWords.findIndex(
    (w) => frame >= w.startFrame && frame <= w.endFrame
  );

  if (!currentSegment || currentWords.length === 0) {
    return null;
  }

  // Calculate container entry animation
  const containerOpacity = interpolate(
    frame - startFrame,
    [0, fps * 0.3],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  const containerStyles: React.CSSProperties = {
    position: "absolute",
    bottom: `${bottomOffset}%`,
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: `${maxWidth}%`,
    opacity: containerOpacity,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: style === "boxed" ? "8px" : "12px",
    padding: style === "minimal" ? "0" : "16px 24px",
    borderRadius: style === "minimal" ? "0" : "12px",
    backgroundColor: style === "minimal" ? "transparent" : backgroundColor,
    backdropFilter: style === "minimal" ? "none" : "blur(8px)",
  };

  return (
    <div style={containerStyles}>
      {currentWords.map((word, index) => (
        <AnimatedWord
          key={`${word.segmentIndex}-${index}`}
          word={word}
          index={index}
          currentFrame={frame}
          isActive={index === currentWordIndex}
          isPast={index < currentWordIndex}
          highlightColor={highlightColor}
          textColor={textColor}
          fontSize={fontSize}
          style={style}
          fps={fps}
        />
      ))}
    </div>
  );
};

interface AnimatedWordProps {
  word: Word;
  index: number;
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
  word,
  index: _index,
  currentFrame,
  isActive,
  isPast,
  highlightColor,
  textColor,
  fontSize,
  style,
  fps,
}) => {
  // Spring animation for active word
  const scale = spring({
    frame: currentFrame - word.startFrame,
    fps,
    config: {
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    },
    durationInFrames: fps * 0.3,
  });

  // Opacity based on state
  const opacity = isPast || isActive ? 1 : 0.6;

  // Color based on state
  const color = isActive ? highlightColor : isPast ? textColor : `${textColor}99`;

  // Scale only for active word
  const wordScale = isActive ? interpolate(scale, [0, 1], [1, 1.1]) : 1;

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

  return <span style={wordStyles}>{word.text}</span>;
};

/**
 * Parse caption segments into individual words with timing
 */
function parseWordsFromCaptions(
  captions: CaptionSegment[],
  fps: number,
  startFrame: number
): Word[] {
  const words: Word[] = [];

  captions.forEach((segment, segmentIndex) => {
    const segmentWords = segment.text.trim().split(/\s+/);
    const segmentDurationMs = segment.endMs - segment.startMs;
    const wordDurationMs = segmentDurationMs / segmentWords.length;

    segmentWords.forEach((text, wordIndex) => {
      const wordStartMs = segment.startMs + wordIndex * wordDurationMs;
      const wordEndMs = wordStartMs + wordDurationMs;

      words.push({
        text,
        startFrame: startFrame + Math.floor((wordStartMs / 1000) * fps),
        endFrame: startFrame + Math.floor((wordEndMs / 1000) * fps),
        segmentIndex,
      });
    });
  });

  return words;
}

/**
 * Find the current segment based on frame
 */
function findCurrentSegment(
  captions: CaptionSegment[],
  frame: number,
  fps: number,
  startFrame: number
): number {
  const currentTimeMs = ((frame - startFrame) / fps) * 1000;

  for (let i = 0; i < captions.length; i++) {
    if (currentTimeMs >= captions[i].startMs && currentTimeMs <= captions[i].endMs) {
      return i;
    }
  }

  return -1;
}

export default AnimatedCaptions;
