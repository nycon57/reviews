// Apple Business Connect OAuth and API client

import {
  APPLE_OAUTH_CONFIG,
  APPLE_API_ENDPOINTS,
  type AppleOAuthTokens,
  type AppleTeam,
  type AppleBusiness,
  type AppleLocation,
  type AppleReview,
  type AppleAnalytics,
  type ApplePlaceActionLink,
  type AppleShowcase,
  type ApplePhoto,
  formatAppleAddress,
} from './types';

// Environment variables validation
function getAppleConfig() {
  const clientId = process.env.APPLE_BUSINESS_CLIENT_ID;
  const clientSecret = process.env.APPLE_BUSINESS_CLIENT_SECRET;
  const redirectUri = process.env.APPLE_BUSINESS_REDIRECT_URI;
  const teamId = process.env.APPLE_BUSINESS_TEAM_ID;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Apple Business Connect OAuth configuration. Set APPLE_BUSINESS_CLIENT_ID, APPLE_BUSINESS_CLIENT_SECRET, and APPLE_BUSINESS_REDIRECT_URI');
  }

  return { clientId, clientSecret, redirectUri, teamId };
}

// Generate OAuth authorization URL
export function getAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getAppleConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: APPLE_OAUTH_CONFIG.scopes.join(' '),
    state,
  });

  return `${APPLE_OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<AppleOAuthTokens> {
  const { clientId, clientSecret, redirectUri } = getAppleConfig();

  const response = await fetch(APPLE_OAUTH_CONFIG.tokenEndpoint, {
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
    console.error('Apple token exchange failed:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: data.scope ? data.scope.split(' ') : APPLE_OAUTH_CONFIG.scopes,
  };
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<AppleOAuthTokens> {
  const { clientId, clientSecret } = getAppleConfig();

  const response = await fetch(APPLE_OAUTH_CONFIG.tokenEndpoint, {
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
    console.error('Apple token refresh failed:', error);
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Refresh token doesn't change
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: data.scope ? data.scope.split(' ') : APPLE_OAUTH_CONFIG.scopes,
  };
}

// Get Apple Business teams
export async function getTeams(accessToken: string): Promise<{ teams: AppleTeam[] }> {
  const response = await fetch(APPLE_API_ENDPOINTS.teams, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple teams:', error);
    throw new Error('Failed to fetch Apple Business teams');
  }

  const data = await response.json();

  return {
    teams: (data.teams || []).map((team: Record<string, unknown>) => ({
      id: team.id as string,
      name: team.name as string,
    })),
  };
}

// Get businesses for a team
export async function getBusinesses(accessToken: string, teamId: string): Promise<{ businesses: AppleBusiness[] }> {
  const response = await fetch(APPLE_API_ENDPOINTS.businesses(teamId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple businesses:', error);
    throw new Error('Failed to fetch Apple businesses');
  }

  const data = await response.json();

  return {
    businesses: (data.businesses || []).map((biz: Record<string, unknown>) => ({
      id: biz.id as string,
      name: biz.name as string,
      teamId: teamId,
    })),
  };
}

// Get locations for a business
export async function getLocations(accessToken: string, businessId: string): Promise<{ locations: AppleLocation[] }> {
  const response = await fetch(APPLE_API_ENDPOINTS.locations(businessId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple locations:', error);
    throw new Error('Failed to fetch Apple locations');
  }

  const data = await response.json();

  return {
    locations: (data.locations || []).map((loc: Record<string, unknown>) => ({
      id: loc.id as string,
      businessId: businessId,
      name: loc.name as string,
      address: loc.address as AppleLocation['address'],
      phoneNumber: loc.phoneNumber as string | undefined,
      websiteUrl: loc.websiteUrl as string | undefined,
      categories: loc.categories as string[] | undefined,
      description: loc.description as string | undefined,
      placeActionLinks: loc.placeActionLinks as ApplePlaceActionLink[] | undefined,
      showcases: loc.showcases as AppleShowcase[] | undefined,
      photos: loc.photos as ApplePhoto[] | undefined,
      metadata: loc.metadata as AppleLocation['metadata'],
    })),
  };
}

// Get location details
export async function getLocation(accessToken: string, locationId: string): Promise<AppleLocation> {
  const response = await fetch(APPLE_API_ENDPOINTS.location(locationId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple location:', error);
    throw new Error('Failed to fetch Apple location');
  }

  const loc = await response.json();

  return {
    id: loc.id as string,
    businessId: loc.businessId as string,
    name: loc.name as string,
    address: loc.address as AppleLocation['address'],
    phoneNumber: loc.phoneNumber as string | undefined,
    websiteUrl: loc.websiteUrl as string | undefined,
    categories: loc.categories as string[] | undefined,
    description: loc.description as string | undefined,
    placeActionLinks: loc.placeActionLinks as ApplePlaceActionLink[] | undefined,
    showcases: loc.showcases as AppleShowcase[] | undefined,
    photos: loc.photos as ApplePhoto[] | undefined,
    metadata: loc.metadata as AppleLocation['metadata'],
  };
}

// Update location business info
export async function updateLocation(
  accessToken: string,
  locationId: string,
  data: Partial<Pick<AppleLocation, 'name' | 'description' | 'phoneNumber' | 'websiteUrl' | 'categories'>>
): Promise<AppleLocation> {
  const response = await fetch(APPLE_API_ENDPOINTS.location(locationId), {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to update Apple location:', error);
    throw new Error('Failed to update Apple location');
  }

  return response.json();
}

// Get reviews for a location
export async function getReviews(
  accessToken: string,
  locationId: string,
  pageToken?: string
): Promise<{ reviews: AppleReview[]; nextPageToken?: string; totalCount?: number }> {
  const url = new URL(APPLE_API_ENDPOINTS.reviews(locationId));
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }
  url.searchParams.set('pageSize', '50');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple reviews:', error);
    throw new Error('Failed to fetch Apple reviews');
  }

  const data = await response.json();

  return {
    reviews: (data.reviews || []).map((review: Record<string, unknown>) => ({
      reviewId: review.id as string,
      locationId: locationId,
      rating: review.rating as number,
      title: review.title as string | undefined,
      comment: review.comment as string | undefined,
      reviewerName: review.reviewerName as string | undefined,
      createTime: review.createTime as string,
      updateTime: review.updateTime as string,
      reviewReply: review.reviewReply as AppleReview['reviewReply'] | undefined,
    })),
    nextPageToken: data.nextPageToken,
    totalCount: data.totalCount,
  };
}

// Reply to a review
export async function replyToReview(
  accessToken: string,
  reviewId: string,
  comment: string
): Promise<{ updateTime: string }> {
  const response = await fetch(APPLE_API_ENDPOINTS.reviewReply(reviewId), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to reply to Apple review:', error);
    throw new Error('Failed to reply to Apple review');
  }

  return response.json();
}

// Delete a reply
export async function deleteReply(accessToken: string, reviewId: string): Promise<void> {
  const response = await fetch(APPLE_API_ENDPOINTS.reviewReply(reviewId), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to delete Apple review reply:', error);
    throw new Error('Failed to delete Apple review reply');
  }
}

// Get photos for a location
export async function getPhotos(accessToken: string, locationId: string): Promise<{ photos: ApplePhoto[] }> {
  const response = await fetch(APPLE_API_ENDPOINTS.photos(locationId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple photos:', error);
    throw new Error('Failed to fetch Apple photos');
  }

  const data = await response.json();

  return {
    photos: (data.photos || []).map((photo: Record<string, unknown>) => ({
      id: photo.id as string,
      url: photo.url as string,
      type: photo.type as ApplePhoto['type'],
      caption: photo.caption as string | undefined,
      isActive: photo.isActive as boolean,
    })),
  };
}

// Upload a photo
export async function uploadPhoto(
  accessToken: string,
  locationId: string,
  photo: { url: string; type: ApplePhoto['type']; caption?: string }
): Promise<ApplePhoto> {
  const response = await fetch(APPLE_API_ENDPOINTS.photos(locationId), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(photo),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to upload Apple photo:', error);
    throw new Error('Failed to upload Apple photo');
  }

  return response.json();
}

// Get analytics for a location
export async function getAnalytics(
  accessToken: string,
  locationId: string,
  startDate: string,
  endDate: string
): Promise<{ analytics: Omit<AppleAnalytics, 'id' | 'organizationId' | 'connectionId'>[] }> {
  const url = new URL(APPLE_API_ENDPOINTS.analytics(locationId));
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple analytics:', error);
    throw new Error('Failed to fetch Apple analytics');
  }

  const data = await response.json();

  return {
    analytics: (data.analytics || []).map((a: Record<string, unknown>) => ({
      date: a.date as string,
      impressions: (a.impressions as number) || 0,
      actions: (a.actions as number) || 0,
      directionRequests: (a.directionRequests as number) || 0,
      websiteClicks: (a.websiteClicks as number) || 0,
      phoneCalls: (a.phoneCalls as number) || 0,
      newReviews: (a.newReviews as number) || 0,
      reviewResponses: (a.reviewResponses as number) || 0,
      averageRating: a.averageRating as number | null,
      photoViews: (a.photoViews as number) || 0,
    })),
  };
}

// Get place action links
export async function getPlaceActionLinks(accessToken: string, locationId: string): Promise<{ links: ApplePlaceActionLink[] }> {
  const response = await fetch(APPLE_API_ENDPOINTS.placeActionLinks(locationId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple place action links:', error);
    throw new Error('Failed to fetch Apple place action links');
  }

  const data = await response.json();

  return {
    links: (data.links || []).map((link: Record<string, unknown>) => ({
      id: link.id as string,
      type: link.type as ApplePlaceActionLink['type'],
      url: link.url as string,
      displayName: link.displayName as string | undefined,
      isActive: link.isActive as boolean,
    })),
  };
}

// Get showcases
export async function getShowcases(accessToken: string, locationId: string): Promise<{ showcases: AppleShowcase[] }> {
  const response = await fetch(APPLE_API_ENDPOINTS.showcases(locationId), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch Apple showcases:', error);
    throw new Error('Failed to fetch Apple showcases');
  }

  const data = await response.json();

  return {
    showcases: (data.showcases || []).map((showcase: Record<string, unknown>) => ({
      id: showcase.id as string,
      title: showcase.title as string,
      description: showcase.description as string | undefined,
      imageUrl: showcase.imageUrl as string | undefined,
      actionUrl: showcase.actionUrl as string | undefined,
      expiresAt: showcase.expiresAt as string | undefined,
      isActive: showcase.isActive as boolean,
    })),
  };
}

// Check if token is expired (with 5 minute buffer)
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date(expiresAt) <= new Date(Date.now() + 5 * 60 * 1000);
}

// Re-export formatAppleAddress for convenience
export { formatAppleAddress };
