import "server-only";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  CampaignStatusSchema,
  parseJsonObject,
  type CampaignListItem,
  type CampaignStatus,
  type CampaignWorkflow,
  WorkflowTemplateCategorySchema,
  type WorkflowTemplate,
} from "./types";

function parseCampaignStatus(value: unknown): CampaignStatus {
  const parsed = CampaignStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "draft";
}

function parseTemplateCategory(value: unknown): WorkflowTemplate["category"] {
  const parsed = WorkflowTemplateCategorySchema.safeParse(value);
  return parsed.success ? parsed.data : "onboarding";
}

function getUserFullName(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const fullName = (value as { full_name?: unknown }).full_name;
  return typeof fullName === "string" && fullName.length > 0 ? fullName : null;
}

function toCampaignWorkflow(row: Record<string, unknown>): CampaignWorkflow {
  return {
    id: String(row.id ?? ""),
    organizationId: String(row.organization_id ?? ""),
    name: String(row.name ?? "Untitled Campaign"),
    description: typeof row.description === "string" ? row.description : null,
    status: parseCampaignStatus(row.status),
    sequenceDefinition: parseJsonObject(row.sequence_definition),
    canvasMetadata: parseJsonObject(row.canvas_metadata),
    triggerType: typeof row.trigger_type === "string" ? row.trigger_type : null,
    createdBy: typeof row.created_by === "string" ? row.created_by : null,
    createdByName: getUserFullName(row.created_user),
    updatedBy: typeof row.updated_by === "string" ? row.updated_by : null,
    updatedByName: getUserFullName(row.updated_user),
    lockedBy: typeof row.locked_by === "string" ? row.locked_by : null,
    lockedByName: getUserFullName(row.locked_user),
    lockedAt: typeof row.locked_at === "string" ? row.locked_at : null,
    activatedAt: typeof row.activated_at === "string" ? row.activated_at : null,
    activatedBy: typeof row.activated_by === "string" ? row.activated_by : null,
    activatedByName: getUserFullName(row.activated_user),
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date(0).toISOString(),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date(0).toISOString(),
  };
}

function toCampaignListItem(row: Record<string, unknown>): CampaignListItem {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Untitled Campaign"),
    status: parseCampaignStatus(row.status),
    triggerType: typeof row.trigger_type === "string" ? row.trigger_type : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : new Date(0).toISOString(),
    createdByName: getUserFullName(row.created_user),
    lockedByName: getUserFullName(row.locked_user),
    lockedAt: typeof row.locked_at === "string" ? row.locked_at : null,
  };
}

function toWorkflowTemplate(row: Record<string, unknown>): WorkflowTemplate {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Untitled Template"),
    description: typeof row.description === "string" ? row.description : null,
    category: parseTemplateCategory(row.category),
    iconName: typeof row.icon_name === "string" ? row.icon_name : "Envelope",
    sequenceDefinition: parseJsonObject(row.sequence_definition),
    canvasMetadata: parseJsonObject(row.canvas_metadata),
    isSystem: Boolean(row.is_system),
    popularity: typeof row.popularity === "number" ? row.popularity : 0,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date(0).toISOString(),
  };
}

export function deriveTriggerType(sequenceDefinition: Record<string, unknown>): string | null {
  const triggers = sequenceDefinition.triggers;

  if (Array.isArray(triggers) && triggers.length > 0) {
    const first = triggers[0];
    if (typeof first === "object" && first !== null) {
      const type = (first as { type?: unknown }).type;
      if (typeof type === "string" && type.length > 0) {
        return type;
      }
    }
  }

  const fallback = sequenceDefinition.triggerType;
  if (typeof fallback === "string" && fallback.length > 0) {
    return fallback;
  }

  return null;
}

export async function getCampaignsByOrg(
  organizationId: string,
  status?: CampaignStatus
): Promise<CampaignListItem[]> {
  const supabase = createUntypedAdminClient();

  let query = supabase
    .from("campaign_workflows")
    .select(
      `
      id,
      name,
      status,
      trigger_type,
      updated_at,
      locked_at,
      created_user:users!campaign_workflows_created_by_fkey(full_name),
      locked_user:users!campaign_workflows_locked_by_fkey(full_name)
      `
    )
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  return ((data || []) as Record<string, unknown>[]).map(toCampaignListItem);
}

export async function getCampaignById(
  id: string,
  organizationId: string
): Promise<CampaignWorkflow | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("campaign_workflows")
    .select(
      `
      id,
      organization_id,
      name,
      description,
      status,
      sequence_definition,
      canvas_metadata,
      trigger_type,
      created_by,
      updated_by,
      locked_by,
      locked_at,
      activated_at,
      activated_by,
      created_at,
      updated_at,
      created_user:users!campaign_workflows_created_by_fkey(full_name),
      updated_user:users!campaign_workflows_updated_by_fkey(full_name),
      locked_user:users!campaign_workflows_locked_by_fkey(full_name),
      activated_user:users!campaign_workflows_activated_by_fkey(full_name)
      `
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to fetch campaign: ${error.message}`);
  }

  return toCampaignWorkflow(data as Record<string, unknown>);
}

export async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("workflow_templates")
    .select(
      `
      id,
      name,
      description,
      category,
      icon_name,
      sequence_definition,
      canvas_metadata,
      is_system,
      popularity,
      created_at
      `
    )
    .eq("is_system", true)
    .order("popularity", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch workflow templates: ${error.message}`);
  }

  return ((data || []) as Record<string, unknown>[]).map(toWorkflowTemplate);
}

export interface CampaignExecutionStats {
  active: number;
  completed: number;
  exited: number;
  paused: number;
  cancelled: number;
  total: number;
}

export async function getCampaignExecutionStats(
  campaignId: string
): Promise<CampaignExecutionStats> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("email_sequences")
    .select("status")
    .eq("campaign_workflow_id", campaignId);

  if (error) {
    throw new Error(`Failed to fetch campaign stats: ${error.message}`);
  }

  const rows = (data ?? []) as { status: string }[];

  const stats: CampaignExecutionStats = {
    active: 0,
    completed: 0,
    exited: 0,
    paused: 0,
    cancelled: 0,
    total: rows.length,
  };

  for (const row of rows) {
    switch (row.status) {
      case "active":
      case "processing":
        stats.active++;
        break;
      case "completed":
        stats.completed++;
        break;
      case "exited":
        stats.exited++;
        break;
      case "paused":
        stats.paused++;
        break;
      case "cancelled":
        stats.cancelled++;
        break;
    }
  }

  return stats;
}
