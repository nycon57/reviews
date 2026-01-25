'use server';

import { createAdminClient, createUntypedAdminClient } from '@/lib/supabase/admin';
import { unifiedGetUser } from '@/lib/auth/actions';
import { revalidatePath } from 'next/cache';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserInfo,
  getContacts,
  getOpportunities,
  getOpportunityStages,
  getOpportunityContacts,
  createTask,
  isTokenExpired,
  getAuthorizationUrl,
} from './client';
import {
  type SalesforceConnection,
  type SalesforceSyncLog,
  type ActionResult,
} from './types';
import type { Json } from '@/types/database.types';

// Get user's role and organization ID
async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from('users')
    .select('id, organization_id, role')
    .eq('id', user.id)
    .single();

  return userData;
}

// Require admin role for Salesforce management
async function requireAdminRole(): Promise<{
  userId: string;
  organizationId: string;
} | null> {
  const context = await getUserContext();

  if (!context || !context.organization_id) {
    return null;
  }

  if (context.role !== 'admin') {
    return null;
  }

  return {
    userId: context.id,
    organizationId: context.organization_id,
  };
}

// Get valid access token (refreshing if needed)
async function getValidAccessToken(connectionId: string): Promise<{
  accessToken: string;
  instanceUrl: string;
} | null> {
  const adminClient = createUntypedAdminClient();

  const { data: connection, error } = await adminClient
    .from('salesforce_connections')
    .select('access_token, refresh_token, token_expires_at, instance_url')
    .eq('id', connectionId)
    .eq('is_active', true)
    .single();

  if (error || !connection) {
    return null;
  }

  // Check if token is expired
  if (isTokenExpired(new Date(connection.token_expires_at))) {
    try {
      const newTokens = await refreshAccessToken(
        connection.refresh_token,
        connection.instance_url
      );

      // Update tokens in database
      await adminClient
        .from('salesforce_connections')
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          token_expires_at: newTokens.expiresAt.toISOString(),
          instance_url: newTokens.instanceUrl,
        })
        .eq('id', connectionId);

      return {
        accessToken: newTokens.accessToken,
        instanceUrl: newTokens.instanceUrl,
      };
    } catch (error) {
      console.error('Failed to refresh Salesforce token:', error);
      return null;
    }
  }

  return {
    accessToken: connection.access_token,
    instanceUrl: connection.instance_url,
  };
}

// Generate OAuth state and URL
export async function initiateSalesforceOAuth(): Promise<ActionResult<{ url: string }>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Admin role required' };
  }

  // Create state with organization info
  const state = Buffer.from(
    JSON.stringify({
      organizationId: context.organizationId,
      userId: context.userId,
      timestamp: Date.now(),
    })
  ).toString('base64url');

  const url = getAuthorizationUrl(state);

  return { success: true, data: { url } };
}

// Handle OAuth callback and create connection
export async function handleSalesforceOAuthCallback(
  code: string,
  state: string
): Promise<ActionResult<{ connectionId: string }>> {
  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    const { organizationId, userId: _userId } = stateData;

    // Validate timestamp (5 minute expiry)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return { success: false, error: 'OAuth session expired' };
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info
    const userInfo = await getUserInfo(tokens.accessToken, tokens.instanceUrl);

    const adminClient = createUntypedAdminClient();

    // Check if a connection already exists for this Salesforce org
    const { data: existingConnection } = await adminClient
      .from('salesforce_connections')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('salesforce_org_id', userInfo.organizationId)
      .eq('is_active', true)
      .single();

    if (existingConnection) {
      // Update existing connection
      await adminClient
        .from('salesforce_connections')
        .update({
          salesforce_user_id: userInfo.id,
          salesforce_username: userInfo.username,
          instance_url: tokens.instanceUrl,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt.toISOString(),
          scopes: tokens.scopes,
          sync_status: 'pending',
          sync_error: null,
        })
        .eq('id', existingConnection.id);

      return { success: true, data: { connectionId: existingConnection.id } };
    }

    // Create new connection
    const { data: connection, error } = await adminClient
      .from('salesforce_connections')
      .insert({
        organization_id: organizationId,
        instance_url: tokens.instanceUrl,
        salesforce_org_id: userInfo.organizationId,
        salesforce_user_id: userInfo.id,
        salesforce_username: userInfo.username,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_expires_at: tokens.expiresAt.toISOString(),
        scopes: tokens.scopes,
        is_active: true,
        sync_status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create Salesforce connection:', error);
      return { success: false, error: 'Failed to save Salesforce connection' };
    }

    return { success: true, data: { connectionId: connection.id } };
  } catch (error) {
    console.error('Salesforce OAuth callback error:', error);
    return { success: false, error: 'Failed to complete Salesforce authentication' };
  }
}

// Get Salesforce connection for organization
export async function getSalesforceConnection(): Promise<ActionResult<SalesforceConnection | null>> {
  const context = await getUserContext();
  if (!context || !context.organization_id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Use untyped client for salesforce_connections table (not in generated types)
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from('salesforce_connections')
    .select('*')
    .eq('organization_id', context.organization_id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Failed to fetch Salesforce connection:', error);
    return { success: false, error: 'Failed to fetch Salesforce connection' };
  }

  if (!data) {
    return { success: true, data: null };
  }

  const connection: SalesforceConnection = {
    id: data.id,
    organizationId: data.organization_id,
    instanceUrl: data.instance_url,
    salesforceOrgId: data.salesforce_org_id,
    salesforceUserId: data.salesforce_user_id,
    salesforceUsername: data.salesforce_username,
    isActive: data.is_active ?? true,
    lastSyncAt: data.last_sync_at,
    syncStatus: data.sync_status as SalesforceConnection['syncStatus'],
    syncError: data.sync_error,
    syncContacts: data.sync_contacts ?? true,
    syncAccounts: data.sync_accounts ?? true,
    syncOpportunities: data.sync_opportunities ?? true,
    autoCreateSurveys: data.auto_create_surveys ?? false,
    opportunityStageTrigger: data.opportunity_stage_trigger ?? 'Closed Won',
    contactsSynced: data.contacts_synced ?? 0,
    accountsSynced: data.accounts_synced ?? 0,
    opportunitiesSynced: data.opportunities_synced ?? 0,
    fieldMappings: (data.field_mappings as Record<string, string>) || {},
    metadata: (data.metadata as Record<string, unknown>) || {},
    createdAt: data.created_at!,
    updatedAt: data.updated_at!,
  };

  return { success: true, data: connection };
}

// Disconnect Salesforce
export async function disconnectSalesforce(connectionId: string): Promise<ActionResult> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Admin role required' };
  }

  // Use untyped client for salesforce_connections table (not in generated types)
  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from('salesforce_connections')
    .update({ is_active: false })
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId);

  if (error) {
    console.error('Failed to disconnect Salesforce:', error);
    return { success: false, error: 'Failed to disconnect Salesforce' };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Update Salesforce connection settings
export async function updateSalesforceSettings(
  connectionId: string,
  settings: {
    syncContacts?: boolean;
    syncAccounts?: boolean;
    syncOpportunities?: boolean;
    autoCreateSurveys?: boolean;
    opportunityStageTrigger?: string;
  }
): Promise<ActionResult> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Admin role required' };
  }

  // Use untyped client for salesforce_connections table (not in generated types)
  const supabase = createUntypedAdminClient();

  const updateData: Record<string, unknown> = {};
  if (settings.syncContacts !== undefined)
    updateData.sync_contacts = settings.syncContacts;
  if (settings.syncAccounts !== undefined)
    updateData.sync_accounts = settings.syncAccounts;
  if (settings.syncOpportunities !== undefined)
    updateData.sync_opportunities = settings.syncOpportunities;
  if (settings.autoCreateSurveys !== undefined)
    updateData.auto_create_surveys = settings.autoCreateSurveys;
  if (settings.opportunityStageTrigger !== undefined)
    updateData.opportunity_stage_trigger = settings.opportunityStageTrigger;

  const { error } = await supabase
    .from('salesforce_connections')
    .update(updateData)
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId);

  if (error) {
    console.error('Failed to update Salesforce settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}

// Get available opportunity stages
export async function getAvailableOpportunityStages(
  connectionId: string
): Promise<ActionResult<string[]>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Admin role required' };
  }

  const tokenInfo = await getValidAccessToken(connectionId);
  if (!tokenInfo) {
    return { success: false, error: 'Failed to get valid access token' };
  }

  try {
    const stages = await getOpportunityStages(
      tokenInfo.accessToken,
      tokenInfo.instanceUrl
    );
    return { success: true, data: stages };
  } catch (error) {
    console.error('Failed to fetch opportunity stages:', error);
    return { success: false, error: 'Failed to fetch opportunity stages' };
  }
}

// Sync Salesforce data
export async function syncSalesforceData(
  connectionId: string,
  syncType: 'full' | 'incremental' | 'manual' = 'manual',
  objectTypes?: ('contacts' | 'accounts' | 'opportunities')[]
): Promise<ActionResult<SalesforceSyncLog>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: 'Unauthorized - Admin role required' };
  }

  const adminClient = createUntypedAdminClient();

  // Get connection
  const { data: connection, error: connError } = await adminClient
    .from('salesforce_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('organization_id', context.organizationId)
    .eq('is_active', true)
    .single();

  if (connError || !connection) {
    return { success: false, error: 'Connection not found' };
  }

  // Create sync log
  const { data: syncLog, error: logError } = await adminClient
    .from('salesforce_sync_logs')
    .insert({
      organization_id: context.organizationId,
      connection_id: connectionId,
      sync_type: syncType,
      sync_direction: 'inbound',
      status: 'started',
    })
    .select()
    .single();

  if (logError || !syncLog) {
    return { success: false, error: 'Failed to start sync' };
  }

  // Update connection status
  await adminClient
    .from('salesforce_connections')
    .update({ sync_status: 'syncing' })
    .eq('id', connectionId);

  const startTime = Date.now();
  let recordsFetched = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  const errors: string[] = [];

  try {
    // Get valid access token
    const tokenInfo = await getValidAccessToken(connectionId);
    if (!tokenInfo) {
      throw new Error('Failed to get valid access token');
    }

    const typesToSync = objectTypes || [];
    if (typesToSync.length === 0) {
      if (connection.sync_contacts) typesToSync.push('contacts');
      if (connection.sync_accounts) typesToSync.push('accounts');
      if (connection.sync_opportunities) typesToSync.push('opportunities');
    }

    // Get last sync time for incremental sync
    const lastSyncAt =
      syncType === 'incremental' && connection.last_sync_at
        ? new Date(connection.last_sync_at)
        : undefined;

    // Sync contacts
    if (typesToSync.includes('contacts')) {
      try {
        const contacts = await getContacts(
          tokenInfo.accessToken,
          tokenInfo.instanceUrl,
          500,
          lastSyncAt
        );

        recordsFetched += contacts.length;

        for (const contact of contacts) {
          try {
            // Upsert contact mapping
            const { data: existing } = await adminClient
              .from('salesforce_contact_mappings')
              .select('id')
              .eq('connection_id', connectionId)
              .eq('salesforce_contact_id', contact.Id)
              .single();

            if (existing) {
              await adminClient
                .from('salesforce_contact_mappings')
                .update({
                  salesforce_account_id: contact.AccountId,
                  customer_email: contact.Email,
                  customer_name: contact.Name,
                  customer_phone: contact.Phone || contact.MobilePhone,
                  salesforce_data: contact as unknown as Json,
                  last_synced_at: new Date().toISOString(),
                  sync_status: 'synced',
                })
                .eq('id', existing.id);
              recordsUpdated++;
            } else {
              await adminClient.from('salesforce_contact_mappings').insert({
                organization_id: context.organizationId,
                connection_id: connectionId,
                salesforce_contact_id: contact.Id,
                salesforce_account_id: contact.AccountId,
                customer_email: contact.Email,
                customer_name: contact.Name,
                customer_phone: contact.Phone || contact.MobilePhone,
                salesforce_data: contact as unknown as Json,
              });
              recordsCreated++;
            }
          } catch (err) {
            recordsFailed++;
            errors.push(`Contact ${contact.Id}: ${err}`);
          }
        }
      } catch (err) {
        errors.push(`Contact sync failed: ${err}`);
      }
    }

    // Sync opportunities
    if (typesToSync.includes('opportunities')) {
      try {
        const opportunities = await getOpportunities(
          tokenInfo.accessToken,
          tokenInfo.instanceUrl,
          500,
          lastSyncAt
        );

        recordsFetched += opportunities.length;

        for (const opp of opportunities) {
          try {
            // Upsert opportunity mapping
            const { data: existing } = await adminClient
              .from('salesforce_opportunity_mappings')
              .select('id, survey_id')
              .eq('connection_id', connectionId)
              .eq('salesforce_opportunity_id', opp.Id)
              .single();

            if (existing) {
              await adminClient
                .from('salesforce_opportunity_mappings')
                .update({
                  salesforce_account_id: opp.AccountId,
                  salesforce_contact_id: opp.ContactId,
                  opportunity_name: opp.Name,
                  opportunity_stage: opp.StageName,
                  opportunity_amount: opp.Amount,
                  close_date: opp.CloseDate,
                  salesforce_data: opp as unknown as Json,
                  last_synced_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
              recordsUpdated++;

              // Check if we should trigger a survey for closed-won opportunities
              if (
                connection.auto_create_surveys &&
                opp.StageName === connection.opportunity_stage_trigger &&
                !existing.survey_id
              ) {
                await triggerSurveyForOpportunity(
                  adminClient,
                  context.organizationId,
                  connectionId,
                  existing.id,
                  opp,
                  tokenInfo
                );
              }
            } else {
              const { data: newMapping } = await adminClient
                .from('salesforce_opportunity_mappings')
                .insert({
                  organization_id: context.organizationId,
                  connection_id: connectionId,
                  salesforce_opportunity_id: opp.Id,
                  salesforce_account_id: opp.AccountId,
                  salesforce_contact_id: opp.ContactId,
                  opportunity_name: opp.Name,
                  opportunity_stage: opp.StageName,
                  opportunity_amount: opp.Amount,
                  close_date: opp.CloseDate,
                  salesforce_data: opp as unknown as Json,
                })
                .select('id')
                .single();
              recordsCreated++;

              // Check if we should trigger a survey
              if (
                connection.auto_create_surveys &&
                opp.StageName === connection.opportunity_stage_trigger &&
                newMapping
              ) {
                await triggerSurveyForOpportunity(
                  adminClient,
                  context.organizationId,
                  connectionId,
                  newMapping.id,
                  opp,
                  tokenInfo
                );
              }
            }
          } catch (err) {
            recordsFailed++;
            errors.push(`Opportunity ${opp.Id}: ${err}`);
          }
        }
      } catch (err) {
        errors.push(`Opportunity sync failed: ${err}`);
      }
    }

    // Update connection with sync results
    const updateStats: Record<string, unknown> = {
      sync_status: 'completed',
      last_sync_at: new Date().toISOString(),
      sync_error: errors.length > 0 ? errors[0] : null,
    };

    if (typesToSync.includes('contacts')) {
      updateStats.contacts_synced = recordsCreated + recordsUpdated;
    }
    if (typesToSync.includes('opportunities')) {
      updateStats.opportunities_synced = recordsCreated + recordsUpdated;
    }

    await adminClient
      .from('salesforce_connections')
      .update(updateStats)
      .eq('id', connectionId);

    // Update sync log
    const durationMs = Date.now() - startTime;
    const { data: completedLog } = await adminClient
      .from('salesforce_sync_logs')
      .update({
        status: 'completed',
        records_fetched: recordsFetched,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        errors: errors.length > 0 ? errors : null,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      })
      .eq('id', syncLog.id)
      .select()
      .single();

    revalidatePath('/dashboard/settings');

    return {
      success: true,
      data: {
        id: completedLog?.id || syncLog.id,
        organizationId: context.organizationId,
        connectionId,
        syncType,
        syncDirection: 'inbound',
        objectType: typesToSync.join(','),
        status: 'completed',
        recordsFetched,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
        errors,
        startedAt: syncLog.started_at!,
        completedAt: new Date().toISOString(),
        durationMs,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    // Update connection with error
    await adminClient
      .from('salesforce_connections')
      .update({
        sync_status: 'failed',
        sync_error: errorMessage,
      })
      .eq('id', connectionId);

    // Update sync log with error
    await adminClient
      .from('salesforce_sync_logs')
      .update({
        status: 'failed',
        errors,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      })
      .eq('id', syncLog.id);

    return { success: false, error: `Sync failed: ${errorMessage}` };
  }
}

// Helper function to trigger survey for opportunity
async function triggerSurveyForOpportunity(
  adminClient: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  connectionId: string,
  mappingId: string,
  opportunity: { Id: string; Name: string; AccountId?: string; ContactId?: string },
  tokenInfo: { accessToken: string; instanceUrl: string }
): Promise<void> {
  try {
    // Get contacts for this opportunity
    const contacts = await getOpportunityContacts(
      tokenInfo.accessToken,
      tokenInfo.instanceUrl,
      opportunity.Id
    );

    const contactWithEmail = contacts.find((c) => c.Email);
    if (!contactWithEmail || !contactWithEmail.Email) {
      console.warn(`No contact with email found for opportunity ${opportunity.Id}`);
      return;
    }

    const contact = contactWithEmail;
    const contactEmail = contactWithEmail.Email; // Guaranteed to exist after check

    // Get default survey template
    const { data: template } = await adminClient
      .from('survey_templates')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (!template) {
      console.warn('No default survey template found');
      return;
    }

    // Find a loan officer to assign (could be improved with mapping)
    const { data: loanOfficer } = await adminClient
      .from('users')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!loanOfficer) {
      console.warn('No active loan officer found');
      return;
    }

    // Create survey
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { data: survey, error: surveyError } = await adminClient
      .from('surveys')
      .insert({
        organization_id: organizationId,
        template_id: template.id,
        user_id: loanOfficer.id,
        customer_name: contact.Name,
        customer_email: contactEmail,
        customer_phone: contact.Phone || contact.MobilePhone || null,
        transaction_id: opportunity.Id,
        transaction_type: 'salesforce_opportunity',
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        source: 'salesforce',
        source_metadata: {
          salesforce_opportunity_id: opportunity.Id,
          salesforce_opportunity_name: opportunity.Name,
          salesforce_contact_id: contact.Id,
          salesforce_account_id: opportunity.AccountId,
          connection_id: connectionId,
        },
      })
      .select('id')
      .single();

    if (surveyError) {
      console.error('Failed to create survey:', surveyError);
      return;
    }

    // Update opportunity mapping with survey reference
    await adminClient
      .from('salesforce_opportunity_mappings')
      .update({
        survey_id: survey.id,
        survey_triggered_at: new Date().toISOString(),
      })
      .eq('id', mappingId);

    // Add to distribution queue
    await adminClient.from('survey_distribution_queue').insert({
      organization_id: organizationId,
      survey_id: survey.id,
      type: 'initial',
      scheduled_at: new Date().toISOString(),
      priority: 1,
    });

    console.log(
      `Survey ${survey.id} created for Salesforce opportunity ${opportunity.Id}`
    );
  } catch (error) {
    console.error('Failed to trigger survey for opportunity:', error);
  }
}

// Sync review data back to Salesforce
export async function syncReviewToSalesforce(
  reviewId: string,
  connectionId: string
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context || !context.organization_id) {
    return { success: false, error: 'Unauthorized' };
  }

  const adminClient = createUntypedAdminClient();

  // Get review details
  const { data: review, error: reviewError } = await adminClient
    .from('reviews')
    .select('*, loan_officers(full_name)')
    .eq('id', reviewId)
    .eq('organization_id', context.organization_id)
    .single();

  if (reviewError || !review) {
    return { success: false, error: 'Review not found' };
  }

  // Get Salesforce connection
  const tokenInfo = await getValidAccessToken(connectionId);
  if (!tokenInfo) {
    return { success: false, error: 'Failed to get valid access token' };
  }

  try {
    // Try to find associated Salesforce contact
    let salesforceContactId: string | undefined;
    let salesforceAccountId: string | undefined;

    // If review came from a survey, check if survey has Salesforce link
    if (review.survey_response_id) {
      const { data: surveyResponse } = await adminClient
        .from('survey_responses')
        .select('survey_id, surveys!inner(source_metadata)')
        .eq('id', review.survey_response_id)
        .single();

      if (surveyResponse?.surveys) {
        const surveySourceMetadata = (surveyResponse.surveys as unknown as { source_metadata: Record<string, unknown> | null }).source_metadata;
        if (surveySourceMetadata?.salesforce_contact_id) {
          salesforceContactId = surveySourceMetadata.salesforce_contact_id as string;
          salesforceAccountId = surveySourceMetadata.salesforce_account_id as string | undefined;
        }
      }
    }

    // Fallback: Try to find contact by customer name if we have it
    if (!salesforceContactId && review.customer_name) {
      const { data: mapping } = await adminClient
        .from('salesforce_contact_mappings')
        .select('salesforce_contact_id, salesforce_account_id')
        .eq('connection_id', connectionId)
        .eq('customer_name', review.customer_name)
        .single();

      if (mapping) {
        salesforceContactId = mapping.salesforce_contact_id;
        salesforceAccountId = mapping.salesforce_account_id ?? undefined;
      }
    }

    // Create a task in Salesforce
    const taskSubject = `Customer Review: ${review.rating} stars from ${review.customer_name || 'Customer'}`;
    const taskDescription = `
Rating: ${review.rating} out of 5 stars
${review.text ? `\nReview:\n${review.text}` : ''}
${review.loan_officers ? `\nLoan Officer: ${(review.loan_officers as { full_name: string }).full_name}` : ''}
Source: ${review.source || 'Internal Survey'}
Date: ${review.review_date || review.created_at}
    `.trim();

    const taskResult = await createTask(
      tokenInfo.accessToken,
      tokenInfo.instanceUrl,
      {
        WhoId: salesforceContactId,
        WhatId: salesforceAccountId,
        Subject: taskSubject,
        Description: taskDescription,
        Status: 'Completed',
        Priority: review.rating <= 2 ? 'High' : 'Normal',
        ActivityDate: new Date().toISOString().split('T')[0],
      }
    );

    // Record the sync
    await adminClient
      .from('salesforce_review_data')
      .upsert({
        organization_id: context.organization_id,
        connection_id: connectionId,
        review_id: reviewId,
        salesforce_contact_id: salesforceContactId,
        salesforce_account_id: salesforceAccountId,
        synced_to_salesforce: true,
        salesforce_record_id: taskResult.id,
        synced_at: new Date().toISOString(),
        sync_error: null,
      })
      .eq('review_id', reviewId)
      .eq('connection_id', connectionId);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Record the error
    await adminClient
      .from('salesforce_review_data')
      .upsert({
        organization_id: context.organization_id,
        connection_id: connectionId,
        review_id: reviewId,
        synced_to_salesforce: false,
        sync_error: errorMessage,
      })
      .eq('review_id', reviewId)
      .eq('connection_id', connectionId);

    return { success: false, error: `Failed to sync to Salesforce: ${errorMessage}` };
  }
}

// Get sync logs
export async function getSalesforceSyncLogs(
  connectionId: string,
  limit: number = 10
): Promise<ActionResult<SalesforceSyncLog[]>> {
  const context = await getUserContext();
  if (!context || !context.organization_id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Use untyped client for salesforce_sync_logs table (not in generated types)
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from('salesforce_sync_logs')
    .select('*')
    .eq('connection_id', connectionId)
    .eq('organization_id', context.organization_id)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: 'Failed to fetch sync logs' };
  }

  const logs: SalesforceSyncLog[] = (data || []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    connectionId: row.connection_id,
    syncType: row.sync_type as SalesforceSyncLog['syncType'],
    syncDirection: row.sync_direction as SalesforceSyncLog['syncDirection'],
    objectType: row.object_type,
    status: row.status as SalesforceSyncLog['status'],
    recordsFetched: row.records_fetched ?? 0,
    recordsCreated: row.records_created ?? 0,
    recordsUpdated: row.records_updated ?? 0,
    recordsFailed: row.records_failed ?? 0,
    errors: (row.errors as string[]) || [],
    startedAt: row.started_at!,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
  }));

  return { success: true, data: logs };
}
