import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth, type ApiAuthContext } from '@/lib/api-keys/validate';
import {
  apiSuccess,
  apiValidationError,
  apiNotFound,
  apiInternalError,
  handleOptionsRequest,
} from '@/lib/api/response';
import { updateReviewSchema, validateBody } from '@/lib/api/validation';
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/reviews/:id - Get a single review
async function handleGet(
  request: NextRequest,
  context: ApiAuthContext,
  { params }: RouteParams
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: review, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (error || !review) {
    return apiNotFound('Review', context.requestId);
  }

  return apiSuccess(
    mapReviewRow(review as Record<string, unknown>),
    context.requestId
  );
}

// PATCH /api/v1/reviews/:id - Update a review
async function handlePatch(
  request: NextRequest,
  context: ApiAuthContext,
  { params }: RouteParams
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiValidationError(
      [{ field: 'body', message: 'Invalid JSON body' }],
      context.requestId
    );
  }

  // Validate body
  const validation = validateBody(updateReviewSchema, body);
  if (!validation.success) {
    return apiValidationError(validation.errors, context.requestId);
  }

  // Check if review exists
  const { data: existing, error: existError } = await supabase
    .from('reviews')
    .select('id')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (existError || !existing) {
    return apiNotFound('Review', context.requestId);
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (validation.data.status) {
    updateData.status = validation.data.status;
  }

  // Update review
  const { data: review, error: updateError } = await supabase
    .from('reviews')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error updating review:', updateError);
    return apiInternalError(context.requestId, 'Failed to update review');
  }

  return apiSuccess(
    mapReviewRow(review as Record<string, unknown>),
    context.requestId
  );
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Wrap handlers with route params
export const GET = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth(
    (req, ctx) => handleGet(req, ctx, routeContext),
    ['reviews:read']
  )(request);

export const PATCH = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth(
    (req, ctx) => handlePatch(req, ctx, routeContext),
    ['reviews:write']
  )(request);
