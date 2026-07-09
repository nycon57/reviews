import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type {
  ShareStudioAssetFilter,
  ShareStudioAssetRow,
  ShareStudioAssetsInput,
  ShareStudioAssetsResult,
  ShareStudioCardsData,
  ShareStudioHubSmartLinksData,
  SmartLinkAnalyticsPoint,
  SmartLinkAnalyticsResult,
  SmartLinkBulkAction,
  SmartLinkEventStats,
  SmartLinkReferrerStat,
  SmartLinkRow,
  SmartLinksListInput,
  SmartLinksListResult,
  SmartLinkSourceSummary,
  SmartLinkStatusFilter,
} from "@/lib/share-studio/hub-types";

export const SHARE_STUDIO_HUB_PATH = "/dashboard/share-studio";
export const SMART_LINKS_PAGE_SIZE = 10;
export const SHARE_STUDIO_ASSETS_PAGE_SIZE = 24;

type RecordRow = Record<string, unknown>;

type DailyEventRow = {
  proof_link_id?: string | null;
  event_type?: string | null;
  event_count?: number | string | null;
  event_date?: string | null;
};

function clampPage(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

function clampPageSize(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

function cleanSearch(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 80);
}

export function normalizeSmartLinkStatus(value: unknown): SmartLinkStatusFilter {
  if (
    value === "live" ||
    value === "unpublished" ||
    value === "archived" ||
    value === "all"
  ) {
    return value;
  }
  return "all";
}

export function normalizeAssetFilter(value: unknown): ShareStudioAssetFilter {
  if (value === "image" || value === "video" || value === "all") {
    return value;
  }
  return "all";
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startDateKey(days: number): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - Math.max(1, days) + 1);
  return dateKey(start);
}

function escapeSearchForOr(search: string): string {
  return search.replace(/,/g, " ").replace(/([%_\\])/g, "\\$1");
}

function relatedOne(value: unknown): RecordRow | null {
  if (Array.isArray(value)) {
    return (value[0] as RecordRow | undefined) ?? null;
  }
  if (value && typeof value === "object") {
    return value as RecordRow;
  }
  return null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sourceFromProofItem(value: unknown): SmartLinkSourceSummary | null {
  const item = relatedOne(value);
  if (!item) return null;

  return {
    id: String(item.id ?? ""),
    sourceType: String(item.source_type ?? ""),
    sourceId: stringOrNull(item.source_id),
    title: stringOrNull(item.title),
    customerName: stringOrNull(item.customer_name),
    rating: numberOrNull(item.rating),
  };
}

function smartLinkTitle(row: RecordRow, source: SmartLinkSourceSummary | null): string {
  return (
    stringOrNull(row.title) ??
    source?.title ??
    (source?.customerName ? `Story from ${source.customerName}` : "Untitled Smart Link")
  );
}

function mapSmartLinkRow(row: RecordRow, stats: SmartLinkEventStats = { views: 0, clicks: 0 }): SmartLinkRow {
  const source = sourceFromProofItem(row.proof_items);
  const slug = String(row.slug ?? "");

  return {
    id: String(row.id ?? ""),
    title: smartLinkTitle(row, source),
    slug,
    urlPath: `/s/${slug}`,
    destinationUrl: stringOrNull(row.destination_url),
    published: row.published === true,
    archivedAt: stringOrNull(row.archived_at),
    createdAt: String(row.created_at ?? ""),
    source,
    stats7d: stats,
  };
}

function aggregateStats(rows: DailyEventRow[], allowedIds?: Set<string>): Map<string, SmartLinkEventStats> {
  const stats = new Map<string, SmartLinkEventStats>();

  for (const row of rows) {
    const linkId = row.proof_link_id ? String(row.proof_link_id) : "";
    if (!linkId || (allowedIds && !allowedIds.has(linkId))) continue;

    const eventType = String(row.event_type ?? "");
    if (eventType !== "view" && eventType !== "click") continue;

    const current = stats.get(linkId) ?? { views: 0, clicks: 0 };
    const count =
      typeof row.event_count === "number"
        ? row.event_count
        : row.event_count
          ? Number(row.event_count)
          : 0;

    if (eventType === "view") {
      current.views += Number.isFinite(count) ? count : 0;
    } else {
      current.clicks += Number.isFinite(count) ? count : 0;
    }
    stats.set(linkId, current);
  }

  return stats;
}

function aggregateTotals(rows: DailyEventRow[]): SmartLinkEventStats {
  let views = 0;
  let clicks = 0;

  for (const row of rows) {
    const eventType = String(row.event_type ?? "");
    const count =
      typeof row.event_count === "number"
        ? row.event_count
        : row.event_count
          ? Number(row.event_count)
          : 0;
    if (!Number.isFinite(count)) continue;
    if (eventType === "view") views += count;
    if (eventType === "click") clicks += count;
  }

  return { views, clicks };
}

function applySmartLinkStatusFilter<T extends { is: (column: string, value: null) => T; eq: (column: string, value: unknown) => T; not: (column: string, operator: string, value: unknown) => T }>(
  query: T,
  status: SmartLinkStatusFilter
): T {
  if (status === "live") {
    return query.is("archived_at", null).eq("published", true);
  }
  if (status === "unpublished") {
    return query.is("archived_at", null).eq("published", false);
  }
  if (status === "archived") {
    return query.not("archived_at", "is", null);
  }
  return query.is("archived_at", null);
}

async function executeSmartLinkListQuery(input: SmartLinksListInput & { organizationId: string }): Promise<{
  rows: RecordRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: SmartLinkStatusFilter;
}> {
  const supabase = createUntypedAdminClient();
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize, SMART_LINKS_PAGE_SIZE, 100);
  const search = cleanSearch(input.search);
  const status = normalizeSmartLinkStatus(input.status);
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("proof_links")
    .select(
      "id, title, slug, destination_url, published, archived_at, created_at, proof_item_id, proof_items(id, source_type, source_id, title, customer_name, rating)",
      { count: "exact" }
    )
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  query = applySmartLinkStatusFilter(query, status);

  if (search) {
    const escaped = escapeSearchForOr(search);
    query = query.or(`title.ilike.%${escaped}%,slug.ilike.%${escaped}%`);
  }

  const { data, count, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to load Smart Links");
  }

  return {
    rows: (data ?? []) as RecordRow[],
    total: count ?? 0,
    page,
    pageSize,
    search,
    status,
  };
}

async function loadDailyRowsForLinks(
  organizationId: string,
  linkIds: string[],
  days: number
): Promise<DailyEventRow[]> {
  if (linkIds.length === 0) return [];

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("proof_link_events_daily")
    .select("proof_link_id, event_type, event_count, event_date")
    .eq("organization_id", organizationId)
    .gte("event_date", startDateKey(days))
    .in("proof_link_id", linkIds);

  if (error) {
    throw new Error(error.message || "Failed to load Smart Link stats");
  }

  return (data ?? []) as DailyEventRow[];
}

export async function listSmartLinksForOrganization(
  organizationId: string,
  input: SmartLinksListInput = {}
): Promise<SmartLinksListResult> {
  const list = await executeSmartLinkListQuery({ ...input, organizationId });
  const ids = list.rows.map((row) => String(row.id));
  const dailyRows = await loadDailyRowsForLinks(organizationId, ids, 7);
  const stats = aggregateStats(dailyRows);

  return {
    items: list.rows.map((row) =>
      mapSmartLinkRow(row, stats.get(String(row.id)) ?? { views: 0, clicks: 0 })
    ),
    page: list.page,
    pageSize: list.pageSize,
    total: list.total,
    totalPages: Math.max(1, Math.ceil(list.total / list.pageSize)),
    search: list.search,
    status: list.status,
  };
}

export async function getShareStudioHubSmartLinksData(
  organizationId: string,
  input: SmartLinksListInput = {}
): Promise<ShareStudioHubSmartLinksData> {
  const [cardsData, list] = await Promise.all([
    buildShareStudioCardsForOrganization(organizationId),
    executeSmartLinkListQuery({ ...input, organizationId }),
  ]);

  const pageIds = new Set(list.rows.map((row) => String(row.id)));
  const pageStats = aggregateStats(cardsData.dailyRows, pageIds);

  const smartLinks: SmartLinksListResult = {
    items: list.rows.map((row) =>
      mapSmartLinkRow(row, pageStats.get(String(row.id)) ?? { views: 0, clicks: 0 })
    ),
    page: list.page,
    pageSize: list.pageSize,
    total: list.total,
    totalPages: Math.max(1, Math.ceil(list.total / list.pageSize)),
    search: list.search,
    status: list.status,
  };

  return {
    cards: cardsData.cards,
    smartLinks,
    queryCount: 4,
  };
}

async function buildShareStudioCardsForOrganization(
  organizationId: string
): Promise<{ cards: ShareStudioCardsData; dailyRows: DailyEventRow[] }> {
  const supabase = createUntypedAdminClient();

  const [activeJobsResult, allLinksResult] = await Promise.all([
    supabase
      .from("proof_render_jobs")
      .select("id, asset_type, status, proof_item_id, created_at")
      .eq("organization_id", organizationId)
      .in("status", ["queued", "processing"])
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("proof_links")
      .select("id, published")
      .eq("organization_id", organizationId)
      .is("archived_at", null),
  ]);

  if (activeJobsResult.error) {
    throw new Error(activeJobsResult.error.message || "Failed to load render queue");
  }
  if (allLinksResult.error) {
    throw new Error(allLinksResult.error.message || "Failed to load Smart Link totals");
  }

  const allLinks = (allLinksResult.data ?? []) as RecordRow[];
  const allLinkIds = allLinks.map((row) => String(row.id));
  const dailyRows = await loadDailyRowsForLinks(organizationId, allLinkIds, 7);
  const totals = aggregateTotals(dailyRows);

  return {
    cards: {
      activeJobs: ((activeJobsResult.data ?? []) as RecordRow[]).map((job) => ({
        id: String(job.id ?? ""),
        assetType: String(job.asset_type ?? "asset"),
        status: String(job.status ?? "queued"),
        proofItemId: stringOrNull(job.proof_item_id),
        createdAt: String(job.created_at ?? ""),
      })),
      views: totals.views,
      clicks: totals.clicks,
      publishedLinks: allLinks.filter((row) => row.published === true).length,
      totalLinks: allLinks.length,
      periodLabel: "Last 7 days",
    },
    dailyRows,
  };
}

export async function getShareStudioCardsForOrganization(
  organizationId: string
): Promise<ShareStudioCardsData> {
  const { cards } = await buildShareStudioCardsForOrganization(organizationId);
  return cards;
}

export async function bulkUpdateSmartLinksForOrganization(input: {
  organizationId: string;
  ids: string[];
  action: SmartLinkBulkAction;
}): Promise<{ updated: number }> {
  const ids = Array.from(
    new Set(input.ids.map((id) => id.trim()).filter(Boolean))
  );

  if (ids.length === 0) {
    throw new Error("Select at least one Smart Link");
  }

  const now = new Date().toISOString();
  let payload: Record<string, unknown>;

  if (input.action === "archive") {
    payload = { archived_at: now, published: false, updated_at: now };
  } else if (input.action === "unpublish") {
    payload = { published: false, updated_at: now };
  } else if (input.action === "republish") {
    payload = { published: true, published_at: now, archived_at: null, updated_at: now };
  } else {
    throw new Error("Unsupported bulk action");
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("proof_links")
    .update(payload)
    .eq("organization_id", input.organizationId)
    .in("id", ids)
    .select("id");

  if (error) {
    throw new Error(error.message || "Failed to update Smart Links");
  }

  return { updated: (data ?? []).length };
}

function fillAnalyticsSeries(rows: DailyEventRow[], days: number): SmartLinkAnalyticsPoint[] {
  const byDate = new Map<string, SmartLinkEventStats>();
  const today = new Date();
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - days + 1);

  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    byDate.set(dateKey(date), { views: 0, clicks: 0 });
  }

  for (const row of rows) {
    const key = row.event_date ? String(row.event_date) : "";
    const entry = byDate.get(key);
    if (!entry) continue;

    const count =
      typeof row.event_count === "number"
        ? row.event_count
        : row.event_count
          ? Number(row.event_count)
          : 0;
    if (!Number.isFinite(count)) continue;

    if (row.event_type === "view") entry.views += count;
    if (row.event_type === "click") entry.clicks += count;
  }

  return Array.from(byDate.entries()).map(([date, stats]) => ({
    date,
    views: stats.views,
    clicks: stats.clicks,
  }));
}

export async function getSmartLinkAnalyticsForOrganization(input: {
  organizationId: string;
  linkId: string;
}): Promise<SmartLinkAnalyticsResult> {
  const supabase = createUntypedAdminClient();

  const [linkResult, dailyResult, referrersResult] = await Promise.all([
    supabase
      .from("proof_links")
      .select(
        "id, title, slug, destination_url, published, archived_at, created_at, proof_item_id, proof_items(id, source_type, source_id, title, customer_name, rating)"
      )
      .eq("organization_id", input.organizationId)
      .eq("id", input.linkId)
      .single(),
    supabase
      .from("proof_link_events_daily")
      .select("proof_link_id, event_type, event_count, event_date")
      .eq("organization_id", input.organizationId)
      .eq("proof_link_id", input.linkId)
      .gte("event_date", startDateKey(30)),
    supabase
      .rpc("proof_link_referrer_summary", {
        p_link_id: input.linkId,
        p_days: 30,
        p_limit: 10,
      }),
  ]);

  if (linkResult.error || !linkResult.data) {
    throw new Error(linkResult.error?.message || "Smart Link not found");
  }
  if (dailyResult.error) {
    throw new Error(dailyResult.error.message || "Failed to load Smart Link analytics");
  }
  if (referrersResult.error) {
    throw new Error(referrersResult.error.message || "Failed to load referrers");
  }

  const dailyRows = (dailyResult.data ?? []) as DailyEventRow[];
  const series = fillAnalyticsSeries(dailyRows, 30);
  const totals = series.reduce(
    (acc, point) => ({
      views: acc.views + point.views,
      clicks: acc.clicks + point.clicks,
    }),
    { views: 0, clicks: 0 }
  );
  const ctr = totals.views > 0 ? Math.round((totals.clicks / totals.views) * 1000) / 10 : 0;

  return {
    link: mapSmartLinkRow(linkResult.data as RecordRow, totals),
    totals: { ...totals, ctr },
    series,
    referrers: ((referrersResult.data ?? []) as RecordRow[]).map((row) => ({
      referrer: String(row.referrer ?? "Direct"),
      count:
        typeof row.event_count === "number"
          ? row.event_count
          : row.event_count
            ? Number(row.event_count)
            : 0,
    })) satisfies SmartLinkReferrerStat[],
  };
}

function mapAssetRow(
  row: RecordRow,
  smartLinkByProofItem: Map<string, string>
): ShareStudioAssetRow | null {
  const assetUrl = stringOrNull(row.asset_url);
  if (!assetUrl) return null;

  const source = sourceFromProofItem(row.proof_items);
  const smartLinkUrlPath = source?.id ? smartLinkByProofItem.get(source.id) ?? null : null;

  return {
    id: String(row.id ?? ""),
    assetType: String(row.asset_type ?? "image"),
    assetUrl,
    mimeType: stringOrNull(row.mime_type),
    width: numberOrNull(row.width),
    height: numberOrNull(row.height),
    durationSeconds: numberOrNull(row.duration_seconds),
    createdAt: String(row.created_at ?? ""),
    source: source ? { ...source, smartLinkUrlPath } : null,
  };
}

export async function listShareStudioAssetsForOrganization(
  organizationId: string,
  input: ShareStudioAssetsInput = {}
): Promise<ShareStudioAssetsResult> {
  const supabase = createUntypedAdminClient();
  const page = clampPage(input.page);
  const pageSize = clampPageSize(input.pageSize, SHARE_STUDIO_ASSETS_PAGE_SIZE, 48);
  const type = normalizeAssetFilter(input.type);
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("proof_assets")
    .select(
      "id, asset_type, asset_url, mime_type, width, height, duration_seconds, created_at, proof_item_id, proof_items(id, source_type, source_id, title, customer_name, rating)",
      { count: "exact" }
    )
    .eq("organization_id", organizationId)
    .not("asset_url", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (type === "image" || type === "video") {
    query = query.eq("asset_type", type);
  } else {
    query = query.in("asset_type", ["image", "video"]);
  }

  const { data, count, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to load Share Studio assets");
  }

  const rows = (data ?? []) as RecordRow[];
  const proofItemIds = Array.from(
    new Set(rows.map((row) => stringOrNull(row.proof_item_id)).filter((id): id is string => Boolean(id)))
  );

  const smartLinkByProofItem = new Map<string, string>();
  if (proofItemIds.length > 0) {
    const { data: links, error: linksError } = await supabase
      .from("proof_links")
      .select("proof_item_id, slug")
      .eq("organization_id", organizationId)
      .eq("published", true)
      .is("archived_at", null)
      .in("proof_item_id", proofItemIds)
      .order("created_at", { ascending: false });

    if (linksError) {
      throw new Error(linksError.message || "Failed to load asset share links");
    }

    for (const link of (links ?? []) as RecordRow[]) {
      const proofItemId = stringOrNull(link.proof_item_id);
      const slug = stringOrNull(link.slug);
      if (proofItemId && slug && !smartLinkByProofItem.has(proofItemId)) {
        smartLinkByProofItem.set(proofItemId, `/s/${slug}`);
      }
    }
  }

  return {
    items: rows
      .map((row) => mapAssetRow(row, smartLinkByProofItem))
      .filter((row): row is ShareStudioAssetRow => Boolean(row)),
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    type,
  };
}

export async function deleteShareStudioAssetForOrganization(input: {
  organizationId: string;
  assetId: string;
}): Promise<{ deleted: boolean }> {
  const supabase = createUntypedAdminClient();
  const { data: asset, error: assetError } = await supabase
    .from("proof_assets")
    .select("id, storage_path")
    .eq("organization_id", input.organizationId)
    .eq("id", input.assetId)
    .single();

  if (assetError || !asset) {
    throw new Error(assetError?.message || "Asset not found");
  }

  const storagePath = stringOrNull((asset as RecordRow).storage_path);

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("share-studio")
      .remove([storagePath]);
    if (storageError) {
      throw new Error(storageError.message || "Failed to delete asset file");
    }
  }

  const now = new Date().toISOString();
  const [jobsResult, linksResult] = await Promise.all([
    supabase
      .from("proof_render_jobs")
      .update({ output_asset_id: null, updated_at: now })
      .eq("organization_id", input.organizationId)
      .eq("output_asset_id", input.assetId),
    supabase
      .from("proof_links")
      .update({ og_asset_id: null, updated_at: now })
      .eq("organization_id", input.organizationId)
      .eq("og_asset_id", input.assetId),
  ]);

  if (jobsResult.error) {
    throw new Error(jobsResult.error.message || "Failed to detach render job");
  }
  if (linksResult.error) {
    throw new Error(linksResult.error.message || "Failed to detach Smart Link asset");
  }

  const { error: deleteError } = await supabase
    .from("proof_assets")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("id", input.assetId);

  if (deleteError) {
    throw new Error(deleteError.message || "Failed to delete asset");
  }

  return { deleted: true };
}
