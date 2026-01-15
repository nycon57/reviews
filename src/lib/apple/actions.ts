'use server';

import { createClient } from '@/lib/supabase/server';
import { createUntypedAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  getTeams,
  getBusinesses,
  getLocations,
  getLocation,
  updateLocation,
  getReviews,
  replyToReview as appleReplyToReview,
  getPhotos,
  uploadPhoto as appleUploadPhoto,
  getAnalytics,
  isTokenExpired,
  getAuthorizationUrl,
  formatAppleAddress,
} from './client';
import {
  type AppleConnection,
  type AppleSyncLog,
  type AppleAnalytics,
  type ActionResult,
  type AppleLocation,
  type AppleBusiness,
  type ApplePhoto,
  type ApplePlaceActionLink,
  type AppleShowcase,
} from './types';
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
  const adminClient = createUntypedAdminClient();

  const { data: connection, error } = await adminClient
    .from('apple_connections')
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
        .from('apple_connections')
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          token_expires_at: newTokens.expiresAt.toISOString(),
        })
        .eq('id', connectionId);

      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh Apple token:', error);
      return null;
    }
  }

  return connection.access_token;
}

// Generate OAuth state and URL
export async function initiateAppleOAuth(loanOfficerId?: string): Promise<ActionResult<{ url: string }>> {
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
export async function handleAppleOAuthCallback(
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

    // Get available teams
    const { teams } = await getTeams(tokens.accessToken);

    if (!teams || teams.length === 0) {
      return { success: false, error: 'No Apple Business Connect teams found' };
    }

    // Get businesses for first team
    const { businesses } = await getBusinesses(tokens.accessToken, teams[0].id);

    if (!businesses || businesses.length === 0) {
      return { success: false, error: 'No businesses found for this Apple Business account' };
    }

    // Get locations for first business
    const { locations } = await getLocations(tokens.accessToken, businesses[0].id);

    if (!locations || locations.length === 0) {
      return { success: false, error: 'No locations found for this Apple business' };
    }

    const adminClient = createUntypedAdminClient();

    // Create connection for first location
    const location = locations[0];
    const address = formatAppleAddress(location.address);

    const { data: connection, error } = await adminClient
      .from('apple_connections')
      .insert({
        organization_id: organizationId,
        loan_officer_id: loanOfficerId || null,
        apple_team_id: teams[0].id,
        apple_business_id: businesses[0].id,
        location_id: location.id,
        location_name: location.name,
        location_address: address,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt.toISOString(),
        scopes: tokens.scopes,
        is_active: true,
        sync_status: 'pending',
        place_action_links: location.placeActionLinks || [],
        showcases: location.showcases || [],
        photos: location.photos || [],
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create Apple connection:', error);
      return { success: false, error: 'Failed to save Apple connection' };
    }

    return { success: true, data: { connectionId: connection.id } };
  } catch (error) {
    console.error('Apple OAuth callback error:', error);
    return { success: false, error: 'Failed to complete Apple authentication' };
  }
}

// Get all connections for organization
export async function getAppleConnections(): Promise<ActionResult<AppleConnection[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('apple_connections')
    .select('*')
    .eq('organization_id', context.organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch Apple connections:', error);
    return { success: false, error: 'Failed to fetch Apple connections' };
  }

  const connections: AppleConnection[] = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    organizationId: row.organization_id as string,
    loanOfficerId: row.loan_officer_id as string | null,
    appleTeamId: row.apple_team_id as string,
    appleBusinessId: row.apple_business_id as string,
    locationId: row.location_id as string,
    locationName: row.location_name as string | null,
    locationAddress: row.location_address as string | null,
    isActive: (row.is_active as boolean | null) ?? true,
    lastSyncAt: row.last_sync_at as string | null,
    syncStatus: row.sync_status as AppleConnection['syncStatus'],
    syncError: row.sync_error as string | null,
    reviewsCount: (row.reviews_count as number | null) ?? 0,
    averageRating: Number(row.average_rating) || 0,
    placeActionLinks: (row.place_action_links || []) as ApplePlaceActionLink[],
    showcases: (row.showcases || []) as AppleShowcase[],
    photos: (row.photos || []) as ApplePhoto[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  return { success: true, data: connections };
}

// Disconnect an Apple connection
export async function disconnectApple(connectionId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('apple_connections')
    .update({ is_active: false })
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId);

  if (error) {
    console.error('Failed to disconnect Apple:', error);
    return { success: false, error: 'Failed to disconnect Apple account' };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Sync reviews for a connection
export async function syncAppleReviews(
  connectionId: string,
  syncType: AppleSyncLog['syncType'] = 'manual'
): Promise<ActionResult<AppleSyncLog>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const adminClient = createUntypedAdminClient();

  // Get connection
  const { data: connection, error: connError } = await adminClient
    .from('apple_connections')
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
    .from('apple_sync_logs')
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
    .from('apple_connections')
    .update({ sync_status: 'syncing' })
    .eq('id', connectionId);

  const startTime = Date.now();
  let reviewsFetched = 0;
  let reviewsCreated = 0;
  let reviewsUpdated = 0;
  let photosSynced = 0;
  let businessInfoUpdated = false;
  const errors: string[] = [];

  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(connectionId);
    if (!accessToken) {
      throw new Error('Failed to get valid access token');
    }

    // Fetch reviews from Apple
    let pageToken: string | undefined;
    const allReviews: Awaited<ReturnType<typeof getReviews>>['reviews'] = [];

    do {
      const response = await getReviews(accessToken, connection.location_id, pageToken);
      allReviews.push(...response.reviews);
      pageToken = response.nextPageToken;
      reviewsFetched = allReviews.length;
    } while (pageToken);

    // Update sync log with progress
    await adminClient
      .from('apple_sync_logs')
      .update({ status: 'in_progress', reviews_fetched: reviewsFetched })
      .eq('id', syncLog.id);

    // Process each review
    for (const appleReview of allReviews) {
      try {
        const rating = appleReview.rating;

        // Check if review already exists
        const { data: existingReview } = await adminClient
          .from('reviews')
          .select('id, updated_at')
          .eq('organization_id', context.organizationId)
          .eq('source', 'apple_maps')
          .eq('source_review_id', appleReview.reviewId)
          .single();

        if (existingReview) {
          // Update existing review if it changed
          const appleUpdateTime = new Date(appleReview.updateTime);
          const dbUpdateTime = new Date(existingReview.updated_at!);

          if (appleUpdateTime > dbUpdateTime) {
            await adminClient
              .from('reviews')
              .update({
                rating,
                title: appleReview.title,
                text: appleReview.comment,
                customer_name: appleReview.reviewerName,
                review_date: appleReview.createTime,
                response_text: appleReview.reviewReply?.comment,
                response_synced_at: appleReview.reviewReply
                  ? appleReview.reviewReply.updateTime
                  : null,
                synced_at: new Date().toISOString(),
              })
              .eq('id', existingReview.id);
            reviewsUpdated++;
          }
        } else if (connection.loan_officer_id) {
          // Create new review (only if we have a loan officer assigned)
          const { data: newReview } = await adminClient
            .from('reviews')
            .insert({
              organization_id: context.organizationId,
              loan_officer_id: connection.loan_officer_id,
              source: 'apple_maps',
              source_review_id: appleReview.reviewId,
              source_url: `https://maps.apple.com/?auid=${connection.location_id}`,
              rating,
              title: appleReview.title ?? null,
              text: appleReview.comment ?? null,
              customer_name: appleReview.reviewerName,
              status: 'approved', // Apple reviews are already public
              approved_at: new Date().toISOString(),
              is_published: true,
              published_at: new Date().toISOString(),
              review_date: appleReview.createTime,
              response_text: appleReview.reviewReply?.comment ?? null,
              response_synced_at: appleReview.reviewReply?.updateTime ?? null,
              synced_at: new Date().toISOString(),
            })
            .select('id')
            .single();
          reviewsCreated++;

          // Trigger AI sentiment analysis for newly synced review
          if (newReview && appleReview.comment) {
            analyzeNewReview(newReview.id, appleReview.comment, rating).catch((err) =>
              console.error(`Sentiment analysis failed for review ${newReview.id}:`, err)
            );
          }
        } else {
          // Skip review - no loan officer assigned
          console.warn(`Skipping Apple review ${appleReview.reviewId} - no loan officer assigned`);
        }
      } catch (reviewError) {
        errors.push(`Failed to process review ${appleReview.reviewId}: ${reviewError}`);
      }
    }

    // Also sync photos and location info if doing a full sync
    if (syncType === 'full' || syncType === 'photos') {
      try {
        const { photos } = await getPhotos(accessToken, connection.location_id);
        photosSynced = photos.length;

        await adminClient
          .from('apple_connections')
          .update({ photos })
          .eq('id', connectionId);
      } catch (photoError) {
        errors.push(`Failed to sync photos: ${photoError}`);
      }
    }

    if (syncType === 'full' || syncType === 'business_info') {
      try {
        const location = await getLocation(accessToken, connection.location_id);
        await adminClient
          .from('apple_connections')
          .update({
            location_name: location.name,
            location_address: formatAppleAddress(location.address),
            place_action_links: location.placeActionLinks || [],
            showcases: location.showcases || [],
          })
          .eq('id', connectionId);
        businessInfoUpdated = true;
      } catch (infoError) {
        errors.push(`Failed to sync business info: ${infoError}`);
      }
    }

    // Calculate average rating
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

    // Update connection with sync results
    await adminClient
      .from('apple_connections')
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
      .from('apple_sync_logs')
      .update({
        status: 'completed',
        reviews_fetched: reviewsFetched,
        reviews_created: reviewsCreated,
        reviews_updated: reviewsUpdated,
        photos_synced: photosSynced,
        business_info_updated: businessInfoUpdated,
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
        photosSynced,
        businessInfoUpdated,
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
      .from('apple_connections')
      .update({
        sync_status: 'failed',
        sync_error: errorMessage,
      })
      .eq('id', connectionId);

    // Update sync log with error
    await adminClient
      .from('apple_sync_logs')
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

// Reply to an Apple review
export async function replyToAppleReview(
  reviewId: string,
  replyText: string
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const adminClient = createUntypedAdminClient();

  // Get review and connection info
  const { data: review, error: reviewError } = await adminClient
    .from('reviews')
    .select('id, source_review_id, loan_officer_id, organization_id')
    .eq('id', reviewId)
    .eq('organization_id', context.organizationId)
    .eq('source', 'apple_maps')
    .single();

  if (reviewError || !review) {
    return { success: false, error: 'Review not found' };
  }

  // Find active connection for this loan officer
  const { data: connection, error: connError } = await adminClient
    .from('apple_connections')
    .select('id, apple_team_id, apple_business_id, location_id')
    .eq('organization_id', context.organizationId)
    .eq('loan_officer_id', review.loan_officer_id)
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    return { success: false, error: 'No active Apple connection found' };
  }

  // Create reply record
  const { data: replyRecord, error: insertError } = await adminClient
    .from('apple_review_replies')
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

    // Send reply to Apple
    const result = await appleReplyToReview(accessToken, review.source_review_id, replyText);

    // Update reply record
    await adminClient
      .from('apple_review_replies')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        apple_reply_time: result.updateTime,
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
      .from('apple_review_replies')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', replyRecord.id);

    return { success: false, error: `Failed to send reply: ${errorMessage}` };
  }
}

// Sync business info to Apple Maps
export async function syncBusinessInfoToApple(
  connectionId: string,
  updates: {
    name?: string;
    description?: string;
    phoneNumber?: string;
    websiteUrl?: string;
    categories?: string[];
  }
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  try {
    const accessToken = await getValidAccessToken(connectionId);
    if (!accessToken) {
      return { success: false, error: 'Failed to get valid access token' };
    }

    const adminClient = createUntypedAdminClient();

    // Get the connection
    const { data: connection } = await adminClient
      .from('apple_connections')
      .select('location_id')
      .eq('id', connectionId)
      .eq('organization_id', context.organizationId)
      .single();

    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    // Update location on Apple
    const updatedLocation = await updateLocation(accessToken, connection.location_id, updates);

    // Update local connection
    await adminClient
      .from('apple_connections')
      .update({
        location_name: updatedLocation.name,
        location_address: formatAppleAddress(updatedLocation.address),
      })
      .eq('id', connectionId);

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to sync business info: ${errorMessage}` };
  }
}

// Upload photo to Apple Maps
export async function uploadPhotoToApple(
  connectionId: string,
  photo: { url: string; type: ApplePhoto['type']; caption?: string }
): Promise<ActionResult<ApplePhoto>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  try {
    const accessToken = await getValidAccessToken(connectionId);
    if (!accessToken) {
      return { success: false, error: 'Failed to get valid access token' };
    }

    const adminClient = createUntypedAdminClient();

    // Get the connection
    const { data: connection } = await adminClient
      .from('apple_connections')
      .select('location_id, photos')
      .eq('id', connectionId)
      .eq('organization_id', context.organizationId)
      .single();

    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    // Upload photo to Apple
    const uploadedPhoto = await appleUploadPhoto(accessToken, connection.location_id, photo);

    // Update local connection with new photo
    const updatedPhotos = [...(connection.photos || []), uploadedPhoto];
    await adminClient
      .from('apple_connections')
      .update({ photos: updatedPhotos })
      .eq('id', connectionId);

    revalidatePath('/dashboard/settings');
    return { success: true, data: uploadedPhoto };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to upload photo: ${errorMessage}` };
  }
}

// Get Apple-specific analytics
export async function getAppleAnalytics(
  connectionId: string,
  startDate: string,
  endDate: string
): Promise<ActionResult<AppleAnalytics[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const supabase = await createClient();

  // First check local cache
  const { data: cachedAnalytics } = await supabase
    .from('apple_analytics')
    .select('*')
    .eq('connection_id', connectionId)
    .eq('organization_id', context.organizationId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (cachedAnalytics && cachedAnalytics.length > 0) {
    const analytics: AppleAnalytics[] = cachedAnalytics.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      connectionId: row.connection_id,
      date: row.date,
      impressions: row.impressions || 0,
      actions: row.actions || 0,
      directionRequests: row.direction_requests || 0,
      websiteClicks: row.website_clicks || 0,
      phoneCalls: row.phone_calls || 0,
      newReviews: row.new_reviews || 0,
      reviewResponses: row.review_responses || 0,
      averageRating: row.average_rating,
      photoViews: row.photo_views || 0,
    }));

    return { success: true, data: analytics };
  }

  // Fetch from Apple API if not cached
  try {
    const accessToken = await getValidAccessToken(connectionId);
    if (!accessToken) {
      return { success: false, error: 'Failed to get valid access token' };
    }

    const adminClient = createUntypedAdminClient();

    // Get the connection
    const { data: connection } = await adminClient
      .from('apple_connections')
      .select('location_id')
      .eq('id', connectionId)
      .eq('organization_id', context.organizationId)
      .single();

    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    const { analytics: fetchedAnalytics } = await getAnalytics(
      accessToken,
      connection.location_id,
      startDate,
      endDate
    );

    // Cache analytics in database
    const analyticsToInsert = fetchedAnalytics.map((a) => ({
      organization_id: context.organizationId,
      connection_id: connectionId,
      date: a.date,
      impressions: a.impressions,
      actions: a.actions,
      direction_requests: a.directionRequests,
      website_clicks: a.websiteClicks,
      phone_calls: a.phoneCalls,
      new_reviews: a.newReviews,
      review_responses: a.reviewResponses,
      average_rating: a.averageRating,
      photo_views: a.photoViews,
    }));

    if (analyticsToInsert.length > 0) {
      await adminClient.from('apple_analytics').upsert(analyticsToInsert, {
        onConflict: 'connection_id,date',
      });
    }

    const analytics: AppleAnalytics[] = fetchedAnalytics.map((a, i) => ({
      id: `temp-${i}`,
      organizationId: context.organizationId,
      connectionId,
      ...a,
    }));

    return { success: true, data: analytics };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to fetch analytics: ${errorMessage}` };
  }
}

// Get sync logs for a connection
export async function getAppleSyncLogs(
  connectionId: string,
  limit: number = 10
): Promise<ActionResult<AppleSyncLog[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('apple_sync_logs')
    .select('*')
    .eq('connection_id', connectionId)
    .eq('organization_id', context.organizationId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: 'Failed to fetch sync logs' };
  }

  const logs: AppleSyncLog[] = (data || []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    connectionId: row.connection_id,
    syncType: row.sync_type as AppleSyncLog['syncType'],
    status: row.status as AppleSyncLog['status'],
    reviewsFetched: row.reviews_fetched ?? 0,
    reviewsCreated: row.reviews_created ?? 0,
    reviewsUpdated: row.reviews_updated ?? 0,
    photosSynced: row.photos_synced ?? 0,
    businessInfoUpdated: row.business_info_updated ?? false,
    errors: (row.errors as string[]) || [],
    startedAt: row.started_at!,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
  }));

  return { success: true, data: logs };
}

// Get available businesses for OAuth callback flow
export async function getAvailableBusinesses(
  accessToken: string,
  teamId: string
): Promise<ActionResult<AppleBusiness[]>> {
  try {
    const { businesses } = await getBusinesses(accessToken, teamId);
    return { success: true, data: businesses };
  } catch {
    return { success: false, error: 'Failed to fetch businesses' };
  }
}

// Get available locations for OAuth callback flow
export async function getAvailableLocations(
  accessToken: string,
  businessId: string
): Promise<ActionResult<AppleLocation[]>> {
  try {
    const { locations } = await getLocations(accessToken, businessId);
    return { success: true, data: locations };
  } catch {
    return { success: false, error: 'Failed to fetch locations' };
  }
}

// Get loan officers for dropdown
export async function getLoanOfficersForApple(): Promise<
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
