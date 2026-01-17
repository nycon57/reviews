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
import { updateBranchSchema, validateBody } from '@/lib/api/validation';
import type { BranchResource } from '@/lib/api/types';
import type { Json } from '@/types/database.types';

// Map database row to API resource
function mapBranchRow(row: Record<string, unknown>): BranchResource {
  const address = row.address as Json;
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    name: row.name as string,
    slug: row.slug as string,
    address: address as BranchResource['address'],
    phone: row.phone as string | null,
    email: row.email as string | null,
    website_url: row.website_url as string | null,
    manager_name: row.manager_name as string | null,
    manager_email: row.manager_email as string | null,
    region: row.region as string | null,
    is_active: row.is_active as boolean,
    average_rating: row.average_rating as number | null,
    total_reviews: (row.total_reviews as number) || 0,
    total_loan_officers: (row.total_loan_officers as number) || 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/branches/:id - Get a single branch
async function handleGet(
  request: NextRequest,
  context: ApiAuthContext,
  { params }: RouteParams
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: branch, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (error || !branch) {
    return apiNotFound('Branch', context.requestId);
  }

  return apiSuccess(
    mapBranchRow(branch as Record<string, unknown>),
    context.requestId
  );
}

// PATCH /api/v1/branches/:id - Update a branch
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
  const validation = validateBody(updateBranchSchema, body);
  if (!validation.success) {
    return apiValidationError(validation.errors, context.requestId);
  }

  // Check if branch exists
  const { data: existing, error: existError } = await supabase
    .from('branches')
    .select('id')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (existError || !existing) {
    return apiNotFound('Branch', context.requestId);
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (validation.data.name !== undefined) {
    updateData.name = validation.data.name;
  }
  if (validation.data.address !== undefined) {
    updateData.address = validation.data.address as Json;
  }
  if (validation.data.phone !== undefined) {
    updateData.phone = validation.data.phone;
  }
  if (validation.data.email !== undefined) {
    updateData.email = validation.data.email;
  }
  if (validation.data.website_url !== undefined) {
    updateData.website_url = validation.data.website_url;
  }
  if (validation.data.manager_name !== undefined) {
    updateData.manager_name = validation.data.manager_name;
  }
  if (validation.data.manager_email !== undefined) {
    updateData.manager_email = validation.data.manager_email;
  }
  if (validation.data.region !== undefined) {
    updateData.region = validation.data.region;
  }
  if (validation.data.is_active !== undefined) {
    updateData.is_active = validation.data.is_active;
  }

  // Update branch
  const { data: branch, error: updateError } = await supabase
    .from('branches')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error updating branch:', updateError);
    return apiInternalError(context.requestId, 'Failed to update branch');
  }

  return apiSuccess(
    mapBranchRow(branch as Record<string, unknown>),
    context.requestId
  );
}

// DELETE /api/v1/branches/:id - Soft delete a branch
async function handleDelete(
  request: NextRequest,
  context: ApiAuthContext,
  { params }: RouteParams
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Check if branch exists
  const { data: existing, error: existError } = await supabase
    .from('branches')
    .select('id')
    .eq('id', id)
    .eq('organization_id', context.organizationId)
    .single();

  if (existError || !existing) {
    return apiNotFound('Branch', context.requestId);
  }

  // Soft delete by setting is_active to false
  const { error: deleteError } = await supabase
    .from('branches')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', context.organizationId);

  if (deleteError) {
    console.error('Error deleting branch:', deleteError);
    return apiInternalError(context.requestId, 'Failed to delete branch');
  }

  return apiSuccess({ deleted: true }, context.requestId);
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Wrap handlers with route params
export const GET = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth(
    (req, ctx) => handleGet(req, ctx, routeContext),
    ['branches:read']
  )(request);

export const PATCH = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth(
    (req, ctx) => handlePatch(req, ctx, routeContext),
    ['branches:write']
  )(request);

export const DELETE = (request: NextRequest, routeContext: RouteParams) =>
  withApiAuth(
    (req, ctx) => handleDelete(req, ctx, routeContext),
    ['branches:write']
  )(request);
