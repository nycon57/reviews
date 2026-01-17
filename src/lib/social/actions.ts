'use server';

import { createClient, createUntypedServerClient } from '@/lib/supabase/server';
import { createUntypedAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
  getFacebookPages,
  getLinkedInPages,
  getAuthorizationUrl,
  isTokenExpired,
  postToFacebook,
  postToTwitter,
  postToLinkedIn,
  postToInstagram,
} from './client';
import {
  fillTemplatePlaceholders,
  PLATFORM_LIMITS,
} from './types';
import type {
  SocialPlatform,
  SocialConnection,
  SocialPostTemplate,
  SocialPost,
  ActionResult,
} from './types';

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
async function getValidAccessToken(connectionId: string): Promise<{
  accessToken: string;
  pageAccessToken?: string;
  platform: SocialPlatform;
} | null> {
  const adminClient = createUntypedAdminClient();

  const { data: connection, error } = await adminClient
    .from('social_connections')
    .select('platform, access_token, refresh_token, token_expires_at, page_access_token')
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
      return null; // Token expired and no refresh token
    }
  }

  return {
    accessToken,
    pageAccessToken: connection.page_access_token || undefined,
    platform,
  };
}

// Initiate OAuth flow for a social platform
export async function initiateSocialOAuth(
  platform: SocialPlatform
): Promise<ActionResult<{ url: string }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  // Create state with organization info
  const state = Buffer.from(
    JSON.stringify({
      platform,
      organizationId: context.organizationId,
      userId: context.userId,
      timestamp: Date.now(),
    })
  ).toString('base64url');

  const url = getAuthorizationUrl(platform, state);

  return { success: true, data: { url } };
}

// Handle OAuth callback
export async function handleSocialOAuthCallback(
  platform: SocialPlatform,
  code: string,
  state: string
): Promise<ActionResult<{ connectionId: string; needsPageSelection?: boolean; pages?: Array<{ id: string; name: string }> }>> {
  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { organizationId } = stateData;

    // Validate timestamp (5 minute expiry)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return { success: false, error: 'OAuth session expired' };
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(platform, code);

    // Get user info
    const userInfo = await getUserInfo(platform, tokens.accessToken);

    const adminClient = createUntypedAdminClient();

    // Check if connection already exists
    const { data: existing } = await adminClient
      .from('social_connections')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('platform', platform)
      .single();

    if (existing) {
      // Update existing connection
      await adminClient
        .from('social_connections')
        .update({
          platform_user_id: userInfo.id,
          platform_username: userInfo.username,
          platform_display_name: userInfo.displayName,
          platform_profile_url: userInfo.profileUrl,
          platform_avatar_url: userInfo.avatarUrl,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt?.toISOString(),
          token_scope: tokens.scope,
          is_active: true,
        })
        .eq('id', existing.id);

      revalidatePath('/dashboard/settings/social');
      return { success: true, data: { connectionId: existing.id } };
    }

    // For Facebook and LinkedIn, we need to get pages
    if (platform === 'facebook' || platform === 'instagram') {
      const pages = await getFacebookPages(tokens.accessToken);
      if (pages.length > 0) {
        // Store connection temporarily without page
        const { data: connection, error } = await adminClient
          .from('social_connections')
          .insert({
            organization_id: organizationId,
            platform,
            platform_user_id: userInfo.id,
            platform_username: userInfo.username,
            platform_display_name: userInfo.displayName,
            platform_profile_url: userInfo.profileUrl,
            platform_avatar_url: userInfo.avatarUrl,
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            token_expires_at: tokens.expiresAt?.toISOString(),
            token_scope: tokens.scope,
            is_active: true,
          })
          .select('id')
          .single();

        if (error || !connection) {
          return { success: false, error: 'Failed to save connection' };
        }

        // Return pages for selection
        return {
          success: true,
          data: {
            connectionId: connection.id,
            needsPageSelection: true,
            pages: pages.map((p) => ({ id: p.id, name: p.name })),
          },
        };
      }
    }

    if (platform === 'linkedin') {
      const pages = await getLinkedInPages(tokens.accessToken);
      if (pages.length > 0) {
        // Store connection temporarily without page
        const { data: connection, error } = await adminClient
          .from('social_connections')
          .insert({
            organization_id: organizationId,
            platform,
            platform_user_id: userInfo.id,
            platform_display_name: userInfo.displayName,
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
            token_expires_at: tokens.expiresAt?.toISOString(),
            token_scope: tokens.scope,
            is_active: true,
          })
          .select('id')
          .single();

        if (error || !connection) {
          return { success: false, error: 'Failed to save connection' };
        }

        // Return pages for selection
        return {
          success: true,
          data: {
            connectionId: connection.id,
            needsPageSelection: true,
            pages: pages.map((p) => ({ id: p.id, name: p.name })),
          },
        };
      }
    }

    // Create connection without page selection (Twitter)
    const { data: connection, error } = await adminClient
      .from('social_connections')
      .insert({
        organization_id: organizationId,
        platform,
        platform_user_id: userInfo.id,
        platform_username: userInfo.username,
        platform_display_name: userInfo.displayName,
        platform_profile_url: userInfo.profileUrl,
        platform_avatar_url: userInfo.avatarUrl,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt?.toISOString(),
        token_scope: tokens.scope,
        is_active: true,
      })
      .select('id')
      .single();

    if (error || !connection) {
      return { success: false, error: 'Failed to save connection' };
    }

    revalidatePath('/dashboard/settings/social');
    return { success: true, data: { connectionId: connection.id } };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return { success: false, error: 'Failed to complete authentication' };
  }
}

// Select a page for Facebook/LinkedIn connection
export async function selectSocialPage(
  connectionId: string,
  pageId: string,
  pageName: string,
  pageAccessToken?: string
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const adminClient = createUntypedAdminClient();

  const { error } = await adminClient
    .from('social_connections')
    .update({
      page_id: pageId,
      page_name: pageName,
      page_access_token: pageAccessToken,
    })
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId);

  if (error) {
    return { success: false, error: 'Failed to update connection' };
  }

  revalidatePath('/dashboard/settings/social');
  return { success: true };
}

// Get all social connections for organization
export async function getSocialConnections(): Promise<ActionResult<SocialConnection[]>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  // Use untyped client for social_connections table (not in generated types)
  const supabase = await createUntypedServerClient();

  const { data, error } = await supabase
    .from('social_connections')
    .select('*')
    .eq('organization_id', context.organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: 'Failed to fetch connections' };
  }

  const connections: SocialConnection[] = (data || []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    platform: row.platform as SocialPlatform,
    platformUserId: row.platform_user_id,
    platformUsername: row.platform_username,
    platformDisplayName: row.platform_display_name,
    platformProfileUrl: row.platform_profile_url,
    platformAvatarUrl: row.platform_avatar_url,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    tokenExpiresAt: row.token_expires_at,
    tokenScope: row.token_scope,
    pageId: row.page_id,
    pageName: row.page_name,
    pageAccessToken: row.page_access_token,
    isActive: row.is_active ?? true,
    autoPublishEnabled: row.auto_publish_enabled ?? false,
    autoPublishMinRating: row.auto_publish_min_rating ?? 5,
    lastPostAt: row.last_post_at,
    postsCount: row.posts_count ?? 0,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  }));

  return { success: true, data: connections };
}

// Disconnect a social connection
export async function disconnectSocial(connectionId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  // Use untyped client for social_connections table (not in generated types)
  const supabase = await createUntypedServerClient();

  const { error } = await supabase
    .from('social_connections')
    .update({ is_active: false })
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId);

  if (error) {
    return { success: false, error: 'Failed to disconnect' };
  }

  revalidatePath('/dashboard/settings/social');
  return { success: true };
}

// Update auto-publish settings
export async function updateAutoPublishSettings(
  connectionId: string,
  enabled: boolean,
  minRating: number = 5
): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  // Use untyped client for social_connections table (not in generated types)
  const supabase = await createUntypedServerClient();

  const { error } = await supabase
    .from('social_connections')
    .update({
      auto_publish_enabled: enabled,
      auto_publish_min_rating: minRating,
    })
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId);

  if (error) {
    return { success: false, error: 'Failed to update settings' };
  }

  revalidatePath('/dashboard/settings/social');
  return { success: true };
}

// Get post templates
export async function getSocialPostTemplates(
  platform?: SocialPlatform
): Promise<ActionResult<SocialPostTemplate[]>> {
  const context = await getUserContext();
  if (!context || !context.organization_id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Use untyped client for social_post_templates table (not in generated types)
  const supabase = await createUntypedServerClient();

  let query = supabase
    .from('social_post_templates')
    .select('*')
    .or(`is_system.eq.true,organization_id.eq.${context.organization_id}`)
    .eq('is_active', true)
    .order('is_default', { ascending: false });

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: 'Failed to fetch templates' };
  }

  const templates: SocialPostTemplate[] = (data || []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    platform: row.platform as SocialPlatform,
    name: row.name,
    description: row.description,
    isDefault: row.is_default ?? false,
    isSystem: row.is_system ?? false,
    isActive: row.is_active ?? true,
    templateText: row.template_text,
    includeImage: row.include_image ?? true,
    includeLink: row.include_link ?? true,
    linkText: row.link_text ?? 'Read more reviews',
    maxLength: row.max_length,
    defaultHashtags: row.default_hashtags || [],
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  }));

  return { success: true, data: templates };
}

// Generate post preview
export async function generatePostPreview(
  reviewId: string,
  templateId: string
): Promise<ActionResult<{ content: string; platform: SocialPlatform; characterCount: number; maxLength: number | null }>> {
  const context = await getUserContext();
  if (!context || !context.organization_id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Use untyped client for social_post_templates table (not in generated types)
  const supabase = await createUntypedServerClient();

  // Get review with loan officer info
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select(`
      *,
      loan_officers (
        full_name,
        branch
      )
    `)
    .eq('id', reviewId)
    .eq('organization_id', context.organization_id)
    .single();

  if (reviewError || !review) {
    return { success: false, error: 'Review not found' };
  }

  // Get template
  const { data: template, error: templateError } = await supabase
    .from('social_post_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    return { success: false, error: 'Template not found' };
  }

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', context.organization_id)
    .single();

  // Fill template
  const content = fillTemplatePlaceholders(template.template_text, {
    reviewerName: review.customer_name || 'Happy Customer',
    rating: review.rating,
    reviewText: review.text || '',
    loanOfficerName: review.loan_officers?.full_name ?? undefined,
    branchName: review.loan_officers?.branch ?? undefined,
    organizationName: org?.name ?? undefined,
    hashtags: template.default_hashtags || [],
    link: review.source_url || '',
  });

  return {
    success: true,
    data: {
      content,
      platform: template.platform as SocialPlatform,
      characterCount: content.length,
      maxLength: template.max_length,
    },
  };
}

// Create and publish a social post
export async function createSocialPost(params: {
  connectionId: string;
  reviewId?: string;
  testimonialId?: string;
  templateId?: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  scheduledFor?: string;
}): Promise<ActionResult<SocialPost>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const adminClient = createUntypedAdminClient();

  // Get connection
  const { data: connection, error: connError } = await adminClient
    .from('social_connections')
    .select('platform')
    .eq('id', params.connectionId)
    .eq('organization_id', context.organizationId)
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    return { success: false, error: 'Connection not found' };
  }

  // Check character limit
  const platform = connection.platform as SocialPlatform;
  const maxLength = PLATFORM_LIMITS[platform];
  if (params.content.length > maxLength) {
    return {
      success: false,
      error: `Content exceeds ${platform} character limit of ${maxLength}`,
    };
  }

  // Determine status
  const status = params.scheduledFor ? 'scheduled' : 'draft';

  // Create post record
  const { data: post, error: insertError } = await adminClient
    .from('social_posts')
    .insert({
      organization_id: context.organizationId,
      connection_id: params.connectionId,
      review_id: params.reviewId,
      testimonial_id: params.testimonialId,
      template_id: params.templateId,
      platform,
      content: params.content,
      image_url: params.imageUrl,
      link_url: params.linkUrl,
      status,
      scheduled_for: params.scheduledFor,
      created_by: context.userId,
      is_auto_generated: false,
    })
    .select('*')
    .single();

  if (insertError || !post) {
    return { success: false, error: 'Failed to create post' };
  }

  revalidatePath('/dashboard/social');

  return {
    success: true,
    data: {
      id: post.id,
      organizationId: post.organization_id,
      connectionId: post.connection_id,
      reviewId: post.review_id,
      testimonialId: post.testimonial_id,
      templateId: post.template_id,
      platform: post.platform as SocialPlatform,
      content: post.content,
      imageUrl: post.image_url,
      linkUrl: post.link_url,
      status: post.status as SocialPost['status'],
      scheduledFor: post.scheduled_for,
      publishedAt: post.published_at,
      platformPostId: post.platform_post_id,
      platformPostUrl: post.platform_post_url,
      errorMessage: post.error_message,
      retryCount: post.retry_count ?? 0,
      lastRetryAt: post.last_retry_at,
      createdBy: post.created_by,
      isAutoGenerated: post.is_auto_generated ?? false,
      createdAt: post.created_at!,
      updatedAt: post.updated_at!,
    },
  };
}

// Publish a post immediately
export async function publishSocialPost(postId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const adminClient = createUntypedAdminClient();

  // Get post
  const { data: post, error: postError } = await adminClient
    .from('social_posts')
    .select('*, social_connections!inner(*)')
    .eq('id', postId)
    .eq('organization_id', context.organizationId)
    .single();

  if (postError || !post) {
    return { success: false, error: 'Post not found' };
  }

  // Update status to publishing
  await adminClient
    .from('social_posts')
    .update({ status: 'publishing' })
    .eq('id', postId);

  try {
    // Get valid access token
    const tokens = await getValidAccessToken(post.connection_id);
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
      .eq('id', postId);

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
      post_id: postId,
      organization_id: context.organizationId,
    });

    revalidatePath('/dashboard/social');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update post with error
    await adminClient
      .from('social_posts')
      .update({
        status: 'failed',
        error_message: errorMessage,
        retry_count: (post.retry_count || 0) + 1,
        last_retry_at: new Date().toISOString(),
      })
      .eq('id', postId);

    return { success: false, error: `Failed to publish: ${errorMessage}` };
  }
}

// Get social posts for organization
export async function getSocialPosts(params?: {
  platform?: SocialPlatform;
  status?: SocialPost['status'];
  limit?: number;
  offset?: number;
}): Promise<ActionResult<{ posts: SocialPost[]; total: number }>> {
  const context = await getUserContext();
  if (!context || !context.organization_id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Use untyped client for social_posts table (not in generated types)
  const supabase = await createUntypedServerClient();

  let query = supabase
    .from('social_posts')
    .select('*', { count: 'exact' })
    .eq('organization_id', context.organization_id)
    .order('created_at', { ascending: false });

  if (params?.platform) {
    query = query.eq('platform', params.platform);
  }
  if (params?.status) {
    query = query.eq('status', params.status);
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    return { success: false, error: 'Failed to fetch posts' };
  }

  const posts: SocialPost[] = (data || []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    connectionId: row.connection_id,
    reviewId: row.review_id,
    testimonialId: row.testimonial_id,
    templateId: row.template_id,
    platform: row.platform as SocialPlatform,
    content: row.content,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    status: row.status as SocialPost['status'],
    scheduledFor: row.scheduled_for,
    publishedAt: row.published_at,
    platformPostId: row.platform_post_id,
    platformPostUrl: row.platform_post_url,
    errorMessage: row.error_message,
    retryCount: row.retry_count ?? 0,
    lastRetryAt: row.last_retry_at,
    createdBy: row.created_by,
    isAutoGenerated: row.is_auto_generated ?? false,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  }));

  return { success: true, data: { posts, total: count || 0 } };
}

// Delete a social post
export async function deleteSocialPost(postId: string): Promise<ActionResult> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  // Use untyped client for social_posts table (not in generated types)
  const supabase = await createUntypedServerClient();

  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', postId)
    .eq('organization_id', context.organizationId);

  if (error) {
    return { success: false, error: 'Failed to delete post' };
  }

  revalidatePath('/dashboard/social');
  return { success: true };
}

// Bulk queue reviews for social publishing
export async function bulkQueueReviewsForPublishing(
  reviewIds: string[],
  connectionId: string,
  scheduledFor?: string
): Promise<ActionResult<{ queued: number }>> {
  const context = await requireManagerRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Manager role required' };
  }

  const adminClient = createUntypedAdminClient();

  // Verify connection
  const { data: connection, error: connError } = await adminClient
    .from('social_connections')
    .select('id')
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId)
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    return { success: false, error: 'Connection not found' };
  }

  // Queue each review
  const queueItems = reviewIds.map((reviewId, index) => ({
    organization_id: context.organizationId,
    review_id: reviewId,
    connection_id: connectionId,
    scheduled_for: scheduledFor
      ? new Date(new Date(scheduledFor).getTime() + index * 5 * 60 * 1000).toISOString() // 5 min intervals
      : new Date(Date.now() + index * 5 * 60 * 1000).toISOString(),
    priority: reviewIds.length - index, // Higher priority for earlier items
  }));

  const { error } = await adminClient
    .from('social_publish_queue')
    .insert(queueItems);

  if (error) {
    return { success: false, error: 'Failed to queue reviews' };
  }

  revalidatePath('/dashboard/social');
  return { success: true, data: { queued: reviewIds.length } };
}
