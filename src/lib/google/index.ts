// Google Business Profile Integration - Public exports

// Types
export type {
  GoogleOAuthTokens,
  GoogleAccount,
  GoogleLocation,
  GoogleReview,
  GoogleConnection,
  GoogleSyncLog,
  ActionResult,
} from "./types";

export {
  GOOGLE_OAUTH_CONFIG,
  GOOGLE_API_ENDPOINTS,
  STAR_RATING_MAP,
} from "./types";

// Actions
export {
  initiateGoogleOAuth,
  handleGoogleOAuthCallback,
  getGoogleConnections,
  disconnectGoogle,
  syncGoogleReviews,
  replyToGoogleReview,
  processPendingGoogleReplies,
  getSyncLogs,
  getAvailableLocations,
  getProfessionalsForGoogle,
  /**
   * @deprecated Use getProfessionalsForGoogle instead
   */
  getLoanOfficersForGoogle,
} from "./actions";

// Client utilities
export {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
  getAccounts,
  getLocations,
  getReviews,
  replyToReview,
  deleteReply,
  isTokenExpired,
} from "./client";
