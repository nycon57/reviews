// Business Listings Management

// Types
export type {
  DirectoryPlatform,
  ListingSyncStatus,
  NapConsistencyStatus,
  BusinessListing,
  HoursOfOperation,
  DayHours,
  SocialLinks,
  DirectoryConnection,
  RemoteNapData,
  NapConflicts,
  ListingSyncLog,
  ListingAccuracyHistory,
  AccuracyScoreBreakdown,
  ListingAlert,
  ActionResult,
  PlatformInfo,
} from "./types";

export {
  PLATFORM_INFO,
  getSeverityColor,
  getSyncStatusColor,
  getAccuracyScoreColor,
  getAccuracyScoreLabel,
  formatPhoneNumber,
  getFullAddress,
} from "./types";

// Actions
export {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getDirectoryConnections,
  updateDirectoryConnection,
  connectDirectory,
  disconnectDirectory,
  syncDirectory,
  syncAppleDirectory,
  pushToAppleDirectory,
  getListingAlerts,
  markAlertRead,
  resolveAlert,
  getSyncLogs,
  getAccuracyHistory,
  detectDuplicates,
  getListingsSummary,
} from "./actions";
