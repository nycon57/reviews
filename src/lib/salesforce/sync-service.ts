import { revalidatePath } from "next/cache";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/contacts/actions";
import { matchOpportunityOwnerToUser } from "./attribution";
import {
  getContacts,
  getOpportunities,
  getOpportunityContacts,
  isTokenExpired,
  refreshAccessToken,
} from "./client";
import type { ActionResult, SalesforceSyncLog } from "./types";
import type { Json } from "@/types/database.types";

type SalesforceObjectType = "contacts" | "accounts" | "opportunities";
type SalesforceSyncType = "full" | "incremental" | "manual";

interface SyncSalesforceConnectionParams {
  connectionId: string;
  organizationId: string;
  syncType?: SalesforceSyncType;
  objectTypes?: SalesforceObjectType[];
  revalidateDashboard?: boolean;
}

async function getValidAccessToken(connectionId: string): Promise<{
  accessToken: string;
  instanceUrl: string;
} | null> {
  const adminClient = createUntypedAdminClient();

  const { data: connection, error } = await adminClient
    .from("salesforce_connections")
    .select("access_token, refresh_token, token_expires_at, instance_url")
    .eq("id", connectionId)
    .eq("is_active", true)
    .single();

  if (error || !connection) {
    return null;
  }

  if (isTokenExpired(new Date(connection.token_expires_at))) {
    try {
      const newTokens = await refreshAccessToken(connection.refresh_token, connection.instance_url);

      await adminClient
        .from("salesforce_connections")
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          token_expires_at: newTokens.expiresAt.toISOString(),
          instance_url: newTokens.instanceUrl,
        })
        .eq("id", connectionId);

      return {
        accessToken: newTokens.accessToken,
        instanceUrl: newTokens.instanceUrl,
      };
    } catch (error) {
      console.error("Failed to refresh Salesforce token:", error);
      return null;
    }
  }

  return {
    accessToken: connection.access_token,
    instanceUrl: connection.instance_url,
  };
}

async function resolveHeldAssignee(
  adminClient: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string
): Promise<string | null> {
  const { data: org } = await adminClient
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .maybeSingle();
  const settings = ((org as { settings?: Record<string, unknown> } | null)?.settings ??
    {}) as Record<string, unknown>;
  const configured =
    typeof settings.acquisitionDefaultAssignee === "string"
      ? (settings.acquisitionDefaultAssignee as string)
      : null;

  if (configured) {
    const { data: user } = await adminClient
      .from("users")
      .select("id")
      .eq("id", configured)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();
    if (user) return (user as { id: string }).id;
  }

  const { data: admin } = await adminClient
    .from("users")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("role", "admin")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (admin as { id: string } | null)?.id ?? null;
}

async function triggerSurveyForOpportunity(
  adminClient: ReturnType<typeof createUntypedAdminClient>,
  organizationId: string,
  connectionId: string,
  mappingId: string,
  opportunity: {
    Id: string;
    Name: string;
    AccountId?: string;
    ContactId?: string;
    OwnerId?: string;
    Owner?: { Email?: string; Name?: string };
  },
  tokenInfo: { accessToken: string; instanceUrl: string }
): Promise<void> {
  try {
    const contacts = await getOpportunityContacts(
      tokenInfo.accessToken,
      tokenInfo.instanceUrl,
      opportunity.Id
    );

    const contactWithEmail = contacts.find((contact) => contact.Email);
    if (!contactWithEmail || !contactWithEmail.Email) {
      console.warn(`No contact with email found for opportunity ${opportunity.Id}`);
      return;
    }

    const contact = contactWithEmail;
    const contactEmail = contactWithEmail.Email;

    const { data: template } = await adminClient
      .from("survey_templates")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .eq("is_default", true)
      .single();

    if (!template) {
      console.warn("No default survey template found");
      return;
    }

    const ownerEmail = opportunity.Owner?.Email?.trim().toLowerCase() || null;
    let assigneeUserId: string | null = null;

    if (ownerEmail) {
      const { data: orgUsers } = await adminClient
        .from("users")
        .select("id, email")
        .eq("organization_id", organizationId)
        .eq("is_active", true);
      assigneeUserId = matchOpportunityOwnerToUser(
        ownerEmail,
        (orgUsers as Array<{ id: string; email: string | null }> | null) ?? []
      );
    }

    const heldReason = assigneeUserId ? null : "salesforce_owner_unmatched";
    if (heldReason) {
      assigneeUserId = await resolveHeldAssignee(adminClient, organizationId);
    }

    const contactOwnerUserId = heldReason ? null : assigneeUserId;

    let contactId: string | null = null;
    try {
      const resolvedContact = await findOrCreateContact(
        organizationId,
        {
          email: contactEmail,
          name: contact.Name,
          phone: contact.Phone || contact.MobilePhone || null,
        },
        contactOwnerUserId,
        "salesforce"
      );
      contactId = resolvedContact.id;
    } catch (contactError) {
      console.error("triggerSurveyForOpportunity: contact resolution failed", contactError);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { data: survey, error: surveyError } = await adminClient
      .from("surveys")
      .insert({
        organization_id: organizationId,
        template_id: template.id,
        user_id: assigneeUserId,
        contact_id: contactId,
        held_reason: heldReason,
        customer_name: contact.Name,
        customer_email: contactEmail,
        customer_phone: contact.Phone || contact.MobilePhone || null,
        transaction_id: opportunity.Id,
        transaction_type: "salesforce_opportunity",
        status: "pending",
        expires_at: expiresAt.toISOString(),
        source: "salesforce",
        source_metadata: {
          salesforce_opportunity_id: opportunity.Id,
          salesforce_opportunity_name: opportunity.Name,
          salesforce_contact_id: contact.Id,
          salesforce_account_id: opportunity.AccountId,
          salesforce_opportunity_owner_email: ownerEmail,
          connection_id: connectionId,
        },
      })
      .select("id")
      .single();

    if (surveyError) {
      console.error("Failed to create survey:", surveyError);
      return;
    }

    if (contactId) {
      const { error: mappingLinkError } = await adminClient
        .from("salesforce_contact_mappings")
        .update({ contact_id: contactId })
        .eq("organization_id", organizationId)
        .eq("connection_id", connectionId)
        .eq("salesforce_contact_id", contact.Id);
      if (mappingLinkError) {
        console.error("triggerSurveyForOpportunity: mapping back-link failed", mappingLinkError);
      }
    }

    await adminClient
      .from("salesforce_opportunity_mappings")
      .update({
        survey_id: survey.id,
        survey_triggered_at: new Date().toISOString(),
      })
      .eq("id", mappingId);

    if (!heldReason) {
      await adminClient.from("survey_distribution_queue").insert({
        organization_id: organizationId,
        survey_id: survey.id,
        type: "initial",
        scheduled_at: new Date().toISOString(),
        priority: 1,
      });
      console.log(`Survey ${survey.id} created for Salesforce opportunity ${opportunity.Id}`);
    } else {
      console.log(
        `Survey ${survey.id} HELD (unmatched Salesforce owner ${
          ownerEmail ?? "none"
        }) for opportunity ${opportunity.Id}`
      );
    }
  } catch (error) {
    console.error("Failed to trigger survey for opportunity:", error);
  }
}

export async function syncSalesforceConnection({
  connectionId,
  organizationId,
  syncType = "manual",
  objectTypes,
  revalidateDashboard = false,
}: SyncSalesforceConnectionParams): Promise<ActionResult<SalesforceSyncLog>> {
  const adminClient = createUntypedAdminClient();

  const { data: connection, error: connError } = await adminClient
    .from("salesforce_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .single();

  if (connError || !connection) {
    return { success: false, error: "Connection not found" };
  }

  const { data: syncLog, error: logError } = await adminClient
    .from("salesforce_sync_logs")
    .insert({
      organization_id: organizationId,
      connection_id: connectionId,
      sync_type: syncType,
      sync_direction: "inbound",
      status: "started",
    })
    .select()
    .single();

  if (logError || !syncLog) {
    return { success: false, error: "Failed to start sync" };
  }

  await adminClient
    .from("salesforce_connections")
    .update({ sync_status: "syncing" })
    .eq("id", connectionId);

  const startTime = Date.now();
  let recordsFetched = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  const errors: string[] = [];

  try {
    const tokenInfo = await getValidAccessToken(connectionId);
    if (!tokenInfo) {
      throw new Error("Failed to get valid access token");
    }

    const typesToSync = objectTypes ? [...objectTypes] : [];
    if (typesToSync.length === 0) {
      if (connection.sync_contacts) typesToSync.push("contacts");
      if (connection.sync_accounts) typesToSync.push("accounts");
      if (connection.sync_opportunities) typesToSync.push("opportunities");
    }

    const lastSyncAt =
      syncType === "incremental" && connection.last_sync_at
        ? new Date(connection.last_sync_at)
        : undefined;

    if (typesToSync.includes("contacts")) {
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
            const { data: existing } = await adminClient
              .from("salesforce_contact_mappings")
              .select("id")
              .eq("connection_id", connectionId)
              .eq("salesforce_contact_id", contact.Id)
              .single();

            if (existing) {
              await adminClient
                .from("salesforce_contact_mappings")
                .update({
                  salesforce_account_id: contact.AccountId,
                  customer_email: contact.Email,
                  customer_name: contact.Name,
                  customer_phone: contact.Phone || contact.MobilePhone,
                  salesforce_data: contact as unknown as Json,
                  last_synced_at: new Date().toISOString(),
                  sync_status: "synced",
                })
                .eq("id", existing.id);
              recordsUpdated++;
            } else {
              await adminClient.from("salesforce_contact_mappings").insert({
                organization_id: organizationId,
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

    if (typesToSync.includes("opportunities")) {
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
            const { data: existing } = await adminClient
              .from("salesforce_opportunity_mappings")
              .select("id, survey_id")
              .eq("connection_id", connectionId)
              .eq("salesforce_opportunity_id", opp.Id)
              .single();

            if (existing) {
              await adminClient
                .from("salesforce_opportunity_mappings")
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
                .eq("id", existing.id);
              recordsUpdated++;

              if (
                connection.auto_create_surveys &&
                opp.StageName === connection.opportunity_stage_trigger &&
                !existing.survey_id
              ) {
                await triggerSurveyForOpportunity(
                  adminClient,
                  organizationId,
                  connectionId,
                  existing.id,
                  opp,
                  tokenInfo
                );
              }
            } else {
              const { data: newMapping } = await adminClient
                .from("salesforce_opportunity_mappings")
                .insert({
                  organization_id: organizationId,
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
                .select("id")
                .single();
              recordsCreated++;

              if (
                connection.auto_create_surveys &&
                opp.StageName === connection.opportunity_stage_trigger &&
                newMapping
              ) {
                await triggerSurveyForOpportunity(
                  adminClient,
                  organizationId,
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

    const updateStats: Record<string, unknown> = {
      sync_status: "completed",
      last_sync_at: new Date().toISOString(),
      sync_error: errors.length > 0 ? errors[0] : null,
    };

    if (typesToSync.includes("contacts")) {
      updateStats.contacts_synced = recordsCreated + recordsUpdated;
    }
    if (typesToSync.includes("opportunities")) {
      updateStats.opportunities_synced = recordsCreated + recordsUpdated;
    }

    await adminClient.from("salesforce_connections").update(updateStats).eq("id", connectionId);

    const durationMs = Date.now() - startTime;
    const { data: completedLog } = await adminClient
      .from("salesforce_sync_logs")
      .update({
        status: "completed",
        records_fetched: recordsFetched,
        records_created: recordsCreated,
        records_updated: recordsUpdated,
        records_failed: recordsFailed,
        errors: errors.length > 0 ? errors : null,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      })
      .eq("id", syncLog.id)
      .select()
      .single();

    if (revalidateDashboard) {
      revalidatePath("/dashboard/settings");
      revalidatePath("/dashboard/organization");
    }

    return {
      success: true,
      data: {
        id: completedLog?.id || syncLog.id,
        organizationId,
        connectionId,
        syncType,
        syncDirection: "inbound",
        objectType: typesToSync.join(","),
        status: "completed",
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    errors.push(errorMessage);

    await adminClient
      .from("salesforce_connections")
      .update({
        sync_status: "failed",
        sync_error: errorMessage,
      })
      .eq("id", connectionId);

    await adminClient
      .from("salesforce_sync_logs")
      .update({
        status: "failed",
        errors,
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      })
      .eq("id", syncLog.id);

    return { success: false, error: `Sync failed: ${errorMessage}` };
  }
}
