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
import { updateOrganizationSchema, validateBody } from '@/lib/api/validation';
import type { OrganizationResource } from '@/lib/api/types';

// Map database row to API resource
function mapOrganizationRow(row: Record<string, unknown>): OrganizationResource {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logo_url: row.logo_url as string | null,
    website_url: row.website_url as string | null,
    industry: row.industry as string | null,
    timezone: (row.timezone as string) || 'America/New_York',
    settings: (row.settings as Record<string, unknown>) || {},
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// GET /api/v1/organization - Get current organization
async function handleGet(
  request: NextRequest,
  context: ApiAuthContext
) {
  const supabase = createAdminClient();

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', context.organizationId)
    .single();

  if (error || !organization) {
    return apiNotFound('Organization', context.requestId);
  }

  return apiSuccess(
    mapOrganizationRow(organization as Record<string, unknown>),
    context.requestId
  );
}

// PATCH /api/v1/organization - Update current organization
async function handlePatch(
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
  const validation = validateBody(updateOrganizationSchema, body);
  if (!validation.success) {
    return apiValidationError(validation.errors, context.requestId);
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (validation.data.name !== undefined) {
    updateData.name = validation.data.name;
  }
  if (validation.data.logo_url !== undefined) {
    updateData.logo_url = validation.data.logo_url;
  }
  if (validation.data.website_url !== undefined) {
    updateData.website_url = validation.data.website_url;
  }
  if (validation.data.timezone !== undefined) {
    updateData.timezone = validation.data.timezone;
  }
  if (validation.data.settings !== undefined) {
    updateData.settings = validation.data.settings;
  }

  // Update organization
  const { data: organization, error: updateError } = await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', context.organizationId)
    .select('*')
    .single();

  if (updateError) {
    console.error('Error updating organization:', updateError);
    return apiInternalError(context.requestId, 'Failed to update organization');
  }

  return apiSuccess(
    mapOrganizationRow(organization as Record<string, unknown>),
    context.requestId
  );
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Export authenticated handlers
export const GET = withApiAuth(handleGet, ['organization:read']);
export const PATCH = withApiAuth(handlePatch, ['organization:write']);
