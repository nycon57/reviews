import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  refreshAccessToken,
  getReviews,
  isTokenExpired,
  STAR_RATING_MAP,
} from '@/lib/google';

// Concurrency limit for parallel connection processing
const CONCURRENCY_LIMIT = 5;

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

// Process connections in batches for controlled parallelism
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminClient = createAdminClient();
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
      .from('google_connections')
      .select('*')
      .eq('is_active', true)
      .or(`last_sync_at.is.null,last_sync_at.lt.${twentyHoursAgo}`);

    if (fetchError) {
      console.error('Failed to fetch connections:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch connections' },
        { status: 500 }
      );
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        message: 'No connections need syncing',
        syncedConnections: 0,
      });
    }

    // Process single connection - extracted for parallel processing
    async function processConnection(connection: NonNullable<typeof connections>[0]) {
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
              .from('google_connections')
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

        // Create sync log and update connection status in parallel
        const [syncLogResult] = await Promise.all([
          adminClient
            .from('google_sync_logs')
            .insert({
              organization_id: connection.organization_id,
              connection_id: connection.id,
              sync_type: 'incremental',
              status: 'started',
            })
            .select('id')
            .single(),
          adminClient
            .from('google_connections')
            .update({ sync_status: 'syncing' })
            .eq('id', connection.id),
        ]);

        const syncLog = syncLogResult.data;
        const startTime = Date.now();

        // Fetch reviews
        const locationName = `accounts/${connection.google_account_id}/locations/${connection.location_id}`;
        let pageToken: string | undefined;
        let totalReviews = 0;
        let created = 0;
        let updated = 0;

        do {
          const response = await getReviews(accessToken, locationName, pageToken);

          // Batch check existing reviews for this page
          const reviewIds = response.reviews.map(r => r.reviewId);
          const { data: existingReviews } = await adminClient
            .from('reviews')
            .select('id, updated_at, source_review_id')
            .eq('organization_id', connection.organization_id)
            .eq('source', 'google')
            .in('source_review_id', reviewIds);

          const existingMap = new Map(
            existingReviews?.map(r => [r.source_review_id, r]) || []
          );

          // Prepare batch operations
          const updates: PromiseLike<unknown>[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const inserts: Record<string, unknown>[] = [];

          for (const googleReview of response.reviews) {
            const rating = STAR_RATING_MAP[googleReview.starRating];
            const existingReview = existingMap.get(googleReview.reviewId);

            if (existingReview) {
              const googleUpdateTime = new Date(googleReview.updateTime);
              const dbUpdateTime = new Date(existingReview.updated_at!);

              if (googleUpdateTime > dbUpdateTime) {
                updates.push(
                  adminClient
                    .from('reviews')
                    .update({
                      rating,
                      text: googleReview.comment,
                      customer_name: googleReview.reviewer.displayName,
                      review_date: googleReview.createTime,
                      response_text: googleReview.reviewReply?.comment,
                      response_synced_at: googleReview.reviewReply?.updateTime,
                      synced_at: new Date().toISOString(),
                    })
                    .eq('id', existingReview.id)
                    .then(() => {})
                );
                updated++;
              }
            } else if (connection.loan_officer_id) {
              // Only create new reviews if we have a loan officer assigned
              inserts.push({
                organization_id: connection.organization_id,
                loan_officer_id: connection.loan_officer_id,
                source: 'google',
                source_review_id: googleReview.reviewId,
                source_url: `https://search.google.com/local/reviews?placeid=${connection.location_id}`,
                rating,
                text: googleReview.comment ?? null,
                customer_name: googleReview.reviewer.displayName,
                status: 'approved',
                approved_at: new Date().toISOString(),
                is_published: true,
                published_at: new Date().toISOString(),
                review_date: googleReview.createTime,
                response_text: googleReview.reviewReply?.comment ?? null,
                response_synced_at: googleReview.reviewReply?.updateTime ?? null,
                synced_at: new Date().toISOString(),
              });
              created++;
            } else {
              console.warn(`Skipping review ${googleReview.reviewId} - no loan officer assigned to connection ${connection.id}`);
            }

            totalReviews++;
          }

          // Execute batch operations in parallel
          await Promise.all([
            ...updates,
            inserts.length > 0 ? adminClient.from('reviews').insert(inserts as any) : Promise.resolve(),
          ]);

          pageToken = response.nextPageToken;
        } while (pageToken);

        const durationMs = Date.now() - startTime;

        // Update connection and sync log in parallel
        await Promise.all([
          adminClient
            .from('google_connections')
            .update({
              sync_status: 'completed',
              last_sync_at: new Date().toISOString(),
              sync_error: null,
              reviews_count: totalReviews,
            })
            .eq('id', connection.id),
          syncLog
            ? adminClient
                .from('google_sync_logs')
                .update({
                  status: 'completed',
                  reviews_fetched: totalReviews,
                  reviews_created: created,
                  reviews_updated: updated,
                  completed_at: new Date().toISOString(),
                  duration_ms: durationMs,
                })
                .eq('id', syncLog.id)
            : Promise.resolve(),
        ]);

        connectionResult.reviewsSynced = totalReviews;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        connectionResult.status = 'failed';
        connectionResult.error = errorMessage;

        // Update connection with error
        await adminClient
          .from('google_connections')
          .update({
            sync_status: 'failed',
            sync_error: errorMessage,
          })
          .eq('id', connection.id);
      }

      return connectionResult;
    }

    // Process connections in parallel batches
    const batchResults = await processBatch(
      connections,
      processConnection,
      CONCURRENCY_LIMIT
    );
    results.push(...batchResults);

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    return NextResponse.json({
      message: `Synced ${successCount} connections, ${failedCount} failed`,
      totalConnections: connections.length,
      successCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error('Cron sync error:', error);
    return NextResponse.json(
      {
        error: 'Sync job failed',
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
