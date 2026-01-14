// Review types for the review approval workflow

export interface Review {
  id: string;
  organizationId: string;
  loanOfficerId: string;
  source: string;
  rating: number;
  title: string | null;
  text: string | null;
  customerName: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  reviewDate: string;
  createdAt: string;
  loanOfficer?: {
    id: string;
    fullName: string;
    email: string;
    photoUrl: string | null;
  };
  surveyResponse?: {
    id: string;
    overallRating: number | null;
    npsScore: number | null;
    testimonialText: string | null;
  } | null;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auto-approval rules types
export interface AutoApprovalRule {
  id: string;
  type: "rating" | "source" | "sentiment";
  enabled: boolean;
  config: {
    minRating?: number; // For rating-based rules
    sources?: string[]; // For source-based rules
    minSentiment?: number; // For sentiment-based rules
  };
}

// Default auto-approval rules stored in organization settings
export const DEFAULT_AUTO_APPROVAL_RULES: AutoApprovalRule[] = [
  {
    id: "auto-5-star",
    type: "rating",
    enabled: false,
    config: { minRating: 5 },
  },
  {
    id: "auto-4-5-star",
    type: "rating",
    enabled: false,
    config: { minRating: 4 },
  },
];
