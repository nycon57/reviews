// Salesforce integration module exports

// Types
export type {
  SalesforceOAuthTokens,
  SalesforceUser,
  SalesforceContact,
  SalesforceAccount,
  SalesforceOpportunity,
  SalesforceAddress,
  SalesforceQueryResult,
  SalesforceConnection,
  SalesforceSyncLog,
  SalesforceContactMapping,
  SalesforceOpportunityMapping,
  ActionResult,
} from "./types";

export {
  SALESFORCE_OAUTH_CONFIG,
  SALESFORCE_API_ENDPOINTS,
  OPPORTUNITY_CLOSED_STAGES,
  DEFAULT_FIELD_MAPPINGS,
} from "./types";

// Client utilities
export {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  getUserInfo,
  query,
  queryAll,
  getContacts,
  getAccounts,
  getOpportunities,
  getContactById,
  getOpportunityById,
  createTask,
  updateContact,
  getOpportunityStages,
  isTokenExpired,
  getOpportunityContacts,
  getOpportunityContactRoles,
} from "./client";

// Actions
export {
  initiateSalesforceOAuth,
  handleSalesforceOAuthCallback,
  getSalesforceConnection,
  disconnectSalesforce,
  updateSalesforceSettings,
  getAvailableOpportunityStages,
  syncSalesforceData,
  syncReviewToSalesforce,
  getSalesforceSyncLogs,
} from "./actions";
