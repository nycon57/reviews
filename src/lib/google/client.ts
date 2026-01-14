// Google OAuth and API client

import {
  GOOGLE_OAUTH_CONFIG,
  GOOGLE_API_ENDPOINTS,
  type GoogleOAuthTokens,
  type GoogleAccount,
  type GoogleLocation,
  type GoogleReview,
} from './types';

// Environment variables validation
function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Google OAuth configuration. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI');
  }

  return { clientId, clientSecret, redirectUri };
}

// Generate OAuth authorization URL
export function getAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `${GOOGLE_OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<GoogleOAuthTokens> {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token exchange failed:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: data.scope ? data.scope.split(' ') : GOOGLE_OAUTH_CONFIG.scopes,
  };
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<GoogleOAuthTokens> {
  const { clientId, clientSecret } = getGoogleConfig();

  const response = await fetch(GOOGLE_OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token refresh failed:', error);
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Refresh token doesn't change
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: data.scope ? data.scope.split(' ') : GOOGLE_OAUTH_CONFIG.scopes,
  };
}

// Get user info from Google
export async function getUserInfo(accessToken: string): Promise<GoogleAccount> {
  const response = await fetch(GOOGLE_OAUTH_CONFIG.userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const data = await response.json();

  return {
    id: data.id,
    email: data.email,
    name: data.name,
  };
}

// Get Google Business accounts
export async function getAccounts(accessToken: string): Promise<{ accounts: { name: string; accountName: string }[] }> {
  const response = await fetch(GOOGLE_API_ENDPOINTS.accounts, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch accounts:', error);
    throw new Error('Failed to fetch Google Business accounts');
  }

  return response.json();
}

// Get locations for an account
export async function getLocations(accessToken: string, accountId: string): Promise<{ locations: GoogleLocation[] }> {
  const response = await fetch(GOOGLE_API_ENDPOINTS.locations(accountId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch locations:', error);
    throw new Error('Failed to fetch Google Business locations');
  }

  const data = await response.json();

  return {
    locations: (data.locations || []).map((loc: Record<string, unknown>) => ({
      name: loc.name as string,
      locationId: (loc.name as string).split('/').pop() || '',
      title: loc.title as string,
      storefrontAddress: loc.storefrontAddress as GoogleLocation['storefrontAddress'],
      primaryPhone: loc.primaryPhone as string | undefined,
      websiteUri: loc.websiteUri as string | undefined,
      metadata: loc.metadata as GoogleLocation['metadata'],
    })),
  };
}

// Get reviews for a location
export async function getReviews(
  accessToken: string,
  locationName: string,
  pageToken?: string
): Promise<{ reviews: GoogleReview[]; nextPageToken?: string; totalReviewCount?: number }> {
  const url = new URL(GOOGLE_API_ENDPOINTS.reviews(locationName));
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }
  url.searchParams.set('pageSize', '50');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch reviews:', error);
    throw new Error('Failed to fetch Google reviews');
  }

  const data = await response.json();

  return {
    reviews: (data.reviews || []).map((review: Record<string, unknown>) => ({
      reviewId: (review.reviewId || (review.name as string)?.split('/').pop()) as string,
      name: review.name as string,
      reviewer: review.reviewer as GoogleReview['reviewer'],
      starRating: review.starRating as GoogleReview['starRating'],
      comment: review.comment as string | undefined,
      createTime: review.createTime as string,
      updateTime: review.updateTime as string,
      reviewReply: review.reviewReply as GoogleReview['reviewReply'] | undefined,
    })),
    nextPageToken: data.nextPageToken,
    totalReviewCount: data.totalReviewCount,
  };
}

// Reply to a review
export async function replyToReview(
  accessToken: string,
  reviewName: string,
  comment: string
): Promise<{ updateTime: string }> {
  const response = await fetch(GOOGLE_API_ENDPOINTS.reviewReply(reviewName), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to reply to review:', error);
    throw new Error('Failed to reply to Google review');
  }

  return response.json();
}

// Delete a reply
export async function deleteReply(accessToken: string, reviewName: string): Promise<void> {
  const response = await fetch(GOOGLE_API_ENDPOINTS.reviewReply(reviewName), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to delete reply:', error);
    throw new Error('Failed to delete Google review reply');
  }
}

// Check if token is expired (with 5 minute buffer)
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date(expiresAt) <= new Date(Date.now() + 5 * 60 * 1000);
}
