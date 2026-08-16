"use server";

import { revalidatePath } from "next/cache";
import { unifiedGetUser } from "@/lib/auth/actions";
import { getAccessContext } from "@/lib/access";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  createRenderJob,
  ensureSmartLinkForSource,
  getShareStudioAssetsBySource,
  getRenderJob,
  queueClipRender,
  kickRenderWorker,
} from "@/lib/share-studio/service";
import {
  SHARE_STUDIO_HUB_PATH,
  bulkUpdateSmartLinksForOrganization,
  deleteShareStudioAssetForOrganization,
  getSmartLinkAnalyticsForOrganization,
  listShareStudioAssetsForOrganization,
  listSmartLinksForOrganization,
} from "@/lib/share-studio/hub-service";
import type { ActionResult } from "@/lib/types/action-result";
import type {
  ShareStudioAssetsInput,
  ShareStudioAssetsResult,
  SmartLinkAnalyticsResult,
  SmartLinkBulkAction,
  SmartLinksListInput,
  SmartLinksListResult,
} from "@/lib/share-studio/hub-types";
import type { ClipRenderOptions } from "@/lib/share-studio/clip-renderer";
import { resolveBrandTokens } from "@/lib/share-studio/template-resolver";
import { renderStillWithSatori } from "@/lib/share-studio/satori-renderer";
import { renderTemplateToPng } from "@/lib/share-studio/templates/svg-renderer";
import { getTemplate } from "@/lib/share-studio/templates/registry";
import { fetchImagesAsBase64 } from "@/lib/share-studio/templates/image-loader";
import type { TemplateFormat } from "@/lib/share-studio/templates/types";

interface ShareResult {
  success: boolean;
  slug?: string;
  url?: string;
  error?: string;
}

interface QueueRenderAssetInput {
  assetType: "image" | "video";
  format?: "16:9" | "1:1" | "9:16";
  template?: "modern" | "minimal" | "bold";
  templateId?: string;
  templateVersionId?: string;
  priority?: number;
}

interface QueueRenderAssetResult {
  success: boolean;
  jobId?: string;
  proofItemId?: string;
  error?: string;
}

async function getAuthenticatedOrganizationContext(): Promise<{
  userId: string;
  organizationId: string;
} | null> {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createUntypedAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return null;
  }

  return {
    userId: user.id,
    organizationId: profile.organization_id as string,
  };
}

async function getShareStudioHubActionContext(): Promise<
  | {
      ok: true;
      userId: string;
      organizationId: string;
    }
  | {
      ok: false;
      error: string;
    }
> {
  const ctx = await getAccessContext();
  if (!ctx) {
    return { ok: false, error: "Could not load user profile" };
  }

  if (!hasPermission(ctx, PERMISSIONS.VIEW_SHARE_STUDIO)) {
    return { ok: false, error: "You do not have permission to manage Share Studio." };
  }

  return {
    ok: true,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
  };
}

/**
 * One-click share: creates a proof item + smart link + publishes, all in one call.
 * Idempotent — if a published proof link already exists for this review, returns it.
 */
export async function shareReviewAsSmartLink(
  reviewId: string
): Promise<ShareResult> {
  return ensureReviewSmartLink(reviewId);
}

export async function ensureReviewSmartLink(
  reviewId: string
): Promise<ShareResult> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) {
    return { success: false, error: "Could not load user profile" };
  }

  try {
    const ensured = await ensureSmartLinkForSource({
      organizationId: context.organizationId,
      sourceType: "review",
      sourceId: reviewId,
      actorUserId: context.userId,
    });
    revalidatePath("/dashboard/share-studio");
    return { success: true, slug: ensured.slug, url: ensured.url };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create smart link",
    };
  }
}

export async function ensureVideoSmartLink(
  videoResponseId: string
): Promise<ShareResult> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) {
    return { success: false, error: "Could not load user profile" };
  }

  try {
    const ensured = await ensureSmartLinkForSource({
      organizationId: context.organizationId,
      sourceType: "video_testimonial",
      sourceId: videoResponseId,
      actorUserId: context.userId,
    });
    revalidatePath("/dashboard/share-studio");
    return { success: true, slug: ensured.slug, url: ensured.url };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create smart link",
    };
  }
}

export async function listSmartLinks(
  input: SmartLinksListInput = {}
): Promise<ActionResult<SmartLinksListResult>> {
  const context = await getShareStudioHubActionContext();
  if (!context.ok) {
    return { success: false, error: context.error };
  }

  try {
    const data = await listSmartLinksForOrganization(context.organizationId, input);
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load Smart Links",
    };
  }
}

export async function bulkUpdateSmartLinks(input: {
  ids: string[];
  action: SmartLinkBulkAction;
}): Promise<ActionResult<{ updated: number }>> {
  const context = await getShareStudioHubActionContext();
  if (!context.ok) {
    return { success: false, error: context.error };
  }

  try {
    const data = await bulkUpdateSmartLinksForOrganization({
      organizationId: context.organizationId,
      ids: input.ids,
      action: input.action,
    });
    revalidatePath(SHARE_STUDIO_HUB_PATH);
    revalidatePath("/dashboard/reviews");
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update Smart Links",
    };
  }
}

export async function getSmartLinkAnalytics(
  linkId: string
): Promise<ActionResult<SmartLinkAnalyticsResult>> {
  const context = await getShareStudioHubActionContext();
  if (!context.ok) {
    return { success: false, error: context.error };
  }

  try {
    const data = await getSmartLinkAnalyticsForOrganization({
      organizationId: context.organizationId,
      linkId,
    });
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load Smart Link analytics",
    };
  }
}

export async function listShareStudioAssets(
  input: ShareStudioAssetsInput = {}
): Promise<ActionResult<ShareStudioAssetsResult>> {
  const context = await getShareStudioHubActionContext();
  if (!context.ok) {
    return { success: false, error: context.error };
  }

  try {
    const data = await listShareStudioAssetsForOrganization(
      context.organizationId,
      input
    );
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load Share Studio assets",
    };
  }
}

export async function deleteShareStudioAsset(
  assetId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  const context = await getShareStudioHubActionContext();
  if (!context.ok) {
    return { success: false, error: context.error };
  }

  try {
    const data = await deleteShareStudioAssetForOrganization({
      organizationId: context.organizationId,
      assetId,
    });
    revalidatePath(SHARE_STUDIO_HUB_PATH);
    revalidatePath("/dashboard/reviews");
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete asset",
    };
  }
}

export async function getShareAssetsForReviewSource(reviewId: string) {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) return null;

  return getShareStudioAssetsBySource({
    organizationId: context.organizationId,
    sourceType: "review",
    sourceId: reviewId,
  });
}

export async function getShareAssetsForVideoSource(videoResponseId: string) {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) return null;

  return getShareStudioAssetsBySource({
    organizationId: context.organizationId,
    sourceType: "video_testimonial",
    sourceId: videoResponseId,
  });
}

async function queueRenderJobForSource(input: {
  sourceType: "review" | "video_testimonial";
  sourceId: string;
  options: QueueRenderAssetInput;
}): Promise<QueueRenderAssetResult> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) {
    return { success: false, error: "Could not load user profile" };
  }

  try {
    const ensured = await ensureSmartLinkForSource({
      organizationId: context.organizationId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      actorUserId: context.userId,
    });

    const job = await createRenderJob({
      organizationId: context.organizationId,
      proofItemId: ensured.proofItemId,
      assetType: input.options.assetType,
      requestedBy: context.userId,
      templateId: input.options.templateId,
      templateVersionId: input.options.templateVersionId,
      priority: input.options.priority,
      payload: {
        format: input.options.format ?? "1:1",
        template: input.options.template ?? "modern",
      },
    });

    revalidatePath("/dashboard/share-studio");

    // Fire-and-forget: trigger render worker immediately for faster processing
    kickRenderWorker();

    return {
      success: true,
      jobId: String(job.id),
      proofItemId: ensured.proofItemId,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to queue render job",
    };
  }
}

/**
 * Queue a Clip render (branded VideoTestimonial composition) for a video
 * testimonial response. Used by the asset creator / tweak panel; always
 * renders, even when a kit clip already exists (regenerate).
 */
export async function queueClipRenderJob(
  videoResponseId: string,
  options: ClipRenderOptions & { musicTrackId?: string }
): Promise<QueueRenderAssetResult> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) {
    return { success: false, error: "Could not load user profile" };
  }

  // Music is resolved server-side from the curated library; clients send a
  // track id, never a URL, so the render pipeline only plays approved audio.
  const { musicTrackId, ...clipOptions } = options;
  clipOptions.music = "off";
  if (musicTrackId) {
    const tracks = await getClipMusicTracks();
    const track = tracks.find((candidate) => candidate.id === musicTrackId);
    if (!track) {
      return { success: false, error: "Selected music track is unavailable" };
    }
    clipOptions.music = { url: track.url };
  }

  try {
    const result = await queueClipRender({
      organizationId: context.organizationId,
      videoResponseId,
      actorUserId: context.userId,
      options: { ...clipOptions },
      idempotent: false,
    });

    revalidatePath("/dashboard/share-studio");

    return {
      success: true,
      jobId: result.jobId ?? undefined,
      proofItemId: result.proofItemId,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to queue clip render",
    };
  }
}

export interface ClipMusicTrack {
  id: string;
  name: string;
  mood: string;
  description: string | null;
  url: string;
  durationSeconds: number | null;
}

/** Curated background-music library shown in the asset creator. */
export async function getClipMusicTracks(): Promise<ClipMusicTrack[]> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) return [];

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("clip_music_tracks")
    .select("id, name, mood, description, url, duration_seconds")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("[share-studio] Failed to load clip music tracks:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    mood: String(row.mood),
    description: (row.description as string | null) ?? null,
    url: String(row.url),
    durationSeconds:
      typeof row.duration_seconds === "number"
        ? row.duration_seconds
        : row.duration_seconds
          ? Number(row.duration_seconds)
          : null,
  }));
}

export interface RenderJobStatusResult {
  status: "queued" | "processing" | "completed" | "failed" | "not_found";
  errorMessage: string | null;
  asset: { url: string; mimeType: string | null } | null;
}

/** Poll a render job until it resolves; used by the asset creator modal. */
export async function getRenderJobStatus(
  jobId: string
): Promise<RenderJobStatusResult> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) {
    return { status: "not_found", errorMessage: "Not authenticated", asset: null };
  }

  const job = await getRenderJob(context.organizationId, jobId);
  if (!job) {
    return { status: "not_found", errorMessage: null, asset: null };
  }

  const rawStatus = String(job.status ?? "queued");
  const status: RenderJobStatusResult["status"] = [
    "queued",
    "processing",
    "completed",
    "failed",
  ].includes(rawStatus)
    ? (rawStatus as RenderJobStatusResult["status"])
    : "queued";

  const assets = job.proof_assets as
    | Array<{ asset_url?: string | null; mime_type?: string | null; id?: string }>
    | { asset_url?: string | null; mime_type?: string | null }
    | null;
  const outputAssetId = job.output_asset_id as string | null;
  const assetList = Array.isArray(assets) ? assets : assets ? [assets] : [];
  const matched =
    assetList.find((a) => "id" in a && a.id === outputAssetId) ??
    assetList[assetList.length - 1] ??
    null;

  return {
    status,
    errorMessage: (job.error_message as string | null) ?? null,
    asset:
      status === "completed" && matched?.asset_url
        ? { url: String(matched.asset_url), mimeType: matched.mime_type ?? null }
        : null,
  };
}

export async function queueReviewRenderJob(
  reviewId: string,
  options: QueueRenderAssetInput
): Promise<QueueRenderAssetResult> {
  return queueRenderJobForSource({
    sourceType: "review",
    sourceId: reviewId,
    options,
  });
}

export async function queueVideoRenderJob(
  videoResponseId: string,
  options: QueueRenderAssetInput
): Promise<QueueRenderAssetResult> {
  return queueRenderJobForSource({
    sourceType: "video_testimonial",
    sourceId: videoResponseId,
    options,
  });
}

// ---------------------------------------------------------------------------
// Inline image render (Satori — no background queue needed)
// ---------------------------------------------------------------------------

interface RenderImageInlineInput {
  format?: "16:9" | "1:1" | "9:16";
  template?: "modern" | "minimal" | "bold";
}

interface RenderImageInlineResult {
  success: boolean;
  assetUrl?: string;
  error?: string;
}

export async function renderImageInline(
  sourceType: "review" | "video_testimonial",
  sourceId: string,
  options: RenderImageInlineInput
): Promise<RenderImageInlineResult> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) {
    return { success: false, error: "Could not load user profile" };
  }

  try {
    // 1. Ensure proof item + smart link exist
    const ensured = await ensureSmartLinkForSource({
      organizationId: context.organizationId,
      sourceType,
      sourceId,
      actorUserId: context.userId,
    });

    // 2. Load source data + org branding
    const supabase = createUntypedAdminClient();
    const [itemResult, orgResult] = await Promise.all([
      supabase
        .from("proof_items")
        .select("*")
        .eq("id", ensured.proofItemId)
        .single(),
      supabase
        .from("organizations")
        .select("id, name, logo_url, primary_color, settings")
        .eq("id", context.organizationId)
        .single(),
    ]);

    if (itemResult.error || !itemResult.data) {
      return { success: false, error: "Proof item not found" };
    }
    if (orgResult.error || !orgResult.data) {
      return { success: false, error: "Organization not found" };
    }

    const item = itemResult.data as Record<string, unknown>;
    const org = orgResult.data as Record<string, unknown>;
    const brand = resolveBrandTokens({
      primary_color: (org.primary_color as string | null) ?? null,
      logo_url: (org.logo_url as string | null) ?? null,
      settings: (org.settings as Record<string, unknown> | null) ?? null,
    });

    const formatValue = options.format ?? "1:1";
    const templateValue = options.template ?? "modern";

    // 3. Render with Satori (milliseconds)
    const rendered = await renderStillWithSatori({
      input: {
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
      },
      format: formatValue,
      template: templateValue,
    });

    // 4. Upload to storage
    const storagePath = `images/${context.organizationId}/${ensured.proofItemId}/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("share-studio")
      .upload(storagePath, rendered.buffer, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) {
      return { success: false, error: uploadError.message || "Upload failed" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("share-studio").getPublicUrl(storagePath);

    // 5. Create asset record
    const { error: assetError } = await supabase.from("proof_assets").insert({
      proof_item_id: ensured.proofItemId,
      organization_id: context.organizationId,
      asset_type: "image",
      storage_path: storagePath,
      asset_url: publicUrl,
      mime_type: "image/png",
      width: rendered.width,
      height: rendered.height,
      duration_seconds: null,
      metadata: { requested_format: formatValue, template: templateValue },
    });

    if (assetError) {
      return { success: false, error: assetError.message || "Failed to save asset" };
    }

    revalidatePath("/dashboard/share-studio");
    return { success: true, assetUrl: publicUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to render image",
    };
  }
}

// ---------------------------------------------------------------------------
// Inline premium template render (React SVG + resvg — no background queue)
// ---------------------------------------------------------------------------

const FORMAT_DIMENSIONS: Record<TemplateFormat, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
};

interface RenderTemplateInlineInput {
  templateId: string;
  format?: TemplateFormat;
}

export async function renderTemplateInline(
  sourceType: "review" | "video_testimonial",
  sourceId: string,
  options: RenderTemplateInlineInput,
): Promise<RenderImageInlineResult> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) {
    return { success: false, error: "Could not load user profile" };
  }

  const templateMeta = getTemplate(options.templateId);
  if (!templateMeta) {
    return { success: false, error: `Unknown template: ${options.templateId}` };
  }

  try {
    // 1. Ensure proof item + smart link exist
    const ensured = await ensureSmartLinkForSource({
      organizationId: context.organizationId,
      sourceType,
      sourceId,
      actorUserId: context.userId,
    });

    // 2. Load source data + org branding
    const supabase = createUntypedAdminClient();
    const [itemResult, orgResult] = await Promise.all([
      supabase
        .from("proof_items")
        .select("*")
        .eq("id", ensured.proofItemId)
        .single(),
      supabase
        .from("organizations")
        .select("id, name, logo_url, primary_color, settings")
        .eq("id", context.organizationId)
        .single(),
    ]);

    if (itemResult.error || !itemResult.data) {
      return { success: false, error: "Proof item not found" };
    }
    if (orgResult.error || !orgResult.data) {
      return { success: false, error: "Organization not found" };
    }

    const item = itemResult.data as Record<string, unknown>;
    const org = orgResult.data as Record<string, unknown>;
    const brand = resolveBrandTokens({
      primary_color: (org.primary_color as string | null) ?? null,
      logo_url: (org.logo_url as string | null) ?? null,
      settings: (org.settings as Record<string, unknown> | null) ?? null,
    });

    // 3. Pre-fetch avatar + logo as base64 for SVG embedding
    const sourceSnapshot = (item.source_snapshot as Record<string, unknown>) ?? {};
    const avatarUrl =
      (sourceSnapshot.reviewer_avatar_url as string | null) ??
      (sourceSnapshot.avatar_url as string | null) ??
      null;
    const logoUrl = brand.logoUrl;

    const imageMap = await fetchImagesAsBase64([avatarUrl, logoUrl]);

    const formatValue: TemplateFormat = options.format ?? "1:1";
    const dims = FORMAT_DIMENSIONS[formatValue];

    // 4. Render with React SVG + resvg
    const rendered = await renderTemplateToPng(templateMeta.component, {
      width: dims.width,
      height: dims.height,
      quote:
        (item.quote as string | null) ||
        (item.summary as string | null) ||
        "Customer feedback captured in Share Studio.",
      customerName: (item.customer_name as string | null) || "Verified Customer",
      rating: (item.rating as number | null) ?? 5,
      avatarBase64: avatarUrl ? (imageMap.get(avatarUrl) ?? null) : null,
      orgName: (org.name as string) || "Organization",
      primaryColor: brand.primaryColor,
      secondaryColor: brand.secondaryColor,
      logoBase64: logoUrl ? (imageMap.get(logoUrl) ?? null) : null,
    });

    // 5. Upload to storage
    const storagePath = `images/${context.organizationId}/${ensured.proofItemId}/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("share-studio")
      .upload(storagePath, rendered.buffer, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) {
      return { success: false, error: uploadError.message || "Upload failed" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("share-studio").getPublicUrl(storagePath);

    // 6. Create asset record
    const { error: assetError } = await supabase.from("proof_assets").insert({
      proof_item_id: ensured.proofItemId,
      organization_id: context.organizationId,
      asset_type: "image",
      storage_path: storagePath,
      asset_url: publicUrl,
      mime_type: "image/png",
      width: rendered.width,
      height: rendered.height,
      duration_seconds: null,
      metadata: {
        requested_format: formatValue,
        template: options.templateId,
        renderer: "svg-resvg",
      },
    });

    if (assetError) {
      return { success: false, error: assetError.message || "Failed to save asset" };
    }

    revalidatePath("/dashboard/share-studio");
    return { success: true, assetUrl: publicUrl };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to render template",
    };
  }
}

// ---------------------------------------------------------------------------
// Smart link settings
// ---------------------------------------------------------------------------

interface SmartLinkSettings {
  ctaButtonUrl: string | null;
  ctaButtonText: string | null;
}

export async function getSmartLinkSettings(): Promise<SmartLinkSettings | null> {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("cta_button_url, cta_button_text")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    ctaButtonUrl: data.cta_button_url,
    ctaButtonText: data.cta_button_text,
  };
}

interface SettingsResult {
  success: boolean;
  error?: string;
}

export async function updateSmartLinkSettings(
  ctaButtonUrl: string | null,
  ctaButtonText: string | null
): Promise<SettingsResult> {
  const user = await unifiedGetUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({
      cta_button_url: ctaButtonUrl || null,
      cta_button_text: ctaButtonText || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export interface OrganizationBrandingResult {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export async function getOrganizationBranding(): Promise<OrganizationBrandingResult | null> {
  const context = await getAuthenticatedOrganizationContext();
  if (!context) return null;

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("name, logo_url, primary_color, settings")
    .eq("id", context.organizationId)
    .single();

  if (error || !data) return null;

  const settings = (data.settings as Record<string, unknown> | null) ?? {};

  return {
    name: (data.name as string) || "Organization",
    logoUrl: (data.logo_url as string | null) ?? null,
    primaryColor: (data.primary_color as string | null) || "#52796f",
    secondaryColor: (settings.secondary_color as string | null) || "#84a98c",
  };
}
