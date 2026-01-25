/**
 * REST API Types
 * Common types for the public REST API
 */

// Standard API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationMeta;
  meta?: ResponseMeta;
}

// Error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}

// Response metadata
export interface ResponseMeta {
  request_id: string;
  timestamp: string;
}

// Common pagination parameters
export interface PaginationParams {
  page?: number;
  page_size?: number;
  limit?: number;
  offset?: number;
}

// Common sorting parameters
export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Common filter parameters
export interface FilterParams {
  search?: string;
  status?: string;
  created_after?: string;
  created_before?: string;
}

// Combined query parameters
export type QueryParams = PaginationParams & SortParams & FilterParams;

// Standard error codes
export const API_ERROR_CODES = {
  // Authentication errors (4xx)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_FIELD: 'MISSING_FIELD',
  INVALID_FIELD: 'INVALID_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// HTTP status codes mapping
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Resource types for API endpoints
export interface SurveyResource {
  id: string;
  organization_id: string;
  template_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  transaction_id: string | null;
  transaction_type: string | null;
  transaction_date: string | null;
  status: string;
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewResource {
  id: string;
  organization_id: string;
  user_id: string | null;
  branch_id: string | null;
  platform: string;
  platform_review_id: string | null;
  rating: number;
  review_text: string | null;
  reviewer_name: string | null;
  review_date: string;
  response_text: string | null;
  response_date: string | null;
  status: string;
  sentiment_score: number | null;
  sentiment_label: string | null;
  key_phrases: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BranchResource {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  manager_name: string | null;
  manager_email: string | null;
  region: string | null;
  is_active: boolean;
  average_rating: number | null;
  total_reviews: number;
  total_members: number;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalResource {
  id: string;
  organization_id: string;
  branch_id: string | null;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  nmls_id: string | null;
  bio: string | null;
  photo_url: string | null;
  is_active: boolean;
  average_rating: number | null;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

/** @deprecated Use ProfessionalResource instead */
export type LoanOfficerResource = ProfessionalResource;

export interface OrganizationResource {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  industry: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserResource {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
}

// Input types for creating/updating resources
export interface CreateSurveyInput {
  user_id?: string;
  user_email?: string;
  template_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  transaction_id?: string;
  transaction_type?: string;
  transaction_date?: string;
  delay_hours?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateSurveyInput {
  status?: 'pending' | 'sent' | 'completed' | 'expired' | 'cancelled';
}

export interface CreateBranchInput {
  name: string;
  slug?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  website_url?: string;
  manager_name?: string;
  manager_email?: string;
  region?: string;
}

export interface UpdateBranchInput {
  name?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  website_url?: string;
  manager_name?: string;
  manager_email?: string;
  region?: string;
  is_active?: boolean;
}

export interface UpdateReviewInput {
  status?: 'pending' | 'approved' | 'rejected' | 'flagged';
}

export interface ReviewResponseInput {
  response_text: string;
}

export interface UpdateProfessionalInput {
  full_name?: string;
  phone?: string;
  title?: string;
  bio?: string;
  branch_id?: string;
  is_active?: boolean;
}

/** @deprecated Use UpdateProfessionalInput instead */
export type UpdateLoanOfficerInput = UpdateProfessionalInput;

export interface UpdateOrganizationInput {
  name?: string;
  logo_url?: string;
  website_url?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
}

export interface InviteUserInput {
  email: string;
  role: 'admin' | 'manager' | 'user';
  first_name?: string;
  last_name?: string;
}
