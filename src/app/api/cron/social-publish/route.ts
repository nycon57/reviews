import { NextRequest, NextResponse } from 'next/server';
import { createUntypedAdminClient } from '@/lib/supabase/admin';
import { fillTemplatePlaceholders } from '@/lib/social/types';
import {
  postToFacebook,
  postToTwitter,
  postToLinkedIn,
  postToInstagram,
  refreshAccessToken,
  isTokenExpired,
} from '@/lib/social/client';
import type { SocialPlatform } from '@/types';

// Verify the request is from a valid cron job source
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is configured, only allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === 'development';
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// Get valid access token (refreshing if needed)
async function getValidToken(
  adminClient: ReturnType<typeof createUntypedAdminClient>,
  connectionId: string
): Promise<{
  accessToken: string;
  pageAccessToken?: string;
  platform: SocialPlatform;
} | null> {
  const { data: connection, error } = await adminClient
    .from('social_connections')
    .select('id, platform, access_token, refresh_token, token_expires_at, page_access_token')
    .eq('id', connectionId)
    .eq('is_active', true)
    .single();

  if (error || !connection) {
    return null;
  }

  const platform = connection.platform as SocialPlatform;
  let accessToken = connection.access_token;

  // Check if token is expired
  if (connection.token_expires_at && isTokenExpired(new Date(connection.token_expires_at))) {
    if (connection.refresh_token) {
      try {
        const newTokens = await refreshAccessToken(platform, connection.refresh_token);

        // Update tokens in database
        await adminClient
          .from('social_connections')
          .update({
            access_token: newTokens.accessToken,
            refresh_token: newTokens.refreshToken || connection.refresh_token,
            token_expires_at: newTokens.expiresAt?.toISOString(),
          })
          .eq('id', connectionId);

        accessToken = newTokens.accessToken;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    } else {
      return null;
    }
  }

  return {
    accessToken,
    pageAccessToken: connection.page_access_token || undefined,
    platform,
  };
}

// Process scheduled posts
async function processScheduledPosts(
  adminClient: ReturnType<typeof createUntypedAdminClient>,
  batchSize: number
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  // Get posts that are scheduled and due
  const { data: posts, error } = await adminClient
    .from('social_posts')
    .select('*, social_connections!inner(*)')
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(batchSize);

  if (error || !posts) {
    errors.push('Failed to fetch scheduled posts');
    return { processed, failed, errors };
  }

  for (const post of posts) {
    try {
      // Update status to publishing
      await adminClient
        .from('social_posts')
        .update({ status: 'publishing' })
        .eq('id', post.id);

      // Get valid access token
      const tokens = await getValidToken(adminClient, post.connection_id);
      if (!tokens) {
        throw new Error('Failed to get valid access token');
      }

      const platform = post.platform as SocialPlatform;
      let result;

      switch (platform) {
        case 'facebook':
          if (!post.social_connections.page_id || !post.social_connections.page_access_token) {
            throw new Error('Facebook page not configured');
          }
          result = await postToFacebook(
            post.social_connections.page_access_token,
            post.social_connections.page_id,
            post.content,
            post.image_url || undefined,
            post.link_url || undefined
          );
          break;

        case 'twitter':
          result = await postToTwitter(tokens.accessToken, post.content);
          break;

        case 'linkedin':
          result = await postToLinkedIn(
            tokens.accessToken,
            post.social_connections.page_id || post.social_connections.platform_user_id,
            post.content,
            !!post.social_connections.page_id
          );
          break;

        case 'instagram':
          if (!post.image_url) {
            throw new Error('Instagram posts require an image');
          }
          if (!post.social_connections.page_access_token) {
            throw new Error('Instagram not configured');
          }
          result = await postToInstagram(
            post.social_connections.page_access_token,
            post.social_connections.page_id!,
            post.content,
            post.image_url
          );
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to publish');
      }

      // Update post with success
      await adminClient
        .from('social_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: result.postId,
          platform_post_url: result.postUrl,
          error_message: null,
        })
        .eq('id', post.id);

      // Update connection stats
      await adminClient
        .from('social_connections')
        .update({
          last_post_at: new Date().toISOString(),
          posts_count: (post.social_connections.posts_count || 0) + 1,
        })
        .eq('id', post.connection_id);

      // Create analytics record
      await adminClient.from('social_post_analytics').insert({
        post_id: post.id,
        organization_id: post.organization_id,
      });

      processed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Post ${post.id}: ${errorMessage}`);

      // Update post with error
      await adminClient
        .from('social_posts')
        .update({
          status: 'failed',
          error_message: errorMessage,
          retry_count: (post.retry_count || 0) + 1,
          last_retry_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      failed++;
    }
  }

  return { processed, failed, errors };
}

// Process the publish queue (auto-generated posts from approved reviews)
async function processPublishQueue(
  adminClient: ReturnType<typeof createUntypedAdminClient>,
  batchSize: number
): Promise<{ processed: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;
  let failed = 0;

  // Get pending queue items
  const { data: queueItems, error } = await adminClient
    .from('social_publish_queue')
    .select(`
      *,
      reviews!inner(*),
      social_connections!inner(*)
    `)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('priority', { ascending: false })
    .order('scheduled_for', { ascending: true })
    .limit(batchSize);

  if (error || !queueItems) {
    errors.push('Failed to fetch queue items');
    return { processed, failed, errors };
  }

  for (const item of queueItems) {
    try {
      // Mark as processing
      await adminClient
        .from('social_publish_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);

      // Get default template for platform
      const platform = item.social_connections.platform as SocialPlatform;
      const { data: template } = await adminClient
        .from('social_post_templates')
        .select('*')
        .eq('platform', platform)
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (!template) {
        throw new Error(`No default template for ${platform}`);
      }

      // Get user and organization info
      const { data: loanOfficer } = await adminClient
        .from('users')
        .select('full_name, branch')
        .eq('id', item.reviews.user_id)
        .single();

      const { data: org } = await adminClient
        .from('organizations')
        .select('name')
        .eq('id', item.organization_id)
        .single();

      // Generate content from template
      const content = fillTemplatePlaceholders(template.template_text, {
        reviewerName: item.reviews.customer_name || 'Happy Customer',
        rating: item.reviews.rating,
        reviewText: item.reviews.text || '',
        loanOfficerName: loanOfficer?.full_name ?? undefined,
        branchName: loanOfficer?.branch ?? undefined,
        organizationName: org?.name ?? undefined,
        hashtags: template.default_hashtags || [],
        link: item.reviews.source_url || '',
      });

      // Create social post
      const { data: post, error: postError } = await adminClient
        .from('social_posts')
        .insert({
          organization_id: item.organization_id,
          connection_id: item.connection_id,
          review_id: item.review_id,
          template_id: template.id,
          platform,
          content,
          status: 'scheduled',
          scheduled_for: new Date().toISOString(),
          is_auto_generated: true,
        })
        .select('id')
        .single();

      if (postError || !post) {
        throw new Error('Failed to create post');
      }

      // Update queue item
      await adminClient
        .from('social_publish_queue')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          post_id: post.id,
        })
        .eq('id', item.id);

      processed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Queue item ${item.id}: ${errorMessage}`);

      await adminClient
        .from('social_publish_queue')
        .update({
          status: 'failed',
          processed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq('id', item.id);

      failed++;
    }
  }

  return { processed, failed, errors };
}

// POST /api/cron/social-publish
// Process both scheduled posts and the publish queue
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const batchSize = parseInt(url.searchParams.get('batch_size') || '10', 10);
    const clampedBatchSize = Math.min(Math.max(batchSize, 1), 50);

    const adminClient = createUntypedAdminClient();

    // Process scheduled posts
    const scheduledResult = await processScheduledPosts(adminClient, clampedBatchSize);

    // Process publish queue
    const queueResult = await processPublishQueue(adminClient, clampedBatchSize);

    return NextResponse.json({
      success: true,
      scheduled: {
        processed: scheduledResult.processed,
        failed: scheduledResult.failed,
      },
      queue: {
        processed: queueResult.processed,
        failed: queueResult.failed,
      },
      errors: [...scheduledResult.errors, ...queueResult.errors].slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Social publish cron error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health checks

// Vercel Cron triggers this endpoint with a GET request (carrying the
// Authorization: Bearer <CRON_SECRET> header). Delegate to POST so the job
// actually runs its work on the scheduled trigger.
export async function GET(request: NextRequest) {
  return POST(request);
}
