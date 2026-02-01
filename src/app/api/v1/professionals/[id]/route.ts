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
import { updateProfessionalSchema, validateBody } from '@/lib/api/validation';
import type { ProfessionalResource } from '@/lib/api/types';

// Map database row to API resource
function mapProfessionalRow(row: Record<string, unknown>): ProfessionalResource {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    branch_id: row.branch_id as string | null,
    user_id: row.user_id as string | null,
    full_name: row.full_name as string,
    email: row.email as string,
    phone: row.phone as string | null,
    title: row.title as string | null,
    nmls_id: row.nmls_id as string | null,
    bio: row.bio as string | null,
    photo_url: row.photo_url as string | null,
    is_active: row.is_active as boolean,
    average_rating: row.average_rating as number | null,
    total_reviews: (row.total_reviews as number) || 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/professionals/:id - Get a single professional
async function handleGet(
  request: NextRequest,
  context: ApiAuthContext,
  { params }: RouteParams
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: professional, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (error || !professional) {
    return apiNotFound('Professional', context.requestId);
  }

  return apiSuccess(
    mapProfessionalRow(professional as Record<string, unknown>),
    context.requestId
  );
}

// PATCH /api/v1/professionals/:id - Update a professional
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
  const validation = validateBody(updateProfessionalSchema, body);
  if (!validation.success) {
    return apiValidationError(validation.errors, context.requestId);
  }

  // Check if professional exists
  const { data: existing, error: existError } = await supabase
    .from('users')
    .select('id')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (existError || !existing) {
    return apiNotFound('Professional', context.requestId);
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (validation.data.full_name !== undefined) {
    updateData.full_name = validation.data.full_name;
  }
  if (validation.data.phone !== undefined) {
    updateData.phone = validation.data.phone;
  }
  if (validation.data.title !== undefined) {
    updateData.title = validation.data.title;
  }
  if (validation.data.bio !== undefined) {
    updateData.bio = validation.data.bio;
  }
  if (validation.data.branch_id !== undefined) {
    updateData.branch_id = validation.data.branch_id;
  }
  if (validation.data.is_active !== undefined) {
    updateData.is_active = validation.data.is_active;
  }

  // Update professional
  const { data: professional, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error updating professional:', updateError);
    return apiInternalError(context.requestId, 'Failed to update professional');
  }

  return apiSuccess(
    mapProfessionalRow(professional as Record<string, unknown>),
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
    ['professionals:read']
  )(request);

export const PATCH = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth(
    (req, ctx) => handlePatch(req, ctx, routeContext),
    ['professionals:write']
  )(request);
