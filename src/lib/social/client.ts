// Social Media API Clients

import { createHash, randomBytes } from "crypto";
import type {
  SocialPlatform,
  SocialOAuthTokens,
  PlatformUserInfo,
  FacebookPage,
  LinkedInPage,
  PostResult,
  PlatformAnalytics,
} from "./types";
import { PLATFORM_AUTH_URLS, PLATFORM_TOKEN_URLS, PLATFORM_SCOPES } from "./types";

// Get base URL for OAuth redirects
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// Get redirect URI for a platform
export function getRedirectUri(platform: SocialPlatform): string {
  return `${getBaseUrl()}/api/auth/social/${platform}/callback`;
}

export interface TwitterPkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

export function createTwitterPkcePair(): TwitterPkcePair {
  const codeVerifier = randomBytes(64).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  return { codeVerifier, codeChallenge };
}

// Generate OAuth authorization URL
export function getAuthorizationUrl(
  platform: SocialPlatform,
  state: string,
  options?: { codeChallenge?: string }
): string {
  const params = new URLSearchParams();
  const redirectUri = getRedirectUri(platform);

  switch (platform) {
    case "facebook":
    case "instagram": {
      const clientId = process.env.FACEBOOK_APP_ID!;
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("state", state);
      params.set("scope", PLATFORM_SCOPES.facebook.join(","));
      params.set("response_type", "code");
      return `${PLATFORM_AUTH_URLS.facebook}?${params.toString()}`;
    }

    case "twitter": {
      const clientId = process.env.TWITTER_CLIENT_ID!;
      if (!options?.codeChallenge) {
        throw new Error("Twitter OAuth requires a PKCE code challenge");
      }
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("state", state);
      params.set("scope", PLATFORM_SCOPES.twitter.join(" "));
      params.set("response_type", "code");
      params.set("code_challenge", options.codeChallenge);
      params.set("code_challenge_method", "S256");
      return `${PLATFORM_AUTH_URLS.twitter}?${params.toString()}`;
    }

    case "linkedin": {
      const clientId = process.env.LINKEDIN_CLIENT_ID!;
      params.set("client_id", clientId);
      params.set("redirect_uri", redirectUri);
      params.set("state", state);
      params.set("scope", PLATFORM_SCOPES.linkedin.join(" "));
      params.set("response_type", "code");
      return `${PLATFORM_AUTH_URLS.linkedin}?${params.toString()}`;
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  platform: SocialPlatform,
  code: string,
  codeVerifier?: string
): Promise<SocialOAuthTokens> {
  const redirectUri = getRedirectUri(platform);
  const tokenUrl = PLATFORM_TOKEN_URLS[platform];

  let body: URLSearchParams | FormData;
  const headers: Record<string, string> = {};

  switch (platform) {
    case "facebook":
    case "instagram": {
      body = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: redirectUri,
        code,
      });
      break;
    }

    case "twitter": {
      if (!codeVerifier) {
        throw new Error("Twitter OAuth requires a PKCE code verifier");
      }
      body = new URLSearchParams({
        client_id: process.env.TWITTER_CLIENT_ID!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier,
      });
      headers["Content-Type"] = "application/x-www-form-urlencoded";

      // Twitter uses Basic auth with client credentials
      const credentials = Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
      break;
    }

    case "linkedin": {
      body = new URLSearchParams({
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
      });
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      break;
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    scope: data.scope,
  };
}

// Refresh access token
export async function refreshAccessToken(
  platform: SocialPlatform,
  refreshToken: string
): Promise<SocialOAuthTokens> {
  const tokenUrl = PLATFORM_TOKEN_URLS[platform];
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  let body: URLSearchParams;

  switch (platform) {
    case "facebook":
    case "instagram": {
      body = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        fb_exchange_token: refreshToken,
      });
      break;
    }

    case "twitter": {
      const credentials = Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
      body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });
      break;
    }

    case "linkedin": {
      body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        refresh_token: refreshToken,
      });
      break;
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
  };
}

// Get user info from platform
export async function getUserInfo(
  platform: SocialPlatform,
  accessToken: string
): Promise<PlatformUserInfo> {
  switch (platform) {
    case "facebook":
    case "instagram": {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,name,picture&access_token=${accessToken}`
      );
      const data = await response.json();
      return {
        id: data.id,
        displayName: data.name,
        avatarUrl: data.picture?.data?.url,
      };
    }

    case "twitter": {
      const response = await fetch(
        "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await response.json();
      return {
        id: data.data.id,
        username: data.data.username,
        displayName: data.data.name,
        avatarUrl: data.data.profile_image_url,
        profileUrl: `https://twitter.com/${data.data.username}`,
      };
    }

    case "linkedin": {
      const response = await fetch("https://api.linkedin.com/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      return {
        id: data.id,
        displayName: `${data.localizedFirstName} ${data.localizedLastName}`,
      };
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Get Facebook pages
export async function getFacebookPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `https://graph.facebook.com/me/accounts?fields=id,name,access_token,category,picture&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Facebook pages");
  }

  const data = await response.json();

  return (data.data || []).map((page: Record<string, unknown>) => ({
    id: page.id as string,
    name: page.name as string,
    accessToken: page.access_token as string,
    category: page.category as string | undefined,
    picture: (page.picture as Record<string, Record<string, string>>)?.data?.url,
  }));
}

// Get LinkedIn organization pages
export async function getLinkedInPages(accessToken: string): Promise<LinkedInPage[]> {
  const response = await fetch("https://api.linkedin.com/v2/organizationAcls?q=roleAssignee", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch LinkedIn pages");
  }

  const data = await response.json();
  const pages: LinkedInPage[] = [];

  for (const element of data.elements || []) {
    const orgId = element.organization?.split(":").pop();
    if (orgId) {
      const orgResponse = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        pages.push({
          id: orgId,
          name: orgData.localizedName,
          vanityName: orgData.vanityName,
        });
      }
    }
  }

  return pages;
}

// Post to Facebook
export async function postToFacebook(
  pageAccessToken: string,
  pageId: string,
  message: string,
  imageUrl?: string,
  link?: string
): Promise<PostResult> {
  try {
    let endpoint = `https://graph.facebook.com/${pageId}/feed`;
    const params: Record<string, string> = {
      access_token: pageAccessToken,
      message,
    };

    if (imageUrl) {
      endpoint = `https://graph.facebook.com/${pageId}/photos`;
      params.url = imageUrl;
      params.caption = message;
    } else if (link) {
      params.link = link;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || "Failed to post to Facebook",
      };
    }

    return {
      success: true,
      postId: data.id || data.post_id,
      postUrl: `https://facebook.com/${data.id || data.post_id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Post to Twitter/X
export async function postToTwitter(accessToken: string, text: string): Promise<PostResult> {
  try {
    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.title || "Failed to post to Twitter",
      };
    }

    return {
      success: true,
      postId: data.data.id,
      postUrl: `https://twitter.com/i/web/status/${data.data.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Post to LinkedIn
export async function postToLinkedIn(
  accessToken: string,
  authorId: string,
  text: string,
  isOrganization: boolean = false
): Promise<PostResult> {
  try {
    const author = isOrganization ? `urn:li:organization:${authorId}` : `urn:li:person:${authorId}`;

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        success: false,
        error: responseText || "Failed to post to LinkedIn",
      };
    }

    const postId = response.headers.get("X-RestLi-Id");

    return {
      success: true,
      postId: postId || undefined,
      postUrl: postId ? `https://www.linkedin.com/feed/update/${postId}` : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Post to Instagram (via Facebook Graph API)
export async function postToInstagram(
  pageAccessToken: string,
  instagramBusinessAccountId: string,
  caption: string,
  imageUrl: string
): Promise<PostResult> {
  try {
    // Step 1: Create media container
    const createMediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: pageAccessToken,
        }),
      }
    );

    const createMediaData = await createMediaResponse.json();

    if (!createMediaResponse.ok) {
      return {
        success: false,
        error: createMediaData.error?.message || "Failed to create Instagram media",
      };
    }

    const containerId = createMediaData.id;

    // Step 2: Publish media container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramBusinessAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: pageAccessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      return {
        success: false,
        error: publishData.error?.message || "Failed to publish Instagram post",
      };
    }

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://instagram.com/p/${publishData.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get post analytics from Facebook
export async function getFacebookPostAnalytics(
  pageAccessToken: string,
  postId: string
): Promise<PlatformAnalytics | null> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${postId}/insights?metric=post_impressions,post_impressions_unique,post_engaged_users,post_reactions_by_type_total&access_token=${pageAccessToken}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const metrics: Record<string, number> = {};

    for (const insight of data.data || []) {
      metrics[insight.name] = insight.values?.[0]?.value || 0;
    }

    return {
      impressions: metrics.post_impressions || 0,
      reach: metrics.post_impressions_unique || 0,
      engagements: metrics.post_engaged_users || 0,
      likes: 0, // Reactions need separate handling due to nested structure
      comments: 0, // Would need separate API call
      shares: 0, // Would need separate API call
      clicks: 0,
    };
  } catch {
    return null;
  }
}

// Get post analytics from Twitter
export async function getTwitterPostAnalytics(
  accessToken: string,
  tweetId: string
): Promise<PlatformAnalytics | null> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const metrics = data.data?.public_metrics || {};

    return {
      impressions: metrics.impression_count || 0,
      reach: 0, // Twitter doesn't provide reach
      engagements:
        (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0),
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      clicks: 0,
    };
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false; // No expiration
  return new Date() >= expiresAt;
}
