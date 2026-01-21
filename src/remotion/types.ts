/**
 * Remotion Types
 *
 * Shared type definitions for all Remotion compositions and components.
 */

// =============================================================================
// Core Types
// =============================================================================

export type VideoFormat = "16:9" | "1:1" | "9:16";

export type TemplateStyle = "modern" | "minimal" | "bold";

export interface CaptionSegment {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface OrganizationBranding {
  name: string;
  logoUrl: string | null;
  primaryColor: string; // Hex color
  secondaryColor: string; // Hex color
}

export interface PersonInfo {
  name: string;
  photoUrl: string | null;
}

// =============================================================================
// Video Testimonial Types
// =============================================================================

export interface VideoTestimonialProps {
  /** URL of the source video */
  videoUrl: string;
  /** Parsed caption segments with timing */
  captions: CaptionSegment[];
  /** Full transcription text */
  transcription: string;
  /** AI-generated quote/summary */
  aiQuote: string | null;
  /** Customer information */
  customer: {
    displayName: string;
    relationship: string | null;
  };
  /** Loan officer information */
  loanOfficer: {
    fullName: string;
    title: string | null;
    photoUrl: string | null;
  };
  /** Organization branding */
  organization: OrganizationBranding;
  /** Template style */
  template: TemplateStyle;
  /** Output format/aspect ratio */
  format: VideoFormat;
  /** Whether to show animated captions */
  showCaptions: boolean;
  /** Whether to show branded intro */
  showIntro: boolean;
  /** Whether to show branded outro */
  showOutro: boolean;
  /** Duration of source video in milliseconds */
  videoDurationMs: number;
}

// =============================================================================
// Text Testimonial Types
// =============================================================================

export interface TextTestimonialProps {
  /** The testimonial text content */
  text: string;
  /** Author name */
  author: string;
  /** Star rating (1-5) */
  rating: number;
  /** Organization branding */
  organization: OrganizationBranding;
  /** Template style */
  template: TemplateStyle;
  /** Output format/aspect ratio */
  format: VideoFormat;
  /** Optional author location/company */
  authorSubtitle?: string;
  /** Optional customer photo */
  authorPhotoUrl?: string | null;
}

// =============================================================================
// Leaderboard Types
// =============================================================================

export type CelebrationType = "new_first_place" | "weekly_highlights" | "badge_earned" | "milestone";

export interface LeaderboardEntry {
  name: string;
  photoUrl: string | null;
  score: number;
  rank: number;
}

export interface LeaderboardWinner extends LeaderboardEntry {
  previousRank: number;
  newRank: number;
}

export interface LeaderboardCelebrationProps {
  /** Type of celebration */
  celebrationType: CelebrationType;
  /** Winner information */
  winner: LeaderboardWinner;
  /** Organization branding */
  organization: OrganizationBranding;
  /** Top 5 performers */
  topFive: LeaderboardEntry[];
  /** Time period */
  period: string;
  /** Optional badge info for badge_earned type */
  badge?: {
    name: string;
    iconUrl: string | null;
    description: string;
  };
}

// =============================================================================
// Report Summary Types
// =============================================================================

export interface ReportMetrics {
  npsScore: number;
  npsPrevious: number;
  totalReviews: number;
  reviewsPrevious: number;
  averageRating: number;
  ratingPrevious: number;
  responseRate: number;
  responseRatePrevious: number;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ReportSummaryProps {
  /** Report period (e.g., "January 2026") */
  period: string;
  /** Organization branding */
  organization: OrganizationBranding;
  /** Key metrics with previous values */
  metrics: ReportMetrics;
  /** Sentiment breakdown percentages */
  sentimentBreakdown: SentimentBreakdown;
  /** Top performer */
  topPerformer: PersonInfo & { score: number };
  /** Optional team highlights */
  teamHighlights?: string[];
}

// =============================================================================
// Social Clip Types
// =============================================================================

export type SocialClipType = "testimonial_quote" | "review_highlight" | "stat_celebration" | "team_shoutout";

export interface SocialClipProps {
  /** Type of social clip */
  type: SocialClipType;
  /** Main quote or text content */
  quote: string;
  /** Author name */
  author: string;
  /** Rating (1-5) */
  rating: number;
  /** Organization branding */
  organization: OrganizationBranding;
  /** Output format */
  format: VideoFormat;
  /** Optional stat value for stat_celebration type */
  statValue?: string;
  /** Optional stat label */
  statLabel?: string;
}

// =============================================================================
// Thumbnail Types
// =============================================================================

export interface VideoThumbnailProps {
  /** Customer name */
  customerName: string;
  /** Quote snippet */
  quote: string;
  /** Rating */
  rating: number;
  /** Organization branding */
  organization: OrganizationBranding;
  /** Loan officer info */
  loanOfficer: {
    fullName: string;
    photoUrl: string | null;
  };
  /** Optional customer photo */
  customerPhotoUrl?: string | null;
}

// =============================================================================
// Animation/Timing Types
// =============================================================================

export interface AnimationConfig {
  /** Duration in frames */
  durationFrames: number;
  /** Delay before animation starts in frames */
  delayFrames: number;
  /** Spring stiffness */
  stiffness: number;
  /** Spring damping */
  damping: number;
  /** Spring mass */
  mass: number;
}

export interface TransitionConfig {
  /** Type of transition */
  type: "fade" | "slide" | "scale" | "wipe";
  /** Duration in frames */
  durationFrames: number;
  /** Direction for directional transitions */
  direction?: "left" | "right" | "up" | "down";
}

// =============================================================================
// Color System Types (from design system)
// =============================================================================

export const REPWELL_COLORS = {
  sage: {
    100: "#cad2c5",
    200: "#84a98c",
  },
  teal: {
    300: "#52796f",
    400: "#354f52",
    500: "#2f3e46",
  },
  accent: {
    success: "#84a98c",
    warning: "#d4a574",
    error: "#c47c7c",
    info: "#7c9eb8",
  },
  white: "#ffffff",
  black: "#000000",
} as const;

// =============================================================================
// Render Service Types
// =============================================================================

export interface RenderJobInput {
  compositionId: string;
  props: Record<string, unknown>;
  outputFormat?: "mp4" | "webm" | "gif";
  quality?: "draft" | "standard" | "high";
}

export interface RenderJobResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  durationSeconds?: number;
  renderTimeSeconds?: number;
}

export type RenderStatus = "pending" | "processing" | "completed" | "failed";

export interface GeneratedVideo {
  id: string;
  organizationId: string;
  sourceType: "testimonial_video" | "testimonial_text" | "leaderboard" | "report" | "social_clip";
  sourceId: string;
  template: TemplateStyle;
  format: VideoFormat;
  storagePath: string;
  durationSeconds: number | null;
  createdAt: Date;
}
