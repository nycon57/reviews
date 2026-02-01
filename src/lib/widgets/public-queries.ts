import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import type { WidgetConfigJson } from "./schemas";

/** Public-safe subset of widget_configs (no internal fields). */
export interface PublicWidgetConfig {
  widget_id: string;
  widget_type: string;
  entity_type: string;
  entity_id: string | null;
  name: string;
  config: WidgetConfigJson;
  allowed_domains: string[] | null;
  enable_structured_data: boolean | null;
  structured_data_type: string | null;
  status: string;
  version: number | null;
  organization_id: string;
}

export interface PublicReview {
  id: string;
  reviewer_name: string | null;
  rating: number;
  text: string | null;
  review_date: string;
  source: string;
  avatar_url: string | null;
  loan_type: string | null;
  first_time_homebuyer: boolean | null;
}

/** Public-safe LO profile data for lo_review widgets. */
export interface EntityProfile {
  full_name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
  nmls_id: string | null;
  title: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  licensing_states: string[] | null;
}

export async function getPublicWidgetConfig(
  widgetId: string
): Promise<PublicWidgetConfig | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("widget_configs")
    .select(
      "widget_id, widget_type, entity_type, entity_id, name, config, allowed_domains, enable_structured_data, structured_data_type, status, version, organization_id"
    )
    .eq("widget_id", widgetId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicWidgetConfig;
}

/**
 * Fetch public-safe entity profile for lo_review widgets.
 * Returns LO headshot, NMLS, title, aggregate stats.
 */
export async function getEntityProfile(
  entityId: string
): Promise<EntityProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "full_name, avatar_url, photo_url, nmls_id, title, average_rating, total_reviews, region"
    )
    .eq("id", entityId)
    .maybeSingle();

  if (error || !data) return null;

  // Parse region as licensing states (comma-separated or array stored in region)
  let licensingStates: string[] | null = null;
  if (data.region) {
    licensingStates = data.region
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  return {
    full_name: data.full_name,
    avatar_url: data.avatar_url,
    photo_url: data.photo_url,
    nmls_id: data.nmls_id,
    title: data.title,
    average_rating: data.average_rating,
    total_reviews: data.total_reviews,
    licensing_states: licensingStates,
  };
}

interface ReviewQueryOptions {
  organizationId: string;
  entityType: string;
  entityId: string | null;
  filters: WidgetConfigJson["filters"];
  cursor?: string;
  limit: number;
}

export async function getPublicReviews(
  opts: ReviewQueryOptions
): Promise<{ reviews: PublicReview[]; nextCursor: string | null }> {
  const supabase = createAdminClient();
  const { organizationId, entityType, entityId, filters, cursor, limit } = opts;

  let query = supabase
    .from("reviews")
    .select("id, customer_name, rating, text, review_date, source, customer_location")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .eq("is_published", true);

  if (entityType === "user" && entityId) {
    query = query.eq("user_id", entityId);
  }
  if (filters?.minRating) {
    query = query.gte("rating", filters.minRating);
  }
  if (filters?.dateRange?.start) {
    query = query.gte("review_date", filters.dateRange.start);
  }
  if (filters?.dateRange?.end) {
    query = query.lte("review_date", filters.dateRange.end);
  }
  if (filters?.sources && filters.sources.length > 0) {
    query = query.in("source", filters.sources);
  }
  if (filters?.featuredOnly) {
    query = query.eq("featured", true);
  }
  if (filters?.keywords && filters.keywords.length > 0) {
    const keywordFilter = filters.keywords
      .map((kw) => {
        const escaped = kw.replace(/[%_\\]/g, "\\$&");
        return `text.ilike.%${escaped}%`;
      })
      .join(",");
    query = query.or(keywordFilter);
  }

  const sortField = "review_date";
  let ascending = false;
  if (filters?.sortOrder === "oldest") ascending = true;
  if (filters?.sortOrder === "highest") {
    query = query.order("rating", { ascending: false });
  } else if (filters?.sortOrder === "lowest") {
    query = query.order("rating", { ascending: true });
  }
  query = query.order(sortField, { ascending });
  query = query.order("id", { ascending: true });

  // Cursor is an opaque base64-encoded token containing the last row's sort values + id
  if (cursor) {
    try {
      const decoded = JSON.parse(
        Buffer.from(cursor, "base64url").toString("utf-8")
      );
      const { id: cursorId, review_date: cursorDate, rating: cursorRating } = decoded;
      if (filters?.sortOrder === "highest" || filters?.sortOrder === "lowest") {
        const ratingAsc = filters.sortOrder === "lowest";
        query = query.or(
          `rating.${ratingAsc ? "gt" : "lt"}.${cursorRating},and(rating.eq.${cursorRating},or(review_date.${ascending ? "gt" : "lt"}.${cursorDate},and(review_date.eq.${cursorDate},id.gt.${cursorId})))`
        );
      } else {
        query = query.or(
          `review_date.${ascending ? "gt" : "lt"}.${cursorDate},and(review_date.eq.${cursorDate},id.gt.${cursorId})`
        );
      }
    } catch {
      // Invalid cursor — ignore and return from beginning
    }
  }

  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error || !data) {
    return { reviews: [], nextCursor: null };
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  const reviews: PublicReview[] = items.map((row) => ({
    id: row.id,
    reviewer_name: row.customer_name,
    rating: row.rating,
    text: row.text,
    review_date: row.review_date,
    source: row.source,
    avatar_url: null,
    loan_type: null,
    first_time_homebuyer: null,
  }));

  let nextCursor: string | null = null;
  if (hasMore) {
    const lastItem = items[items.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({
        id: lastItem.id,
        review_date: lastItem.review_date,
        rating: lastItem.rating,
      }),
      "utf-8"
    ).toString("base64url");
  }

  return { reviews, nextCursor };
}

const WIDGET_EVENT_TYPES = [
  "impression", "click_review", "click_cta", "click_write_review",
  "video_play", "scroll_depth", "banner_dismiss", "banner_click",
  "carousel_navigate", "filter_change",
] as const;

export type WidgetEventType = (typeof WIDGET_EVENT_TYPES)[number];

export function isValidEventType(value: string): value is WidgetEventType {
  return WIDGET_EVENT_TYPES.includes(value as WidgetEventType);
}

export async function hashIp(ip: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const salt = process.env.IP_HASH_SALT || "repwell-widget-default";
  const encoder = new globalThis.TextEncoder();
  const data = encoder.encode(`${ip}:${today}:${salt}`);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface InsertEventParams {
  widgetId: string;
  eventType: WidgetEventType;
  pageUrl: string | null;
  referrer: string | null;
  ipHash: string;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  sessionId: string | null;
}

export async function insertWidgetEvent(params: InsertEventParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("widget_events").insert({
      widget_id: params.widgetId,
      event_type: params.eventType,
      page_url: params.pageUrl,
      referrer: params.referrer,
      ip_hash: params.ipHash,
      user_agent: params.userAgent,
      metadata: params.metadata as Json,
      session_id: params.sessionId,
    });
    if (error) {
      console.error("Failed to insert widget event:", error.message);
    }
  } catch (err) {
    console.error("Widget event insert error:", err);
  }
}

export async function getWidgetOrganizationId(widgetId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("widget_configs")
    .select("organization_id")
    .eq("widget_id", widgetId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;
  return data.organization_id;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 100;

export function checkEventRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ipHash);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ipHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now >= entry.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60_000);
}
