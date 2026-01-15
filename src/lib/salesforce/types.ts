// Salesforce CRM API types

export interface SalesforceOAuthTokens {
  accessToken: string;
  refreshToken: string;
  instanceUrl: string;
  expiresAt: Date;
  scopes: string[];
}

export interface SalesforceUser {
  id: string;
  username: string;
  email: string;
  name: string;
  organizationId: string;
}

export interface SalesforceContact {
  Id: string;
  AccountId?: string;
  FirstName?: string;
  LastName?: string;
  Name: string;
  Email?: string;
  Phone?: string;
  MobilePhone?: string;
  Title?: string;
  Department?: string;
  MailingAddress?: SalesforceAddress;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceAccount {
  Id: string;
  Name: string;
  Type?: string;
  Industry?: string;
  Phone?: string;
  Website?: string;
  BillingAddress?: SalesforceAddress;
  ShippingAddress?: SalesforceAddress;
  Description?: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceOpportunity {
  Id: string;
  AccountId?: string;
  Name: string;
  StageName: string;
  Amount?: number;
  CloseDate: string;
  Probability?: number;
  Type?: string;
  LeadSource?: string;
  Description?: string;
  IsClosed: boolean;
  IsWon: boolean;
  ContactId?: string; // Primary contact
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface SalesforceAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface SalesforceQueryResult<T> {
  totalSize: number;
  done: boolean;
  nextRecordsUrl?: string;
  records: T[];
}

export interface SalesforceConnection {
  id: string;
  organizationId: string;
  instanceUrl: string;
  salesforceOrgId: string;
  salesforceUserId: string;
  salesforceUsername: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  syncStatus: 'pending' | 'syncing' | 'completed' | 'failed';
  syncError: string | null;
  syncContacts: boolean;
  syncAccounts: boolean;
  syncOpportunities: boolean;
  autoCreateSurveys: boolean;
  opportunityStageTrigger: string;
  contactsSynced: number;
  accountsSynced: number;
  opportunitiesSynced: number;
  fieldMappings: Record<string, string>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SalesforceSyncLog {
  id: string;
  organizationId: string;
  connectionId: string;
  syncType: 'full' | 'incremental' | 'manual' | 'webhook';
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  objectType: string | null;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  recordsFetched: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface SalesforceContactMapping {
  id: string;
  organizationId: string;
  connectionId: string;
  salesforceContactId: string;
  salesforceAccountId: string | null;
  loanOfficerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  salesforceData: Record<string, unknown>;
  lastSyncedAt: string;
  syncStatus: 'synced' | 'pending' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface SalesforceOpportunityMapping {
  id: string;
  organizationId: string;
  connectionId: string;
  salesforceOpportunityId: string;
  salesforceAccountId: string | null;
  salesforceContactId: string | null;
  opportunityName: string | null;
  opportunityStage: string | null;
  opportunityAmount: number | null;
  closeDate: string | null;
  surveyId: string | null;
  surveyTriggeredAt: string | null;
  salesforceData: Record<string, unknown>;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// OAuth configuration
export const SALESFORCE_OAUTH_CONFIG = {
  authorizationEndpoint: 'https://login.salesforce.com/services/oauth2/authorize',
  tokenEndpoint: 'https://login.salesforce.com/services/oauth2/token',
  revokeEndpoint: 'https://login.salesforce.com/services/oauth2/revoke',
  userInfoEndpoint: '/services/oauth2/userinfo', // Relative to instance URL
  scopes: [
    'api',
    'refresh_token',
    'offline_access',
    'id',
    'profile',
    'email',
  ],
} as const;

// Salesforce API endpoints (relative to instance URL)
export const SALESFORCE_API_ENDPOINTS = {
  // REST API base
  restBase: (instanceUrl: string) => `${instanceUrl}/services/data/v59.0`,
  // Query endpoint
  query: (instanceUrl: string) => `${instanceUrl}/services/data/v59.0/query`,
  // SObject endpoints
  sobject: (instanceUrl: string, objectType: string) =>
    `${instanceUrl}/services/data/v59.0/sobjects/${objectType}`,
  sobjectRecord: (instanceUrl: string, objectType: string, id: string) =>
    `${instanceUrl}/services/data/v59.0/sobjects/${objectType}/${id}`,
  // Describe endpoint
  describe: (instanceUrl: string, objectType: string) =>
    `${instanceUrl}/services/data/v59.0/sobjects/${objectType}/describe`,
  // Composite API
  composite: (instanceUrl: string) =>
    `${instanceUrl}/services/data/v59.0/composite`,
} as const;

// Common opportunity stages that typically indicate completion
export const OPPORTUNITY_CLOSED_STAGES = [
  'Closed Won',
  'Closed Lost',
  'Closed - Won',
  'Closed - Lost',
  'Won',
  'Lost',
] as const;

// Default field mappings for syncing
export const DEFAULT_FIELD_MAPPINGS = {
  contact: {
    email: 'Email',
    name: 'Name',
    firstName: 'FirstName',
    lastName: 'LastName',
    phone: 'Phone',
    mobilePhone: 'MobilePhone',
  },
  account: {
    name: 'Name',
    phone: 'Phone',
    website: 'Website',
    industry: 'Industry',
  },
  opportunity: {
    name: 'Name',
    stage: 'StageName',
    amount: 'Amount',
    closeDate: 'CloseDate',
  },
} as const;
