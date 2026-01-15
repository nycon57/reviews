import { NextRequest, NextResponse } from 'next/server';
import { createUntypedAdminClient } from '@/lib/supabase/admin';
import {
  refreshAccessToken,
  getReviews,
  isTokenExpired,
} from '@/lib/apple';

// Verify cron secret (set in Vercel or your cron service)
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is set, allow in development
  if (!cronSecret && process.env.NODE_ENV === 'development') {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createUntypedAdminClient();
  const results: {
    connectionId: string;
    organizationId: string;
    status: 'success' | 'failed';
    reviewsSynced?: number;
    error?: string;
  }[] = [];

  try {
    // Get all active connections that haven't synced in last 20 hours
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();

    const { data: connections, error: fetchError } = await adminClient
      .from('apple_connections')
      .select('*')
      .eq('is_active', true)
      .or(`last_sync_at.is.null,last_sync_at.lt.${twentyHoursAgo}`);

    if (fetchError) {
      console.error('Failed to fetch Apple connections:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        message: 'No Apple connections need syncing',
        syncedConnections: 0,
      });
    }

    // Process each connection
    for (const connection of connections) {
      const connectionResult: (typeof results)[0] = {
        connectionId: connection.id,
        organizationId: connection.organization_id,
        status: 'success',
      };

      try {
        // Get valid access token
        let accessToken = connection.access_token;

        if (isTokenExpired(new Date(connection.token_expires_at))) {
          try {
            const newTokens = await refreshAccessToken(connection.refresh_token);
            accessToken = newTokens.accessToken;

            // Update tokens in database
            await adminClient
              .from('apple_connections')
              .update({
                access_token: newTokens.accessToken,
                refresh_token: newTokens.refreshToken,
                token_expires_at: newTokens.expiresAt.toISOString(),
              })
              .eq('id', connection.id);
          } catch (tokenError) {
            throw new Error(
              `Token refresh failed: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}`
            );
          }
        }

        // Create sync log
        const { data: syncLog } = await adminClient
          .from('apple_sync_logs')
          .insert({
            organization_id: connection.organization_id,
            connection_id: connection.id,
            sync_type: 'incremental',
            status: 'started',
          })
          .select('id')
          .single();

        // Update connection status
        await adminClient
          .from('apple_connections')
          .update({ sync_status: 'syncing' })
          .eq('id', connection.id);

        const startTime = Date.now();

        // Fetch reviews
        let pageToken: string | undefined;
        let totalReviews = 0;
        let created = 0;
        let updated = 0;
        let totalRating = 0;

        do {
          const response = await getReviews(accessToken, connection.location_id, pageToken);

          for (const appleReview of response.reviews) {
            // Check if review exists
            const { data: existingReview } = await adminClient
              .from('reviews')
              .select('id, updated_at')
              .eq('organization_id', connection.organization_id)
              .eq('source', 'apple_maps')
              .eq('source_review_id', appleReview.reviewId)
              .single();

            if (existingReview) {
              const appleUpdateTime = new Date(appleReview.updateTime);
              const dbUpdateTime = new Date(existingReview.updated_at!);

              if (appleUpdateTime > dbUpdateTime) {
                await adminClient
                  .from('reviews')
                  .update({
                    rating: appleReview.rating,
                    text: appleReview.comment,
                    customer_name: appleReview.reviewerName,
                    review_date: appleReview.createTime,
                    response_text: appleReview.reviewReply?.comment,
                    response_synced_at: appleReview.reviewReply?.updateTime,
                    synced_at: new Date().toISOString(),
                  })
                  .eq('id', existingReview.id);
                updated++;
              }
            } else if (connection.loan_officer_id) {
              // Only create new reviews if we have a loan officer assigned
              await adminClient.from('reviews').insert({
                organization_id: connection.organization_id,
                loan_officer_id: connection.loan_officer_id,
                source: 'apple_maps',
                source_review_id: appleReview.reviewId,
                source_url: `https://maps.apple.com/?address=${encodeURIComponent(connection.location_address || '')}`,
                rating: appleReview.rating,
                text: appleReview.comment ?? null,
                customer_name: appleReview.reviewerName ?? null,
                status: 'approved',
                approved_at: new Date().toISOString(),
                is_published: true,
                published_at: new Date().toISOString(),
                review_date: appleReview.createTime,
                response_text: appleReview.reviewReply?.comment ?? null,
                response_synced_at: appleReview.reviewReply?.updateTime ?? null,
                synced_at: new Date().toISOString(),
              });
              created++;
            } else {
              console.warn(`Skipping Apple review ${appleReview.reviewId} - no loan officer assigned to connection ${connection.id}`);
            }

            totalReviews++;
            totalRating += appleReview.rating;
          }

          pageToken = response.nextPageToken;
        } while (pageToken);

        const durationMs = Date.now() - startTime;
        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        // Update connection
        await adminClient
          .from('apple_connections')
          .update({
            sync_status: 'completed',
            last_sync_at: new Date().toISOString(),
            sync_error: null,
            reviews_count: totalReviews,
            average_rating: averageRating,
          })
          .eq('id', connection.id);

        // Update sync log
        if (syncLog) {
          await adminClient
            .from('apple_sync_logs')
            .update({
              status: 'completed',
              reviews_fetched: totalReviews,
              reviews_created: created,
              reviews_updated: updated,
              completed_at: new Date().toISOString(),
              duration_ms: durationMs,
            })
            .eq('id', syncLog.id);
        }

        connectionResult.reviewsSynced = totalReviews;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        connectionResult.status = 'failed';
        connectionResult.error = errorMessage;

        // Update connection with error
        await adminClient
          .from('apple_connections')
          .update({
            sync_status: 'failed',
            sync_error: errorMessage,
          })
          .eq('id', connection.id);
      }

      results.push(connectionResult);
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    return NextResponse.json({
      message: `Synced ${successCount} Apple connections, ${failedCount} failed`,
      totalConnections: connections.length,
      successCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error('Apple cron sync error:', error);
    return NextResponse.json(
      {
        error: 'Apple sync job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow POST for manual triggers with authentication
export async function POST(request: NextRequest) {
  return GET(request);
}
