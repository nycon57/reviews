// Apple Business Connect API types

export interface AppleOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

export interface AppleTeam {
  id: string;
  name: string;
}

export interface AppleBusiness {
  id: string;
  name: string;
  teamId: string;
}

export interface AppleLocation {
  id: string;
  businessId: string;
  name: string;
  address?: AppleAddress;
  phoneNumber?: string;
  websiteUrl?: string;
  categories?: string[];
  description?: string;
  placeActionLinks?: ApplePlaceActionLink[];
  showcases?: AppleShowcase[];
  photos?: ApplePhoto[];
  metadata?: {
    mapsUrl?: string;
    placeId?: string;
  };
}

export interface AppleAddress {
  lines: string[];
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}

export interface ApplePlaceActionLink {
  id: string;
  type: 'ORDER' | 'RESERVE' | 'SCHEDULE' | 'MENU' | 'ONLINE_ORDER' | 'OTHER';
  url: string;
  displayName?: string;
  isActive: boolean;
}

export interface AppleShowcase {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  actionUrl?: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface ApplePhoto {
  id: string;
  url: string;
  type: 'LOGO' | 'COVER' | 'INTERIOR' | 'EXTERIOR' | 'PRODUCT' | 'TEAM' | 'OTHER';
  caption?: string;
  isActive: boolean;
}

export interface AppleReview {
  reviewId: string;
  locationId: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  reviewerName?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface AppleConnection {
  id: string;
  organizationId: string;
  loanOfficerId: string | null;
  appleTeamId: string;
  appleBusinessId: string;
  locationId: string;
  locationName: string | null;
  locationAddress: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: 'pending' | 'syncing' | 'completed' | 'failed';
  syncError: string | null;
  reviewsCount: number;
  averageRating: number;
  placeActionLinks: ApplePlaceActionLink[];
  showcases: AppleShowcase[];
  photos: ApplePhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface AppleSyncLog {
  id: string;
  organizationId: string;
  connectionId: string;
  syncType: 'full' | 'incremental' | 'manual' | 'business_info' | 'photos' | 'reviews';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  reviewsFetched: number;
  reviewsCreated: number;
  reviewsUpdated: number;
  photosSynced: number;
  businessInfoUpdated: boolean;
  errors: string[];
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface AppleAnalytics {
  id: string;
  organizationId: string;
  connectionId: string;
  date: string;
  impressions: number;
  actions: number;
  directionRequests: number;
  websiteClicks: number;
  phoneCalls: number;
  newReviews: number;
  reviewResponses: number;
  averageRating: number | null;
  photoViews: number;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// OAuth configuration for Apple Business Connect
// Apple uses a custom OAuth implementation with JWT tokens
export const APPLE_OAUTH_CONFIG = {
  authorizationEndpoint: 'https://businessconnect.apple.com/oauth/authorize',
  tokenEndpoint: 'https://businessconnect.apple.com/oauth/token',
  scopes: [
    'business.read',
    'business.write',
    'locations.read',
    'locations.write',
    'reviews.read',
    'reviews.respond',
    'analytics.read',
    'photos.read',
    'photos.write',
  ],
} as const;

// Apple Business Connect API endpoints
export const APPLE_API_ENDPOINTS = {
  teams: 'https://api.businessconnect.apple.com/v1/teams',
  businesses: (teamId: string) =>
    `https://api.businessconnect.apple.com/v1/teams/${teamId}/businesses`,
  locations: (businessId: string) =>
    `https://api.businessconnect.apple.com/v1/businesses/${businessId}/locations`,
  location: (locationId: string) =>
    `https://api.businessconnect.apple.com/v1/locations/${locationId}`,
  reviews: (locationId: string) =>
    `https://api.businessconnect.apple.com/v1/locations/${locationId}/reviews`,
  reviewReply: (reviewId: string) =>
    `https://api.businessconnect.apple.com/v1/reviews/${reviewId}/reply`,
  photos: (locationId: string) =>
    `https://api.businessconnect.apple.com/v1/locations/${locationId}/photos`,
  analytics: (locationId: string) =>
    `https://api.businessconnect.apple.com/v1/locations/${locationId}/analytics`,
  placeActionLinks: (locationId: string) =>
    `https://api.businessconnect.apple.com/v1/locations/${locationId}/placeActionLinks`,
  showcases: (locationId: string) =>
    `https://api.businessconnect.apple.com/v1/locations/${locationId}/showcases`,
} as const;

// Rating validation (Apple uses 1-5 star ratings)
export function isValidAppleRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// Format Apple address to string
export function formatAppleAddress(address?: AppleAddress): string | null {
  if (!address) return null;
  const parts = [
    ...address.lines,
    address.city,
    address.stateProvince,
    address.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
}

// Get sync status color
export function getSyncStatusColor(status: AppleConnection['syncStatus']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'syncing':
      return 'bg-blue-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'failed':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

// Get sync status label
export function getSyncStatusLabel(status: AppleConnection['syncStatus']): string {
  switch (status) {
    case 'completed':
      return 'Synced';
    case 'syncing':
      return 'Syncing...';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}
