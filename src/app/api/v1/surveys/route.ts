import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth, type ApiAuthContext } from '@/lib/api-keys/validate';
import {
  apiSuccess,
  apiPaginated,
  apiValidationError,
  apiNotFound,
  apiInternalError,
  parsePaginationParams,
  parseSortParams,
  handleOptionsRequest,
} from '@/lib/api/response';
import {
  createSurveySchema,
  surveyFiltersSchema,
  validateBody,
  validateParams,
} from '@/lib/api/validation';
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

// GET /api/v1/surveys - List surveys
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
    ['created_at', 'sent_at', 'completed_at', 'customer_name', 'status'],
    'created_at'
  );

  // Parse filters
  const filtersResult = validateParams(surveyFiltersSchema, searchParams);
  const filters = filtersResult.success ? filtersResult.data : {};

  // Build query
  let query = supabase
    .from('surveys')
    .select('*', { count: 'exact' })
    .eq('organization_id', context.organizationId)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + pageSize - 1);

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }
  if (filters.template_id) {
    query = query.eq('template_id', filters.template_id);
  }
  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after);
  }
  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before);
  }
  if (filters.search) {
    query = query.or(
      `customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching surveys:', error);
    return apiInternalError(context.requestId, 'Failed to fetch surveys');
  }

  const surveys = (data || []).map((row) =>
    mapSurveyRow(row as Record<string, unknown>)
  );

  return apiPaginated(surveys, { page, pageSize, total: count || 0 }, context.requestId);
}

// POST /api/v1/surveys - Create a survey
async function handlePost(
  request: NextRequest,
  context: ApiAuthContext
) {
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
  const validation = validateBody(createSurveySchema, body);
  if (!validation.success) {
    return apiValidationError(validation.errors, context.requestId);
  }

  const input = validation.data;

  // Find user
  let userId = input.user_id;
  if (!userId && input.user_email) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', context.organizationId)
      .eq('email', input.user_email)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return apiNotFound('User', context.requestId);
    }

    userId = user.id;
  }

  // Get template
  let templateId = input.template_id;
  if (!templateId) {
    const { data: defaultTemplate } = await supabase
      .from('survey_templates')
      .select('id')
      .eq('organization_id', context.organizationId)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (!defaultTemplate) {
      const { data: anyTemplate } = await supabase
        .from('survey_templates')
        .select('id')
        .eq('organization_id', context.organizationId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!anyTemplate) {
        return apiValidationError(
          [{ field: 'template_id', message: 'No active survey template found' }],
          context.requestId
        );
      }

      templateId = anyTemplate.id;
    } else {
      templateId = defaultTemplate.id;
    }
  }

  // Verify user was found
  if (!userId) {
    return apiValidationError(
      [{ field: 'user_id', message: 'User not found' }],
      context.requestId
    );
  }

  // Calculate scheduled time
  const scheduledAt = new Date();
  if (input.delay_hours && input.delay_hours > 0) {
    scheduledAt.setHours(scheduledAt.getHours() + input.delay_hours);
  }

  // Calculate expiration
  const expiresAt = new Date(scheduledAt);
  expiresAt.setDate(expiresAt.getDate() + 14);

  // Create survey
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .insert({
      organization_id: context.organizationId,
      template_id: templateId as string,
      user_id: userId as string,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone,
      transaction_id: input.transaction_id,
      transaction_type: input.transaction_type,
      transaction_date: input.transaction_date,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      source: 'api',
      source_metadata: {
        api_key_id: context.apiKeyId,
        request_id: context.requestId,
        ...input.metadata,
      },
    })
    .select('*')
    .single();

  if (surveyError) {
    console.error('Error creating survey:', surveyError);
    return apiInternalError(context.requestId, 'Failed to create survey');
  }

  // Add to distribution queue
  await supabase.from('survey_distribution_queue').insert({
    organization_id: context.organizationId,
    survey_id: survey.id,
    type: 'initial',
    scheduled_at: scheduledAt.toISOString(),
    priority: 1,
  });

  return apiSuccess(
    mapSurveyRow(survey as Record<string, unknown>),
    context.requestId,
    201
  );
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Export authenticated handlers
export const GET = withApiAuth(handleGet, ['surveys:read']);
export const POST = withApiAuth(handlePost, ['surveys:write']);
