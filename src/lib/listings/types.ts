// Business Listings Management Types

// Directory platforms
export type DirectoryPlatform =
  | 'google'
  | 'yelp'
  | 'facebook'
  | 'zillow'
  | 'bing'
  | 'yahoo'
  | 'apple_maps'
  | 'bbb'
  | 'yellowpages'
  | 'foursquare'
  | 'tripadvisor'
  | 'angi'
  | 'homeadvisor'
  | 'realtor'
  | 'trulia'
  | 'lendingtree';

// Sync status
export type ListingSyncStatus =
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'error'
  | 'not_connected';

// NAP consistency status
export type NapConsistencyStatus = 'consistent' | 'inconsistent' | 'unchecked';

// Business Listing
export interface BusinessListing {
  id: string;
  organizationId: string;
  branchId: string | null;

  // NAP data
  businessName: string;
  businessPhone: string | null;
  businessEmail: string | null;
  businessWebsite: string | null;

  // Address
  streetAddress: string | null;
  streetAddress2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;

  // Business details
  businessDescription: string | null;
  businessCategories: string[];
  businessKeywords: string[];
  hoursOfOperation: HoursOfOperation;

  // Photos
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  photos: string[];

  // Social links
  socialLinks: SocialLinks;

  // Accuracy
  accuracyScore: number;
  lastAccuracyCheck: string | null;
  napConsistencyStatus: NapConsistencyStatus;

  // Duplicates
  potentialDuplicates: string[];
  isPrimary: boolean;
  mergedFrom: string | null;

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Hours of operation
export interface HoursOfOperation {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed?: boolean;
}

// Social links
export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

// Directory Connection
export interface DirectoryConnection {
  id: string;
  listingId: string;
  organizationId: string;
  platform: DirectoryPlatform;

  // Directory identifiers
  directoryListingId: string | null;
  directoryUrl: string | null;
  directoryUsername: string | null;

  // Connection credentials
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;

  // Status
  isConnected: boolean;
  isVerified: boolean;
  syncStatus: ListingSyncStatus;
  lastSyncAt: string | null;
  syncError: string | null;

  // NAP comparison
  remoteNapData: RemoteNapData;
  napMatchScore: number;
  hasConflicts: boolean;
  conflicts: NapConflicts;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Remote NAP data from directory
export interface RemoteNapData {
  businessName?: string;
  businessPhone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  website?: string;
}

// NAP conflicts
export interface NapConflicts {
  businessName?: { local: string; remote: string };
  businessPhone?: { local: string; remote: string };
  streetAddress?: { local: string; remote: string };
  city?: { local: string; remote: string };
  state?: { local: string; remote: string };
  postalCode?: { local: string; remote: string };
  website?: { local: string; remote: string };
}

// Sync Log
export interface ListingSyncLog {
  id: string;
  organizationId: string;
  listingId: string;
  connectionId: string | null;

  syncType: 'full' | 'incremental' | 'manual' | 'conflict_resolution' | 'photo_sync';
  status: 'started' | 'in_progress' | 'completed' | 'failed';

  directoriesSynced: number;
  conflictsDetected: number;
  conflictsResolved: number;
  photosSynced: number;

  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;

  errors: string[];
  metadata: Record<string, unknown>;
}

// Accuracy History
export interface ListingAccuracyHistory {
  id: string;
  listingId: string;
  organizationId: string;

  previousScore: number | null;
  newScore: number;
  changeAmount: number | null;

  scoreBreakdown: AccuracyScoreBreakdown;
  calculationReason: string;
  recordedAt: string;
}

// Accuracy Score Breakdown
export interface AccuracyScoreBreakdown {
  napCompleteness: number;
  directoryCoverage: number;
  napConsistency: number;
  updateFreshness: number;
  photoQuality: number;
}

// Listing Alert
export interface ListingAlert {
  id: string;
  listingId: string;
  organizationId: string;

  alertType:
    | 'nap_mismatch'
    | 'listing_removed'
    | 'duplicate_found'
    | 'accuracy_drop'
    | 'sync_failed'
    | 'verification_needed'
    | 'photo_rejected'
    | 'hours_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;

  platform: DirectoryPlatform | null;
  connectionId: string | null;

  isRead: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;

  createdAt: string;
}

// Action Result
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Platform Info
export interface PlatformInfo {
  name: string;
  description: string;
  icon: string;
  hasApiAccess: boolean;
  claimUrl?: string;
  color: string;
}

// Platform information mapping
export const PLATFORM_INFO: Record<DirectoryPlatform, PlatformInfo> = {
  google: {
    name: 'Google Business Profile',
    description: 'Manage your Google Maps and Search presence',
    icon: 'google',
    hasApiAccess: true,
    claimUrl: 'https://business.google.com',
    color: 'bg-blue-500',
  },
  yelp: {
    name: 'Yelp',
    description: 'Popular consumer review platform',
    icon: 'yelp',
    hasApiAccess: true,
    claimUrl: 'https://biz.yelp.com',
    color: 'bg-red-600',
  },
  facebook: {
    name: 'Facebook',
    description: 'Facebook business page',
    icon: 'facebook',
    hasApiAccess: true,
    claimUrl: 'https://business.facebook.com',
    color: 'bg-blue-600',
  },
  zillow: {
    name: 'Zillow',
    description: 'Real estate marketplace',
    icon: 'zillow',
    hasApiAccess: false,
    claimUrl: 'https://www.zillow.com/lender-hub/',
    color: 'bg-blue-700',
  },
  bing: {
    name: 'Bing Places',
    description: 'Microsoft Bing local listings',
    icon: 'bing',
    hasApiAccess: true,
    claimUrl: 'https://www.bingplaces.com',
    color: 'bg-teal-600',
  },
  yahoo: {
    name: 'Yahoo Local',
    description: 'Yahoo local business listing',
    icon: 'yahoo',
    hasApiAccess: false,
    claimUrl: 'https://smallbusiness.yahoo.com/local',
    color: 'bg-purple-600',
  },
  apple_maps: {
    name: 'Apple Maps',
    description: 'Apple Business Connect',
    icon: 'apple',
    hasApiAccess: true,
    claimUrl: 'https://businessconnect.apple.com',
    color: 'bg-gray-800',
  },
  bbb: {
    name: 'Better Business Bureau',
    description: 'BBB accreditation and listing',
    icon: 'bbb',
    hasApiAccess: false,
    claimUrl: 'https://www.bbb.org/get-accredited',
    color: 'bg-blue-800',
  },
  yellowpages: {
    name: 'Yellow Pages',
    description: 'YP.com business directory',
    icon: 'yellowpages',
    hasApiAccess: false,
    claimUrl: 'https://adsolutions.yp.com',
    color: 'bg-yellow-500',
  },
  foursquare: {
    name: 'Foursquare',
    description: 'Location data platform',
    icon: 'foursquare',
    hasApiAccess: true,
    claimUrl: 'https://foursquare.com/business',
    color: 'bg-pink-500',
  },
  tripadvisor: {
    name: 'TripAdvisor',
    description: 'Travel and hospitality reviews',
    icon: 'tripadvisor',
    hasApiAccess: false,
    claimUrl: 'https://www.tripadvisor.com/Owners',
    color: 'bg-green-600',
  },
  angi: {
    name: 'Angi',
    description: 'Home services marketplace (formerly Angie\'s List)',
    icon: 'angi',
    hasApiAccess: false,
    claimUrl: 'https://www.angi.com/pro',
    color: 'bg-green-500',
  },
  homeadvisor: {
    name: 'HomeAdvisor',
    description: 'Home improvement services',
    icon: 'homeadvisor',
    hasApiAccess: false,
    claimUrl: 'https://pro.homeadvisor.com',
    color: 'bg-orange-500',
  },
  realtor: {
    name: 'Realtor.com',
    description: 'Real estate listings and agents',
    icon: 'realtor',
    hasApiAccess: false,
    claimUrl: 'https://www.realtor.com/marketing/',
    color: 'bg-red-500',
  },
  trulia: {
    name: 'Trulia',
    description: 'Real estate and neighborhood info',
    icon: 'trulia',
    hasApiAccess: false,
    claimUrl: 'https://www.trulia.com/lender-hub/',
    color: 'bg-green-700',
  },
  lendingtree: {
    name: 'LendingTree',
    description: 'Loan comparison marketplace',
    icon: 'lendingtree',
    hasApiAccess: false,
    claimUrl: 'https://www.lendingtree.com/lenders/',
    color: 'bg-green-600',
  },
};

// Get severity color
export function getSeverityColor(severity: ListingAlert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

// Get sync status color
export function getSyncStatusColor(status: ListingSyncStatus): string {
  switch (status) {
    case 'synced':
      return 'bg-green-500';
    case 'syncing':
      return 'bg-blue-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    case 'not_connected':
      return 'bg-gray-400';
    default:
      return 'bg-gray-500';
  }
}

// Get accuracy score color
export function getAccuracyScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

// Get accuracy score label
export function getAccuracyScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
}

// Format phone number
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// Get full address string
export function getFullAddress(listing: BusinessListing): string {
  const parts = [
    listing.streetAddress,
    listing.streetAddress2,
    listing.city,
    listing.state,
    listing.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
}
