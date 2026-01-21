/**
 * Timing Utilities for Remotion Compositions
 *
 * Calculate dynamic durations based on content length.
 */

import type {
  VideoTestimonialProps,
  TextTestimonialProps,
  LeaderboardCelebrationProps,
  ReportSummaryProps,
  SocialClipProps,
} from "../types";

// =============================================================================
// Constants
// =============================================================================

/** Intro animation duration in seconds */
const INTRO_DURATION_SEC = 3;

/** Outro animation duration in seconds */
const OUTRO_DURATION_SEC = 3;

/** Minimum video duration in seconds */
const MIN_VIDEO_DURATION_SEC = 5;

/** Reading speed in words per minute */
const WORDS_PER_MINUTE = 150;

/** Minimum time per text segment in seconds */
const MIN_TEXT_SEGMENT_SEC = 2;

/** Time for stat counter animation in seconds */
const STAT_COUNTER_DURATION_SEC = 2;

/** Buffer time at end of animations in seconds */
const END_BUFFER_SEC = 1;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert seconds to frames
 */
export function secondsToFrames(seconds: number, fps: number): number {
  return Math.ceil(seconds * fps);
}

/**
 * Convert frames to seconds
 */
export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

/**
 * Convert milliseconds to frames
 */
export function msToFrames(ms: number, fps: number): number {
  return Math.ceil((ms / 1000) * fps);
}

/**
 * Calculate reading time for text
 */
function calculateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  const minutes = words / WORDS_PER_MINUTE;
  return Math.max(minutes * 60, MIN_TEXT_SEGMENT_SEC);
}

// =============================================================================
// Composition Duration Calculators
// =============================================================================

/**
 * Calculate total duration for VideoTestimonial composition
 */
export function calculateVideoTestimonialDuration(
  props: VideoTestimonialProps,
  fps: number
): number {
  let totalSeconds = 0;

  // Intro duration
  if (props.showIntro) {
    totalSeconds += INTRO_DURATION_SEC;
  }

  // Video duration
  const videoDurationSec = props.videoDurationMs / 1000;
  totalSeconds += Math.max(videoDurationSec, MIN_VIDEO_DURATION_SEC);

  // AI quote highlight segment (if quote exists)
  if (props.aiQuote) {
    totalSeconds += calculateReadingTime(props.aiQuote);
  }

  // Outro duration
  if (props.showOutro) {
    totalSeconds += OUTRO_DURATION_SEC;
  }

  totalSeconds += END_BUFFER_SEC;

  return secondsToFrames(totalSeconds, fps);
}

/**
 * Calculate total duration for TextTestimonial composition
 */
export function calculateTextTestimonialDuration(
  props: TextTestimonialProps,
  fps: number
): number {
  let totalSeconds = 0;

  // Intro animation (logo reveal)
  totalSeconds += 1.5;

  // Text reveal with typewriter effect
  // Calculate based on text length
  const textReadingTime = calculateReadingTime(props.text);
  totalSeconds += textReadingTime;

  // Star rating animation
  totalSeconds += 1;

  // Author reveal
  totalSeconds += 1;

  // Hold at end
  totalSeconds += END_BUFFER_SEC;

  // Minimum 8 seconds for short testimonials
  return secondsToFrames(Math.max(totalSeconds, 8), fps);
}

/**
 * Calculate total duration for LeaderboardCelebration composition
 */
export function calculateLeaderboardDuration(
  props: LeaderboardCelebrationProps,
  fps: number
): number {
  let totalSeconds = 0;

  switch (props.celebrationType) {
    case "new_first_place":
      // Intro + confetti setup
      totalSeconds += 1.5;
      // Winner reveal with animation
      totalSeconds += 2.5;
      // Rank change animation
      totalSeconds += 1.5;
      // Top 5 reveal
      totalSeconds += props.topFive.length * 0.5;
      // Hold/celebration
      totalSeconds += 2;
      break;

    case "weekly_highlights":
      // Intro
      totalSeconds += 1.5;
      // Each position reveal
      totalSeconds += props.topFive.length * 1.5;
      // Summary
      totalSeconds += 2;
      break;

    case "badge_earned":
      // Intro
      totalSeconds += 1.5;
      // Badge reveal animation
      totalSeconds += 2;
      // Winner reveal
      totalSeconds += 1.5;
      // Description
      totalSeconds += 2;
      break;

    case "milestone":
      // Intro
      totalSeconds += 1.5;
      // Counter animation
      totalSeconds += STAT_COUNTER_DURATION_SEC;
      // Celebration
      totalSeconds += 2;
      break;
  }

  totalSeconds += END_BUFFER_SEC;

  return secondsToFrames(totalSeconds, fps);
}

/**
 * Calculate total duration for ReportSummary composition
 */
export function calculateReportDuration(
  props: ReportSummaryProps,
  fps: number
): number {
  let totalSeconds = 0;

  // Intro with period title
  totalSeconds += 2;

  // NPS Score animation
  totalSeconds += STAT_COUNTER_DURATION_SEC + 1;

  // Reviews count animation
  totalSeconds += STAT_COUNTER_DURATION_SEC + 0.5;

  // Average rating animation
  totalSeconds += STAT_COUNTER_DURATION_SEC + 0.5;

  // Response rate animation
  totalSeconds += STAT_COUNTER_DURATION_SEC + 0.5;

  // Sentiment pie chart animation
  totalSeconds += 2;

  // Top performer highlight
  totalSeconds += 2;

  // Team highlights (if any)
  if (props.teamHighlights && props.teamHighlights.length > 0) {
    totalSeconds += props.teamHighlights.length * 1;
  }

  // Outro
  totalSeconds += 1.5;

  totalSeconds += END_BUFFER_SEC;

  // Minimum 20 seconds for reports
  return secondsToFrames(Math.max(totalSeconds, 20), fps);
}

/**
 * Calculate total duration for SocialClip composition
 */
export function calculateSocialClipDuration(
  props: SocialClipProps,
  fps: number
): number {
  let totalSeconds = 0;

  switch (props.type) {
    case "testimonial_quote":
    case "review_highlight":
      // Intro
      totalSeconds += 0.5;
      // Quote reveal
      totalSeconds += calculateReadingTime(props.quote);
      // Stars animation
      totalSeconds += 1;
      // Author
      totalSeconds += 0.5;
      break;

    case "stat_celebration":
      // Intro
      totalSeconds += 0.5;
      // Counter animation
      totalSeconds += STAT_COUNTER_DURATION_SEC;
      // Label reveal
      totalSeconds += 1;
      // Celebration
      totalSeconds += 1;
      break;

    case "team_shoutout":
      // Intro
      totalSeconds += 0.5;
      // Name reveal
      totalSeconds += 1;
      // Message
      totalSeconds += calculateReadingTime(props.quote);
      break;
  }

  // Social clips should be 5-15 seconds
  totalSeconds = Math.max(totalSeconds, 5);
  totalSeconds = Math.min(totalSeconds, 15);

  return secondsToFrames(totalSeconds, fps);
}

// =============================================================================
// Timing Helpers for Components
// =============================================================================

/**
 * Calculate the frame at which a segment should start
 */
export function getSegmentStartFrame(
  segments: Array<{ durationFrames: number }>,
  segmentIndex: number
): number {
  let frame = 0;
  for (let i = 0; i < segmentIndex; i++) {
    frame += segments[i].durationFrames;
  }
  return frame;
}

/**
 * Calculate stagger delay for list animations
 */
export function getStaggerDelay(index: number, baseDelay: number = 0.1): number {
  return index * baseDelay;
}

/**
 * Get spring config for different animation types
 */
export function getSpringConfig(type: "default" | "bouncy" | "stiff" | "gentle") {
  switch (type) {
    case "bouncy":
      return { stiffness: 400, damping: 20, mass: 1 };
    case "stiff":
      return { stiffness: 300, damping: 30, mass: 1 };
    case "gentle":
      return { stiffness: 100, damping: 20, mass: 1 };
    case "default":
    default:
      return { stiffness: 200, damping: 25, mass: 1 };
  }
}

/**
 * Calculate frame ranges for intro/content/outro
 */
export function getCompositionSegments(
  totalFrames: number,
  fps: number,
  options: {
    showIntro?: boolean;
    showOutro?: boolean;
    introDurationSec?: number;
    outroDurationSec?: number;
  } = {}
) {
  const {
    showIntro = true,
    showOutro = true,
    introDurationSec = INTRO_DURATION_SEC,
    outroDurationSec = OUTRO_DURATION_SEC,
  } = options;

  const introFrames = showIntro ? secondsToFrames(introDurationSec, fps) : 0;
  const outroFrames = showOutro ? secondsToFrames(outroDurationSec, fps) : 0;
  const contentFrames = totalFrames - introFrames - outroFrames;

  return {
    intro: {
      start: 0,
      end: introFrames,
      duration: introFrames,
    },
    content: {
      start: introFrames,
      end: introFrames + contentFrames,
      duration: contentFrames,
    },
    outro: {
      start: introFrames + contentFrames,
      end: totalFrames,
      duration: outroFrames,
    },
  };
}
