import crypto from "crypto";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { classifyProofItemEdit, type EditClassificationResult } from "@/lib/share-studio/edit-classification";
import type {
  ProofAssetType,
  ProofSourceType,
  ProofStatus,
  ProofItemSnapshot,
  BrandTokens,
} from "@/lib/share-studio/template-types";
import { resolveBrandTokens } from "@/lib/share-studio/template-resolver";

interface PostgrestErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

export class ShareStudioSchemaNotReadyError extends Error {
  constructor() {
    super(
      "Share Studio schema is not available. Apply the latest Supabase migrations and refresh."
    );
    this.name = "ShareStudioSchemaNotReadyError";
  }
}

export function isShareStudioSchemaError(
  error: unknown,
  tableNames: string[] = ["proof_items"]
): boolean {
  const candidate = (error ?? {}) as PostgrestErrorLike;

  if (candidate.code === "PGRST205") {
    return true;
  }

  const normalized = `${candidate.message ?? ""} ${candidate.details ?? ""} ${candidate.hint ?? ""}`.toLowerCase();

  if (!normalized) return false;

  if (normalized.includes("schema cache")) {
    return tableNames.some((table) => normalized.includes(table.toLowerCase()));
  }

  return tableNames.some((table) => {
    const lower = table.toLowerCase();
    return (
      normalized.includes(`relation "${lower}" does not exist`) ||
      normalized.includes(`public.${lower}`) ||
      normalized.includes(`'public.${lower}'`)
    );
  });
}

export async function isShareStudioSchemaReady(
  organizationId: string
): Promise<boolean> {
  const supabase = createUntypedAdminClient();
  const { error } = await supabase
    .from("proof_items")
    .select("id")
    .eq("organization_id", organizationId)
    .limit(1);

  if (!error) {
    return true;
  }

  if (isShareStudioSchemaError(error, ["proof_items"])) {
    return false;
  }

  throw new Error(error.message || "Failed to verify Share Studio schema");
}

export interface CreateProofItemInput {
  organizationId: string;
  createdBy?: string | null;
  presenterUserId?: string | null;
  source: {
    review_id?: string;
    video_response_id?: string;
    manual_json?: Record<string, unknown>;
  };
  templateId?: string;
  title?: string;
  summary?: string;
  quote?: string;
  customer_name?: string;
  rating?: number;
}

export interface ListProofItemsInput {
  organizationId: string;
  source_type?: ProofSourceType;
  status?: ProofStatus;
  approval_status?: "approved" | "pending_approval" | "rejected";
  created_after?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface PatchProofItemInput {
  organizationId: string;
  itemId: string;
  editedBy?: string | null;
  content: Partial<{
    title: string | null;
    summary: string | null;
    quote: string | null;
    customer_name: string | null;
    rating: number | null;
    source_platform: string | null;
    source_review_date: string | null;
    custom_payload: Record<string, unknown> | null;
  }>;
}

export interface ApprovalActionInput {
  organizationId: string;
  itemId: string;
  actedBy?: string | null;
  action: "approve" | "reject" | "request_changes";
  reason?: string;
}

export interface CreateRenderJobInput {
  organizationId: string;
  proofItemId: string;
  assetType: ProofAssetType;
  requestedBy?: string | null;
  templateId?: string;
  templateVersionId?: string;
  priority?: number;
  payload?: Record<string, unknown>;
}

export interface CreateSmartLinkInput {
  organizationId: string;
  proofItemId: string;
  slug?: string;
  title?: string;
  description?: string;
  destinationUrl?: string;
  createdBy?: string | null;
}

export interface EnsureSmartLinkForSourceInput {
  organizationId: string;
  sourceType: Extract<ProofSourceType, "review" | "video_testimonial">;
  sourceId: string;
  actorUserId?: string | null;
}

export interface EnsureSmartLinkForSourceResult {
  proofItemId: string;
  slug: string;
  url: string;
  created: boolean;
}

export interface RecordProofLinkEventInput {
  organizationId: string;
  proofLinkId: string;
  eventType: "view" | "click";
  requestId?: string;
  referrer?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

function clipText(value: string | null | undefined, maxLength: number): string {
  const input = (value ?? "").trim();
  if (input.length <= maxLength) return input;
  return `${input.slice(0, maxLength - 1)}...`;
}

function mapSentimentToRating(sentiment: number | null | undefined): number {
  if (sentiment === null || sentiment === undefined) return 5;
  const normalized = Math.max(1, Math.min(5, Math.round((sentiment / 100) * 5)));
  return normalized;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function randomSlugSuffix(): string {
  return crypto.randomBytes(3).toString("hex");
}

function pickManualField(
  payload: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function hashIp(ipAddress?: string | null): string | null {
  if (!ipAddress) return null;
  const salt = process.env.SHARE_STUDIO_IP_HASH_SALT;
  if (!salt) {
    console.error("SHARE_STUDIO_IP_HASH_SALT is not set — IP hashing disabled");
    return null;
  }
  return crypto
    .createHash("sha256")
    .update(`${salt}:${ipAddress}`)
    .digest("hex")
    .slice(0, 48);
}

async function buildProofItemSnapshot(input: CreateProofItemInput): Promise<{
  sourceType: ProofSourceType;
  sourceId: string | null;
  presenterUserId: string | null;
  snapshot: Record<string, unknown>;
  content: Omit<ProofItemSnapshot, "source_type" | "source_snapshot" | "source_id">;
}> {
  const supabase = createUntypedAdminClient();

  const sourceFlags = [
    !!input.source.review_id,
    !!input.source.video_response_id,
    !!input.source.manual_json,
  ].filter(Boolean);

  if (sourceFlags.length !== 1) {
    throw new Error("Exactly one source input is required");
  }

  if (input.source.review_id) {
    const { data: review, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", input.source.review_id)
      .eq("organization_id", input.organizationId)
      .single();

    if (error || !review) {
      throw new Error("Review source not found");
    }

    const quote = clipText(review.text ?? "", 300);
    const summary = clipText(review.text ?? "", 160);
    const title = `Review from ${review.customer_name || "Customer"}`;

    return {
      sourceType: "review",
      sourceId: review.id,
      presenterUserId: (review.user_id as string | null) ?? null,
      snapshot: {
        review_id: review.id,
        rating: review.rating,
        source: review.source,
        review_date: review.review_date,
        text: review.text,
        customer_name: review.customer_name,
        source_url: review.source_url,
      },
      content: {
        title,
        summary,
        quote,
        customer_name: review.customer_name,
        rating: review.rating,
        source_platform: review.source,
        source_review_date: review.review_date,
        custom_payload: null,
      },
    };
  }

  if (input.source.video_response_id) {
    const { data: response, error } = await supabase
      .from("video_testimonial_responses")
      .select("*, video_testimonial_requests(customer_name, source, submitted_at)")
      .eq("id", input.source.video_response_id)
      .eq("organization_id", input.organizationId)
      .single();

    if (error || !response) {
      throw new Error("Video testimonial source not found");
    }

    const request = response.video_testimonial_requests as
      | {
          customer_name?: string | null;
          source?: string | null;
          submitted_at?: string | null;
        }
      | undefined;

    const quoteSource =
      response.ai_generated_text ||
      response.transcription ||
      "Video testimonial submitted";

    const quote = clipText(quoteSource, 300);

    return {
      sourceType: "video_testimonial",
      sourceId: response.id,
      presenterUserId: (response.user_id as string | null) ?? null,
      snapshot: {
        video_response_id: response.id,
        request_id: response.request_id,
        customer_name: request?.customer_name ?? null,
        source: request?.source ?? "video_testimonial",
        submitted_at: request?.submitted_at ?? response.created_at,
        video_url: response.video_url,
        thumbnail_url: response.thumbnail_url,
        ai_generated_text: response.ai_generated_text,
        transcription: response.transcription,
        sentiment_score: response.sentiment_score,
      },
      content: {
        title: `Video story from ${request?.customer_name || "Customer"}`,
        summary: clipText(quoteSource, 160),
        quote,
        customer_name: request?.customer_name ?? null,
        rating: mapSentimentToRating(response.sentiment_score),
        source_platform: request?.source ?? "video_testimonial",
        source_review_date: request?.submitted_at ?? response.created_at,
        custom_payload: null,
      },
    };
  }

  const manual = input.source.manual_json || {};
  const quote = pickManualField(manual, ["quote", "text", "content", "message"]);
  const title = pickManualField(manual, ["title", "headline"]) || "Manual proof item";
  const summary = pickManualField(manual, ["summary", "description", "excerpt"]);
  const customerName = pickManualField(manual, ["customer_name", "author", "name"]);

  const ratingValue = typeof manual.rating === "number" ? manual.rating : null;
  const sourcePlatform = pickManualField(manual, ["source", "source_platform"]);
  const sourceReviewDate = pickManualField(manual, ["review_date", "source_review_date", "date"]);

  return {
    sourceType: "manual_json",
    sourceId: null,
    presenterUserId: null,
    snapshot: {
      manual_json: manual,
    },
    content: {
      title,
      summary,
      quote,
      customer_name: customerName,
      rating: ratingValue,
      source_platform: sourcePlatform,
      source_review_date: sourceReviewDate,
      custom_payload: manual,
    },
  };
}

async function getProofItemRow(organizationId: string, itemId: string): Promise<Record<string, unknown> | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("proof_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", itemId)
    .single();

  if (error || !data) return null;
  return data;
}

async function getProofItemBySource(
  organizationId: string,
  sourceType: Extract<ProofSourceType, "review" | "video_testimonial">,
  sourceId: string
): Promise<Record<string, unknown> | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("proof_items")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function getActiveProofLinkByItem(
  organizationId: string,
  proofItemId: string
): Promise<Record<string, unknown> | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("proof_links")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("proof_item_id", proofItemId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function resolvePresenterUserIdForSource(
  organizationId: string,
  sourceType: Extract<ProofSourceType, "review" | "video_testimonial">,
  sourceId: string
): Promise<string | null> {
  const supabase = createUntypedAdminClient();

  if (sourceType === "review") {
    const { data, error } = await supabase
      .from("reviews")
      .select("user_id")
      .eq("organization_id", organizationId)
      .eq("id", sourceId)
      .maybeSingle();

    if (error || !data) return null;
    return (data.user_id as string | null) ?? null;
  }

  const { data, error } = await supabase
    .from("video_testimonial_responses")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("id", sourceId)
    .maybeSingle();

  if (error || !data) return null;
  return (data.user_id as string | null) ?? null;
}

async function resolvePresenterDestinationUrl(
  presenterUserId: string | null | undefined
): Promise<string | null> {
  if (!presenterUserId) return null;

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("cta_button_url, personal_website_url")
    .eq("id", presenterUserId)
    .maybeSingle();

  if (error || !data) return null;

  return (
    (data.cta_button_url as string | null) ??
    (data.personal_website_url as string | null) ??
    null
  );
}

export async function createProofItem(input: CreateProofItemInput): Promise<Record<string, unknown>> {
  const supabase = createUntypedAdminClient();

  const built = await buildProofItemSnapshot(input);

  // Carry the source snapshot's payload forward, tagging it with the template when one was chosen.
  const customPayload = { ...(built.content.custom_payload || {}) };
  if (input.templateId) customPayload.template_id = input.templateId;

  const itemPayload = {
    organization_id: input.organizationId,
    created_by: input.createdBy ?? null,
    presenter_user_id: input.presenterUserId ?? built.presenterUserId,
    source_type: built.sourceType,
    source_id: built.sourceId,
    source_snapshot: built.snapshot,
    title: input.title ?? built.content.title,
    summary: input.summary ?? built.content.summary,
    quote: input.quote ?? built.content.quote,
    customer_name: input.customer_name ?? built.content.customer_name,
    rating: input.rating ?? built.content.rating,
    source_platform: built.content.source_platform,
    source_review_date: built.content.source_review_date,
    custom_payload: customPayload,
    status: "approved",
    approval_required: false,
    approved_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("proof_items")
    .insert(itemPayload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create proof item");
  }

  return data;
}

export async function listProofItems(input: ListProofItemsInput): Promise<{
  items: Record<string, unknown>[];
  total: number;
}> {
  const supabase = createUntypedAdminClient();
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.page_size ?? 25));
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("proof_items")
    .select("*", { count: "exact" })
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (input.source_type) query = query.eq("source_type", input.source_type);
  if (input.status) query = query.eq("status", input.status);

  if (input.approval_status === "approved") {
    query = query.eq("status", "approved");
  } else if (input.approval_status === "pending_approval") {
    query = query.eq("status", "pending_approval");
  } else if (input.approval_status === "rejected") {
    query = query.eq("status", "rejected");
  }

  if (input.created_after) query = query.gte("created_at", input.created_after);

  if (input.search) {
    const escaped = input.search
      .replace(/,/g, " ")
      .replace(/([%_\\])/g, "\\$1");
    query = query.or(
      `title.ilike.%${escaped}%,summary.ilike.%${escaped}%,quote.ilike.%${escaped}%,customer_name.ilike.%${escaped}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    if (isShareStudioSchemaError(error, ["proof_items"])) {
      throw new ShareStudioSchemaNotReadyError();
    }
    throw new Error(error.message || "Failed to list proof items");
  }

  return {
    items: (data ?? []) as Record<string, unknown>[],
    total: count ?? 0,
  };
}

export async function getProofItemWithDetails(organizationId: string, itemId: string): Promise<{
  item: Record<string, unknown>;
  edits: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
  links: Record<string, unknown>[];
}> {
  const supabase = createUntypedAdminClient();

  const item = await getProofItemRow(organizationId, itemId);
  if (!item) {
    throw new Error("Proof item not found");
  }

  const [editsResult, assetsResult, jobsResult, linksResult] = await Promise.all([
    supabase
      .from("proof_item_edits")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("proof_item_id", itemId)
      .order("created_at", { ascending: false }),
    supabase
      .from("proof_assets")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("proof_item_id", itemId)
      .order("created_at", { ascending: false }),
    supabase
      .from("proof_render_jobs")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("proof_item_id", itemId)
      .order("created_at", { ascending: false }),
    supabase
      .from("proof_links")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("proof_item_id", itemId)
      .order("created_at", { ascending: false }),
  ]);

  if (editsResult.error) throw new Error(editsResult.error.message);
  if (assetsResult.error) throw new Error(assetsResult.error.message);
  if (jobsResult.error) throw new Error(jobsResult.error.message);
  if (linksResult.error) throw new Error(linksResult.error.message);

  return {
    item,
    edits: (editsResult.data ?? []) as Record<string, unknown>[],
    assets: (assetsResult.data ?? []) as Record<string, unknown>[],
    jobs: (jobsResult.data ?? []) as Record<string, unknown>[],
    links: (linksResult.data ?? []) as Record<string, unknown>[],
  };
}

export async function getShareStudioAssetsBySource(input: {
  organizationId: string;
  sourceType: Extract<ProofSourceType, "review" | "video_testimonial">;
  sourceId: string;
}): Promise<{
  item: Record<string, unknown> | null;
  links: Record<string, unknown>[];
  assets: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
}> {
  const item = await getProofItemBySource(
    input.organizationId,
    input.sourceType,
    input.sourceId
  );

  if (!item) {
    return {
      item: null,
      links: [],
      assets: [],
      jobs: [],
    };
  }

  const details = await getProofItemWithDetails(input.organizationId, String(item.id));
  return {
    item: details.item,
    links: details.links,
    assets: details.assets,
    jobs: details.jobs,
  };
}

function buildEditablePayload(item: Record<string, unknown>): Record<string, unknown> {
  return {
    title: item.title ?? null,
    summary: item.summary ?? null,
    quote: item.quote ?? null,
    customer_name: item.customer_name ?? null,
    rating: item.rating ?? null,
    source_platform: item.source_platform ?? null,
    source_review_date: item.source_review_date ?? null,
    custom_payload: (item.custom_payload as Record<string, unknown> | null) ?? null,
  };
}

function statusFromClassification(classification: EditClassificationResult): ProofStatus {
  if (classification.classification === "minor") return "approved";
  if (classification.classification === "material") return "pending_approval";
  return "rejected";
}

export async function patchProofItem(input: PatchProofItemInput): Promise<{
  item: Record<string, unknown>;
  classification: EditClassificationResult;
}> {
  const supabase = createUntypedAdminClient();

  const item = await getProofItemRow(input.organizationId, input.itemId);
  if (!item) {
    throw new Error("Proof item not found");
  }

  const originalPayload = buildEditablePayload(item);
  const editedPayload = {
    ...originalPayload,
    ...input.content,
  };

  const classification = classifyProofItemEdit({
    sourceType: item.source_type as ProofSourceType,
    originalPayload,
    editedPayload,
  });

  if (classification.classification === "blocked") {
    throw new Error(classification.reason);
  }

  const nextStatus = statusFromClassification(classification);
  const now = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    ...input.content,
    status: nextStatus,
    approval_required: classification.classification === "material",
    updated_at: now,
  };

  if (classification.classification === "minor") {
    updatePayload.approved_at = now;
    updatePayload.rejection_reason = null;
  } else {
    updatePayload.approved_at = null;
    updatePayload.approved_by = null;
  }

  const { data: updated, error: updateError } = await supabase
    .from("proof_items")
    .update(updatePayload)
    .eq("id", input.itemId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message || "Failed to update proof item");
  }

  const { error: editError } = await supabase.from("proof_item_edits").insert({
    proof_item_id: input.itemId,
    organization_id: input.organizationId,
    edited_by: input.editedBy ?? null,
    original_content: originalPayload,
    edited_content: editedPayload,
    diff_summary: {
      fields: classification.diff,
      reason: classification.reason,
    },
    lexical_delta_percent: classification.lexicalDeltaPercent,
    classification: classification.classification,
    classification_reason: classification.reason,
  });

  if (editError) {
    throw new Error(editError.message || "Failed to save edit log");
  }

  return {
    item: updated,
    classification,
  };
}

export async function applyProofApprovalAction(input: ApprovalActionInput): Promise<Record<string, unknown>> {
  const supabase = createUntypedAdminClient();

  const item = await getProofItemRow(input.organizationId, input.itemId);
  if (!item) throw new Error("Proof item not found");

  const now = new Date().toISOString();
  let status: ProofStatus;
  let rejectionReason: string | null = null;
  let approvedAt: string | null = null;

  if (input.action === "approve") {
    status = "approved";
    approvedAt = now;
  } else if (input.action === "reject") {
    status = "rejected";
    rejectionReason = input.reason || "Rejected during approval";
  } else {
    status = "pending_approval";
    rejectionReason = input.reason || "Changes requested";
  }

  const { data, error } = await supabase
    .from("proof_items")
    .update({
      status,
      approved_by: input.actedBy ?? null,
      approved_at: approvedAt,
      rejection_reason: rejectionReason,
      approval_required: status === "pending_approval",
      updated_at: now,
    })
    .eq("organization_id", input.organizationId)
    .eq("id", input.itemId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to apply approval action");
  }

  return data;
}

export async function createRenderJob(input: CreateRenderJobInput): Promise<Record<string, unknown>> {
  const supabase = createUntypedAdminClient();

  const item = await getProofItemRow(input.organizationId, input.proofItemId);
  if (!item) {
    throw new Error("Proof item not found");
  }

  const { data, error } = await supabase
    .from("proof_render_jobs")
    .insert({
      organization_id: input.organizationId,
      proof_item_id: input.proofItemId,
      requested_by: input.requestedBy ?? null,
      asset_type: input.assetType,
      template_id: input.templateId ?? null,
      template_version_id: input.templateVersionId ?? null,
      status: "queued",
      priority: input.priority ?? 0,
      payload: input.payload ?? {},
      queued_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create render job");
  }

  return data;
}

/** Fire-and-forget kick so queued render jobs start without waiting for cron. */
export function kickRenderWorker(): void {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  fetch(`${appUrl}/api/cron/share-render-jobs`, {
    method: "POST",
    headers: { "x-cron-secret": process.env.CRON_SECRET || "" },
  }).catch(() => {});
}

export interface QueueClipRenderInput {
  organizationId: string;
  videoResponseId: string;
  actorUserId?: string | null;
  /** ClipRenderOptions passed through to the renderer (see clip-renderer.ts) */
  options?: Record<string, unknown>;
  priority?: number;
  /**
   * When true (auto-kit), skip if any clip job already exists for this
   * source so re-approvals don't re-render. Manual regenerates pass false.
   */
  idempotent?: boolean;
}

export interface QueueClipRenderResult {
  jobId: string | null;
  proofItemId: string;
  skipped?: "existing_job";
}

/**
 * Queue a Clip render (branded VideoTestimonial composition) for a video
 * response. Ensures the proof item + smart link exist first; quarantine and
 * approval gating are enforced by ensureSmartLinkForSource.
 */
export async function queueClipRender(
  input: QueueClipRenderInput
): Promise<QueueClipRenderResult> {
  const supabase = createUntypedAdminClient();

  const ensured = await ensureSmartLinkForSource({
    organizationId: input.organizationId,
    sourceType: "video_testimonial",
    sourceId: input.videoResponseId,
    actorUserId: input.actorUserId ?? null,
  });

  if (input.idempotent) {
    const { data: existing } = await supabase
      .from("proof_render_jobs")
      .select("id, status")
      .eq("proof_item_id", ensured.proofItemId)
      .eq("organization_id", input.organizationId)
      .eq("asset_type", "video")
      .contains("payload", { composition: "video_testimonial" })
      .in("status", ["queued", "processing", "completed"])
      .limit(1);

    if (existing && existing.length > 0) {
      return { jobId: null, proofItemId: ensured.proofItemId, skipped: "existing_job" };
    }
  }

  const options = input.options ?? {};
  const format = typeof options.format === "string" ? options.format : "9:16";

  const job = await createRenderJob({
    organizationId: input.organizationId,
    proofItemId: ensured.proofItemId,
    assetType: "video",
    requestedBy: input.actorUserId ?? undefined,
    priority: input.priority,
    payload: {
      composition: "video_testimonial",
      format,
      options: { format, ...options },
    },
  });

  kickRenderWorker();

  return { jobId: String(job.id), proofItemId: ensured.proofItemId };
}

const QUOTE_CARD_KIT_FORMATS = ["1:1", "9:16"] as const;

/**
 * Text-review half of the Asset Kit: queue quote-card images (1:1 + 9:16)
 * for reviews that were just approved at/above the org's celebration
 * threshold. Video-sourced reviews are skipped (they get a Clip instead).
 * Idempotent per review: a review that already has kit jobs is not re-queued.
 */
export async function queueQuoteCardKitForReviews(input: {
  organizationId: string;
  reviewIds: string[];
  actorUserId?: string | null;
  /** Minimum rating for kit generation (the org's celebration threshold) */
  minRating: number;
}): Promise<{ queued: number; skipped: number }> {
  const supabase = createUntypedAdminClient();
  let queued = 0;
  let skipped = 0;

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, rating, source")
    .in("id", input.reviewIds)
    .eq("organization_id", input.organizationId);

  if (error) {
    throw new Error(error.message || "Failed to load reviews for kit generation");
  }

  for (const review of reviews || []) {
    const rating = typeof review.rating === "number" ? review.rating : null;
    if (
      review.source === "video_testimonial" ||
      rating === null ||
      rating < input.minRating
    ) {
      skipped += 1;
      continue;
    }

    try {
      const ensured = await ensureSmartLinkForSource({
        organizationId: input.organizationId,
        sourceType: "review",
        sourceId: String(review.id),
        actorUserId: input.actorUserId ?? null,
      });

      const { data: existing } = await supabase
        .from("proof_render_jobs")
        .select("id")
        .eq("proof_item_id", ensured.proofItemId)
        .eq("organization_id", input.organizationId)
        .eq("asset_type", "image")
        .contains("payload", { kit: "quote_card" })
        .in("status", ["queued", "processing", "completed"])
        .limit(1);

      if (existing && existing.length > 0) {
        skipped += 1;
        continue;
      }

      for (const format of QUOTE_CARD_KIT_FORMATS) {
        await createRenderJob({
          organizationId: input.organizationId,
          proofItemId: ensured.proofItemId,
          assetType: "image",
          requestedBy: input.actorUserId ?? undefined,
          payload: { kit: "quote_card", format, template: "modern" },
        });
      }
      queued += 1;
    } catch (err) {
      console.error("Asset kit: failed to queue quote cards for review", {
        reviewId: review.id,
        organizationId: input.organizationId,
        error: err,
      });
      skipped += 1;
    }
  }

  if (queued > 0) {
    kickRenderWorker();
  }

  return { queued, skipped };
}

export async function getRenderJob(
  organizationId: string,
  jobId: string
): Promise<Record<string, unknown> | null> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("proof_render_jobs")
    .select("*, proof_assets(*)")
    .eq("organization_id", organizationId)
    .eq("id", jobId)
    .single();

  if (error || !data) return null;
  return data;
}

async function ensureUniqueSlug(
  organizationId: string,
  preferred?: string
): Promise<string> {
  const supabase = createUntypedAdminClient();

  let slug = slugify(preferred || "smart-link") || `smart-link-${randomSlugSuffix()}`;

  for (let i = 0; i < 6; i++) {
    const { data } = await supabase
      .from("proof_links")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;
    slug = `${slugify(preferred || "smart-link")}-${randomSlugSuffix()}`;
  }

  return `${slug}-${randomSlugSuffix()}`;
}

export async function createSmartLink(input: CreateSmartLinkInput): Promise<Record<string, unknown>> {
  const supabase = createUntypedAdminClient();

  const item = await getProofItemRow(input.organizationId, input.proofItemId);
  if (!item) throw new Error("Proof item not found");

  const slug = await ensureUniqueSlug(
    input.organizationId,
    input.slug || (item.title as string | null) || (item.customer_name as string | null) || "smart-link"
  );

  const { data, error } = await supabase
    .from("proof_links")
    .insert({
      organization_id: input.organizationId,
      proof_item_id: input.proofItemId,
      slug,
      title: input.title ?? (item.title as string | null),
      description: input.description ?? (item.summary as string | null),
      destination_url: input.destinationUrl ?? null,
      created_by: input.createdBy ?? null,
      published: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create smart link");
  }

  return data;
}

export async function ensureSmartLinkForSource(
  input: EnsureSmartLinkForSourceInput
): Promise<EnsureSmartLinkForSourceResult> {
  const supabase = createUntypedAdminClient();

  // Quarantine enforcement (ADR 0001): low-path/quarantined videos are held
  // back, but 4+ star video testimonials may be shared immediately.
  if (input.sourceType === "video_testimonial") {
    const { data: videoRow, error: videoError } = await supabase
      .from("video_testimonial_responses")
      .select("approval_status, customer_rating, quarantined")
      .eq("id", input.sourceId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();

    if (videoError || !videoRow) {
      throw new Error("Video testimonial not found");
    }

    const status = String(videoRow.approval_status ?? "");
    const rating =
      typeof videoRow.customer_rating === "number" ? videoRow.customer_rating : null;
    const approvedForPublicShare =
      ["approved", "published"].includes(status) || (rating !== null && rating >= 4);

    if (videoRow.quarantined || !approvedForPublicShare) {
      throw new Error(
        "This video must have a 4+ star rating or be approved before it can be shared publicly"
      );
    }
  }
  const presenterUserId = await resolvePresenterUserIdForSource(
    input.organizationId,
    input.sourceType,
    input.sourceId
  );
  const presenterDestinationUrl = await resolvePresenterDestinationUrl(presenterUserId);

  let createdAny = false;

  let item = await getProofItemBySource(
    input.organizationId,
    input.sourceType,
    input.sourceId
  );

  if (!item) {
    try {
      item = await createProofItem({
        organizationId: input.organizationId,
        createdBy: input.actorUserId ?? null,
        presenterUserId,
        source:
          input.sourceType === "review"
            ? { review_id: input.sourceId }
            : { video_response_id: input.sourceId },
      });
      createdAny = true;
    } catch (error) {
      console.error("ensureSmartLinkForSource: proof item creation race, retrying", { error });
      // Handle races against the source-uniqueness index.
      item = await getProofItemBySource(
        input.organizationId,
        input.sourceType,
        input.sourceId
      );
      if (!item) {
        throw new Error("Failed to create proof item for smart link source");
      }
    }
  }

  if (
    presenterUserId &&
    (item.presenter_user_id as string | null) !== presenterUserId
  ) {
    const { data: updatedItem, error: presenterError } = await supabase
      .from("proof_items")
      .update({
        presenter_user_id: presenterUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", input.organizationId)
      .eq("id", item.id)
      .select("*")
      .single();

    if (presenterError || !updatedItem) {
      throw new Error(
        presenterError?.message || "Failed to update proof presenter"
      );
    }
    item = updatedItem;
  }

  if (!item) {
    throw new Error("Failed to resolve proof item for smart link source");
  }

  const proofItemId = String(item.id);

  let link = await getActiveProofLinkByItem(input.organizationId, proofItemId);

  if (!link) {
    try {
      link = await createSmartLink({
        organizationId: input.organizationId,
        proofItemId,
        destinationUrl: presenterDestinationUrl ?? undefined,
        createdBy: input.actorUserId ?? null,
      });
      createdAny = true;
    } catch (error) {
      console.error("ensureSmartLinkForSource: smart link creation race, retrying", { error });
      // Handle races against one-active-link constraint.
      link = await getActiveProofLinkByItem(input.organizationId, proofItemId);
      if (!link) {
        throw new Error("Failed to create smart link");
      }
    }
  }

  if (!link.destination_url && presenterDestinationUrl) {
    const { data: updatedLink, error: updateLinkError } = await supabase
      .from("proof_links")
      .update({
        destination_url: presenterDestinationUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", link.id)
      .eq("organization_id", input.organizationId)
      .select("*")
      .single();

    if (updateLinkError) {
      console.warn("ensureSmartLinkForSource: failed to update link destination_url", { error: updateLinkError });
    } else if (updatedLink) {
      link = updatedLink;
    }
  }

  if (!link) {
    throw new Error("Failed to resolve smart link");
  }

  if (!link.published) {
    await publishProofItem(input.organizationId, proofItemId, input.actorUserId ?? null);

    const refreshed = await getActiveProofLinkByItem(
      input.organizationId,
      proofItemId
    );
    if (!refreshed) {
      throw new Error("Failed to fetch smart link after publish");
    }
    link = refreshed;
  }

  const slug = String(link.slug ?? "");
  if (!slug) {
    throw new Error("Smart link slug was not resolved");
  }

  return {
    proofItemId,
    slug,
    url: `/s/${slug}`,
    created: createdAny,
  };
}

export async function getPublishedSmartLinkBySource(input: {
  organizationId: string;
  sourceType: Extract<ProofSourceType, "review" | "video_testimonial">;
  sourceId: string;
}): Promise<{ slug: string; proofItemId: string } | null> {
  const item = await getProofItemBySource(
    input.organizationId,
    input.sourceType,
    input.sourceId
  );

  if (!item) return null;

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("proof_links")
    .select("slug, proof_item_id")
    .eq("organization_id", input.organizationId)
    .eq("proof_item_id", item.id)
    .eq("published", true)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || !data.slug) return null;

  return {
    slug: String(data.slug),
    proofItemId: String(data.proof_item_id),
  };
}

export async function publishProofItem(
  organizationId: string,
  itemId: string,
  publishedBy?: string | null
): Promise<Record<string, unknown>> {
  const supabase = createUntypedAdminClient();

  const item = await getProofItemRow(organizationId, itemId);
  if (!item) throw new Error("Proof item not found");

  if (item.status !== "approved") {
    throw new Error("Proof item must be approved before publish");
  }

  const now = new Date().toISOString();

  const { data: updatedItem, error: itemError } = await supabase
    .from("proof_items")
    .update({
      published_at: now,
      approved_by: publishedBy ?? item.approved_by ?? null,
      updated_at: now,
    })
    .eq("organization_id", organizationId)
    .eq("id", itemId)
    .select("*")
    .single();

  if (itemError || !updatedItem) {
    throw new Error(itemError?.message || "Failed to publish proof item");
  }

  const { error: linkError } = await supabase
    .from("proof_links")
    .update({
      published: true,
      published_at: now,
      updated_at: now,
    })
    .eq("organization_id", organizationId)
    .eq("proof_item_id", itemId);

  if (linkError) {
    throw new Error(linkError.message || "Failed to publish linked Smart Links");
  }

  return updatedItem;
}

export async function getProofLinkBySlug(slug: string): Promise<{
  link: Record<string, unknown>;
  item: Record<string, unknown>;
  organization: Record<string, unknown>;
  brandTokens: BrandTokens;
} | null> {
  const supabase = createUntypedAdminClient();

  const { data: link, error } = await supabase
    .from("proof_links")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !link) return null;

  const [itemResult, orgResult] = await Promise.all([
    supabase
      .from("proof_items")
      .select("*")
      .eq("id", link.proof_item_id)
      .maybeSingle(),
    supabase
      .from("organizations")
      .select("id, name, slug, account_type, logo_url, primary_color, settings")
      .eq("id", link.organization_id)
      .single(),
  ]);

  if (!itemResult.data || itemResult.error || !orgResult.data || orgResult.error) {
    return null;
  }

  const brandTokens = resolveBrandTokens(orgResult.data as Record<string, unknown>);

  return {
    link,
    item: itemResult.data,
    organization: orgResult.data,
    brandTokens,
  };
}

export async function recordProofLinkEvent(input: RecordProofLinkEventInput): Promise<void> {
  const supabase = createUntypedAdminClient();

  const { error } = await supabase.from("proof_link_events").insert({
    proof_link_id: input.proofLinkId,
    organization_id: input.organizationId,
    event_type: input.eventType,
    request_id: input.requestId ?? null,
    referrer: input.referrer ?? null,
    user_agent: input.userAgent ?? null,
    ip_hash: hashIp(input.ipAddress),
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Failed to record proof link event", {
      proofLinkId: input.proofLinkId,
      eventType: input.eventType,
      error: error.message,
    });
  }
}

export async function listProofTemplates(organizationId: string): Promise<Record<string, unknown>[]> {
  const supabase = createUntypedAdminClient();

  const { data, error } = await supabase
    .from("proof_templates")
    .select("*")
    .eq("is_active", true)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to list templates");
  }

  return (data ?? []) as Record<string, unknown>[];
}
