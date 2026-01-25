import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth, type ApiAuthContext } from '@/lib/api-keys/validate';
import {
  apiSuccess,
  apiValidationError,
  apiConflict,
  apiInternalError,
  handleOptionsRequest,
} from '@/lib/api/response';
import { inviteUserSchema, validateBody } from '@/lib/api/validation';

// POST /api/v1/users/invite - Invite a new user
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
  const validation = validateBody(inviteUserSchema, body);
  if (!validation.success) {
    return apiValidationError(validation.errors, context.requestId);
  }

  const input = validation.data;

  // Check if user already exists in organization
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', input.email)
    .eq('organization_id', context.organizationId)
    .single();

  if (existingUser) {
    return apiConflict(
      'A user with this email already exists in your organization',
      context.requestId
    );
  }

  // Create a user if the role is user
  // For admin/manager roles, a full auth flow is required
  if (input.role === 'user') {
    // Check if loan officer with this email already exists
    const { data: existingLO } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', context.organizationId)
      .eq('email', input.email)
      .single();

    if (existingLO) {
      return apiConflict(
        'A loan officer with this email already exists',
        context.requestId
      );
    }

    // Build full name from first and last name
    const fullName = [input.first_name, input.last_name].filter(Boolean).join(' ') || 'Unknown';

    // Create the user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: randomUUID(),
        organization_id: context.organizationId,
        email: input.email,
        full_name: fullName,
        role: 'user',
        is_active: true,
      })
      .select('id, email, full_name, created_at')
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return apiInternalError(context.requestId, 'Failed to create user');
    }

    // TODO: Send invitation email via email service

    return apiSuccess(
      {
        id: newUser.id,
        email: newUser.email,
        role: input.role,
        status: 'active',
        created_at: newUser.created_at,
      },
      context.requestId,
      201
    );
  }

  // For admin/manager roles, require the user_invitations table (not yet implemented)
  // TODO: Add user_invitations table for proper invitation flow
  return apiInternalError(
    context.requestId,
    'User invitation for admin/manager roles is not yet implemented'
  );
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleOptionsRequest();
}

// Export authenticated handlers
export const POST = withApiAuth(handlePost, ['users:write']);
