/**
 * Types for the RepWell embed script.
 * These mirror the public API response shapes from /api/v1/widgets/[widgetId]/.
 * Zero imports from the main app — this compiles standalone via esbuild.
 */

// ── Widget Config (from /config endpoint) ─────────────────────────────

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
  placement?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-bar" | "bottom-bar";
  trigger?: "immediate" | "scroll" | "time" | "exit_intent";
  triggerValue?: number; // scroll %, or delay ms
  frequency?: "every_visit" | "once_per_session" | "once_per_day" | "once_per_week";
  dismissable?: boolean;
  animation?: "slide" | "fade" | "bounce";
  interval?: number; // rotation interval for notification popup (ms)
  zIndex?: number;
  ctaText?: string;
  ctaUrl?: string;
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

export interface WidgetAnalyticsConfig {
  /** URL pattern for conversion attribution (glob-style with * wildcards). */
  conversionUrl?: string;
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
  analytics?: WidgetAnalyticsConfig;
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
  /** Video testimonials data (only for video_testimonial widget type) */
  video_testimonials?: VideoTestimonial[] | null;
  /** NPS data (only for nps_score_badge widget type) */
  nps_data?: NpsData | null;
  /** A/B test config (only when parent widget has an active test) */
  ab_test?: {
    enabled: boolean;
    splitPercent: number;
    variantWidgetSlug: string;
  } | null;
}

export interface NpsData {
  score: number;
  totalResponses: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
}

// ── Entity Profile (from /config endpoint) ────────────────────────────

export interface EntityProfile {
  full_name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
  nmls_id: string | null;
  title: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  licensing_states: string[] | null;
  /** Organization-specific fields (company_review widget) */
  logo_url?: string | null;
  organization_name?: string | null;
  rating_distribution?: RatingDistribution | null;
  source_breakdown?: SourceBreakdown[] | null;
  /** Address for LocalBusiness structured data */
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
  /** Telephone for LocalBusiness structured data */
  telephone?: string | null;
  /** URL for Organization structured data */
  url?: string | null;
  /** Branch-specific: team members (LOs at this branch) */
  team_members?: TeamMember[] | null;
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

// ── Review (from /reviews endpoint) ───────────────────────────────────

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
  /** LO name for branch-level reviews (populated when entity_type is "branch") */
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

// ── Widget Instance State ─────────────────────────────────────────────

export const enum WidgetState {
  Discovered = 0,
  ShadowAttached = 1,
  Observing = 2,
  Loading = 3,
  Rendered = 4,
  Error = 5,
}

export interface ActiveFilters {
  minRating?: number;
  sortOrder?: "newest" | "oldest" | "highest" | "lowest";
  sources?: string[];
  loanTypes?: string[];
  keywords?: string[];
  dateRange?: string;
}

export interface WidgetInstance {
  id: string;
  widgetId: string;
  element: HTMLElement;
  shadowRoot: ShadowRoot;
  state: WidgetState;
  config: PublicWidgetConfig | null;
  reviews: PublicReview[];
  abortController: AbortController | null;
  activeFilters: ActiveFilters;
  /** Cleanup for scroll depth tracking observer. */
  _scrollCleanup?: (() => void) | null;
  /** Cleanup for conversion attribution listener. */
  _conversionCleanup?: (() => void) | null;
}

// ── Global API ────────────────────────────────────────────────────────

export interface RepWellAPI {
  init: () => void;
  refresh: (widgetId: string) => void;
  destroy: (widgetId: string) => void;
  /** Internal: all active widget instances, keyed by instance ID. */
  _instances: Map<string, WidgetInstance>;
  /** Internal: the API base URL resolved from the script tag. */
  _apiBase: string;
}
