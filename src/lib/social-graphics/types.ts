import type { Database, Json } from "@/types/database.types";

// ── Database Types ──────────────────────────────────────────────────────

export type SocialProofGraphic =
  Database["public"]["Tables"]["social_proof_graphics"]["Row"];
export type SocialProofGraphicInsert =
  Database["public"]["Tables"]["social_proof_graphics"]["Insert"];
export type SocialProofGraphicUpdate =
  Database["public"]["Tables"]["social_proof_graphics"]["Update"];
export type RenderStatus = Database["public"]["Enums"]["render_status"];

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Canvas Types ────────────────────────────────────────────────────────

export type CanvasSize = {
  width: number;
  height: number;
  name?: string;
};

export const CANVAS_PRESETS: CanvasSize[] = [
  { width: 1080, height: 1080, name: "Instagram Post" },
  { width: 1080, height: 1920, name: "Instagram Story" },
  { width: 1200, height: 630, name: "Facebook Post" },
  { width: 1200, height: 627, name: "LinkedIn Post" },
  { width: 1600, height: 900, name: "Twitter/X Post" },
  { width: 1920, height: 400, name: "Website Banner" },
  { width: 600, height: 200, name: "Email Header" },
];

// ── Element Types ───────────────────────────────────────────────────────

export type ElementType =
  | "text"
  | "image"
  | "shape"
  | "icon"
  | "rating"
  | "stats";

export type ShapeType = "rectangle" | "circle" | "rounded-rect";

export type TextAlignment = "left" | "center" | "right";

export type CanvasElement = {
  id: string;
  type: ElementType;
  /** Position as fraction of canvas (0-1) for proportional scaling */
  x: number;
  y: number;
  /** Size as fraction of canvas (0-1) for proportional scaling */
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: TextAlignment;
  lineHeight?: number;
  letterSpacing?: number;
  // Shape properties
  shape?: ShapeType;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // Image properties
  imageUrl?: string;
  objectFit?: "cover" | "contain" | "fill";
  // Rating properties
  rating?: number;
  starColor?: string;
  starSize?: number;
  // Stats properties
  statLabel?: string;
  statValue?: string;
  // Icon
  iconName?: string;
  iconColor?: string;
};

// ── Template Types ──────────────────────────────────────────────────────

export type TemplateId =
  | "five-star-spotlight"
  | "monthly-roundup"
  | "lo-spotlight"
  | "milestone"
  | "nps-announcement"
  | "before-after"
  | "team-excellence"
  | "holiday-themed";

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  description: string;
  category: "review" | "stats" | "team" | "seasonal";
  /** Min reviews needed to populate this template */
  minReviews: number;
  /** Whether template needs LO data */
  requiresLoanOfficer: boolean;
  /** Preview background color for thumbnail */
  previewBgColor: string;
}

export interface TemplateInput {
  canvasSize: CanvasSize;
  review?: ReviewForGraphic;
  reviews?: ReviewForGraphic[];
  loanOfficer?: LoanOfficerForGraphic;
  orgName?: string;
  stats?: GraphicStats;
}

export type TemplateFunction = (input: TemplateInput) => CanvasElement[];

export interface Template {
  metadata: TemplateMetadata;
  generate: TemplateFunction;
}

// ── Review Data for Graphics ────────────────────────────────────────────

export interface ReviewForGraphic {
  id: string;
  rating: number;
  text: string | null;
  customerName: string | null;
  reviewDate: string;
  source: string;
  loanOfficerName?: string | null;
}

export interface LoanOfficerForGraphic {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  totalReviews?: number;
  averageRating?: number;
}

export interface GraphicStats {
  totalReviews: number;
  averageRating: number;
  npsScore?: number;
  fiveStarCount?: number;
  totalLoanOfficers?: number;
}

// ── Generation Types ────────────────────────────────────────────────────

export interface AutoGenerateInput {
  reviewId: string;
  templateId?: TemplateId;
  canvasSize?: CanvasSize;
}

export interface BatchGenerateInput {
  reviewIds: string[];
  templateId: TemplateId;
  canvasSize: CanvasSize;
}

export interface ScheduleConfig {
  graphicId: string;
  templateId: TemplateId;
  canvasSize: CanvasSize;
  cronExpression: string;
  enabled: boolean;
}

// ── Export & Render Types ──────────────────────────────────────────────

export type ExportFormat = "png" | "jpg" | "webp";

export interface RenderResult {
  url: string;
  format: ExportFormat;
  width: number;
  height: number;
}

// ── Social Publishing Types ────────────────────────────────────────────

export type SocialPlatform = "facebook" | "twitter" | "linkedin" | "instagram";

export interface SocialConnection {
  id: string;
  platform: SocialPlatform;
  account_name: string | null;
  is_active: boolean;
}

export interface SocialPost {
  id: string;
  platform: SocialPlatform;
  status: "pending" | "published" | "failed" | "scheduled";
  caption: string | null;
  platform_post_url: string | null;
  error_message: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
}

export const PLATFORM_CHAR_LIMITS: Record<SocialPlatform, number> = {
  facebook: 63206,
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

// ── Helpers ─────────────────────────────────────────────────────────────

/** Convert a Json value from the database to typed CanvasElement[] */
export function parseElements(json: Json): CanvasElement[] {
  if (!Array.isArray(json)) return [];
  // SAFETY: the `elements` column is only ever written from CanvasElement[] by
  // the editor and batch generator, so a stored array always holds elements.
  return json as CanvasElement[];
}

/** Convert a Json value from the database to typed CanvasSize */
export function parseCanvasSize(json: Json): CanvasSize {
  const obj = json as Record<string, unknown>;
  return {
    width: (obj?.width as number) ?? 1080,
    height: (obj?.height as number) ?? 1080,
    name: (obj?.name as string) ?? undefined,
  };
}
