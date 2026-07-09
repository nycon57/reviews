export type SmartLinkStatusFilter = "all" | "live" | "unpublished" | "archived";

export type SmartLinkBulkAction = "archive" | "unpublish" | "republish";

export type ShareStudioAssetFilter = "all" | "image" | "video";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SmartLinkEventStats {
  views: number;
  clicks: number;
}

export interface SmartLinkSourceSummary {
  id: string;
  sourceType: "review" | "video_testimonial" | "manual_json" | string;
  sourceId: string | null;
  title: string | null;
  customerName: string | null;
  rating: number | null;
}

export interface SmartLinkRow {
  id: string;
  title: string;
  slug: string;
  urlPath: string;
  destinationUrl: string | null;
  published: boolean;
  archivedAt: string | null;
  createdAt: string;
  source: SmartLinkSourceSummary | null;
  stats7d: SmartLinkEventStats;
}

export interface SmartLinksListInput {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SmartLinkStatusFilter;
}

export interface SmartLinksListResult {
  items: SmartLinkRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
  status: SmartLinkStatusFilter;
}

export interface ShareStudioCardJob {
  id: string;
  assetType: string;
  status: string;
  proofItemId: string | null;
  createdAt: string;
}

export interface ShareStudioCardsData {
  activeJobs: ShareStudioCardJob[];
  views: number;
  clicks: number;
  publishedLinks: number;
  totalLinks: number;
  periodLabel: string;
}

export interface ShareStudioHubSmartLinksData {
  cards: ShareStudioCardsData;
  smartLinks: SmartLinksListResult;
  queryCount: number;
}

export interface SmartLinkAnalyticsPoint {
  date: string;
  views: number;
  clicks: number;
}

export interface SmartLinkReferrerStat {
  referrer: string;
  count: number;
}

export interface SmartLinkAnalyticsResult {
  link: SmartLinkRow;
  totals: SmartLinkEventStats & { ctr: number };
  series: SmartLinkAnalyticsPoint[];
  referrers: SmartLinkReferrerStat[];
}

export interface ShareStudioAssetSourceSummary extends SmartLinkSourceSummary {
  smartLinkUrlPath: string | null;
}

export interface ShareStudioAssetRow {
  id: string;
  assetType: "image" | "video" | "smart_link_og" | string;
  assetUrl: string;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  createdAt: string;
  source: ShareStudioAssetSourceSummary | null;
}

export interface ShareStudioAssetsInput {
  page?: number;
  pageSize?: number;
  type?: ShareStudioAssetFilter;
}

export interface ShareStudioAssetsResult {
  items: ShareStudioAssetRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  type: ShareStudioAssetFilter;
}
