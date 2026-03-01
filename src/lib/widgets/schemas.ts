import { z } from "zod";

// ── Enum values (mirrored from database enums) ──────────────────────────

export const WIDGET_TYPES = [
  "lo_review",
  "branch_review",
  "company_review",
  "review_carousel",
  "star_rating_badge",
  "video_testimonial",
  "review_wall",
  "nps_score_badge",
  "social_proof_banner",
] as const;

export const WIDGET_ENTITY_TYPES = [
  "user",
  "branch",
  "organization",
] as const;

export const WIDGET_STATUSES = ["active", "inactive", "draft"] as const;

// ── Config sub-schemas ──────────────────────────────────────────────────

const hexColorPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const rgbPattern = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
const cssValuePattern = /^\d+(\.\d+)?(px|rem|em|%)$/;

const colorSchema = z
  .string()
  .refine((v) => hexColorPattern.test(v) || rgbPattern.test(v), {
    message: "Must be a valid hex (#fff or #ffffff) or rgb(r,g,b) color",
  });

const cssValueSchema = z.string().refine((v) => cssValuePattern.test(v), {
  message: "Must be a valid CSS value (e.g. 16px, 1.5rem, 100%)",
});

export const themeColorsSchema = z
  .object({
    primary: colorSchema.optional(),
    secondary: colorSchema.optional(),
    background: colorSchema.optional(),
    text: colorSchema.optional(),
    accent: colorSchema.optional(),
    border: colorSchema.optional(),
    starFilled: colorSchema.optional(),
    starEmpty: colorSchema.optional(),
  })
  .optional();

export const themeTypographySchema = z
  .object({
    fontFamily: z.string().optional(),
    headerSize: cssValueSchema.optional(),
    bodySize: cssValueSchema.optional(),
    smallSize: cssValueSchema.optional(),
  })
  .optional();

export const themeLayoutSchema = z
  .object({
    maxWidth: cssValueSchema.optional(),
    padding: cssValueSchema.optional(),
    borderRadius: cssValueSchema.optional(),
    gap: cssValueSchema.optional(),
    shadow: z
      .enum(["none", "sm", "md", "lg", "xl"])
      .optional(),
    cardStyle: z
      .enum(["flat", "elevated", "bordered", "glass"])
      .optional(),
  })
  .optional();

export const themeSchema = z
  .object({
    preset: z
      .enum([
        "clean_white",
        "dark",
        "brand_match",
        "mortgage_classic",
        "modern_minimal",
        "trust_badge",
        "social_card",
        "custom",
      ])
      .optional(),
    colors: themeColorsSchema,
    typography: themeTypographySchema,
    layout: themeLayoutSchema,
  })
  .optional();

export const contentSchema = z
  .object({
    showHeader: z.boolean().optional(),
    headerText: z.string().max(200).optional(),
    showCTA: z.boolean().optional(),
    ctaText: z.string().max(100).optional(),
    ctaUrl: z.string().url().or(z.literal("")).optional(),
    showSource: z.boolean().optional(),
    showDate: z.boolean().optional(),
    showAvatar: z.boolean().optional(),
    showBranding: z.boolean().optional(),
    truncateLength: z.number().int().min(0).max(1000).optional(),
    language: z.string().min(2).max(10).optional(),
    showNMLS: z.boolean().optional(),
    showDisclaimer: z.boolean().optional(),
    disclaimerText: z.string().max(500).optional(),
    showWriteReview: z.boolean().optional(),
    writeReviewUrl: z.string().url().or(z.literal("")).optional(),
    columns: z.number().int().min(1).max(6).optional(),
    dateFormat: z.enum(["relative", "absolute"]).optional(),
    cardStyle: z.enum(["bordered", "shadow", "flat"]).optional(),
    showFilters: z.boolean().optional(),
    showRatingDistribution: z.boolean().optional(),
    showSourceBreakdown: z.boolean().optional(),
    showTeam: z.boolean().optional(),
    paginationStyle: z.enum(["load_more", "infinite_scroll"]).optional(),
    reviewsPerPage: z.number().int().min(1).max(50).optional(),
  })
  .optional();

export const filtersSchema = z
  .object({
    minRating: z.number().int().min(1).max(5).optional(),
    dateRange: z
      .object({
        preset: z
          .enum(["last_30d", "last_90d", "last_year", "all_time", "custom"])
          .optional(),
        start: z.string().optional(),
        end: z.string().optional(),
      })
      .optional(),
    sources: z.array(z.string()).optional(),
    maxReviews: z.number().int().min(1).max(100).optional(),
    sortOrder: z.enum(["newest", "oldest", "highest", "lowest"]).optional(),
    featuredOnly: z.boolean().optional(),
    keywords: z.array(z.string()).optional(),
    loanTypes: z.array(z.string()).optional(),
  })
  .optional();

export const carouselSchema = z
  .object({
    autoplay: z.boolean().optional(),
    interval: z.number().int().min(1000).max(30000).optional(),
    showArrows: z.boolean().optional(),
    showDots: z.boolean().optional(),
    slidesPerView: z.number().int().min(1).max(5).optional(),
    transition: z.enum(["slide", "fade", "flip"]).optional(),
    visibleCards: z.number().int().min(1).max(4).optional(),
  })
  .optional();

export const bannerSchema = z
  .object({
    position: z.enum(["top", "bottom", "floating"]).optional(),
    dismissible: z.boolean().optional(),
    showAfterScroll: z.number().int().min(0).optional(),
    animation: z.enum(["slide", "fade", "none"]).optional(),
  })
  .optional();

export const seoSchema = z
  .object({
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    keywords: z.array(z.string()).optional(),
  })
  .optional();

export const videoSchema = z
  .object({
    transcriptPosition: z.enum(["below", "side", "hidden"]).optional(),
    layout: z.enum(["list", "grid"]).optional(),
  })
  .optional();

export const wallSchema = z
  .object({
    columns: z.number().int().min(2).max(5).optional(),
    columnsTablet: z.number().int().min(1).max(3).optional(),
    columnsMobile: z.number().int().min(1).max(2).optional(),
    loadMore: z.enum(["button", "scroll", "none"]).optional(),
    truncateReviews: z.boolean().optional(),
    truncateLength: z.number().int().min(0).max(1000).optional(),
    gap: z.number().int().min(4).max(48).optional(),
  })
  .optional();

export const npsSchema = z
  .object({
    displayMode: z.enum(["gauge", "numeric"]).optional(),
    showBreakdown: z.boolean().optional(),
    showCount: z.boolean().optional(),
    showPeriod: z.boolean().optional(),
    labelText: z.string().max(100).optional(),
    periodText: z.string().max(100).optional(),
  })
  .optional();

export const analyticsConfigSchema = z
  .object({
    conversionUrl: z.string().max(500).optional(),
  })
  .optional();

export const widgetConfigJsonSchema = z.object({
  theme: themeSchema,
  content: contentSchema,
  filters: filtersSchema,
  carousel: carouselSchema,
  banner: bannerSchema,
  video: videoSchema,
  wall: wallSchema,
  nps: npsSchema,
  seo: seoSchema,
  analytics: analyticsConfigSchema,
  advanced: z.object({
    customCSS: z.string().max(5000).optional(),
  }).optional(),
});

export type WidgetConfigJson = z.infer<typeof widgetConfigJsonSchema>;

// ── Action input schemas ────────────────────────────────────────────────

export const updateWidgetInputSchema = z.object({
  id: z.string().uuid("Invalid widget ID"),
  config: widgetConfigJsonSchema.partial().optional(),
  allowed_domains: z.array(z.string()).optional(),
  enable_structured_data: z.boolean().optional(),
  structured_data_type: z.string().optional(),
  entity_id: z.string().uuid().optional(),
});

export type UpdateWidgetInput = z.infer<typeof updateWidgetInputSchema>;

export const listWidgetsInputSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
  widget_type: z.enum(WIDGET_TYPES).optional(),
  status: z.enum(WIDGET_STATUSES).optional(),
  entity_type: z.enum(WIDGET_ENTITY_TYPES).optional(),
  search: z.string().optional(),
});

export type ListWidgetsInput = z.input<typeof listWidgetsInputSchema>;

export const getWidgetInputSchema = z.object({
  idOrSlug: z.string().min(1, "Widget ID or slug is required"),
});

export type GetWidgetInput = z.infer<typeof getWidgetInputSchema>;
