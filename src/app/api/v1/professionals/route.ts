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
import { professionalFiltersSchema, validateParams } from '@/lib/api/validation';
import type { ProfessionalResource } from '@/lib/api/types';
import { escapeLike } from '@/lib/sql/escape-like';

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

// GET /api/v1/professionals - List professionals
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
    ['created_at', 'full_name', 'email', 'average_rating', 'total_reviews'],
    'full_name'
  );

  // Parse filters
  const filtersResult = validateParams(professionalFiltersSchema, searchParams);
  const filters = filtersResult.success ? filtersResult.data : {};

  // Build query
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('organization_id', context.organizationId)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + pageSize - 1);

  // Apply filters
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active === 'true');
  }
  if (filters.branch_id) {
    query = query.eq('branch_id', filters.branch_id);
  }
  if (filters.search) {
    const escapedSearch = escapeLike(filters.search);
    query = query.or(
      `full_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching professionals:', error);
    return apiInternalError(context.requestId, 'Failed to fetch professionals');
  }

  const professionals = (data || []).map((row) =>
    mapProfessionalRow(row as Record<string, unknown>)
  );

  return apiPaginated(professionals, { page, pageSize, total: count || 0 }, context.requestId);
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Export authenticated handlers
export const GET = withApiAuth(handleGet, ['professionals:read']);
