import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth, type ApiAuthContext } from '@/lib/api-keys/validate';
import {
  apiPaginated,
  apiInternalError,
  parsePaginationParams,
  parseSortParams,
  handleOptionsRequest,
} from '@/lib/api/response';
import { reviewFiltersSchema, validateParams } from '@/lib/api/validation';
import type { ReviewResource } from '@/lib/api/types';

// Map database row to API resource
function mapReviewRow(row: Record<string, unknown>): ReviewResource {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    loan_officer_id: row.loan_officer_id as string | null,
    branch_id: row.branch_id as string | null,
    platform: row.platform as string,
    platform_review_id: row.platform_review_id as string | null,
    rating: row.rating as number,
    review_text: row.review_text as string | null,
    reviewer_name: row.reviewer_name as string | null,
    review_date: row.review_date as string,
    response_text: row.response_text as string | null,
    response_date: row.response_date as string | null,
    status: row.status as string,
    sentiment_score: row.sentiment_score as number | null,
    sentiment_label: row.sentiment_label as string | null,
    key_phrases: row.key_phrases as string[] | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// GET /api/v1/reviews - List reviews
async function handleGet(
  request: NextRequest,
  context: ApiAuthContext
) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  // Parse pagination
  const { page, pageSize, offset } = parsePaginationParams(searchParams);

  // Parse sorting
  const { sortBy, sortOrder } = parseSortParams(
    searchParams,
    ['created_at', 'review_date', 'rating', 'platform', 'status'],
    'review_date'
  );

  // Parse filters
  const filtersResult = validateParams(reviewFiltersSchema, searchParams);
  const filters = filtersResult.success ? filtersResult.data : {};

  // Build query
  let query = supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('organization_id', context.organizationId)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + pageSize - 1);

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.platform) {
    query = query.eq('platform', filters.platform);
  }
  if (filters.loan_officer_id) {
    query = query.eq('loan_officer_id', filters.loan_officer_id);
  }
  if (filters.branch_id) {
    query = query.eq('branch_id', filters.branch_id);
  }
  if (filters.min_rating) {
    query = query.gte('rating', filters.min_rating);
  }
  if (filters.max_rating) {
    query = query.lte('rating', filters.max_rating);
  }
  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after);
  }
  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before);
  }
  if (filters.search) {
    query = query.or(
      `review_text.ilike.%${filters.search}%,reviewer_name.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    return apiInternalError(context.requestId, 'Failed to fetch reviews');
  }

  const reviews = (data || []).map((row) =>
    mapReviewRow(row as Record<string, unknown>)
  );

  return apiPaginated(reviews, { page, pageSize, total: count || 0 }, context.requestId);
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Export authenticated handlers
export const GET = withApiAuth(handleGet, ['reviews:read']);
