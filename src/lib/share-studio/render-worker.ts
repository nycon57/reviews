import fs from "fs/promises";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { resolveBrandTokens } from "@/lib/share-studio/template-resolver";
import type { ProofAssetType } from "@/lib/share-studio/template-types";
import {
  renderShareStudioStill,
  renderShareStudioVideo,
  type ShareStudioRenderInput,
  type ShareStudioVideoFormat,
} from "@/lib/share-studio/remotion-renderer";

const RENDER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

interface WorkerSummary {
  processed: number;
  completed: number;
  failed: number;
  requeued: number;
  errors: string[];
}

function getRequestedFormat(payload: Record<string, unknown> | null | undefined): "og" | ShareStudioVideoFormat {
  const candidate = payload?.format;
  if (candidate === "og") return "og";
  if (candidate === "1:1") return "1:1";
  if (candidate === "9:16") return "9:16";
  return "16:9";
}

function createStoragePath(
  assetType: ProofAssetType,
  organizationId: string,
  itemId: string,
  timestamp: number
): string {
  if (assetType === "smart_link_og") {
    return `og/${organizationId}/${itemId}/${timestamp}.png`;
  }

  if (assetType === "image") {
    return `images/${organizationId}/${itemId}/${timestamp}.png`;
  }

  return `videos/${organizationId}/${itemId}/${timestamp}.mp4`;
}

function buildRenderInput(item: Record<string, unknown>, org: Record<string, unknown>): ShareStudioRenderInput {
  const brand = resolveBrandTokens({
    primary_color: (org.primary_color as string | null) ?? null,
    logo_url: (org.logo_url as string | null) ?? null,
    settings: (org.settings as Record<string, unknown> | null) ?? null,
  });

  return {
    title: (item.title as string | null) || `Story from ${item.customer_name || "Customer"}`,
    quote:
      (item.quote as string | null) ||
      (item.summary as string | null) ||
      "Customer feedback captured in Share Studio.",
    customerName: (item.customer_name as string | null) || "Verified Customer",
    rating: (item.rating as number | null) ?? 5,
    organizationName: (org.name as string) || "Organization",
    organizationLogoUrl: (brand.logoUrl as string | null) ?? null,
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor,
    fontFamily: brand.fontFamily,
  };
}

async function uploadRenderedAsset(params: {
  localPath: string;
  storagePath: string;
  contentType: string;
}): Promise<string> {
  const supabase = createUntypedAdminClient();
  try {
    const file = await fs.readFile(params.localPath);

    const { error } = await supabase.storage
      .from("share-studio")
      .upload(params.storagePath, file, {
        upsert: true,
        contentType: params.contentType,
      });

    if (error) {
      throw new Error(error.message || "Failed to upload render asset");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("share-studio").getPublicUrl(params.storagePath);

    return publicUrl;
  } finally {
    await fs.unlink(params.localPath).catch(() => undefined);
  }
}

async function markJobFailed(params: {
  job: Record<string, unknown>;
  errorMessage: string;
}): Promise<"failed" | "requeued"> {
  const supabase = createUntypedAdminClient();

  const retryCount = Number(params.job.retry_count || 0) + 1;
  const maxRetries = Number(params.job.max_retries || 3);
  const shouldRetry = retryCount < maxRetries;

  const { error } = await supabase
    .from("proof_render_jobs")
    .update({
      status: shouldRetry ? "queued" : "failed",
      retry_count: retryCount,
      error_message: params.errorMessage.slice(0, 1000),
      started_at: shouldRetry ? null : params.job.started_at ?? new Date().toISOString(),
      completed_at: shouldRetry ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.job.id);

  if (error) {
    throw new Error(error.message || "Failed to update failed render job");
  }

  return shouldRetry ? "requeued" : "failed";
}

async function processOneJob(job: Record<string, unknown>): Promise<boolean> {
  const supabase = createUntypedAdminClient();

  const { data: processingJob, error: processingError } = await supabase
    .from("proof_render_jobs")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();

  if (processingError || !processingJob) {
    return false;
  }

  const [itemResult, orgResult] = await Promise.all([
    supabase
      .from("proof_items")
      .select("*")
      .eq("id", processingJob.proof_item_id)
      .single(),
    supabase
      .from("organizations")
      .select("id, name, logo_url, primary_color, settings")
      .eq("id", processingJob.organization_id)
      .single(),
  ]);

  if (itemResult.error || !itemResult.data) {
    throw new Error(itemResult.error?.message || "Proof item missing for render job");
  }

  if (orgResult.error || !orgResult.data) {
    throw new Error(orgResult.error?.message || "Organization missing for render job");
  }

  const item = itemResult.data as Record<string, unknown>;
  const org = orgResult.data as Record<string, unknown>;
  const payload = (processingJob.payload as Record<string, unknown> | null) ?? {};
  const requestedFormat = getRequestedFormat(payload);

  const input = buildRenderInput(item, org);
  const assetType = processingJob.asset_type as ProofAssetType;

  let localOutputPath = "";
  let width = 0;
  let height = 0;
  let durationSeconds: number | undefined;
  let contentType = "image/png";

  if (assetType === "video") {
    const videoResult = await withTimeout(
      renderShareStudioVideo({
        input,
        format: requestedFormat === "og" ? "16:9" : requestedFormat,
      }),
      RENDER_TIMEOUT_MS,
      "Video rendering timed out"
    );

    localOutputPath = videoResult.outputPath;
    width = videoResult.width;
    height = videoResult.height;
    durationSeconds = videoResult.durationSeconds;
    contentType = "video/mp4";
  } else {
    const stillResult = await withTimeout(
      renderShareStudioStill({
        input,
        format: assetType === "smart_link_og" ? "og" : requestedFormat,
      }),
      RENDER_TIMEOUT_MS,
      "Still rendering timed out"
    );

    localOutputPath = stillResult.outputPath;
    width = stillResult.width;
    height = stillResult.height;
    contentType = "image/png";
  }

  const storagePath = createStoragePath(
    assetType,
    String(processingJob.organization_id),
    String(processingJob.proof_item_id),
    Date.now()
  );

  const assetUrl = await uploadRenderedAsset({
    localPath: localOutputPath,
    storagePath,
    contentType,
  });

  const { data: asset, error: assetError } = await supabase
    .from("proof_assets")
    .insert({
      proof_item_id: processingJob.proof_item_id,
      organization_id: processingJob.organization_id,
      asset_type: processingJob.asset_type,
      template_id: processingJob.template_id,
      template_version_id: processingJob.template_version_id,
      storage_path: storagePath,
      asset_url: assetUrl,
      mime_type: contentType,
      width,
      height,
      duration_seconds: durationSeconds ?? null,
      metadata: {
        requested_format: requestedFormat,
        payload,
      },
    })
    .select("*")
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message || "Failed to persist rendered asset");
  }

  if (assetType === "smart_link_og") {
    const payloadLinkId = payload.link_id;
    if (typeof payloadLinkId === "string") {
      const { error: linkError } = await supabase
        .from("proof_links")
        .update({ og_asset_id: asset.id, updated_at: new Date().toISOString() })
        .eq("id", payloadLinkId)
        .eq("organization_id", processingJob.organization_id);
      if (linkError) {
        console.error("Failed to update proof_link og_asset_id", {
          linkId: payloadLinkId,
          assetId: asset.id,
          organizationId: processingJob.organization_id,
          error: linkError,
        });
      }
    } else {
      const { error: linkError } = await supabase
        .from("proof_links")
        .update({ og_asset_id: asset.id, updated_at: new Date().toISOString() })
        .eq("proof_item_id", processingJob.proof_item_id)
        .eq("organization_id", processingJob.organization_id)
        .is("og_asset_id", null);
      if (linkError) {
        console.error("Failed to update proof_link og_asset_id by item", {
          proofItemId: processingJob.proof_item_id,
          assetId: asset.id,
          organizationId: processingJob.organization_id,
          error: linkError,
        });
      }
    }
  }

  const { error: jobUpdateError } = await supabase
    .from("proof_render_jobs")
    .update({
      status: "completed",
      output_asset_id: asset.id,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", processingJob.id);

  if (jobUpdateError) {
    throw new Error(jobUpdateError.message || "Failed to finalize render job");
  }

  return true;
}

export async function processShareRenderJobs(batchSize = 5): Promise<WorkerSummary> {
  const supabase = createUntypedAdminClient();

  const summary: WorkerSummary = {
    processed: 0,
    completed: 0,
    failed: 0,
    requeued: 0,
    errors: [],
  };

  const { data: jobs, error } = await supabase
    .from("proof_render_jobs")
    .select("*")
    .eq("status", "queued")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (error) {
    throw new Error(error.message || "Failed to fetch queued render jobs");
  }

  for (const job of jobs || []) {
    summary.processed += 1;
    try {
      const didProcess = await processOneJob(job as Record<string, unknown>);
      if (didProcess) {
        summary.completed += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown render worker error";
      summary.errors.push(`[${job.id}] ${message}`);

      const outcome = await markJobFailed({
        job: job as Record<string, unknown>,
        errorMessage: message,
      });

      if (outcome === "requeued") {
        summary.requeued += 1;
      } else {
        summary.failed += 1;
      }
    }
  }

  return summary;
}
