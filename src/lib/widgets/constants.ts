import type { WidgetType, WidgetEntityType } from "./types";

/** Human-readable labels for widget types (DB enum → display string). */
export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  lo_review: "Individual Reviews",
  branch_review: "Branch Reviews",
  company_review: "Company Reviews",
  review_carousel: "Review Carousel",
  star_rating_badge: "Star Rating Badge",
  video_testimonial: "Video Testimonial",
  review_wall: "Review Wall",
  nps_score_badge: "NPS Score Badge",
  social_proof_banner: "Social Proof Banner",
};

/** Short descriptions for the widget type selector grid. */
export const WIDGET_TYPE_DESCRIPTIONS: Record<WidgetType, string> = {
  lo_review: "Display reviews for an individual professional with profile header",
  branch_review: "Aggregate reviews for a branch location",
  company_review: "Organization-level reviews with rating distribution",
  review_carousel: "Rotating display of reviews with auto-play",
  star_rating_badge: "Compact inline or floating rating badge",
  video_testimonial: "Video testimonial player with transcript",
  review_wall: "Grid layout showcasing multiple reviews",
  nps_score_badge: "Display Net Promoter Score with visual gauge",
  social_proof_banner: "Dismissible banner with social proof messaging",
};

/** Human-readable labels for entity types. */
export const ENTITY_TYPE_LABELS: Record<WidgetEntityType, string> = {
  user: "Professional",
  branch: "Branch",
  organization: "Organization",
};

/**
 * Industry-specific field configuration.
 * Controls which mortgage-specific fields are visible and what defaults to use.
 */
export const INDUSTRY_FIELDS = {
  mortgage: {
    showNMLS: true,
    showLoanTypes: true,
    showFirstTimeHomebuyer: true,
    defaultJobTitle: "Loan Officer",
  },
  generic: {
    showNMLS: false,
    showLoanTypes: false,
    showFirstTimeHomebuyer: false,
    defaultJobTitle: "Professional",
  },
} as const;

export type IndustryType = keyof typeof INDUSTRY_FIELDS;
