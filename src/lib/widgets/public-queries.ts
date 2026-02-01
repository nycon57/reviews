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

/** Public-safe entity profile data for lo_review and company_review widgets. */
export interface EntityProfile {
  full_name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
  nmls_id: string | null;
  title: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  licensing_states: string[] | null;
  /** Organization-specific fields (company_review widget) */
  logo_url?: string | null;
  organization_name?: string | null;
  rating_distribution?: { 5: number; 4: number; 3: number; 2: number; 1: number } | null;
  source_breakdown?: { source: string; count: number; average: number }[] | null;
  /** Structured data fields for LocalBusiness/Organization schemas */
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
  telephone?: string | null;
  url?: string | null;
  /** Branch-specific: team members (LOs at this branch) */
  team_members?: {
    id: string;
    full_name: string | null;
    photo_url: string | null;
    title: string | null;
    nmls_id: string | null;
    average_rating: number | null;
    total_reviews: number | null;
  }[] | null;
}

export async function getPublicWidgetConfig(
  widgetId: string,
  options?: { includeDraft?: boolean }
): Promise<PublicWidgetConfig | null> {
  const supabase = createAdminClient();
  let query = supabase
    .from("widget_configs")
    .select(
      "widget_id, widget_type, entity_type, entity_id, name, config, allowed_domains, enable_structured_data, structured_data_type, status, version, organization_id"
    )
    .eq("widget_id", widgetId);

  if (options?.includeDraft) {
    query = query.in("status", ["active", "draft"]);
  } else {
    query = query.eq("status", "active");
  }

  const { data, error } = await query.maybeSingle();

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

/**
 * Fetch public-safe organization profile for company_review widgets.
 * Returns org name, logo, and computed aggregate stats from approved reviews.
 */
export async function getOrganizationProfile(
  organizationId: string
): Promise<EntityProfile | null> {
  const supabase = createAdminClient();

  // Fetch org details
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("name, logo_url")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgError || !org) return null;

  // Compute aggregate stats from approved, published reviews
  const { data: reviews, error: revError } = await supabase
    .from("reviews")
    .select("rating, source")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .eq("is_published", true);

  if (revError || !reviews) {
    return {
      full_name: org.name,
      avatar_url: null,
      photo_url: null,
      nmls_id: null,
      title: null,
      average_rating: null,
      total_reviews: 0,
      licensing_states: null,
      logo_url: org.logo_url,
      organization_name: org.name,
      rating_distribution: null,
      source_breakdown: null,
    };
  }

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : null;

  // Rating distribution
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    dist[star]++;
  }

  // Source breakdown
  const sourceMap = new Map<string, { count: number; total: number }>();
  for (const r of reviews) {
    const entry = sourceMap.get(r.source) ?? { count: 0, total: 0 };
    entry.count++;
    entry.total += r.rating;
    sourceMap.set(r.source, entry);
  }
  const sourceBreakdown = Array.from(sourceMap.entries()).map(([source, { count, total }]) => ({
    source,
    count,
    average: count > 0 ? total / count : 0,
  }));

  return {
    full_name: org.name,
    avatar_url: null,
    photo_url: null,
    nmls_id: null,
    title: null,
    average_rating: averageRating,
    total_reviews: totalReviews,
    licensing_states: null,
    logo_url: org.logo_url,
    organization_name: org.name,
    rating_distribution: dist,
    source_breakdown: sourceBreakdown,
  };
}

/**
 * Fetch public-safe branch profile for branch widgets.
 * Returns branch name, address, phone, and computed aggregate stats.
 */
export async function getBranchProfile(
  branchId: string
): Promise<EntityProfile | null> {
  const supabase = createAdminClient();

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("name, address, phone, website_url, photo_url, average_rating, total_reviews, organization_id")
    .eq("id", branchId)
    .eq("is_active", true)
    .maybeSingle();

  if (branchError || !branch) return null;

  // Parse JSONB address
  const rawAddr = branch.address as Record<string, string | null> | null;
  const address = rawAddr
    ? {
        street: rawAddr.street ?? null,
        city: rawAddr.city ?? null,
        state: rawAddr.state ?? null,
        zip: rawAddr.zip ?? null,
        country: rawAddr.country ?? null,
      }
    : null;

  // Fetch team members (LOs assigned to this branch)
  const { data: teamData } = await supabase
    .from("users")
    .select("id, full_name, photo_url, title, nmls_id, average_rating, total_reviews")
    .eq("branch_id", branchId)
    .eq("is_active", true)
    .order("full_name", { ascending: true })
    .limit(50);

  const teamMembers = (teamData ?? []).map((u) => ({
    id: u.id,
    full_name: u.full_name,
    photo_url: u.photo_url,
    title: u.title,
    nmls_id: u.nmls_id,
    average_rating: u.average_rating ? Number(u.average_rating) : null,
    total_reviews: u.total_reviews ?? 0,
  }));

  // Derive NMLS from first team member with an NMLS ID
  const nmlsId = teamMembers.find((m) => m.nmls_id)?.nmls_id ?? null;

  // Compute rating distribution and source breakdown from branch reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, source")
    .eq("organization_id", branch.organization_id)
    .in("user_id", teamMembers.map((t) => t.id))
    .eq("status", "approved")
    .eq("is_published", true);

  let ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number } | null = null;
  let sourceBreakdown: { source: string; count: number; average: number }[] | null = null;

  if (reviews && reviews.length > 0) {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      dist[star]++;
    }
    ratingDistribution = dist;

    const sourceMap = new Map<string, { count: number; total: number }>();
    for (const r of reviews) {
      const entry = sourceMap.get(r.source) ?? { count: 0, total: 0 };
      entry.count++;
      entry.total += r.rating;
      sourceMap.set(r.source, entry);
    }
    sourceBreakdown = Array.from(sourceMap.entries()).map(([source, { count, total }]) => ({
      source,
      count,
      average: count > 0 ? total / count : 0,
    }));
  }

  return {
    full_name: branch.name,
    avatar_url: null,
    photo_url: branch.photo_url,
    nmls_id: nmlsId,
    title: null,
    average_rating: branch.average_rating ? Number(branch.average_rating) : null,
    total_reviews: branch.total_reviews,
    licensing_states: null,
    organization_name: branch.name,
    address,
    telephone: branch.phone,
    url: branch.website_url,
    rating_distribution: ratingDistribution,
    source_breakdown: sourceBreakdown,
    team_members: teamMembers.length > 0 ? teamMembers : null,
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

  // Include LO name join for branch-level reviews
  const selectFields = entityType === "branch"
    ? "id, customer_name, rating, text, review_date, source, customer_location, user:user_id(full_name)"
    : "id, customer_name, rating, text, review_date, source, customer_location";

  let query = supabase
    .from("reviews")
    .select(selectFields)
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .eq("is_published", true);

  if (entityType === "user" && entityId) {
    query = query.eq("user_id", entityId);
  } else if (entityType === "branch" && entityId) {
    // Fetch user IDs belonging to this branch, then filter reviews to those users
    const { data: branchUsers } = await supabase
      .from("users")
      .select("id")
      .eq("branch_id", entityId)
      .eq("is_active", true);
    const userIds = (branchUsers ?? []).map((u) => u.id);
    if (userIds.length > 0) {
      query = query.in("user_id", userIds);
    } else {
      // No users at branch — return empty
      return { reviews: [], nextCursor: null };
    }
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

  const reviews: PublicReview[] = (items as unknown as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    reviewer_name: row.customer_name as string | null,
    rating: row.rating as number,
    text: row.text as string | null,
    review_date: row.review_date as string,
    source: row.source as string,
    avatar_url: null,
    loan_type: null,
    first_time_homebuyer: null,
    loan_officer_name: (row.user as { full_name: string } | null)?.full_name ?? null,
  }));

  let nextCursor: string | null = null;
  if (hasMore) {
    const lastItem = items[items.length - 1] as unknown as Record<string, unknown>;
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
  "video_play", "video_pause", "video_complete", "video_progress",
  "scroll_depth", "banner_dismiss", "banner_click",
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
      event_type: params.eventType as "impression",
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

/** Fetch approved video testimonials for a widget's organization/entity. */
export interface PublicVideoTestimonial {
  id: string;
  video_url: string;
  poster_url: string | null;
  reviewer_name: string | null;
  reviewer_title: string | null;
  rating: number;
  duration: number | null;
  transcript: { start: number; end: number; text: string }[] | null;
}

export async function getVideoTestimonials(
  organizationId: string,
  entityId: string | null,
  entityType: string,
): Promise<PublicVideoTestimonial[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("video_testimonial_responses")
    .select(
      "id, video_url, thumbnail_url, duration_seconds, transcription, approval_status, request_id, video_testimonial_requests!inner(customer_name, user_id, transaction_type)"
    )
    .eq("organization_id", organizationId)
    .eq("approval_status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);

  // Filter by LO if widget is entity-scoped to a user
  if (entityType === "user" && entityId) {
    query = query.eq("user_id", entityId);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as Record<string, unknown>[]).map((row) => {
    const request = row.video_testimonial_requests as Record<string, unknown> | null;

    // Parse transcription JSON into timed segments if available
    let transcript: { start: number; end: number; text: string }[] | null = null;
    if (row.transcription && typeof row.transcription === "string") {
      try {
        const parsed = JSON.parse(row.transcription);
        if (Array.isArray(parsed)) {
          transcript = parsed;
        }
      } catch {
        // Plain text transcription — wrap as single segment
        transcript = [{ start: 0, end: (row.duration_seconds as number) ?? 60, text: row.transcription as string }];
      }
    }

    return {
      id: row.id as string,
      video_url: row.video_url as string,
      poster_url: (row.thumbnail_url as string | null) ?? null,
      reviewer_name: (request?.customer_name as string | null) ?? null,
      reviewer_title: (request?.transaction_type as string | null) ?? null,
      rating: 5, // Video testimonials are pre-approved positive reviews
      duration: (row.duration_seconds as number | null) ?? null,
      transcript,
    };
  });
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
