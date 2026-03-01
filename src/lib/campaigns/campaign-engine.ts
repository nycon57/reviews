import "server-only";

import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type {
  SequenceDefinition,
  SequenceStep,
  SequenceTrigger,
  ExitCondition,
} from "@/lib/email/orchestration/types";
import type { CampaignWorkflow } from "./types";

// ============================================================================
// Register / Unregister
// ============================================================================

/**
 * Convert a campaign workflow's sequence_definition into a typed SequenceDefinition
 * and register it with the orchestration engine.
 *
 * Uses dynamic import to avoid pulling sync registry functions into the
 * "use server" module graph (which requires all exports to be async).
 */
export async function registerCampaignDefinition(campaign: CampaignWorkflow): Promise<void> {
  const raw = campaign.sequenceDefinition;

  const steps: SequenceStep[] = Array.isArray(raw.steps)
    ? (raw.steps as SequenceStep[])
    : [];

  const triggers: SequenceTrigger[] = Array.isArray(raw.triggers)
    ? (raw.triggers as SequenceTrigger[])
    : [];

  const exitConditions: ExitCondition[] | undefined = Array.isArray(raw.exitConditions)
    ? (raw.exitConditions as ExitCondition[])
    : undefined;

  const definition: SequenceDefinition = {
    type: "custom",
    name: campaign.id,
    description: campaign.name,
    steps,
    triggers,
    exitConditions,
    tags: [`campaign:${campaign.id}`, `org:${campaign.organizationId}`],
  };

  const { registerCampaignSequenceDefinition } = await import("@/lib/email/orchestration/registry");
  registerCampaignSequenceDefinition(campaign.id, definition);
}

/**
 * Remove a campaign's definition from the orchestration registry.
 */
export async function unregisterCampaignDefinition(campaignId: string): Promise<void> {
  const { unregisterCampaignSequenceDefinition } = await import("@/lib/email/orchestration/registry");
  unregisterCampaignSequenceDefinition(campaignId);
}

// ============================================================================
// Start campaign for a user
// ============================================================================

export async function startCampaignForUser(
  campaignId: string,
  userId: string,
  organizationId: string,
  metadata?: Record<string, unknown>
): Promise<{ sequenceId: string } | { skipped: true; reason: string }> {
  const supabase = createUntypedAdminClient();

  // Check if user already has an active sequence for this campaign
  const { data: existing } = await supabase
    .from("email_sequences")
    .select("id")
    .eq("user_id", userId)
    .eq("campaign_workflow_id", campaignId)
    .in("status", ["active", "processing", "paused"])
    .limit(1);

  if (existing && existing.length > 0) {
    return { skipped: true, reason: "User already enrolled in this campaign" };
  }

  // Fetch campaign to get step count
  const { data: campaign } = await supabase
    .from("campaign_workflows")
    .select("sequence_definition")
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    return { skipped: true, reason: "Campaign not found" };
  }

  const definition = campaign.sequence_definition as Record<string, unknown>;
  const steps = Array.isArray(definition.steps) ? definition.steps : [];

  const now = new Date().toISOString();

  const { data: inserted, error } = await supabase
    .from("email_sequences")
    .insert({
      user_id: userId,
      organization_id: organizationId,
      sequence_type: "custom",
      campaign_workflow_id: campaignId,
      status: "active",
      current_step: 0,
      total_steps: steps.length,
      steps_completed: [],
      ab_test_assignments: {},
      skipped_steps: [],
      next_email_at: now,
      metadata: {
        campaign_id: campaignId,
        ...metadata,
      },
      started_at: now,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to create sequence for campaign: ${error?.message ?? "Unknown"}`);
  }

  return { sequenceId: String((inserted as { id: unknown }).id) };
}

// ============================================================================
// Pause / cancel campaign sequences
// ============================================================================

export async function pauseCampaignSequences(campaignId: string): Promise<number> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("email_sequences")
    .update({ status: "paused" })
    .eq("campaign_workflow_id", campaignId)
    .in("status", ["active", "processing"])
    .select("id");

  if (error) {
    console.error(`[CampaignEngine] Failed to pause sequences for ${campaignId}:`, error);
    return 0;
  }

  return data?.length ?? 0;
}

export async function cancelCampaignSequences(
  campaignId: string,
  reason: string = "campaign_archived"
): Promise<number> {
  const supabase = createUntypedAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("email_sequences")
    .update({
      status: "cancelled",
      exit_reason: reason,
      exited_at: now,
    })
    .eq("campaign_workflow_id", campaignId)
    .in("status", ["active", "processing", "paused"])
    .select("id");

  if (error) {
    console.error(`[CampaignEngine] Failed to cancel sequences for ${campaignId}:`, error);
    return 0;
  }

  return data?.length ?? 0;
}

export async function resumeCampaignSequences(campaignId: string): Promise<number> {
  const supabase = createUntypedAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("email_sequences")
    .update({
      status: "active",
      next_email_at: now,
    })
    .eq("campaign_workflow_id", campaignId)
    .eq("status", "paused")
    .select("id");

  if (error) {
    console.error(`[CampaignEngine] Failed to resume sequences for ${campaignId}:`, error);
    return 0;
  }

  return data?.length ?? 0;
}
