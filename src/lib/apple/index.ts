// Apple Business Connect Integration

// Types
export type {
  AppleOAuthTokens,
  AppleTeam,
  AppleBusiness,
  AppleLocation,
  AppleAddress,
  ApplePlaceActionLink,
  AppleShowcase,
  ApplePhoto,
  AppleReview,
  AppleConnection,
  AppleSyncLog,
  AppleAnalytics,
  ActionResult,
} from "./types";

export {
  APPLE_OAUTH_CONFIG,
  APPLE_API_ENDPOINTS,
  isValidAppleRating,
  formatAppleAddress,
  getSyncStatusColor,
  getSyncStatusLabel,
} from "./types";

// Client utilities
export {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getTeams,
  getBusinesses,
  getLocations,
  getLocation,
  updateLocation,
  getReviews,
  replyToReview,
  deleteReply,
  getPhotos,
  uploadPhoto,
  getAnalytics,
  getPlaceActionLinks,
  getShowcases,
  isTokenExpired,
} from "./client";

// Actions
export {
  initiateAppleOAuth,
  handleAppleOAuthCallback,
  getAppleConnections,
  disconnectApple,
  syncAppleReviews,
  replyToAppleReview,
  syncBusinessInfoToApple,
  uploadPhotoToApple,
  getAppleAnalytics,
  getAppleSyncLogs,
  getAvailableBusinesses,
  getAvailableLocations,
  getLoanOfficersForApple,
} from "./actions";
