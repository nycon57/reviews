// Salesforce OAuth and API client

import {
  SALESFORCE_OAUTH_CONFIG,
  SALESFORCE_API_ENDPOINTS,
  type SalesforceOAuthTokens,
  type SalesforceUser,
  type SalesforceContact,
  type SalesforceAccount,
  type SalesforceOpportunity,
  type SalesforceQueryResult,
} from './types';

// Environment variables validation
function getSalesforceConfig() {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
  const redirectUri = process.env.SALESFORCE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Missing Salesforce OAuth configuration. Set SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, and SALESFORCE_REDIRECT_URI'
    );
  }

  return { clientId, clientSecret, redirectUri };
}

// Generate OAuth authorization URL
export function getAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getSalesforceConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SALESFORCE_OAUTH_CONFIG.scopes.join(' '),
    prompt: 'consent',
    state,
  });

  return `${SALESFORCE_OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<SalesforceOAuthTokens> {
  const { clientId, clientSecret, redirectUri } = getSalesforceConfig();

  const response = await fetch(SALESFORCE_OAUTH_CONFIG.tokenEndpoint, {
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
    console.error('Salesforce token exchange failed:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }

  const data = await response.json();

  // Salesforce returns expires_in in seconds
  const expiresIn = data.expires_in || 7200; // Default 2 hours

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    instanceUrl: data.instance_url,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    scopes: data.scope ? data.scope.split(' ') : SALESFORCE_OAUTH_CONFIG.scopes,
  };
}

// Refresh access token
export async function refreshAccessToken(
  refreshToken: string,
  instanceUrl: string
): Promise<SalesforceOAuthTokens> {
  const { clientId, clientSecret } = getSalesforceConfig();

  const response = await fetch(SALESFORCE_OAUTH_CONFIG.tokenEndpoint, {
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
    console.error('Salesforce token refresh failed:', error);
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 7200;

  return {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Refresh token doesn't change in Salesforce
    instanceUrl: data.instance_url || instanceUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    scopes: data.scope ? data.scope.split(' ') : SALESFORCE_OAUTH_CONFIG.scopes,
  };
}

// Revoke access token
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(SALESFORCE_OAUTH_CONFIG.revokeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Salesforce token revoke failed:', error);
    throw new Error('Failed to revoke token');
  }
}

// Get user info from Salesforce
export async function getUserInfo(
  accessToken: string,
  instanceUrl: string
): Promise<SalesforceUser> {
  const response = await fetch(`${instanceUrl}${SALESFORCE_OAUTH_CONFIG.userInfoEndpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Salesforce user info');
  }

  const data = await response.json();

  return {
    id: data.user_id,
    username: data.preferred_username || data.email,
    email: data.email,
    name: data.name,
    organizationId: data.organization_id,
  };
}

// Execute SOQL query
export async function query<T>(
  accessToken: string,
  instanceUrl: string,
  soql: string,
  nextRecordsUrl?: string
): Promise<SalesforceQueryResult<T>> {
  const url = nextRecordsUrl
    ? `${instanceUrl}${nextRecordsUrl}`
    : `${SALESFORCE_API_ENDPOINTS.query(instanceUrl)}?q=${encodeURIComponent(soql)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Salesforce query failed:', error);
    throw new Error(`Salesforce query failed: ${response.status}`);
  }

  return response.json();
}

// Get all records from a paginated query
export async function queryAll<T>(
  accessToken: string,
  instanceUrl: string,
  soql: string
): Promise<T[]> {
  const allRecords: T[] = [];
  let result = await query<T>(accessToken, instanceUrl, soql);

  allRecords.push(...result.records);

  while (!result.done && result.nextRecordsUrl) {
    result = await query<T>(accessToken, instanceUrl, soql, result.nextRecordsUrl);
    allRecords.push(...result.records);
  }

  return allRecords;
}

// Get contacts
export async function getContacts(
  accessToken: string,
  instanceUrl: string,
  limit: number = 200,
  lastModifiedSince?: Date
): Promise<SalesforceContact[]> {
  let soql = `SELECT Id, AccountId, FirstName, LastName, Name, Email, Phone, MobilePhone, Title, Department, MailingAddress, CreatedDate, LastModifiedDate FROM Contact`;

  if (lastModifiedSince) {
    soql += ` WHERE LastModifiedDate > ${lastModifiedSince.toISOString()}`;
  }

  soql += ` ORDER BY LastModifiedDate DESC LIMIT ${limit}`;

  return queryAll<SalesforceContact>(accessToken, instanceUrl, soql);
}

// Get accounts
export async function getAccounts(
  accessToken: string,
  instanceUrl: string,
  limit: number = 200,
  lastModifiedSince?: Date
): Promise<SalesforceAccount[]> {
  let soql = `SELECT Id, Name, Type, Industry, Phone, Website, BillingAddress, ShippingAddress, Description, CreatedDate, LastModifiedDate FROM Account`;

  if (lastModifiedSince) {
    soql += ` WHERE LastModifiedDate > ${lastModifiedSince.toISOString()}`;
  }

  soql += ` ORDER BY LastModifiedDate DESC LIMIT ${limit}`;

  return queryAll<SalesforceAccount>(accessToken, instanceUrl, soql);
}

// Get opportunities
export async function getOpportunities(
  accessToken: string,
  instanceUrl: string,
  limit: number = 200,
  lastModifiedSince?: Date,
  stages?: string[]
): Promise<SalesforceOpportunity[]> {
  let soql = `SELECT Id, AccountId, Name, StageName, Amount, CloseDate, Probability, Type, LeadSource, Description, IsClosed, IsWon, ContactId, CreatedDate, LastModifiedDate FROM Opportunity`;

  const conditions: string[] = [];

  if (lastModifiedSince) {
    conditions.push(`LastModifiedDate > ${lastModifiedSince.toISOString()}`);
  }

  if (stages && stages.length > 0) {
    const stageList = stages.map((s) => `'${s}'`).join(',');
    conditions.push(`StageName IN (${stageList})`);
  }

  if (conditions.length > 0) {
    soql += ` WHERE ${conditions.join(' AND ')}`;
  }

  soql += ` ORDER BY LastModifiedDate DESC LIMIT ${limit}`;

  return queryAll<SalesforceOpportunity>(accessToken, instanceUrl, soql);
}

// Get a single contact by ID
export async function getContactById(
  accessToken: string,
  instanceUrl: string,
  contactId: string
): Promise<SalesforceContact | null> {
  const url = SALESFORCE_API_ENDPOINTS.sobjectRecord(instanceUrl, 'Contact', contactId);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch contact');
  }

  return response.json();
}

// Get a single opportunity by ID
export async function getOpportunityById(
  accessToken: string,
  instanceUrl: string,
  opportunityId: string
): Promise<SalesforceOpportunity | null> {
  const url = SALESFORCE_API_ENDPOINTS.sobjectRecord(instanceUrl, 'Opportunity', opportunityId);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch opportunity');
  }

  return response.json();
}

// Create a task in Salesforce (for review notifications)
export async function createTask(
  accessToken: string,
  instanceUrl: string,
  task: {
    WhoId?: string; // Contact or Lead ID
    WhatId?: string; // Account or Opportunity ID
    Subject: string;
    Description?: string;
    Status?: string;
    Priority?: string;
    ActivityDate?: string;
  }
): Promise<{ id: string; success: boolean }> {
  const url = SALESFORCE_API_ENDPOINTS.sobject(instanceUrl, 'Task');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...task,
      Status: task.Status || 'Completed',
      Priority: task.Priority || 'Normal',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create Salesforce task:', error);
    throw new Error('Failed to create task in Salesforce');
  }

  return response.json();
}

// Update a contact in Salesforce
export async function updateContact(
  accessToken: string,
  instanceUrl: string,
  contactId: string,
  data: Partial<SalesforceContact>
): Promise<void> {
  const url = SALESFORCE_API_ENDPOINTS.sobjectRecord(instanceUrl, 'Contact', contactId);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to update Salesforce contact:', error);
    throw new Error('Failed to update contact in Salesforce');
  }
}

// Get opportunity stages (picklist values)
export async function getOpportunityStages(
  accessToken: string,
  instanceUrl: string
): Promise<string[]> {
  const url = SALESFORCE_API_ENDPOINTS.describe(instanceUrl, 'Opportunity');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to describe Opportunity object');
  }

  const data = await response.json();
  const stageField = data.fields.find(
    (f: { name: string; picklistValues?: { value: string }[] }) => f.name === 'StageName'
  );

  if (!stageField?.picklistValues) {
    return [];
  }

  return stageField.picklistValues.map((pv: { value: string }) => pv.value);
}

// Check if token is expired (with 5 minute buffer)
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date(expiresAt) <= new Date(Date.now() + 5 * 60 * 1000);
}

// Get contacts associated with an opportunity
export async function getOpportunityContacts(
  accessToken: string,
  instanceUrl: string,
  opportunityId: string
): Promise<SalesforceContact[]> {
  // First try to get the primary contact
  const opportunity = await getOpportunityById(accessToken, instanceUrl, opportunityId);

  if (opportunity?.ContactId) {
    const contact = await getContactById(accessToken, instanceUrl, opportunity.ContactId);
    if (contact) {
      return [contact];
    }
  }

  // If no primary contact, try to get contacts from the associated account
  if (opportunity?.AccountId) {
    const soql = `SELECT Id, AccountId, FirstName, LastName, Name, Email, Phone, MobilePhone, Title, Department, MailingAddress, CreatedDate, LastModifiedDate FROM Contact WHERE AccountId = '${opportunity.AccountId}' LIMIT 10`;
    return queryAll<SalesforceContact>(accessToken, instanceUrl, soql);
  }

  return [];
}

// Batch query for multiple opportunities' contacts via OpportunityContactRole
export async function getOpportunityContactRoles(
  accessToken: string,
  instanceUrl: string,
  opportunityIds: string[]
): Promise<{ OpportunityId: string; ContactId: string; IsPrimary: boolean; Role?: string }[]> {
  if (opportunityIds.length === 0) return [];

  const idList = opportunityIds.map((id) => `'${id}'`).join(',');
  const soql = `SELECT Id, OpportunityId, ContactId, IsPrimary, Role FROM OpportunityContactRole WHERE OpportunityId IN (${idList})`;

  return queryAll(accessToken, instanceUrl, soql);
}
