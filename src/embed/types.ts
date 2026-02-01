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
}

export interface WidgetFilters {
  minRating?: number;
  dateRange?: { start?: string; end?: string };
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
}

export interface WidgetBanner {
  position?: "top" | "bottom" | "floating";
  dismissible?: boolean;
  showAfterScroll?: number;
  animation?: "slide" | "fade" | "none";
}

export interface WidgetConfigJson {
  theme?: WidgetTheme;
  content?: WidgetContent;
  filters?: WidgetFilters;
  carousel?: WidgetCarousel;
  banner?: WidgetBanner;
  seo?: { title?: string; description?: string; keywords?: string[] };
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
}

// ── Entity Profile (from /config endpoint for lo_review widgets) ──────

export interface EntityProfile {
  full_name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
  nmls_id: string | null;
  title: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  licensing_states: string[] | null;
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

export interface WidgetInstance {
  id: string;
  widgetId: string;
  element: HTMLElement;
  shadowRoot: ShadowRoot;
  state: WidgetState;
  config: PublicWidgetConfig | null;
  reviews: PublicReview[];
  abortController: AbortController | null;
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
