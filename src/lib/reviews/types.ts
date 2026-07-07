// Review types for the review approval workflow

export interface Review {
  id: string;
  organizationId: string;
  loanOfficerId: string | null;
  source: string;
  rating: number;
  title: string | null;
  text: string | null;
  customerName: string | null;
  customerEmail: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  /** Machine-screening reasons present when status is 'pending' (quarantined) */
  moderationReasons?: string[] | null;
  isPublished: boolean;
  publishedAt: string | null;
  reviewDate: string;
  createdAt: string;
  loanOfficer?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  surveyResponse?: {
    id: string;
    overallRating: number | null;
    npsScore: number | null;
    testimonialText: string | null;
  } | null;
}

// Extended review type for aggregation dashboard with all fields
export interface AggregatedReview extends Review {
  sourceReviewId: string | null;
  sourceUrl: string | null;
  customerLocation: string | null;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  themes: string[] | null;
  keyPhrases: string[] | null;
  responseText: string | null;
  responseAt: string | null;
  responseBy: string | null;
  responseSyncedAt: string | null;
  responseTemplateId: string | null;
  aiSuggestedResponse: string | null;
  featured: boolean;
  syncedAt: string | null;
  updatedAt: string;
}

// Review source options
export type ReviewSource = "internal" | "google" | "zillow" | "facebook" | "yelp" | "other";

// Filter parameters for aggregated reviews
export interface AggregatedReviewFilters {
  status?: "pending" | "approved" | "rejected" | "archived" | "all";
  source?: ReviewSource | "all";
  loanOfficerId?: string;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  hasResponse?: boolean;
  featured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "reviewDate" | "rating" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

// Aggregation statistics
export interface ReviewAggregationStats {
  total: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  byRating: Record<number, number>;
  averageRating: number;
  withResponse: number;
  featuredCount: number;
}

// Export data format
export interface ReviewExportData {
  id: string;
  source: string;
  rating: number;
  customerName: string | null;
  text: string | null;
  loanOfficerName: string;
  status: string;
  reviewDate: string;
  responseText: string | null;
  sentimentLabel: string | null;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auto-reply settings stored in organization settings JSON
export interface AutoReplySettings {
  auto_reply_enabled: boolean;
  auto_reply_tone: "professional" | "friendly" | "empathetic";
  auto_reply_delay_hours: number;
  auto_reply_min_rating: 1 | 3 | 4;
}

export const DEFAULT_AUTO_REPLY_SETTINGS: AutoReplySettings = {
  auto_reply_enabled: false,
  auto_reply_tone: "professional",
  auto_reply_delay_hours: 24,
  auto_reply_min_rating: 4,
};

// ============================================================================
// Review flags (disputes)
// ============================================================================

export type ReviewFlagReason =
  | "inaccurate_information"
  | "impersonation"
  | "inappropriate_content"
  | "spam_fake_review"
  | "other";

/**
 * Display labels for the inverted publish model: 'pending' means
 * machine-quarantined awaiting human release, never "awaiting approval".
 */
export const REVIEW_STATUS_LABELS: Record<Review["status"], string> = {
  pending: "Needs attention",
  approved: "Live",
  rejected: "Removed",
  archived: "Archived",
};

export const FLAG_REASON_LABELS: Record<ReviewFlagReason, string> = {
  inaccurate_information: "Inaccurate information",
  impersonation: "Impersonation",
  inappropriate_content: "Inappropriate content",
  spam_fake_review: "Spam or fake review",
  other: "Other",
};

export type ReviewFlagStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export interface ReviewFlag {
  id: string;
  reviewId: string;
  reason: ReviewFlagReason;
  details: string | null;
  reporterName: string | null;
  reporterEmail: string | null;
  flaggedByName: string | null;
  status: ReviewFlagStatus;
  resolutionNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  review: {
    id: string;
    rating: number;
    customerName: string | null;
    textExcerpt: string | null;
    status: string;
    userId: string | null;
  } | null;
}
