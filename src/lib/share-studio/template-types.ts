export type ProofSourceType = "review" | "video_testimonial" | "manual_json";

export type ProofStatus =
  | "draft"
  | "ready"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "archived";

export type ProofEditClassification = "minor" | "material" | "blocked";

export type ProofAssetType = "smart_link_og" | "image" | "video";

export type ProofJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "canceled";

export interface BrandTokens {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
}

export const DEFAULT_BRAND_TOKENS: BrandTokens = {
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  textColor: "#0F172A",
  accentColor: "#10B981",
  fontFamily: "Inter",
  logoUrl: null,
};

export interface CanvasSize {
  width: number;
  height: number;
  name?: string;
}

export const CANVAS_PRESETS: CanvasSize[] = [
  { width: 1080, height: 1080, name: "Square" },
  { width: 1080, height: 1920, name: "Story" },
  { width: 1200, height: 630, name: "Smart Link OG" },
  { width: 1920, height: 1080, name: "Landscape Video" },
];

export type ElementType =
  | "text"
  | "image"
  | "shape"
  | "icon"
  | "rating"
  | "stats";

export type ShapeType = "rectangle" | "circle" | "rounded-rect";

export type TextAlignment = "left" | "center" | "right";

export interface TemplateBinding {
  path: string;
  fallback?: string | number | boolean | null;
  transform?: "uppercase" | "lowercase" | "title_case" | "stars" | "date_short";
}

export interface MotionConfig {
  preset?: "none" | "fade" | "fade-up" | "slide-left" | "zoom-in";
  durationMs?: number;
  delayMs?: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

interface TemplateLayerBase {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  binding?: TemplateBinding;
  motion?: MotionConfig;
}

export interface TextLayer extends TemplateLayerBase {
  type: "text";
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: TextAlignment;
  lineHeight?: number;
  letterSpacing?: number;
}

export interface ShapeLayer extends TemplateLayerBase {
  type: "shape";
  shape?: ShapeType;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

export interface ImageLayer extends TemplateLayerBase {
  type: "image";
  imageUrl?: string;
  objectFit?: "cover" | "contain" | "fill";
}

export interface IconLayer extends TemplateLayerBase {
  type: "icon";
  iconName?: string;
  iconColor?: string;
}

export interface RatingLayer extends TemplateLayerBase {
  type: "rating";
  rating?: number;
  starColor?: string;
  starSize?: number;
}

export interface StatsLayer extends TemplateLayerBase {
  type: "stats";
  statLabel?: string;
  statValue?: string;
}

export type TemplateLayer =
  | TextLayer
  | ShapeLayer
  | ImageLayer
  | IconLayer
  | RatingLayer
  | StatsLayer;

export interface CanvasElement extends TemplateLayerBase {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: TextAlignment;
  lineHeight?: number;
  letterSpacing?: number;
  shape?: ShapeType;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  imageUrl?: string;
  objectFit?: "cover" | "contain" | "fill";
  rating?: number;
  starColor?: string;
  starSize?: number;
  statLabel?: string;
  statValue?: string;
  iconName?: string;
  iconColor?: string;
}

export interface TemplateBackground {
  type: "solid" | "gradient" | "image";
  color?: string;
  gradientColors?: [string, string];
  gradientAngle?: number;
  imageUrl?: string;
}

export interface ShareStudioTemplateDsl {
  version: number;
  canvas: {
    width: number;
    height: number;
  };
  background?: TemplateBackground;
  layers: TemplateLayer[];
}

export interface ProofItemSnapshot {
  source_type: ProofSourceType;
  source_id?: string;
  source_snapshot: Record<string, unknown>;
  title?: string | null;
  summary?: string | null;
  quote?: string | null;
  customer_name?: string | null;
  rating?: number | null;
  source_platform?: string | null;
  source_review_date?: string | null;
  custom_payload?: Record<string, unknown> | null;
}

export const SMART_LINK_OG_SIZE: CanvasSize = {
  width: 1200,
  height: 630,
  name: "Smart Link OG",
};

export const IMAGE_EXPORT_SIZES: CanvasSize[] = [
  { width: 1080, height: 1080, name: "Square" },
  { width: 1080, height: 1920, name: "Story" },
  { width: 1200, height: 630, name: "OG" },
];

export const VIDEO_EXPORT_FORMATS = ["16:9", "1:1", "9:16"] as const;
export type VideoExportFormat = (typeof VIDEO_EXPORT_FORMATS)[number];

export interface WordTimestampRaw {
  word: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
  flagged_for_review?: boolean;
}

export interface TranscriptionSegment {
  text: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
}

export interface TranscriptionResult {
  full_text: string;
  segments: TranscriptionSegment[];
  words: WordTimestampRaw[];
  provider: "deepgram" | "gemini";
  model: string;
  duration_ms: number | null;
}

export interface WordTimestampData {
  full_text: string;
  segments: TranscriptionSegment[];
  words: WordTimestampRaw[];
  provider: "deepgram" | "gemini";
  model: string;
  created_at: string;
  flagged_word_count: number;
}
