'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
  getAccounts,
  getLocations,
  getReviews,
  replyToReview as googleReplyToReview,
  isTokenExpired,
  getAuthorizationUrl,
} from './client';
import { STAR_RATING_MAP, type GoogleConnection, type GoogleSyncLog, type ActionResult, type GoogleLocation } from './types';
import { analyzeNewReview } from '@/lib/ai/actions';

// Get user's role and organization ID
async function getUserContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, organization_id, role')
    .eq('id', user.id)
    .single();

  return userData;
}

// Require manager or admin role
async function requireManagerRole(): Promise<{
  userId: string;
  organizationId: string;
} | null> {
  const context = await getUserContext();

  if (!context || !context.organization_id) {
    return null;
  }

  if (!['admin', 'manager'].includes(context.role)) {
    return null;
  }

  return {
    userId: context.id,
    organizationId: context.organization_id,
  };
}

// Get valid access token (refreshing if needed)
async function getValidAccessToken(connectionId: string): Promise<string | null> {
  const adminClient = createAdminClient();

  const { data: connection, error } = await adminClient
    .from('google_connections')
    .select('access_token, refresh_token, token_expires_at')
    .eq('id', connectionId)
    .eq('is_active', true)
    .single();

  if (error || !connection) {
    return null;
  }

  // Check if token is expired
  if (isTokenExpired(new Date(connection.token_expires_at))) {
    try {
      const newTokens = await refreshAccessToken(connection.refresh_token);

      // Update tokens in database
      await adminClient
        .from('google_connections')
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          token_expires_at: newTokens.expiresAt.toISOString(),
        })
        .eq('id', connectionId);

      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  return connection.access_token;
}

// Generate OAuth state and URL
export async function initiateGoogleOAuth(loanOfficerId?: string): Promise<ActionResult<{ url: string }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  // Create state with organization and loan officer info
  const state = Buffer.from(
    JSON.stringify({
      organizationId: context.organizationId,
      userId: context.userId,
      loanOfficerId: loanOfficerId || null,
      timestamp: Date.now(),
    })
  ).toString('base64url');

  const url = getAuthorizationUrl(state);

  return { success: true, data: { url } };
}

// Handle OAuth callback and create connection
export async function handleGoogleOAuthCallback(
  code: string,
  state: string
): Promise<ActionResult<{ connectionId: string }>> {
  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { organizationId, userId: _userId, loanOfficerId } = stateData;

    // Validate timestamp (5 minute expiry)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return { success: false, error: 'OAuth session expired' };
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info
    const userInfo = await getUserInfo(tokens.accessToken);

    // Get available accounts and locations
    const { accounts } = await getAccounts(tokens.accessToken);

    if (!accounts || accounts.length === 0) {
      return { success: false, error: 'No Google Business accounts found' };
    }

    // For now, we'll return success and let the user select a location
    // Store temporary tokens in the session or return them for the next step

    const adminClient = createAdminClient();

    // Get locations for first account (simplified - in production, allow user to select)
    const accountId = accounts[0].name.split('/').pop()!;
    const { locations } = await getLocations(tokens.accessToken, accountId);

    if (!locations || locations.length === 0) {
      return { success: false, error: 'No locations found for this Google Business account' };
    }

    // Create connection for first location (in production, allow user to select)
    const location = locations[0];
    const address = location.storefrontAddress
      ? [
          ...(location.storefrontAddress.addressLines || []),
          location.storefrontAddress.locality,
          location.storefrontAddress.administrativeArea,
          location.storefrontAddress.postalCode,
        ]
          .filter(Boolean)
          .join(', ')
      : null;

    const { data: connection, error } = await adminClient
      .from('google_connections')
      .insert({
        organization_id: organizationId,
        loan_officer_id: loanOfficerId || null,
        google_account_id: userInfo.id,
        google_account_email: userInfo.email,
        google_account_name: userInfo.name,
        location_id: location.locationId,
        location_name: location.title,
        location_address: address,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt.toISOString(),
        scopes: tokens.scopes,
        is_active: true,
        sync_status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create connection:', error);
      return { success: false, error: 'Failed to save Google connection' };
    }

    return { success: true, data: { connectionId: connection.id } };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { success: false, error: 'Failed to complete Google authentication' };
  }
}

// Get all connections for organization
export async function getGoogleConnections(): Promise<ActionResult<GoogleConnection[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('google_connections')
    .select('*')
    .eq('organization_id', context.organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch connections:', error);
    return { success: false, error: 'Failed to fetch Google connections' };
  }

  const connections: GoogleConnection[] = (data || []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    loanOfficerId: row.loan_officer_id,
    googleAccountId: row.google_account_id,
    googleAccountEmail: row.google_account_email,
    googleAccountName: row.google_account_name,
    locationId: row.location_id,
    locationName: row.location_name,
    locationAddress: row.location_address,
    isActive: row.is_active ?? true,
    lastSyncAt: row.last_sync_at,
    syncStatus: row.sync_status as GoogleConnection['syncStatus'],
    syncError: row.sync_error,
    reviewsCount: row.reviews_count ?? 0,
    averageRating: Number(row.average_rating) || 0,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  }));

  return { success: true, data: connections };
}

// Disconnect a Google connection
export async function disconnectGoogle(connectionId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('google_connections')
    .update({ is_active: false })
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId);

  if (error) {
    console.error('Failed to disconnect:', error);
    return { success: false, error: 'Failed to disconnect Google account' };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Sync reviews for a connection
export async function syncGoogleReviews(
  connectionId: string,
  syncType: 'full' | 'incremental' | 'manual' = 'manual'
): Promise<ActionResult<GoogleSyncLog>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const adminClient = createAdminClient();

  // Get connection
  const { data: connection, error: connError } = await adminClient
    .from('google_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId)
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    return { success: false, error: 'Connection not found' };
  }

  // Create sync log
  const { data: syncLog, error: logError } = await adminClient
    .from('google_sync_logs')
    .insert({
      organization_id: context.organizationId,
      connection_id: connectionId,
      sync_type: syncType,
      status: 'started',
    })
    .select()
    .single();

  if (logError || !syncLog) {
    return { success: false, error: 'Failed to start sync' };
  }

  // Update connection status
  await adminClient
    .from('google_connections')
    .update({ sync_status: 'syncing' })
    .eq('id', connectionId);

  const startTime = Date.now();
  let reviewsFetched = 0;
  let reviewsCreated = 0;
  let reviewsUpdated = 0;
  const errors: string[] = [];

  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(connectionId);
    if (!accessToken) {
      throw new Error('Failed to get valid access token');
    }

    // Fetch reviews from Google
    const locationName = `accounts/${connection.google_account_id}/locations/${connection.location_id}`;
    let pageToken: string | undefined;
    const allReviews: Awaited<ReturnType<typeof getReviews>>['reviews'] = [];

    do {
      const response = await getReviews(accessToken, locationName, pageToken);
      allReviews.push(...response.reviews);
      pageToken = response.nextPageToken;
      reviewsFetched = allReviews.length;
    } while (pageToken);

    // Update sync log with progress
    await adminClient
      .from('google_sync_logs')
      .update({ status: 'in_progress', reviews_fetched: reviewsFetched })
      .eq('id', syncLog.id);

    // Process each review
    for (const googleReview of allReviews) {
      try {
        const rating = STAR_RATING_MAP[googleReview.starRating];

        // Check if review already exists
        const { data: existingReview } = await adminClient
          .from('reviews')
          .select('id, updated_at')
          .eq('organization_id', context.organizationId)
          .eq('source', 'google')
          .eq('source_review_id', googleReview.reviewId)
          .single();

        if (existingReview) {
          // Update existing review if it changed
          const googleUpdateTime = new Date(googleReview.updateTime);
          const dbUpdateTime = new Date(existingReview.updated_at!);

          if (googleUpdateTime > dbUpdateTime) {
            await adminClient
              .from('reviews')
              .update({
                rating,
                text: googleReview.comment,
                customer_name: googleReview.reviewer.displayName,
                review_date: googleReview.createTime,
                response_text: googleReview.reviewReply?.comment,
                response_synced_at: googleReview.reviewReply
                  ? googleReview.reviewReply.updateTime
                  : null,
                synced_at: new Date().toISOString(),
              })
              .eq('id', existingReview.id);
            reviewsUpdated++;
          }
        } else if (connection.loan_officer_id) {
          // Create new review (only if we have a loan officer assigned)
          const { data: newReview } = await adminClient.from('reviews').insert({
            organization_id: context.organizationId,
            loan_officer_id: connection.loan_officer_id,
            source: 'google',
            source_review_id: googleReview.reviewId,
            source_url: `https://search.google.com/local/reviews?placeid=${connection.location_id}`,
            rating,
            text: googleReview.comment ?? null,
            customer_name: googleReview.reviewer.displayName,
            status: 'approved', // Google reviews are already public
            approved_at: new Date().toISOString(),
            is_published: true,
            published_at: new Date().toISOString(),
            review_date: googleReview.createTime,
            response_text: googleReview.reviewReply?.comment ?? null,
            response_synced_at: googleReview.reviewReply?.updateTime ?? null,
            synced_at: new Date().toISOString(),
          }).select('id').single();
          reviewsCreated++;

          // Trigger AI sentiment analysis for newly synced review
          if (newReview && googleReview.comment) {
            analyzeNewReview(newReview.id, googleReview.comment, rating).catch((err) =>
              console.error(`Sentiment analysis failed for review ${newReview.id}:`, err)
            );
          }
        } else {
          // Skip review - no loan officer assigned
          console.warn(`Skipping review ${googleReview.reviewId} - no loan officer assigned`);
        }
      } catch (reviewError) {
        errors.push(`Failed to process review ${googleReview.reviewId}: ${reviewError}`);
      }
    }

    // Calculate average rating
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + STAR_RATING_MAP[r.starRating], 0) /
          allReviews.length
        : 0;

    // Update connection with sync results
    await adminClient
      .from('google_connections')
      .update({
        sync_status: 'completed',
        last_sync_at: new Date().toISOString(),
        sync_error: null,
        reviews_count: allReviews.length,
        average_rating: averageRating,
      })
      .eq('id', connectionId);

    // Update sync log
    const durationMs = Date.now() - startTime;
    const { data: completedLog } = await adminClient
      .from('google_sync_logs')
      .update({
        status: 'completed',
        reviews_fetched: reviewsFetched,
        reviews_created: reviewsCreated,
        reviews_updated: reviewsUpdated,
        errors: errors.length > 0 ? errors : null,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      })
      .eq('id', syncLog.id)
      .select()
      .single();

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/reviews');

    return {
      success: true,
      data: {
        id: completedLog?.id || syncLog.id,
        organizationId: context.organizationId,
        connectionId,
        syncType,
        status: 'completed',
        reviewsFetched,
        reviewsCreated,
        reviewsUpdated,
        errors,
        startedAt: syncLog.started_at!,
        completedAt: new Date().toISOString(),
        durationMs,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    // Update connection with error
    await adminClient
      .from('google_connections')
      .update({
        sync_status: 'failed',
        sync_error: errorMessage,
      })
      .eq('id', connectionId);

    // Update sync log with error
    await adminClient
      .from('google_sync_logs')
      .update({
        status: 'failed',
        errors,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      })
      .eq('id', syncLog.id);

    return { success: false, error: `Sync failed: ${errorMessage}` };
  }
}

// Reply to a Google review
export async function replyToGoogleReview(
  reviewId: string,
  replyText: string
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const adminClient = createAdminClient();

  // Get review and connection info
  const { data: review, error: reviewError } = await adminClient
    .from('reviews')
    .select('id, source_review_id, loan_officer_id, organization_id')
    .eq('id', reviewId)
    .eq('organization_id', context.organizationId)
    .eq('source', 'google')
    .single();

  if (reviewError || !review) {
    return { success: false, error: 'Review not found' };
  }

  // Find active connection for this loan officer
  const { data: connection, error: connError } = await adminClient
    .from('google_connections')
    .select('id, google_account_id, location_id')
    .eq('organization_id', context.organizationId)
    .eq('loan_officer_id', review.loan_officer_id)
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    return { success: false, error: 'No active Google connection found' };
  }

  // Create reply record
  const { data: replyRecord, error: insertError } = await adminClient
    .from('google_review_replies')
    .insert({
      organization_id: context.organizationId,
      review_id: reviewId,
      connection_id: connection.id,
      reply_text: replyText,
      status: 'pending',
      sent_by: context.userId,
    })
    .select('id')
    .single();

  if (insertError || !replyRecord) {
    return { success: false, error: 'Failed to create reply record' };
  }

  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(connection.id);
    if (!accessToken) {
      throw new Error('Failed to get valid access token');
    }

    // Construct review name
    const reviewName = `accounts/${connection.google_account_id}/locations/${connection.location_id}/reviews/${review.source_review_id}`;

    // Send reply to Google
    const result = await googleReplyToReview(accessToken, reviewName, replyText);

    // Update reply record
    await adminClient
      .from('google_review_replies')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        google_reply_time: result.updateTime,
      })
      .eq('id', replyRecord.id);

    // Update review with response
    await adminClient
      .from('reviews')
      .update({
        response_text: replyText,
        response_at: new Date().toISOString(),
        response_by: context.userId,
        response_synced_at: result.updateTime,
      })
      .eq('id', reviewId);

    revalidatePath('/dashboard/reviews');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update reply record with error
    await adminClient
      .from('google_review_replies')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', replyRecord.id);

    return { success: false, error: `Failed to send reply: ${errorMessage}` };
  }
}

// Get sync logs for a connection
export async function getSyncLogs(
  connectionId: string,
  limit: number = 10
): Promise<ActionResult<GoogleSyncLog[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('google_sync_logs')
    .select('*')
    .eq('connection_id', connectionId)
    .eq('organization_id', context.organizationId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: 'Failed to fetch sync logs' };
  }

  const logs: GoogleSyncLog[] = (data || []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    connectionId: row.connection_id,
    syncType: row.sync_type as GoogleSyncLog['syncType'],
    status: row.status as GoogleSyncLog['status'],
    reviewsFetched: row.reviews_fetched ?? 0,
    reviewsCreated: row.reviews_created ?? 0,
    reviewsUpdated: row.reviews_updated ?? 0,
    errors: (row.errors as string[]) || [],
    startedAt: row.started_at!,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
  }));

  return { success: true, data: logs };
}

// Get available locations for OAuth callback flow
export async function getAvailableLocations(
  accessToken: string,
  accountId: string
): Promise<ActionResult<GoogleLocation[]>> {
  try {
    const { locations } = await getLocations(accessToken, accountId);
    return { success: true, data: locations };
  } catch {
    return { success: false, error: 'Failed to fetch locations' };
  }
}

// Get loan officers for dropdown
export async function getLoanOfficersForGoogle(): Promise<
  ActionResult<{ id: string; fullName: string }[]>
> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('loan_officers')
    .select('id, full_name')
    .eq('organization_id', context.organizationId)
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    return { success: false, error: 'Failed to fetch loan officers' };
  }

  return {
    success: true,
    data: (data || []).map((lo) => ({
      id: lo.id,
      fullName: lo.full_name,
    })),
  };
}
