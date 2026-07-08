"use server";

import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import {
  exchangeCodeForTokens,
  getUserInfo,
  getOpportunityStages,
  createTask,
  getAuthorizationUrl,
} from "./client";
import { type SalesforceConnection, type SalesforceSyncLog, type ActionResult } from "./types";
import { getValidAccessToken, syncSalesforceConnection } from "./sync-service";

// Get user's role and organization ID
async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
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

  if (context.role !== "admin") {
    return null;
  }

  return {
    userId: context.id,
    organizationId: context.organization_id,
  };
}

// Generate OAuth state and URL
export async function initiateSalesforceOAuth(): Promise<ActionResult<{ url: string }>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  // Create state with organization info
  const state = Buffer.from(
    JSON.stringify({
      organizationId: context.organizationId,
      userId: context.userId,
      timestamp: Date.now(),
    })
  ).toString("base64url");

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
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    const { organizationId, userId: _userId } = stateData;

    // Validate timestamp (5 minute expiry)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return { success: false, error: "OAuth session expired" };
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info
    const userInfo = await getUserInfo(tokens.accessToken, tokens.instanceUrl);

    const adminClient = createUntypedAdminClient();

    // Check if a connection already exists for this Salesforce org
    const { data: existingConnection } = await adminClient
      .from("salesforce_connections")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("salesforce_org_id", userInfo.organizationId)
      .eq("is_active", true)
      .single();

    if (existingConnection) {
      // Update existing connection
      await adminClient
        .from("salesforce_connections")
        .update({
          salesforce_user_id: userInfo.id,
          salesforce_username: userInfo.username,
          instance_url: tokens.instanceUrl,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_expires_at: tokens.expiresAt.toISOString(),
          scopes: tokens.scopes,
          sync_status: "pending",
          sync_error: null,
        })
        .eq("id", existingConnection.id);

      return { success: true, data: { connectionId: existingConnection.id } };
    }

    // Create new connection
    const { data: connection, error } = await adminClient
      .from("salesforce_connections")
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
        sync_status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create Salesforce connection:", error);
      return { success: false, error: "Failed to save Salesforce connection" };
    }

    return { success: true, data: { connectionId: connection.id } };
  } catch (error) {
    console.error("Salesforce OAuth callback error:", error);
    return { success: false, error: "Failed to complete Salesforce authentication" };
  }
}

// Get Salesforce connection for organization
export async function getSalesforceConnection(): Promise<
  ActionResult<SalesforceConnection | null>
> {
  const context = await getUserContext();
  if (!context || !context.organization_id) {
    return { success: false, error: "Unauthorized" };
  }

  // Use untyped client for salesforce_connections table (not in generated types)
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("salesforce_connections")
    .select("*")
    .eq("organization_id", context.organization_id)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Failed to fetch Salesforce connection:", error);
    return { success: false, error: "Failed to fetch Salesforce connection" };
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
    syncStatus: data.sync_status as SalesforceConnection["syncStatus"],
    syncError: data.sync_error,
    syncContacts: data.sync_contacts ?? true,
    syncAccounts: data.sync_accounts ?? true,
    syncOpportunities: data.sync_opportunities ?? true,
    autoCreateSurveys: data.auto_create_surveys ?? false,
    opportunityStageTrigger: data.opportunity_stage_trigger ?? "Closed Won",
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
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  // Use untyped client for salesforce_connections table (not in generated types)
  const supabase = createUntypedAdminClient();

  const { error } = await supabase
    .from("salesforce_connections")
    .update({ is_active: false })
    .eq("id", connectionId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Failed to disconnect Salesforce:", error);
    return { success: false, error: "Failed to disconnect Salesforce" };
  }

  revalidatePath("/dashboard/settings");
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
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  // Use untyped client for salesforce_connections table (not in generated types)
  const supabase = createUntypedAdminClient();

  const updateData: Record<string, unknown> = {};
  if (settings.syncContacts !== undefined) updateData.sync_contacts = settings.syncContacts;
  if (settings.syncAccounts !== undefined) updateData.sync_accounts = settings.syncAccounts;
  if (settings.syncOpportunities !== undefined)
    updateData.sync_opportunities = settings.syncOpportunities;
  if (settings.autoCreateSurveys !== undefined)
    updateData.auto_create_surveys = settings.autoCreateSurveys;
  if (settings.opportunityStageTrigger !== undefined)
    updateData.opportunity_stage_trigger = settings.opportunityStageTrigger;

  const { error } = await supabase
    .from("salesforce_connections")
    .update(updateData)
    .eq("id", connectionId)
    .eq("organization_id", context.organizationId);

  if (error) {
    console.error("Failed to update Salesforce settings:", error);
    return { success: false, error: "Failed to update settings" };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// Get available opportunity stages
export async function getAvailableOpportunityStages(
  connectionId: string
): Promise<ActionResult<string[]>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  const tokenInfo = await getValidAccessToken(connectionId);
  if (!tokenInfo) {
    return { success: false, error: "Failed to get valid access token" };
  }

  try {
    const stages = await getOpportunityStages(tokenInfo.accessToken, tokenInfo.instanceUrl);
    return { success: true, data: stages };
  } catch (error) {
    console.error("Failed to fetch opportunity stages:", error);
    return { success: false, error: "Failed to fetch opportunity stages" };
  }
}

// Sync Salesforce data
export async function syncSalesforceData(
  connectionId: string,
  syncType: "full" | "incremental" | "manual" = "manual",
  objectTypes?: ("contacts" | "accounts" | "opportunities")[]
): Promise<ActionResult<SalesforceSyncLog>> {
  const context = await requireAdminRole();
  if (!context) {
    return { success: false, error: "Unauthorized - Admin role required" };
  }

  return syncSalesforceConnection({
    connectionId,
    organizationId: context.organizationId,
    syncType,
    objectTypes,
    revalidateDashboard: true,
  });
}

// Sync review data back to Salesforce
export async function syncReviewToSalesforce(
  reviewId: string,
  connectionId: string
): Promise<ActionResult> {
  const context = await getUserContext();
  if (!context || !context.organization_id) {
    return { success: false, error: "Unauthorized" };
  }

  const adminClient = createUntypedAdminClient();

  // Get review details
  const { data: review, error: reviewError } = await adminClient
    .from("reviews")
    .select("*, loan_officers(full_name)")
    .eq("id", reviewId)
    .eq("organization_id", context.organization_id)
    .single();

  if (reviewError || !review) {
    return { success: false, error: "Review not found" };
  }

  // Get Salesforce connection
  const tokenInfo = await getValidAccessToken(connectionId);
  if (!tokenInfo) {
    return { success: false, error: "Failed to get valid access token" };
  }

  try {
    // Try to find associated Salesforce contact
    let salesforceContactId: string | undefined;
    let salesforceAccountId: string | undefined;

    // If review came from a survey, check if survey has Salesforce link
    if (review.survey_response_id) {
      const { data: surveyResponse } = await adminClient
        .from("survey_responses")
        .select("survey_id, surveys!inner(source_metadata)")
        .eq("id", review.survey_response_id)
        .single();

      if (surveyResponse?.surveys) {
        const surveySourceMetadata = (
          surveyResponse.surveys as unknown as { source_metadata: Record<string, unknown> | null }
        ).source_metadata;
        if (surveySourceMetadata?.salesforce_contact_id) {
          salesforceContactId = surveySourceMetadata.salesforce_contact_id as string;
          salesforceAccountId = surveySourceMetadata.salesforce_account_id as string | undefined;
        }
      }
    }

    // Fallback: Try to find contact by customer name if we have it
    if (!salesforceContactId && review.customer_name) {
      const { data: mapping } = await adminClient
        .from("salesforce_contact_mappings")
        .select("salesforce_contact_id, salesforce_account_id")
        .eq("connection_id", connectionId)
        .eq("customer_name", review.customer_name)
        .single();

      if (mapping) {
        salesforceContactId = mapping.salesforce_contact_id;
        salesforceAccountId = mapping.salesforce_account_id ?? undefined;
      }
    }

    // Create a task in Salesforce
    const taskSubject = `Customer Review: ${review.rating} stars from ${review.customer_name || "Customer"}`;
    const taskDescription = `
Rating: ${review.rating} out of 5 stars
${review.text ? `\nReview:\n${review.text}` : ""}
${review.loan_officers ? `\nLoan Officer: ${(review.loan_officers as { full_name: string }).full_name}` : ""}
Source: ${review.source || "Internal Survey"}
Date: ${review.review_date || review.created_at}
    `.trim();

    const taskResult = await createTask(tokenInfo.accessToken, tokenInfo.instanceUrl, {
      WhoId: salesforceContactId,
      WhatId: salesforceAccountId,
      Subject: taskSubject,
      Description: taskDescription,
      Status: "Completed",
      Priority: review.rating <= 2 ? "High" : "Normal",
      ActivityDate: new Date().toISOString().split("T")[0],
    });

    // Record the sync
    await adminClient
      .from("salesforce_review_data")
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
      .eq("review_id", reviewId)
      .eq("connection_id", connectionId);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Record the error
    await adminClient
      .from("salesforce_review_data")
      .upsert({
        organization_id: context.organization_id,
        connection_id: connectionId,
        review_id: reviewId,
        synced_to_salesforce: false,
        sync_error: errorMessage,
      })
      .eq("review_id", reviewId)
      .eq("connection_id", connectionId);

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
    return { success: false, error: "Unauthorized" };
  }

  // Use untyped client for salesforce_sync_logs table (not in generated types)
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("salesforce_sync_logs")
    .select("*")
    .eq("connection_id", connectionId)
    .eq("organization_id", context.organization_id)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: "Failed to fetch sync logs" };
  }

  const logs: SalesforceSyncLog[] = (data || []).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    connectionId: row.connection_id,
    syncType: row.sync_type as SalesforceSyncLog["syncType"],
    syncDirection: row.sync_direction as SalesforceSyncLog["syncDirection"],
    objectType: row.object_type,
    status: row.status as SalesforceSyncLog["status"],
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
