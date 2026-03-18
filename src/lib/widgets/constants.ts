import type { WidgetType, WidgetEntityType } from "./types";

/** Human-readable labels for widget types (DB enum → display string). */
export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  review_profile: "Review Profile",
  lo_review: "Individual Reviews",
  branch_review: "Branch Reviews",
  company_review: "Company Reviews",
  review_carousel: "Review Carousel",
  star_rating_badge: "Star Rating Badge",
  video_testimonial: "Video Testimonial",
  review_wall: "Review Wall",
  social_proof_banner: "Social Proof Banner",
  nps_score_badge: "NPS Score Badge",
};

/** Short descriptions for the widget type selector grid. */
export const WIDGET_TYPE_DESCRIPTIONS: Record<WidgetType, string> = {
  review_profile: "Display reviews for a professional, branch, or organization with profile header",
  lo_review: "Display reviews for an individual professional with profile header",
  branch_review: "Aggregate reviews for a branch location",
  company_review: "Organization-level reviews with rating distribution",
  review_carousel: "Rotating display of reviews with auto-play",
  star_rating_badge: "Compact inline or floating rating badge",
  video_testimonial: "Video testimonial player with transcript",
  review_wall: "Grid layout showcasing multiple reviews",
  social_proof_banner: "Dismissible banner with social proof messaging",
  nps_score_badge: "Compact badge displaying your NPS score",
};

/** Human-readable labels for entity types. */
export const ENTITY_TYPE_LABELS: Record<WidgetEntityType, string> = {
  user: "Professional",
  branch: "Branch",
  organization: "Organization",
};

