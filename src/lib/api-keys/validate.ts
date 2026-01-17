/**
 * API Key Validation
 * Middleware and utilities for validating API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashApiKey, isValidKeyFormat, generateRequestId } from './generate';
import type {
  ApiKeyScope,
  ValidateApiKeyResult,
  RateLimitResult,
} from './types';

// Header names
const API_KEY_HEADER = 'x-api-key';
const AUTHORIZATION_HEADER = 'authorization';

// Rate limit headers
export const RATE_LIMIT_HEADERS = {
  limit: 'X-RateLimit-Limit',
  remaining: 'X-RateLimit-Remaining',
  reset: 'X-RateLimit-Reset',
  retryAfter: 'Retry-After',
} as const;

/**
 * Extract API key from request headers
 * Supports both x-api-key header and Bearer token authorization
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check x-api-key header first
  const apiKeyHeader = request.headers.get(API_KEY_HEADER);
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check Authorization header for Bearer token
  const authHeader = request.headers.get(AUTHORIZATION_HEADER);
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Validate an API key against the database
 */
export async function validateApiKey(
  rawKey: string,
  requiredScopes: ApiKeyScope[] = []
): Promise<ValidateApiKeyResult> {
  // Check key format first
  if (!isValidKeyFormat(rawKey)) {
    return {
      isValid: false,
      apiKeyId: null,
      organizationId: null,
      scopes: [],
      rateLimit: 0,
      errorMessage: 'Invalid API key format',
    };
  }

  const keyHash = hashApiKey(rawKey);
  const supabase = createAdminClient();

  // Use the database function for validation
  const { data, error } = await supabase.rpc('validate_api_key', {
    p_key_hash: keyHash,
    p_required_scopes: requiredScopes,
  });

  if (error) {
    console.error('API key validation error:', error);
    return {
      isValid: false,
      apiKeyId: null,
      organizationId: null,
      scopes: [],
      rateLimit: 0,
      errorMessage: 'Failed to validate API key',
    };
  }

  // The RPC returns an array, get the first result
  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    return {
      isValid: false,
      apiKeyId: null,
      organizationId: null,
      scopes: [],
      rateLimit: 0,
      errorMessage: 'Invalid API key',
    };
  }

  return {
    isValid: result.is_valid,
    apiKeyId: result.api_key_id,
    organizationId: result.organization_id,
    scopes: (result.scopes || []) as ApiKeyScope[],
    rateLimit: result.rate_limit || 1000,
    errorMessage: result.error_message,
  };
}

/**
 * Check rate limit for an API key
 */
export async function checkRateLimit(
  apiKeyId: string,
  rateLimit: number
): Promise<RateLimitResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('check_api_rate_limit', {
    p_api_key_id: apiKeyId,
    p_rate_limit: rateLimit,
  });

  if (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log it
    return {
      isAllowed: true,
      currentCount: 0,
      limitCount: rateLimit,
      resetAt: new Date(Date.now() + 3600000).toISOString(),
      remaining: rateLimit,
    };
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    return {
      isAllowed: true,
      currentCount: 0,
      limitCount: rateLimit,
      resetAt: new Date(Date.now() + 3600000).toISOString(),
      remaining: rateLimit,
    };
  }

  return {
    isAllowed: result.is_allowed,
    currentCount: result.current_count,
    limitCount: result.limit_count,
    resetAt: result.reset_at,
    remaining: Math.max(0, result.limit_count - result.current_count),
  };
}

/**
 * Log API key usage
 */
export async function logApiKeyUsage(params: {
  apiKeyId: string;
  organizationId: string;
  endpoint: string;
  method: string;
  statusCode?: number;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  responseTimeMs?: number;
  requestBodySize?: number;
  responseBodySize?: number;
  errorMessage?: string;
}): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from('api_key_usage_logs').insert({
    api_key_id: params.apiKeyId,
    organization_id: params.organizationId,
    endpoint: params.endpoint,
    method: params.method,
    status_code: params.statusCode,
    request_id: params.requestId,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    response_time_ms: params.responseTimeMs,
    request_body_size: params.requestBodySize,
    response_body_size: params.responseBodySize,
    error_message: params.errorMessage,
  });

  // Also increment total request count
  await supabase.rpc('increment_api_key_request_count', {
    p_api_key_id: params.apiKeyId,
  });
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  rateLimitResult: RateLimitResult
): Record<string, string> {
  const resetTimestamp = Math.floor(
    new Date(rateLimitResult.resetAt).getTime() / 1000
  );

  return {
    [RATE_LIMIT_HEADERS.limit]: String(rateLimitResult.limitCount),
    [RATE_LIMIT_HEADERS.remaining]: String(rateLimitResult.remaining),
    [RATE_LIMIT_HEADERS.reset]: String(resetTimestamp),
  };
}

/**
 * Context passed to API route handlers after authentication
 */
export interface ApiAuthContext {
  apiKeyId: string;
  organizationId: string;
  scopes: ApiKeyScope[];
  rateLimit: RateLimitResult;
  requestId: string;
}

/**
 * Middleware function type for authenticated API routes
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  context: ApiAuthContext
) => Promise<NextResponse>;

/**
 * Higher-order function to wrap API routes with authentication
 * @param handler - The route handler function
 * @param requiredScopes - Scopes required to access this endpoint
 */
export function withApiAuth(
  handler: AuthenticatedHandler,
  requiredScopes: ApiKeyScope[] = []
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // Extract API key
    const rawKey = extractApiKey(request);
    if (!rawKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing API key. Provide via x-api-key header or Bearer token.',
          },
          meta: { request_id: requestId },
        },
        { status: 401 }
      );
    }

    // Validate API key
    const validation = await validateApiKey(rawKey, requiredScopes);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: validation.errorMessage?.includes('expired')
              ? 'API_KEY_EXPIRED'
              : validation.errorMessage?.includes('permissions')
              ? 'FORBIDDEN'
              : 'INVALID_API_KEY',
            message: validation.errorMessage || 'Invalid API key',
          },
          meta: { request_id: requestId },
        },
        {
          status: validation.errorMessage?.includes('permissions') ? 403 : 401,
        }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(
      validation.apiKeyId!,
      validation.rateLimit
    );

    if (!rateLimit.isAllowed) {
      const headers = createRateLimitHeaders(rateLimit);
      headers[RATE_LIMIT_HEADERS.retryAfter] = String(
        Math.ceil(
          (new Date(rateLimit.resetAt).getTime() - Date.now()) / 1000
        )
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded. Please retry after the reset time.',
            retry_after: rateLimit.resetAt,
          },
          meta: { request_id: requestId },
        },
        { status: 429, headers }
      );
    }

    // Create context
    const context: ApiAuthContext = {
      apiKeyId: validation.apiKeyId!,
      organizationId: validation.organizationId!,
      scopes: validation.scopes,
      rateLimit,
      requestId,
    };

    // Get request metadata for logging
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    try {
      // Call the actual handler
      const response = await handler(request, context);

      // Add rate limit headers to response
      const rateLimitHeaders = createRateLimitHeaders(rateLimit);
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add request ID header
      response.headers.set('X-Request-ID', requestId);

      // Log successful request
      const responseTime = Date.now() - startTime;
      logApiKeyUsage({
        apiKeyId: context.apiKeyId,
        organizationId: context.organizationId,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        statusCode: response.status,
        requestId,
        ipAddress,
        userAgent,
        responseTimeMs: responseTime,
      }).catch((err) => console.error('Failed to log API usage:', err));

      return response;
    } catch (error) {
      // Log error
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logApiKeyUsage({
        apiKeyId: context.apiKeyId,
        organizationId: context.organizationId,
        endpoint: new URL(request.url).pathname,
        method: request.method,
        statusCode: 500,
        requestId,
        ipAddress,
        userAgent,
        responseTimeMs: responseTime,
        errorMessage,
      }).catch((err) => console.error('Failed to log API usage:', err));

      console.error('API route error:', error);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred',
          },
          meta: { request_id: requestId },
        },
        {
          status: 500,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      );
    }
  };
}

/**
 * Check if the authenticated context has a specific scope
 */
export function hasScope(
  context: ApiAuthContext,
  scope: ApiKeyScope
): boolean {
  return context.scopes.includes(scope) || context.scopes.includes('admin');
}

/**
 * Check if the authenticated context has all required scopes
 */
export function hasAllScopes(
  context: ApiAuthContext,
  scopes: ApiKeyScope[]
): boolean {
  return scopes.every((scope) => hasScope(context, scope));
}

/**
 * Check if the authenticated context has any of the required scopes
 */
export function hasAnyScope(
  context: ApiAuthContext,
  scopes: ApiKeyScope[]
): boolean {
  return scopes.some((scope) => hasScope(context, scope));
}
