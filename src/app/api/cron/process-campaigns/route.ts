import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron/verify-secret";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { registerCampaignDefinition } from "@/lib/campaigns/campaign-engine";
import { campaignEmailSender } from "@/lib/campaigns/campaign-email-sender";
import { processTimeTriggers } from "@/lib/campaigns/trigger-handler";
import { parseJsonObject, type CampaignWorkflow } from "@/lib/campaigns/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/process-campaigns
 *
 * 1. Register all active campaign definitions with orchestration engine
 * 2. Process time-based triggers -> create new sequences
 * 3. Process campaign sequence queue -> send emails/SMS
 * 4. Auto-complete campaigns with 0 remaining active sequences
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const batchSize = Math.min(
      Math.max(parseInt(url.searchParams.get("batch_size") || "50", 10), 1),
      100
    );

    const supabase = createUntypedAdminClient();

    // 1. Fetch all active campaigns and register definitions
    const { data: campaigns, error: fetchError } = await supabase
      .from("campaign_workflows")
      .select("id, organization_id, name, description, status, sequence_definition, canvas_metadata, trigger_type")
      .eq("status", "active");

    if (fetchError) {
      throw new Error(`Failed to fetch active campaigns: ${fetchError.message}`);
    }

    const activeCampaigns = (campaigns ?? []) as Record<string, unknown>[];

    for (const row of activeCampaigns) {
      const campaign: CampaignWorkflow = {
        id: String(row.id),
        organizationId: String(row.organization_id),
        name: String(row.name),
        description: typeof row.description === "string" ? row.description : null,
        status: "active",
        sequenceDefinition: parseJsonObject(row.sequence_definition),
        canvasMetadata: parseJsonObject(row.canvas_metadata),
        triggerType: typeof row.trigger_type === "string" ? row.trigger_type : null,
        createdBy: null,
        createdByName: null,
        updatedBy: null,
        updatedByName: null,
        lockedBy: null,
        lockedByName: null,
        lockedAt: null,
        activatedAt: null,
        activatedBy: null,
        activatedByName: null,
        createdAt: "",
        updatedAt: "",
      };

      await registerCampaignDefinition(campaign);
    }

    // Dynamic imports to avoid pulling "use server" sync functions into API route
    const { registerEmailSender, getSequenceDefinition } = await import(
      "@/lib/email/orchestration/registry"
    );
    const { processSequenceQueue } = await import(
      "@/lib/email/orchestration/queue"
    );

    // Register the campaign email sender for "custom" type
    registerEmailSender("custom", campaignEmailSender);

    // 2. Process time-based triggers
    const triggerResults = await processTimeTriggers();
    const totalTriggered = triggerResults.reduce((sum, r) => sum + r.sequencesCreated, 0);

    // 3. Process campaign sequence queue
    const definition = getSequenceDefinition("custom");
    let queueResult = { processed: 0, failed: 0, skipped: 0, exited: 0, waiting: 0, errors: [] as string[] };

    if (definition) {
      const { sendEmailWithReliability } = await import("@/lib/email/send-utils");

      queueResult = await processSequenceQueue(
        definition,
        async (ctx) => {
          try {
            const { subject, html } = await campaignEmailSender(ctx);
            const idempotencyKey = `campaign_${ctx.sequence.id}_step_${ctx.step.step}_${ctx.variant ?? "default"}`;
            const result = await sendEmailWithReliability({
              to: ctx.user.email,
              toName: ctx.user.full_name ?? undefined,
              subject,
              html,
              idempotencyKey,
            });
            return {
              success: result.success,
              emailId: result.messageId,
              error: result.error,
            };
          } catch (err) {
            return {
              success: false,
              error: err instanceof Error ? err.message : "Failed to send campaign email",
            };
          }
        },
        batchSize
      );
    }

    // 4. Auto-complete campaigns with 0 remaining active sequences
    let autoCompleted = 0;
    for (const row of activeCampaigns) {
      const campaignId = String(row.id);

      // Single query: fetch statuses to determine if sequences exist and if any are active
      const { data: seqs } = await supabase
        .from("email_sequences")
        .select("status")
        .eq("campaign_workflow_id", campaignId);

      const sequences = seqs ?? [];
      const hasSequences = sequences.length > 0;
      const hasActiveSequences = sequences.some(
        (s) => (s as { status: string }).status === "active" || (s as { status: string }).status === "processing"
      );

      if (hasSequences && !hasActiveSequences) {
        await supabase
          .from("campaign_workflows")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaignId)
          .eq("status", "active");

        autoCompleted++;
      }
    }

    return NextResponse.json({
      success: true,
      campaignsRegistered: activeCampaigns.length,
      triggersProcessed: totalTriggered,
      queue: {
        processed: queueResult.processed,
        failed: queueResult.failed,
        skipped: queueResult.skipped,
        exited: queueResult.exited,
        waiting: queueResult.waiting,
      },
      autoCompleted,
      errors: [
        ...triggerResults.flatMap((r) => r.errors),
        ...queueResult.errors,
      ].slice(0, 10),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Campaign Cron] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Vercel crons send GET requests — alias to POST so the cron actually processes campaigns.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request);
}
