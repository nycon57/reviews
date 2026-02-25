"use server";

import { revalidatePath } from "next/cache";
import { requireEnterpriseManager } from "@/lib/access";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { parseCanvasMetadata } from "@/components/workflow-builder/lib/serializer";
import {
  hasBlockingActivationWarnings,
  validateGraph,
} from "@/components/workflow-builder/lib/validator";
import {
  CreateCampaignInputSchema,
  UpdateCampaignInputSchema,
  CampaignStatusSchema,
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

const CAMPAIGNS_PATH = "/dashboard/campaigns";
const LOCK_TTL_MS = 15 * 60 * 1000;

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

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
  if (Object.keys(sequenceDefinition).length === 0) {
    return false;
  }

  const steps = sequenceDefinition.steps;
  if (Array.isArray(steps) && steps.length > 0) {
    return true;
  }

  const triggers = sequenceDefinition.triggers;
  if (Array.isArray(triggers) && triggers.length > 0) {
    return true;
  }

  return false;
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
    updatePayload.sequence_definition = parsed.sequenceDefinition;
    updatePayload.trigger_type = deriveTriggerType(parsed.sequenceDefinition);
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
  const now = new Date().toISOString();
  const lockExpiry = new Date(Date.now() - LOCK_TTL_MS).toISOString();

  // Atomic check-and-set: only acquire if unlocked, expired, or already ours
  const { data, error } = await supabase
    .from("campaign_workflows")
    .update({
      locked_by: ctx.userId,
      locked_at: now,
      updated_by: ctx.userId,
      updated_at: now,
    })
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .or(`locked_by.is.null,locked_by.eq.${ctx.userId},locked_at.lt.${lockExpiry}`)
    .select("id");

  if (error) {
    throw new Error(`Failed to acquire lock: ${error.message}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    // Lock held by someone else — fetch current state for the response
    const campaign = await getCampaignById(id, ctx.organizationId);
    if (!campaign) {
      throw new Error("Campaign not found.");
    }
    return {
      acquired: false,
      lockedByName: campaign.lockedByName,
      lockedAt: campaign.lockedAt,
    };
  }

  revalidatePath(`${CAMPAIGNS_PATH}/${id}`);
  return {
    acquired: true,
    lockedByName: null,
    lockedAt: now,
  };
}

export async function releaseLock(id: string): Promise<{ released: boolean }> {
  const ctx = await requireEnterpriseManager();
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("campaign_workflows")
    .update({
      locked_by: null,
      locked_at: null,
      updated_by: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", ctx.organizationId)
    .eq("locked_by", ctx.userId)
    .select("id");

  if (error) {
    throw new Error(`Failed to release lock: ${error.message}`);
  }

  const released = Array.isArray(data) && data.length > 0;
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

  if (!hasSequenceContent(campaign.sequenceDefinition)) {
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

  const updated = await getCampaignById(id, ctx.organizationId);
  if (!updated) {
    throw new Error("Campaign no longer exists.");
  }

  revalidatePath(CAMPAIGNS_PATH);
  revalidatePath(`${CAMPAIGNS_PATH}/${id}`);
  return updated;
}
