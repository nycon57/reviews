import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth, type ApiAuthContext } from '@/lib/api-keys/validate';
import {
  apiSuccess,
  apiPaginated,
  apiValidationError,
  apiInternalError,
  parsePaginationParams,
  parseSortParams,
  handleOptionsRequest,
} from '@/lib/api/response';
import {
  createBranchSchema,
  branchFiltersSchema,
  validateBody,
  validateParams,
} from '@/lib/api/validation';
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
    manager_id: row.manager_id as string | null,
    manager_name: row.manager_name as string | null,
    manager_email: row.manager_email as string | null,
    is_active: row.is_active as boolean,
    average_rating: row.average_rating as number | null,
    total_reviews: (row.total_reviews as number) || 0,
    total_members: (row.total_members as number) || 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// Generate a unique slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/v1/branches - List branches
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
    ['created_at', 'name', 'average_rating', 'total_reviews'],
    'name'
  );

  // Parse filters
  const filtersResult = validateParams(branchFiltersSchema, searchParams);
  const filters = filtersResult.success ? filtersResult.data : {};

  // Build query
  let query = supabase
    .from('branches')
    .select('*', { count: 'exact' })
    .eq('organization_id', context.organizationId)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + pageSize - 1);

  // Apply filters
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active === 'true');
  }
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,manager_name.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching branches:', error);
    return apiInternalError(context.requestId, 'Failed to fetch branches');
  }

  const branches = (data || []).map((row) =>
    mapBranchRow(row as Record<string, unknown>)
  );

  return apiPaginated(branches, { page, pageSize, total: count || 0 }, context.requestId);
}

// POST /api/v1/branches - Create a branch
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
  const validation = validateBody(createBranchSchema, body);
  if (!validation.success) {
    return apiValidationError(validation.errors, context.requestId);
  }

  const input = validation.data;

  // Generate slug if not provided
  const slug = input.slug || generateSlug(input.name);

  // Check if slug already exists
  const { data: existingSlug } = await supabase
    .from('branches')
    .select('id')
    .eq('organization_id', context.organizationId)
    .eq('slug', slug)
    .single();

  if (existingSlug) {
    return apiValidationError(
      [{ field: 'slug', message: 'A branch with this slug already exists' }],
      context.requestId
    );
  }

  // Validate manager_id if provided
  if (input.manager_id) {
    const { data: managerUser, error: managerError } = await supabase
      .from('users')
      .select('id')
      .eq('id', input.manager_id)
      .eq('is_active', true)
      .single();

    if (managerError || !managerUser) {
      return apiValidationError(
        [{ field: 'manager_id', message: 'Manager must be an active user' }],
        context.requestId
      );
    }
  }

  // Create branch
  const { data: branch, error: createError } = await supabase
    .from('branches')
    .insert({
      organization_id: context.organizationId,
      name: input.name,
      slug,
      address: input.address as Json,
      phone: input.phone,
      email: input.email,
      website_url: input.website_url,
      manager_id: input.manager_id,
      manager_name: input.manager_name,
      manager_email: input.manager_email,
      is_active: true,
    })
    .select('*')
    .single();

  if (createError) {
    console.error('Error creating branch:', createError);
    return apiInternalError(context.requestId, 'Failed to create branch');
  }

  return apiSuccess(
    mapBranchRow(branch as Record<string, unknown>),
    context.requestId,
    201
  );
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Export authenticated handlers
export const GET = withApiAuth(handleGet, ['branches:read']);
export const POST = withApiAuth(handlePost, ['branches:write']);
