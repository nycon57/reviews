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
import { updateSurveySchema, validateBody } from '@/lib/api/validation';
import type { SurveyResource } from '@/lib/api/types';

// Map database row to API resource
function mapSurveyRow(row: Record<string, unknown>): SurveyResource {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    template_id: row.template_id as string,
    user_id: row.user_id as string,
    customer_name: row.customer_name as string,
    customer_email: row.customer_email as string,
    customer_phone: row.customer_phone as string | null,
    transaction_id: row.transaction_id as string | null,
    transaction_type: row.transaction_type as string | null,
    transaction_date: row.transaction_date as string | null,
    status: row.status as string,
    sent_at: row.sent_at as string | null,
    completed_at: row.completed_at as string | null,
    expires_at: row.expires_at as string | null,
    source: row.source as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/surveys/:id - Get a single survey
async function handleGet(
  request: NextRequest,
  context: ApiAuthContext,
  { params }: RouteParams
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: survey, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (error || !survey) {
    return apiNotFound('Survey', context.requestId);
  }

  return apiSuccess(
    mapSurveyRow(survey as Record<string, unknown>),
    context.requestId
  );
}

// PATCH /api/v1/surveys/:id - Update a survey
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
  const validation = validateBody(updateSurveySchema, body);
  if (!validation.success) {
    return apiValidationError(validation.errors, context.requestId);
  }

  // Check if survey exists
  const { data: existing, error: existError } = await supabase
    .from('surveys')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (existError || !existing) {
    return apiNotFound('Survey', context.requestId);
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (validation.data.status) {
    updateData.status = validation.data.status;

    // Set completed_at if status is being set to completed
    if (validation.data.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
  }

  // Update survey
  const { data: survey, error: updateError } = await supabase
    .from('surveys')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error updating survey:', updateError);
    return apiInternalError(context.requestId, 'Failed to update survey');
  }

  return apiSuccess(
    mapSurveyRow(survey as Record<string, unknown>),
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
    ['surveys:read']
  )(request);

export const PATCH = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth(
    (req, ctx) => handlePatch(req, ctx, routeContext),
    ['surveys:write']
  )(request);
