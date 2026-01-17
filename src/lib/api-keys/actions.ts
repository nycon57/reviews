'use server';

/**
 * API Key Server Actions
 * CRUD operations for managing API keys
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateApiKey } from './generate';
import {
  type ApiKey,
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
  type CreateApiKeyResult,
  type ApiKeyFilters,
  type ApiKeyStats,
  type ActionResult,
  API_KEY_SCOPES,
  type ApiKeyScope,
} from './types';

// Zod schemas for validation
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  scopes: z
    .array(z.enum(API_KEY_SCOPES as readonly [string, ...string[]]))
    .min(1, 'At least one scope is required'),
  environment: z.enum(['live', 'test']).default('live'),
  rateLimit: z.number().int().min(1).max(100000).optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  scopes: z
    .array(z.enum(API_KEY_SCOPES as readonly [string, ...string[]]))
    .min(1)
    .optional(),
  rateLimit: z.number().int().min(1).max(100000).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

// Database row type
interface ApiKeyRow {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  description: string | null;
  scopes: string[] | null;
  permissions: string[] | null;
  environment: string | null;
  rate_limit: number | null;
  is_active: boolean | null;
  last_used_at: string | null;
  expires_at: string | null;
  request_count: number | null;
  created_by: string | null;
  created_at: string | null;
  rotated_from: string | null;
  rotated_at: string | null;
}

// Map database row to ApiKey type
function mapRowToApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    description: row.description,
    scopes: (row.scopes || row.permissions || ['read']) as ApiKeyScope[],
    environment: (row.environment || 'live') as 'live' | 'test',
    rateLimit: row.rate_limit || 1000,
    isActive: row.is_active ?? true,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    requestCount: row.request_count || 0,
    createdBy: row.created_by,
    createdAt: row.created_at || new Date().toISOString(),
    rotatedFrom: row.rotated_from,
    rotatedAt: row.rotated_at,
  };
}

// Common admin authorization check
async function requireAdminAccess(): Promise<
  | { success: true; organizationId: string; userId: string }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.organization_id) {
    return { success: false, error: 'Organization not found' };
  }

  if (userData.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  return { success: true, organizationId: userData.organization_id, userId: user.id };
}

/**
 * Get all API keys for the current organization
 */
export async function getApiKeys(
  filters?: ApiKeyFilters
): Promise<ActionResult<ApiKey[]>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    let query = supabase
      .from('api_keys')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false });

    if (filters?.environment) {
      query = query.eq('environment', filters.environment);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const apiKeys = (data || []).map((row) =>
      mapRowToApiKey(row as unknown as ApiKeyRow)
    );

    return { success: true, data: apiKeys };
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return { success: false, error: 'Failed to fetch API keys' };
  }
}

/**
 * Get a single API key by ID
 */
export async function getApiKey(id: string): Promise<ActionResult<ApiKey>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error) {
      return { success: false, error: 'API key not found' };
    }

    return {
      success: true,
      data: mapRowToApiKey(data as unknown as ApiKeyRow),
    };
  } catch (error) {
    console.error('Error fetching API key:', error);
    return { success: false, error: 'Failed to fetch API key' };
  }
}

/**
 * Create a new API key
 * Returns the raw key only once - it cannot be retrieved again
 */
export async function createApiKey(
  input: CreateApiKeyInput
): Promise<ActionResult<CreateApiKeyResult>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Validate input
    const validated = createApiKeySchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid input',
      };
    }

    const { name, description, scopes, environment, rateLimit, expiresAt } =
      validated.data;

    // Generate the key
    const { rawKey, keyHash, keyPrefix } = generateApiKey(
      environment as 'live' | 'test'
    );

    // Insert into database using admin client to bypass RLS for insert
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from('api_keys')
      .insert({
        organization_id: auth.organizationId,
        name,
        description,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: scopes,
        permissions: scopes, // Backward compatibility
        environment,
        rate_limit: rateLimit || 1000,
        is_active: true,
        expires_at: expiresAt || null,
        created_by: auth.userId,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return { success: false, error: 'Failed to create API key' };
    }

    revalidatePath('/dashboard/settings/api-keys');

    return {
      success: true,
      data: {
        apiKey: mapRowToApiKey(data as unknown as ApiKeyRow),
        rawKey, // Only returned on creation!
      },
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    return { success: false, error: 'Failed to create API key' };
  }
}

/**
 * Update an existing API key
 */
export async function updateApiKey(
  id: string,
  input: UpdateApiKeyInput
): Promise<ActionResult<ApiKey>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    // Validate input
    const validated = updateApiKeySchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid input',
      };
    }

    const updateData: Record<string, unknown> = {};

    if (validated.data.name !== undefined) {
      updateData.name = validated.data.name;
    }
    if (validated.data.description !== undefined) {
      updateData.description = validated.data.description;
    }
    if (validated.data.scopes !== undefined) {
      updateData.scopes = validated.data.scopes;
      updateData.permissions = validated.data.scopes; // Backward compatibility
    }
    if (validated.data.rateLimit !== undefined) {
      updateData.rate_limit = validated.data.rateLimit;
    }
    if (validated.data.isActive !== undefined) {
      updateData.is_active = validated.data.isActive;
    }
    if (validated.data.expiresAt !== undefined) {
      updateData.expires_at = validated.data.expiresAt;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: 'Failed to update API key' };
    }

    revalidatePath('/dashboard/settings/api-keys');

    return {
      success: true,
      data: mapRowToApiKey(data as unknown as ApiKeyRow),
    };
  } catch (error) {
    console.error('Error updating API key:', error);
    return { success: false, error: 'Failed to update API key' };
  }
}

/**
 * Delete (revoke) an API key
 */
export async function deleteApiKey(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('organization_id', auth.organizationId);

    if (error) {
      return { success: false, error: 'Failed to delete API key' };
    }

    revalidatePath('/dashboard/settings/api-keys');

    return { success: true };
  } catch (error) {
    console.error('Error deleting API key:', error);
    return { success: false, error: 'Failed to delete API key' };
  }
}

/**
 * Rotate an API key (create new one, mark old as inactive)
 */
export async function rotateApiKey(
  id: string
): Promise<ActionResult<CreateApiKeyResult>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    // Get existing key
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (fetchError || !existingKey) {
      return { success: false, error: 'API key not found' };
    }

    const existing = existingKey as unknown as ApiKeyRow;

    // Generate new key with same environment
    const environment = (existing.environment || 'live') as 'live' | 'test';
    const { rawKey, keyHash, keyPrefix } = generateApiKey(environment);

    // Use admin client for transaction
    const adminSupabase = createAdminClient();

    // Create new key with reference to old one
    const { data: newKey, error: createError } = await adminSupabase
      .from('api_keys')
      .insert({
        organization_id: auth.organizationId,
        name: `${existing.name} (rotated)`,
        description: existing.description,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scopes: existing.scopes || existing.permissions,
        permissions: existing.scopes || existing.permissions,
        environment,
        rate_limit: existing.rate_limit,
        is_active: true,
        expires_at: existing.expires_at,
        created_by: auth.userId,
        rotated_from: id,
        rotated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (createError) {
      console.error('Error creating rotated key:', createError);
      return { success: false, error: 'Failed to rotate API key' };
    }

    // Deactivate old key
    await adminSupabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id);

    revalidatePath('/dashboard/settings/api-keys');

    return {
      success: true,
      data: {
        apiKey: mapRowToApiKey(newKey as unknown as ApiKeyRow),
        rawKey,
      },
    };
  } catch (error) {
    console.error('Error rotating API key:', error);
    return { success: false, error: 'Failed to rotate API key' };
  }
}

/**
 * Get API key usage statistics
 */
export async function getApiKeyStats(
  apiKeyId: string,
  startDate?: string,
  endDate?: string
): Promise<ActionResult<ApiKeyStats>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    // Verify key belongs to organization
    const { data: apiKey, error: keyError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', apiKeyId)
      .eq('organization_id', auth.organizationId)
      .single();

    if (keyError || !apiKey) {
      return { success: false, error: 'API key not found' };
    }

    // Query usage logs
    let query = supabase
      .from('api_key_usage_logs')
      .select('endpoint, method, status_code, response_time_ms, created_at')
      .eq('api_key_id', apiKeyId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      return { success: false, error: logsError.message };
    }

    // Calculate statistics
    const stats: ApiKeyStats = {
      totalRequests: logs?.length || 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTimeMs: 0,
      requestsByEndpoint: {},
      requestsByDay: [],
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;
    const dailyCounts: Record<string, number> = {};

    for (const log of logs || []) {
      // Count success/failure
      if (log.status_code && log.status_code >= 200 && log.status_code < 400) {
        stats.successfulRequests++;
      } else {
        stats.failedRequests++;
      }

      // Response time
      if (log.response_time_ms) {
        totalResponseTime += log.response_time_ms;
        responseTimeCount++;
      }

      // By endpoint
      if (log.endpoint) {
        stats.requestsByEndpoint[log.endpoint] =
          (stats.requestsByEndpoint[log.endpoint] || 0) + 1;
      }

      // By day
      if (log.created_at) {
        const day = log.created_at.split('T')[0];
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }
    }

    if (responseTimeCount > 0) {
      stats.averageResponseTimeMs = Math.round(
        totalResponseTime / responseTimeCount
      );
    }

    stats.requestsByDay = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching API key stats:', error);
    return { success: false, error: 'Failed to fetch API key statistics' };
  }
}

/**
 * Check if organization has any active API keys
 */
export async function hasActiveApiKeys(): Promise<ActionResult<boolean>> {
  try {
    const auth = await requireAdminAccess();
    if (!auth.success) {
      return { success: false, error: auth.error };
    }

    const supabase = await createClient();

    const { count, error } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (count || 0) > 0 };
  } catch (error) {
    console.error('Error checking active API keys:', error);
    return { success: false, error: 'Failed to check API keys' };
  }
}
