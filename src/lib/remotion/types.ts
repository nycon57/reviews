/**
 * Remotion Render Service Types
 *
 * Type definitions for video generation API and render service.
 */

import type { VideoFormat, TemplateStyle } from "@/remotion/types";

/**
 * Composition types available for rendering
 */
export type CompositionType =
  | "video-testimonial"
  | "text-testimonial"
  | "leaderboard-celebration"
  | "report-summary"
  | "social-clip"
  | "video-thumbnail";

/**
 * Render job status
 */
export type RenderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/**
 * Base render request
 */
export interface RenderRequestBase {
  compositionType: CompositionType;
  format: VideoFormat;
  organizationId: string;
}

/**
 * Video testimonial render request
 */
export interface VideoTestimonialRenderRequest extends RenderRequestBase {
  compositionType: "video-testimonial";
  videoResponseId: string;
  template?: TemplateStyle;
}

/**
 * Text testimonial render request
 */
export interface TextTestimonialRenderRequest extends RenderRequestBase {
  compositionType: "text-testimonial";
  testimonialId: string;
  template?: TemplateStyle;
}

/**
 * Leaderboard celebration render request
 */
export interface LeaderboardCelebrationRenderRequest extends RenderRequestBase {
  compositionType: "leaderboard-celebration";
  celebrationType: "new_leader" | "weekly_highlights" | "achievement";
  leaderboardId?: string;
  userId?: string;
  badgeType?: string;
}

/**
 * Report summary render request
 */
export interface ReportSummaryRenderRequest extends RenderRequestBase {
  compositionType: "report-summary";
  reportId: string;
  period: string;
}

/**
 * Social clip render request
 */
export interface SocialClipRenderRequest extends RenderRequestBase {
  compositionType: "social-clip";
  clipType: "testimonial_quote" | "review_highlight" | "stat_celebration" | "team_shoutout";
  sourceId: string;
  sourceType: "testimonial" | "review" | "stat" | "team";
}

/**
 * Video thumbnail render request
 */
export interface VideoThumbnailRenderRequest extends RenderRequestBase {
  compositionType: "video-thumbnail";
  videoResponseId: string;
}

/**
 * Union type for all render requests
 */
export type RenderRequest =
  | VideoTestimonialRenderRequest
  | TextTestimonialRenderRequest
  | LeaderboardCelebrationRenderRequest
  | ReportSummaryRenderRequest
  | SocialClipRenderRequest
  | VideoThumbnailRenderRequest;

/**
 * Render job record
 */
export interface RenderJob {
  id: string;
  organizationId: string;
  compositionType: CompositionType;
  format: VideoFormat;
  status: RenderStatus;
  inputProps: Record<string, unknown>;
  outputUrl?: string;
  storagePath?: string;
  durationSeconds?: number;
  errorMessage?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Render result
 */
export interface RenderResult {
  success: boolean;
  jobId: string;
  outputUrl?: string;
  storagePath?: string;
  durationSeconds?: number;
  error?: string;
}

/**
 * Video dimensions by format
 */
export const VIDEO_DIMENSIONS: Record<VideoFormat, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

/**
 * Composition ID mapping
 */
export function getCompositionId(type: CompositionType, format: VideoFormat): string {
  const formatSuffix = format.replace(":", "-");

  switch (type) {
    case "video-testimonial":
      return `VideoTestimonial-${formatSuffix}`;
    case "text-testimonial":
      return `TextTestimonial-${formatSuffix}`;
    case "leaderboard-celebration":
      return `LeaderboardCelebration-${formatSuffix}`;
    case "report-summary":
      return `ReportSummary-${formatSuffix}`;
    case "social-clip":
      return `SocialClip-${formatSuffix}`;
    case "video-thumbnail":
      return "VideoThumbnail";
    default:
      throw new Error(`Unknown composition type: ${type}`);
  }
}
