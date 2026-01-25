// Google Business Profile API types

export interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

export interface GoogleAccount {
  id: string;
  email: string;
  name: string;
}

export interface GoogleLocation {
  name: string; // Full resource name: accounts/{account}/locations/{location}
  locationId: string;
  title: string;
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
  primaryPhone?: string;
  websiteUri?: string;
  metadata?: {
    mapsUri?: string;
    placeId?: string;
  };
}

export interface GoogleReview {
  reviewId: string;
  name: string; // Full resource name
  reviewer: {
    profilePhotoUrl?: string;
    displayName: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GoogleConnection {
  id: string;
  organizationId: string;
  userId: string | null;
  /** @deprecated Use userId instead */
  loanOfficerId?: string | null;
  googleAccountId: string;
  googleAccountEmail: string | null;
  googleAccountName: string | null;
  locationId: string;
  locationName: string | null;
  locationAddress: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: 'pending' | 'syncing' | 'completed' | 'failed';
  syncError: string | null;
  reviewsCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleSyncLog {
  id: string;
  organizationId: string;
  connectionId: string;
  syncType: 'full' | 'incremental' | 'manual';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  reviewsFetched: number;
  reviewsCreated: number;
  reviewsUpdated: number;
  errors: string[];
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// OAuth configuration
export const GOOGLE_OAUTH_CONFIG = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
  scopes: [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
} as const;

// Google API endpoints
export const GOOGLE_API_ENDPOINTS = {
  accounts: 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
  locations: (accountId: string) =>
    `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`,
  reviews: (locationName: string) =>
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews`,
  reviewReply: (reviewName: string) =>
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
} as const;

// Star rating to number conversion
export const STAR_RATING_MAP: Record<GoogleReview['starRating'], number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};
