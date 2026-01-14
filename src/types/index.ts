// Application types for ReviewHub

export type UserRole = "admin" | "manager" | "loan_officer";

export type SurveyStatus = "pending" | "sent" | "opened" | "completed" | "expired";

export type ReviewSource = "internal" | "google" | "zillow" | "facebook" | "yelp" | "other";

export type ReviewStatus = "pending" | "approved" | "rejected" | "archived";

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface User {
  id: string;
  organizationId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string;
  settings: OrganizationSettings;
  subscriptionTier: string;
  subscriptionStatus: string;
  createdAt: string;
}

export interface OrganizationSettings {
  emailFromName?: string;
  emailFromAddress?: string;
  defaultSurveyTemplateId?: string;
  autoApproveThreshold?: number;
  googleConnected?: boolean;
  notificationPreferences?: Record<string, boolean>;
}

export interface LoanOfficer {
  id: string;
  organizationId: string;
  userId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  title: string;
  nmlsId: string | null;
  bio: string | null;
  photoUrl: string | null;
  branch: string | null;
  region: string | null;
  googleBusinessId: string | null;
  zillowProfileUrl: string | null;
  linkedinUrl: string | null;
  averageRating: number;
  totalReviews: number;
  npsScore: number | null;
  reputationScore: number;
  isActive: boolean;
  createdAt: string;
}

export interface SurveyTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  questions: SurveyQuestion[];
  branding: SurveyBranding;
  thankYouConfig: ThankYouConfig;
  createdAt: string;
}

export interface SurveyQuestion {
  id: string;
  type: "rating" | "nps" | "text" | "multiple_choice";
  text: string;
  required: boolean;
  options?: {
    min?: number;
    max?: number;
    choices?: string[];
    placeholder?: string;
  };
}

export interface SurveyBranding {
  logoUrl?: string;
  primaryColor?: string;
  headerText?: string;
}

export interface ThankYouConfig {
  message: string;
  showGooglePrompt: boolean;
  googleReviewUrl?: string;
  redirectUrl?: string;
}

export interface Survey {
  id: string;
  organizationId: string;
  templateId: string;
  loanOfficerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  transactionId: string | null;
  transactionType: string;
  transactionDate: string | null;
  token: string;
  status: SurveyStatus;
  sentAt: string | null;
  openedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  reminderCount: number;
  source: string;
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Record<string, unknown>;
  overallRating: number | null;
  npsScore: number | null;
  testimonialText: string | null;
  sentimentScore: number | null;
  sentimentLabel: SentimentLabel | null;
  themes: string[];
  keyPhrases: string[];
  aiSummary: string | null;
  submittedAt: string;
}

export interface Review {
  id: string;
  organizationId: string;
  loanOfficerId: string;
  source: ReviewSource;
  sourceReviewId: string | null;
  sourceUrl: string | null;
  surveyResponseId: string | null;
  rating: number;
  title: string | null;
  text: string | null;
  customerName: string | null;
  customerLocation: string | null;
  sentimentScore: number | null;
  sentimentLabel: SentimentLabel | null;
  themes: string[];
  keyPhrases: string[];
  status: ReviewStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  responseText: string | null;
  responseAt: string | null;
  responseBy: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  featured: boolean;
  reviewDate: string;
  createdAt: string;
}

export interface MetricsSnapshot {
  totalReviews: number;
  averageRating: number;
  npsScore: number;
  responseRate: number;
  reviewVelocity: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  ratingDistribution: Record<string, number>;
  topThemes: string[];
}

export interface DashboardMetrics {
  current: MetricsSnapshot;
  previous: MetricsSnapshot | null;
  trends: {
    rating: number;
    reviews: number;
    nps: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
