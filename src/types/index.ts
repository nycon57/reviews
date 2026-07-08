// Application types for RepWell

export type UserRole = "admin" | "manager" | "user";

export type AccountType = "individual" | "enterprise";

export type SubscriptionTier = "basic" | "pro" | "enterprise";

export type SurveyStatus = "pending" | "sent" | "opened" | "completed" | "expired";

export type ReviewSource =
  | "internal"
  | "survey"
  | "direct"
  | "video_testimonial"
  | "google"
  | "zillow"
  | "facebook"
  | "yelp"
  | "other";

export type ReviewStatus = "pending" | "approved" | "rejected" | "archived";

export type SentimentLabel = "positive" | "neutral" | "negative";

export type CredentialType = "nmls" | "state_real_estate" | "insurance" | "cpa" | "series_7" | "other";

export type GroupType = "team" | "region" | "segment" | "custom";

export type GroupMemberRole = "member" | "lead";

export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface User {
  id: string;
  organizationId: string;
  slug: string | null;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isOwner: boolean;
  isActive: boolean;
  createdAt: string;

  // Contact & Profile
  phone: string | null;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  personalWebsiteUrl: string | null;
  linkedinUrl: string | null;
  zillowProfileUrl: string | null;

  // Location
  branchId: string | null;
  address: UserAddress | null;

  // Employment
  managerUserId: string | null;
  hireDate: string | null;

  // Industry Context
  industry: string | null;

  // Aggregated Metrics
  averageRating: number;
  totalReviews: number;
  npsScore: number | null;
  reputationScore: number;

  // External Integrations
  googleBusinessId: string | null;
  googlePlaceId: string | null;

  // Settings
  receiveNotifications: boolean;
  autoRequestReviews: boolean;
  timezone: string | null;
  notificationPreferences: Record<string, boolean> | null;
  lastLoginAt: string | null;
  updatedAt: string;
}

export interface UserCredential {
  id: string;
  userId: string;
  organizationId: string;
  credentialType: CredentialType | string;
  credentialNumber: string;
  issuingAuthority: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  isPublic: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: GroupType;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroup {
  userId: string;
  groupId: string;
  role: GroupMemberRole;
  createdAt: string;
}

export interface GroupWithMembers extends Group {
  members: (User & { memberRole: GroupMemberRole })[];
  memberCount: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string;
  settings: OrganizationSettings;
  accountType: AccountType;
  subscriptionTier: SubscriptionTier;
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

/**
 * Professional represents a simplified view of a user for public-facing contexts
 * (directory listings, review attributions, etc.)
 */
export interface Professional {
  id: string;
  organizationId: string;
  slug: string | null;
  userId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  title: string;
  nmlsId: string | null;
  bio: string | null;
  photoUrl: string | null;
  branch: string | null;
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

/** @deprecated Use Professional instead */
export type LoanOfficer = Professional;

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
  userId: string | null;  // References users table
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
  userId: string | null;  // References users table
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

// Social Media Types
export type SocialPlatform = "facebook" | "twitter" | "linkedin" | "instagram";

export type SocialPostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";

export interface SocialConnection {
  id: string;
  organizationId: string;
  platform: SocialPlatform;
  platformUserId: string;
  platformUsername: string | null;
  platformDisplayName: string | null;
  platformProfileUrl: string | null;
  platformAvatarUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
  tokenScope: string | null;
  pageId: string | null;
  pageName: string | null;
  pageAccessToken: string | null;
  isActive: boolean;
  autoPublishEnabled: boolean;
  autoPublishMinRating: number;
  lastPostAt: string | null;
  postsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostTemplate {
  id: string;
  organizationId: string | null;
  platform: SocialPlatform;
  name: string;
  description: string | null;
  isDefault: boolean;
  isSystem: boolean;
  isActive: boolean;
  templateText: string;
  includeImage: boolean;
  includeLink: boolean;
  linkText: string;
  maxLength: number | null;
  defaultHashtags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  organizationId: string;
  connectionId: string;
  reviewId: string | null;
  testimonialId: string | null;
  templateId: string | null;
  platform: SocialPlatform;
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
  status: SocialPostStatus;
  scheduledFor: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  platformPostUrl: string | null;
  errorMessage: string | null;
  retryCount: number;
  lastRetryAt: string | null;
  createdBy: string | null;
  isAutoGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPostAnalytics {
  id: string;
  postId: string;
  organizationId: string;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
  lastFetchedAt: string;
  fetchCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPublishQueueItem {
  id: string;
  organizationId: string;
  reviewId: string;
  connectionId: string;
  status: "pending" | "processing" | "completed" | "failed";
  priority: number;
  scheduledFor: string;
  processedAt: string | null;
  postId: string | null;
  errorMessage: string | null;
  createdAt: string;
}
