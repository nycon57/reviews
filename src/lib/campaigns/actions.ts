"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireEnterpriseManager } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  canvasToSequenceDefinition,
  parseCanvasMetadata,
} from "@/components/workflow-builder/lib/serializer";
import {
  hasBlockingActivationWarnings,
  validateGraph,
} from "@/components/workflow-builder/lib/validator";
import {
  CreateCampaignInputSchema,
  UpdateCampaignInputSchema,
  CampaignStatusSchema,
  parseJsonObject,
  type CampaignListItem,
  type CampaignLockResult,
  type CampaignStatus,
  type CampaignWorkflow,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "./types";
import {
  deriveTriggerType,
  getCampaignById,
  getCampaignsByOrg,
} from "./queries";
import {
  registerCampaignDefinition,
  unregisterCampaignDefinition,
  pauseCampaignSequences,
  cancelCampaignSequences,
  resumeCampaignSequences,
} from "./campaign-engine";

/** Structural validation for sequence_definition before DB write. */
const SequenceDefinitionSchema = z.object({
  type: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  triggers: z.array(z.record(z.unknown())).optional(),
  steps: z.array(z.record(z.unknown())).optional(),
  exitConditions: z.array(z.record(z.unknown())).optional(),
  metadata: z.record(z.unknown()).optional(),
}).passthrough();

function validateSequenceDefinition(value: unknown): Record<string, unknown> {
  const parsed = SequenceDefinitionSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid sequence definition: ${parsed.error.issues.map((i) => i.message).join(", ")}`);
  }
  return parsed.data as Record<string, unknown>;
}

const CAMPAIGNS_PATH = "/dashboard/campaigns";
const LOCK_TTL_MS = 15 * 60 * 1000;

function isLockExpired(lockedAt: string | null): boolean {
  if (!lockedAt) {
    return true;
  }

  const timestamp = new Date(lockedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return true;
  }

  return Date.now() - timestamp > LOCK_TTL_MS;
}

function ensureUnlocked(campaign: CampaignWorkflow, currentUserId: string) {
  if (!campaign.lockedBy || campaign.lockedBy === currentUserId) {
    return;
  }

  if (isLockExpired(campaign.lockedAt)) {
    return;
  }

  const lockedBy = campaign.lockedByName || "another teammate";
  throw new Error(`Campaign is currently being edited by ${lockedBy}.`);
}

function hasSequenceContent(sequenceDefinition: Record<string, unknown>): boolean {
  const { steps, triggers } = sequenceDefinition;
  return (
    (Array.isArray(steps) && steps.length > 0) ||
    (Array.isArray(triggers) && triggers.length > 0)
  );
}

function formatValidationMessage(messages: string[]): string {
  if (messages.length === 0) {
    return "Workflow has validation errors.";
  }

  const topMessages = messages.slice(0, 3);
  return topMessages.join(" ");
}

export async function createCampaign(
  input: CreateCampaignInput
): Promise<CampaignWorkflow> {
  const ctx = await requireEnterpriseManager();
  const parsed = CreateCampaignInputSchema.parse(input);
  const supabase = createUntypedAdminClient();

  let sequenceDefinition: Record<string, unknown> = {};
  let canvasMetadata: Record<string, unknown> = {};

  if (parsed.templateId) {
    const { data: template, error: templateError } = await supabase
      .from("workflow_templates")
      .select("sequence_definition, canvas_metadata")
      .eq("id", parsed.templateId)
      .eq("is_system", true)
      .single();

    if (templateError || !template) {
      throw new Error("Template not found.");
    }

    const templateRecord = template as {
      sequence_definition?: unknown;
      canvas_metadata?: unknown;
    };

    sequenceDefinition = parseJsonObject(templateRecord.sequence_definition);
    canvasMetadata = parseJsonObject(templateRecord.canvas_metadata);
  }

  const { data, error } = await supabase
    .from("campaign_workflows")
    .insert({
      organization_id: ctx.organizationId,
      name: parsed.name,
      description: parsed.description || null,
      status: "draft",
      sequence_definition: sequenceDefinition,
      canvas_metadata: canvasMetadata,
      trigger_type: deriveTriggerType(sequenceDefinition),
      created_by: ctx.userId,
      updated_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create campaign: ${error?.message || "Unknown error"}`);
  }

  const campaignId = String((data as { id?: unknown }).id ?? "");
  const campaign = await getCampaignById(campaignId, ctx.organizationId);

  if (!campaign) {
    throw new Error("Campaign was created but could not be loaded.");
  }

  revalidatePath(CAMPAIGNS_PATH);
  return campaign;
}

export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput
): Promise<CampaignWorkflow> {
  const ctx = await requireEnterpriseManager();
  const parsed = UpdateCampaignInputSchema.parse(input);

  const current = await getCampaignById(id, ctx.organizationId);
  if (!current) {
    throw new Error("Campaign not found.");
  }

  ensureUnlocked(current, ctx.userId);

  const updatePayload: Record<string, unknown> = {
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  };

  if (parsed.name !== undefined) {
    updatePayload.name = parsed.name;
  }

  if (Object.prototype.hasOwnProperty.call(parsed, "description")) {
    updatePayload.description = parsed.description || null;
  }

  if (parsed.sequenceDefinition !== undefined) {
    // Bug 10: validate structure before writing to DB
    const validated = validateSequenceDefinition(parsed.sequenceDefinition);
    updatePayload.sequence_definition = validated;
    updatePayload.trigger_type = deriveTriggerType(validated);
  }

  if (parsed.canvasMetadata !== undefined) {
    updatePayload.canvas_metadata = parsed.canvasMetadata;
  }

  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("campaign_workflows")
    .update(updatePayload)
    .eq("id", id)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    throw new Error(`Failed to update campaign: ${error.message}`);
  }

  const updated = await getCampaignById(id, ctx.organizationId);
  if (!updated) {
    throw new Error("Campaign no longer exists.");
  }

  revalidatePath(CAMPAIGNS_PATH);
  revalidatePath(`${CAMPAIGNS_PATH}/${id}`);
  return updated;
}

export async function deleteCampaign(
  id: string
): Promise<{ id: string; action: "archived" | "deleted" }> {
  const ctx = await requireEnterpriseManager();
  const campaign = await getCampaignById(id, ctx.organizationId);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  ensureUnlocked(campaign, ctx.userId);

  const supabase = createUntypedAdminClient();

  if (campaign.status === "draft") {
    const { error } = await supabase
      .from("campaign_workflows")
      .delete()
      .eq("id", id)
      .eq("organization_id", ctx.organizationId)
      .eq("status", "draft");

    if (error) {
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }

    revalidatePath(CAMPAIGNS_PATH);
    return { id, action: "deleted" };
  }

  // Unregister and cancel all active sequences before archiving
  await unregisterCampaignDefinition(id);
  await cancelCampaignSequences(id, "campaign_archived");

  const { error } = await supabase
    .from("campaign_workflows")
    .update({
      status: "archived",
      updated_by: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", ctx.organizationId);

  if (error) {
    throw new Error(`Failed to archive campaign: ${error.message}`);
  }

  revalidatePath(CAMPAIGNS_PATH);
  revalidatePath(`${CAMPAIGNS_PATH}/${id}`);
  return { id, action: "archived" };
}

export async function getCampaign(id: string): Promise<CampaignWorkflow | null> {
  const ctx = await requireEnterpriseManager();
  return getCampaignById(id, ctx.organizationId);
}

export async function listCampaigns(filters?: {
  status?: CampaignStatus;
}): Promise<CampaignListItem[]> {
  const ctx = await requireEnterpriseManager();

  let normalizedStatus: CampaignStatus | undefined;
  if (filters?.status) {
    const parsed = CampaignStatusSchema.safeParse(filters.status);
    normalizedStatus = parsed.success ? parsed.data : undefined;
  }

  return getCampaignsByOrg(ctx.organizationId, normalizedStatus);
}

export async function duplicateCampaign(id: string): Promise<CampaignWorkflow> {
  const ctx = await requireEnterpriseManager();
  const campaign = await getCampaignById(id, ctx.organizationId);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("campaign_workflows")
    .insert({
      organization_id: ctx.organizationId,
      name: `${campaign.name} (Copy)`,
      description: campaign.description,
      status: "draft",
      sequence_definition: campaign.sequenceDefinition,
      canvas_metadata: campaign.canvasMetadata,
      trigger_type: campaign.triggerType,
      created_by: ctx.userId,
      updated_by: ctx.userId,
      locked_by: null,
      locked_at: null,
      activated_at: null,
      activated_by: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to duplicate campaign: ${error?.message || "Unknown error"}`);
  }

  const copyId = String((data as { id?: unknown }).id ?? "");
  const duplicate = await getCampaignById(copyId, ctx.organizationId);

  if (!duplicate) {
    throw new Error("Campaign copy was created but could not be loaded.");
  }

  revalidatePath(CAMPAIGNS_PATH);
  return duplicate;
}

export async function acquireLock(id: string): Promise<CampaignLockResult> {
  const ctx = await requireEnterpriseManager();
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("acquire_campaign_lock", {
    p_campaign_id: id,
    p_user_id: ctx.userId,
    p_organization_id: ctx.organizationId,
    p_lock_ttl_ms: LOCK_TTL_MS,
  });

  if (error) {
    throw new Error(`Failed to acquire lock: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error("Campaign not found or lock status could not be determined.");
  }

  if (row.acquired) {
    revalidatePath(`${CAMPAIGNS_PATH}/${id}`);
    return { acquired: true, lockedByName: null, lockedAt: new Date().toISOString() };
  }

  return {
    acquired: false,
    lockedByName: row.locked_by_name ?? null,
    lockedAt: row.current_locked_at ?? null,
  };
}

export async function releaseLock(id: string): Promise<{ released: boolean }> {
  const ctx = await requireEnterpriseManager();
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase.rpc("release_campaign_lock", {
    p_campaign_id: id,
    p_user_id: ctx.userId,
    p_organization_id: ctx.organizationId,
  });

  if (error) {
    throw new Error(`Failed to release lock: ${error.message}`);
  }

  const released = data === true;
  if (released) {
    revalidatePath(`${CAMPAIGNS_PATH}/${id}`);
  }
  return { released };
}

export async function activateCampaign(id: string): Promise<CampaignWorkflow> {
  const ctx = await requireEnterpriseManager();
  const campaign = await getCampaignById(id, ctx.organizationId);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  ensureUnlocked(campaign, ctx.userId);

  if (campaign.status !== "draft" && campaign.status !== "paused") {
    throw new Error(
      `Cannot activate a campaign with status "${campaign.status}". Only draft or paused campaigns can be activated.`
    );
  }

  const canvas = parseCanvasMetadata(campaign.canvasMetadata);
  if (canvas.nodes.length > 0) {
    const validation = validateGraph(canvas.nodes, canvas.edges);
    const blockingWarnings = hasBlockingActivationWarnings(validation.warnings);
    if (validation.errors.length > 0 || blockingWarnings) {
      const messages = [
        ...validation.errors.map((issue) => issue.message),
        ...(blockingWarnings
          ? validation.warnings.map((issue) => issue.message)
          : []),
      ];

      throw new Error(formatValidationMessage(messages));
    }
  }

  // Bug 11: re-serialize canvas → sequence_definition at activation time
  // so we never trust stale sequence_definition from a previous save
  let freshSequenceDefinition: Record<string, unknown>;
  if (canvas.nodes.length > 0) {
    freshSequenceDefinition = canvasToSequenceDefinition(
      canvas.nodes,
      canvas.edges,
      campaign.name
    ) as Record<string, unknown>;
  } else {
    freshSequenceDefinition = campaign.sequenceDefinition;
  }

  if (!hasSequenceContent(freshSequenceDefinition)) {
    throw new Error("Cannot activate an empty campaign. Add workflow steps first.");
  }

  const supabase = createUntypedAdminClient();
  const now = new Date().toISOString();

  const { data: activateData, error } = await supabase
    .from("campaign_workflows")
    .update({
      status: "active",
      activated_at: now,
      activated_by: ctx.userId,
      updated_by: ctx.userId,
      updated_at: now,
      // Write the fresh definition so it's always in sync with canvas
      sequence_definition: freshSequenceDefinition,
      trigger_type: deriveTriggerType(freshSequenceDefinition),
    })
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .in("status", ["draft", "paused"])
    .select("id");

  if (error) {
    throw new Error(`Failed to activate campaign: ${error.message}`);
  }

  if (!Array.isArray(activateData) || activateData.length === 0) {
    throw new Error(
      "Campaign status has changed since it was loaded. Please refresh and try again."
    );
  }

  const updated = await getCampaignById(id, ctx.organizationId);
  if (!updated) {
    throw new Error("Campaign no longer exists.");
  }

  // Register campaign definition with orchestration engine
  await registerCampaignDefinition(updated);

  // Resume any previously paused sequences when reactivating
  if (campaign.status === "paused") {
    await resumeCampaignSequences(id);
  }

  revalidatePath(CAMPAIGNS_PATH);
  revalidatePath(`${CAMPAIGNS_PATH}/${id}`);
  return updated;
}

export async function pauseCampaign(id: string): Promise<CampaignWorkflow> {
  const ctx = await requireEnterpriseManager();
  const campaign = await getCampaignById(id, ctx.organizationId);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  ensureUnlocked(campaign, ctx.userId);

  if (campaign.status !== "active") {
    throw new Error(
      `Cannot pause a campaign with status "${campaign.status}". Only active campaigns can be paused.`
    );
  }

  const supabase = createUntypedAdminClient();
  const now = new Date().toISOString();

  const { data: pauseData, error } = await supabase
    .from("campaign_workflows")
    .update({
      status: "paused",
      updated_by: ctx.userId,
      updated_at: now,
    })
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .eq("status", "active")
    .select("id");

  if (error) {
    throw new Error(`Failed to pause campaign: ${error.message}`);
  }

  if (!Array.isArray(pauseData) || pauseData.length === 0) {
    throw new Error(
      "Campaign status has changed since it was loaded. Please refresh and try again."
    );
  }

  // Unregister from orchestration engine and pause active sequences
  await unregisterCampaignDefinition(id);
  await pauseCampaignSequences(id);

  const updated = await getCampaignById(id, ctx.organizationId);
  if (!updated) {
    throw new Error("Campaign no longer exists.");
  }

  revalidatePath(CAMPAIGNS_PATH);
  revalidatePath(`${CAMPAIGNS_PATH}/${id}`);
  return updated;
}
