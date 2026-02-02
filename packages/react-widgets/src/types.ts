/**
 * Public types for @repwell/react-widgets.
 * These mirror the API response shapes from the RepWell widget endpoints.
 */

import type { CSSProperties, ReactNode } from "react";

// ── Theme & Config Types ─────────────────────────────────────────────

export interface WidgetThemeColors {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
  accent?: string;
  border?: string;
  starFilled?: string;
  starEmpty?: string;
}

export interface WidgetThemeTypography {
  fontFamily?: string;
  headerSize?: string;
  bodySize?: string;
  smallSize?: string;
}

export interface WidgetThemeLayout {
  maxWidth?: string;
  padding?: string;
  borderRadius?: string;
  gap?: string;
  shadow?: string;
  cardStyle?: "flat" | "elevated" | "bordered" | "glass";
}

export interface WidgetTheme {
  preset?: string;
  colors?: WidgetThemeColors;
  typography?: WidgetThemeTypography;
  layout?: WidgetThemeLayout;
}

export interface WidgetContent {
  showHeader?: boolean;
  headerText?: string;
  showCTA?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  showSource?: boolean;
  showDate?: boolean;
  showAvatar?: boolean;
  showBranding?: boolean;
  truncateLength?: number;
  language?: string;
  showNMLS?: boolean;
  showDisclaimer?: boolean;
  disclaimerText?: string;
  showWriteReview?: boolean;
  writeReviewUrl?: string;
  columns?: number;
  dateFormat?: "relative" | "absolute";
  cardStyle?: "bordered" | "shadow" | "flat";
  showFilters?: boolean;
  showRatingDistribution?: boolean;
  showSourceBreakdown?: boolean;
  showTeam?: boolean;
  paginationStyle?: "load_more" | "infinite_scroll";
  reviewsPerPage?: number;
}

export interface WidgetFilters {
  minRating?: number;
  dateRange?: { preset?: string; start?: string; end?: string };
  sources?: string[];
  maxReviews?: number;
  sortOrder?: "newest" | "oldest" | "highest" | "lowest";
  featuredOnly?: boolean;
  keywords?: string[];
  loanTypes?: string[];
}

export interface WidgetCarousel {
  autoplay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  slidesPerView?: number;
  transition?: "slide" | "fade" | "flip";
  visibleCards?: number;
}

export interface WidgetBanner {
  position?: "top" | "bottom" | "floating";
  dismissible?: boolean;
  showAfterScroll?: number;
  animation?: "slide" | "fade" | "none";
}

export interface WidgetBadge {
  placement?: "inline" | "floating";
  floatPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  floatOffsetX?: number;
  floatOffsetY?: number;
  floatZIndex?: number;
  floatAnimation?: "fade" | "slide" | "none";
  width?: string;
  height?: string;
  clickUrl?: string;
  showName?: boolean;
  refreshInterval?: "never" | "1hr" | "6hr" | "24hr";
}

export interface WidgetVideo {
  transcriptPosition?: "below" | "side" | "hidden";
  layout?: "list" | "grid";
}

export interface WidgetWall {
  columns?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  loadMore?: "button" | "scroll" | "none";
  truncateReviews?: boolean;
  truncateLength?: number;
  gap?: number;
}

export interface WidgetNps {
  displayMode?: "gauge" | "numeric";
  showBreakdown?: boolean;
  showCount?: boolean;
  showPeriod?: boolean;
  labelText?: string;
  periodText?: string;
}

export interface WidgetSocialProofBanner {
  displayMode?: "notification" | "counter_bar" | "floating_badge";
  placement?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-bar"
    | "bottom-bar";
  trigger?: "immediate" | "scroll" | "time" | "exit_intent";
  triggerValue?: number;
  frequency?: "every_visit" | "once_per_session" | "once_per_day" | "once_per_week";
  dismissable?: boolean;
  animation?: "slide" | "fade" | "bounce";
  interval?: number;
  zIndex?: number;
  ctaText?: string;
  ctaUrl?: string;
}

export interface WidgetConfigJson {
  theme?: WidgetTheme;
  content?: WidgetContent;
  filters?: WidgetFilters;
  carousel?: WidgetCarousel;
  banner?: WidgetBanner;
  badge?: WidgetBadge;
  video?: WidgetVideo;
  wall?: WidgetWall;
  nps?: WidgetNps;
  socialProofBanner?: WidgetSocialProofBanner;
  seo?: { title?: string; description?: string; keywords?: string[] };
}

// ── Entity & Review Types ───────────────────────────────────────────

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface SourceBreakdown {
  source: string;
  count: number;
  average: number;
}

export interface TeamMember {
  id: string;
  full_name: string | null;
  photo_url: string | null;
  title: string | null;
  nmls_id: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

export interface EntityProfile {
  full_name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
  nmls_id: string | null;
  title: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  licensing_states: string[] | null;
  logo_url?: string | null;
  organization_name?: string | null;
  rating_distribution?: RatingDistribution | null;
  source_breakdown?: SourceBreakdown[] | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
  telephone?: string | null;
  url?: string | null;
  team_members?: TeamMember[] | null;
}

export interface NpsData {
  score: number;
  totalResponses: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
}

export interface VideoTestimonial {
  id: string;
  video_url: string;
  poster_url: string | null;
  reviewer_name: string | null;
  reviewer_title: string | null;
  rating: number;
  duration: number | null;
  transcript: VideoTranscriptSegment[] | null;
}

export interface VideoTranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface PublicWidgetConfig {
  widget_id: string;
  widget_type: string;
  entity_type: string;
  entity_id: string | null;
  name: string;
  config: WidgetConfigJson;
  enable_structured_data: boolean | null;
  structured_data_type: string | null;
  status: string;
  version: number | null;
  entity_profile?: EntityProfile | null;
  video_testimonials?: VideoTestimonial[] | null;
  nps_data?: NpsData | null;
}

export interface PublicReview {
  id: string;
  reviewer_name: string | null;
  rating: number;
  text: string | null;
  review_date: string;
  source: string;
  avatar_url: string | null;
  loan_type: string | null;
  first_time_homebuyer: boolean | null;
  loan_officer_name?: string | null;
}

export interface ReviewsResponse {
  reviews: PublicReview[];
  pagination: {
    next_cursor: string | null;
    limit: number;
    has_more: boolean;
  };
}

// ── Widget Event Types ──────────────────────────────────────────────

export type WidgetEventType =
  | "impression"
  | "click"
  | "click_cta"
  | "click_review"
  | "click_write_review"
  | "carousel_navigate"
  | "load"
  | "error";

export interface WidgetEvent {
  type: WidgetEventType;
  widgetId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ── Component Props ─────────────────────────────────────────────────

/** Base props shared by all widget components. */
export interface BaseWidgetProps {
  /** Widget ID to fetch configuration from the API. */
  widgetId?: string;
  /** Inline configuration (used instead of widgetId when provided). */
  config?: PublicWidgetConfig;
  /** Inline reviews data (used instead of fetching when provided). */
  reviews?: PublicReview[];
  /** API base URL for fetching widget config and reviews. Defaults to "https://app.repwell.com". */
  apiBaseUrl?: string;
  /** Additional CSS class names applied to the root element. */
  className?: string;
  /** Inline styles applied to the root element. */
  style?: CSSProperties;
  /** Callback fired for all widget events (impressions, clicks, etc.). */
  onEvent?: (event: WidgetEvent) => void;
  /** Content to display while loading. */
  fallback?: ReactNode;
}
