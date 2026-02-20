/**
 * API Key Types
 * Defines types for API key management
 */

// API Key scopes - define what the key can access
export const API_KEY_SCOPES = [
  // Survey operations
  'surveys:read',
  'surveys:write',

  // Review operations
  'reviews:read',
  'reviews:write',

  // Branch operations
  'branches:read',
  'branches:write',

  // Professional operations
  'professionals:read',
  'professionals:write',

  // Loan officer operations (deprecated - use professionals:* instead)
  'loan-officers:read',
  'loan-officers:write',

  // Organization operations
  'organization:read',
  'organization:write',

  // User operations
  'users:read',
  'users:write',

  // Webhook operations
  'webhooks:trigger',
  'webhooks:manage',

  // Share Studio operations
  'share-studio:read',
  'share-studio:write',
  'share-studio:publish',
  'share-studio:render',

  // Admin scope - grants all permissions
  'admin',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

// Environment types
export type ApiKeyEnvironment = 'live' | 'test';

// Key prefix based on environment
export const KEY_PREFIXES = {
  live: 'rw_live_',
  test: 'rw_test_',
} as const;

// Rate limit tiers
export const RATE_LIMIT_TIERS = {
  basic: 100,     // 100 requests/hour
  pro: 1000,      // 1000 requests/hour
  enterprise: 10000, // 10000 requests/hour
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

// API Key record from database
export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  description: string | null;
  scopes: ApiKeyScope[];
  environment: ApiKeyEnvironment;
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  requestCount: number;
  createdBy: string | null;
  createdAt: string;
  rotatedFrom: string | null;
  rotatedAt: string | null;
}

// Input for creating an API key
export interface CreateApiKeyInput {
  name: string;
  description?: string;
  scopes: ApiKeyScope[];
  environment?: ApiKeyEnvironment;
  rateLimit?: number;
  expiresAt?: string; // ISO date string
}

// Input for updating an API key
export interface UpdateApiKeyInput {
  name?: string;
  description?: string;
  scopes?: ApiKeyScope[];
  rateLimit?: number;
  isActive?: boolean;
  expiresAt?: string | null;
}

// Result of creating an API key - includes the raw key (shown once)
export interface CreateApiKeyResult {
  apiKey: ApiKey;
  rawKey: string; // Only returned on creation - never stored or shown again
}

// Result of validating an API key
export interface ValidateApiKeyResult {
  isValid: boolean;
  apiKeyId: string | null;
  organizationId: string | null;
  scopes: ApiKeyScope[];
  rateLimit: number;
  errorMessage: string | null;
}

// Rate limit check result
export interface RateLimitResult {
  isAllowed: boolean;
  currentCount: number;
  limitCount: number;
  resetAt: string;
  remaining: number;
}

// API Key usage log entry
export interface ApiKeyUsageLog {
  id: string;
  apiKeyId: string;
  organizationId: string;
  endpoint: string;
  method: string;
  statusCode: number | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  responseTimeMs: number | null;
  requestBodySize: number | null;
  responseBodySize: number | null;
  errorMessage: string | null;
  createdAt: string;
}

// API Key statistics
export interface ApiKeyStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTimeMs: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: { date: string; count: number }[];
}

// Filters for listing API keys
export interface ApiKeyFilters {
  environment?: ApiKeyEnvironment;
  isActive?: boolean;
  search?: string;
}

// Action result type
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
