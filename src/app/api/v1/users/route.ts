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
import { userFiltersSchema, validateParams } from '@/lib/api/validation';
import type { UserResource } from '@/lib/api/types';

// Map database row to API resource
function mapUserRow(row: Record<string, unknown>): UserResource {
  return {
    id: row.id as string,
    email: row.email as string,
    full_name: row.full_name as string | null,
    role: row.role as string,
    is_active: row.is_active as boolean,
    avatar_url: row.avatar_url as string | null,
    last_login_at: row.last_login_at as string | null,
    created_at: row.created_at as string,
  };
}

// GET /api/v1/users - List users
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
    ['created_at', 'email', 'full_name', 'role', 'last_login_at'],
    'created_at'
  );

  // Parse filters
  const filtersResult = validateParams(userFiltersSchema, searchParams);
  const filters = filtersResult.success ? filtersResult.data : {};

  // Build query
  let query = supabase
    .from('users')
    .select('id, email, full_name, role, is_active, avatar_url, last_login_at, created_at', { count: 'exact' })
    .eq('organization_id', context.organizationId)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + pageSize - 1);

  // Apply filters
  if (filters.role) {
    query = query.eq('role', filters.role);
  }
  if (filters.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active === 'true');
  }
  if (filters.search) {
    query = query.or(
      `email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return apiInternalError(context.requestId, 'Failed to fetch users');
  }

  const users = (data || []).map((row) =>
    mapUserRow(row as Record<string, unknown>)
  );

  return apiPaginated(users, { page, pageSize, total: count || 0 }, context.requestId);
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Export authenticated handlers
export const GET = withApiAuth(handleGet, ['users:read']);
