/**
 * REST API Response Utilities
 * Helper functions for creating standardized API responses
 */

import { NextResponse } from 'next/server';
import type {
  ApiResponse,
  ApiError,
  ApiErrorCode,
  PaginationMeta,
  HTTP_STATUS,
} from './types';

/**
 * Create a successful API response
 */
export function apiSuccess<T>(
  data: T,
  requestId: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create a successful API response with pagination
 */
export function apiPaginated<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  },
  requestId: string
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const paginationMeta: PaginationMeta = {
    page: pagination.page,
    page_size: pagination.pageSize,
    total: pagination.total,
    total_pages: totalPages,
    has_more: pagination.page < totalPages,
  };

  return NextResponse.json(
    {
      success: true,
      data,
      pagination: paginationMeta,
      meta: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}

/**
 * Create an error API response
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  requestId: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  const error: ApiError = {
    code,
    message,
    ...(details && { details }),
  };

  return NextResponse.json(
    {
      success: false,
      error,
      meta: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Create a validation error response
 */
export function apiValidationError(
  errors: Array<{ field: string; message: string }>,
  requestId: string
): NextResponse<ApiResponse> {
  return apiError(
    'VALIDATION_ERROR',
    'Validation failed',
    requestId,
    422,
    { errors }
  );
}

/**
 * Create a not found error response
 */
export function apiNotFound(
  resource: string,
  requestId: string
): NextResponse<ApiResponse> {
  return apiError(
    'NOT_FOUND',
    `${resource} not found`,
    requestId,
    404
  );
}

/**
 * Create a forbidden error response
 */
export function apiForbidden(
  message: string,
  requestId: string
): NextResponse<ApiResponse> {
  return apiError(
    'FORBIDDEN',
    message,
    requestId,
    403
  );
}

/**
 * Create a conflict error response
 */
export function apiConflict(
  message: string,
  requestId: string
): NextResponse<ApiResponse> {
  return apiError(
    'CONFLICT',
    message,
    requestId,
    409
  );
}

/**
 * Create an internal server error response
 */
export function apiInternalError(
  requestId: string,
  message: string = 'An internal error occurred'
): NextResponse<ApiResponse> {
  return apiError(
    'INTERNAL_ERROR',
    message,
    requestId,
    500
  );
}

/**
 * Map HTTP status code to standard status
 */
export function getStatusCode(status: keyof typeof HTTP_STATUS): number {
  const statusMap: Record<string, number> = {
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
  };

  return statusMap[status] || 500;
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('page_size') || searchParams.get('limit') || '25', 10))
  );
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
}

/**
 * Parse sorting parameters from URL search params
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultField: string = 'created_at'
): {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const sortBy = searchParams.get('sort_by') || defaultField;
  const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';

  // Validate sort field
  const validatedSortBy = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const validatedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

  return {
    sortBy: validatedSortBy,
    sortOrder: validatedSortOrder,
  };
}

/**
 * Parse filter parameters from URL search params
 */
export function parseFilterParams(searchParams: URLSearchParams): {
  search?: string;
  status?: string;
  createdAfter?: string;
  createdBefore?: string;
} {
  return {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    createdAfter: searchParams.get('created_after') || undefined,
    createdBefore: searchParams.get('created_before') || undefined,
  };
}

/**
 * Create response headers with CORS
 */
export function createCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS preflight request
 */
export function handleOptionsRequest(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: createCorsHeaders(),
  });
}
