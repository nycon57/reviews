"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  updateWidgetInputSchema,
  listWidgetsInputSchema,
  getWidgetInputSchema,
  type UpdateWidgetInput,
  type ListWidgetsInput,
  type GetWidgetInput,
  type WidgetConfigJson,
  widgetConfigJsonSchema,
} from "./schemas";
import type { Json } from "@/types/database.types";
import { sanitizeCustomCSS } from "@/embed/core/css-sanitizer";
import { getBaseUrl } from "@/lib/seo";
import {
  getActiveBranchUserIds,
  getOrganizationProfile,
  getPublicReviews,
} from "./public-queries";
import type {
  ActionResult,
  PaginatedResult,
  WidgetConfig,
} from "./types";
import { computeDiff, generateChangeSummary } from "./config-diff";

const WIDGETS_PATH = "/dashboard/widgets";

// ── Internal version snapshot (non-blocking) ─────────────────────────────

async function createVersionSnapshotInternal(
  supabase: ReturnType<typeof createAdminClient>,
  widgetConfigId: string,
  userId: string,
  widgetData: WidgetConfig,
  prevConfig: Record<string, unknown> | null,
  changeNote?: string
): Promise<boolean> {
  try {
    const currentConfig = (widgetData.config ?? {}) as Record<string, unknown>;
    let changeSummary = "Initial version";

    if (prevConfig) {
      const diffs = computeDiff(prevConfig, currentConfig);
      changeSummary = generateChangeSummary(diffs);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("widget_config_versions").insert({
      widget_config_id: widgetConfigId,
      version: widgetData.version ?? 1,
      config: currentConfig as unknown as Json,
      name: widgetData.name,
      status: widgetData.status,
      allowed_domains: widgetData.allowed_domains ?? [],
      enable_structured_data: widgetData.enable_structured_data ?? true,
      structured_data_type: widgetData.structured_data_type ?? "LocalBusiness",
      entity_id: widgetData.entity_id,
      changed_by: userId,
      change_note: changeNote ?? null,
      change_summary: changeSummary,
    });

    if (error) {
      console.error("Version snapshot insert failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    // Non-fatal: version snapshot failure should not block widget operations
    console.error("Version snapshot failed:", err);
    return false;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

interface AuthedContext {
  userId: string;
  organizationId: string;
  role: string;
}

async function getAuthedUserContext(
  supabase: ReturnType<typeof createAdminClient>
): Promise<ActionResult<AuthedContext>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id, individual_organization_id, role")
    .eq("id", user.id)
    .single();

  if (userError) {
    return { success: false, error: "Organization not found" };
  }

  // Resolve organization ID: enterprise uses organization_id, individual uses individual_organization_id
  const orgId = userData?.organization_id || userData?.individual_organization_id;
  if (!orgId) {
    return { success: false, error: "Organization not found" };
  }

  const isIndividual = !userData.organization_id && !!userData.individual_organization_id;

  // Enterprise users need admin/manager role; individual users (always admin of their own org) pass through
  if (!isIndividual && userData.role !== "admin" && userData.role !== "manager") {
    return {
      success: false,
      error: "Insufficient permissions. Admin or manager role required.",
    };
  }

  return {
    success: true,
    data: {
      userId: user.id,
      organizationId: orgId,
      role: isIndividual ? "admin" : (userData.role || "user"),
    },
  };
}

// ── Update Widget ───────────────────────────────────────────────────────

export async function updateWidget(
  input: UpdateWidgetInput
): Promise<ActionResult<WidgetConfig>> {
  try {
    const validated = updateWidgetInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    // Verify widget belongs to user's org
    const { data: existing, error: fetchError } = await supabase
      .from("widget_configs")
      .select("id, organization_id, config, version")
      .eq("id", validated.data.id)
      .eq("organization_id", ctx.data.organizationId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Widget not found" };
    }

    // Server-side CSS sanitization (defense-in-depth)
    if (validated.data.config?.advanced?.customCSS) {
      const { sanitized } = sanitizeCustomCSS(validated.data.config.advanced.customCSS);
      validated.data.config.advanced.customCSS = sanitized;
    }

    // Merge config JSONB: deep-merge new config onto existing.
    // If the merged result fails schema validation (e.g. legacy flat config),
    // fall back to using the input config directly.
    const existingConfig = (existing.config ?? {}) as Record<string, unknown>;
    const inputConfig = (validated.data.config ?? {}) as Record<string, unknown>;
    let mergedConfig = deepMerge(existingConfig, inputConfig);
    const mergeCheck = widgetConfigJsonSchema.safeParse(mergedConfig);
    if (!mergeCheck.success) {
      mergedConfig = inputConfig;
    }

    // Capture pre-update config for diff
    const preUpdateConfig = existingConfig;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      version: (existing.version ?? 1) + 1,
    };

    if (validated.data.config !== undefined)
      updatePayload.config = mergedConfig as unknown as Json;
    if (validated.data.allowed_domains !== undefined)
      updatePayload.allowed_domains = validated.data.allowed_domains;
    if (validated.data.enable_structured_data !== undefined)
      updatePayload.enable_structured_data = validated.data.enable_structured_data;
    if (validated.data.structured_data_type !== undefined)
      updatePayload.structured_data_type = validated.data.structured_data_type;
    if (validated.data.entity_id !== undefined) updatePayload.entity_id = validated.data.entity_id;
    if (validated.data.entity_type !== undefined) updatePayload.entity_type = validated.data.entity_type;

    const { data, error } = await supabase
      .from("widget_configs")
      .update(updatePayload)
      .eq("id", validated.data.id)
      .eq("organization_id", ctx.data.organizationId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Create version snapshot
    await createVersionSnapshotInternal(
      supabase,
      data.id,
      ctx.data.userId,
      data,
      preUpdateConfig,
      undefined
    );

    revalidatePath(WIDGETS_PATH);
    return { success: true, data };
  } catch (err) {
    console.error("updateWidget error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── List Widgets (paginated, filtered) ──────────────────────────────────

export async function listWidgets(
  input: Partial<ListWidgetsInput> = {}
): Promise<ActionResult<PaginatedResult<WidgetConfig>>> {
  try {
    const validated = listWidgetsInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    const { page, pageSize, widget_type, status, entity_type, search } = validated.data;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("widget_configs")
      .select("*", { count: "exact" })
      .eq("organization_id", ctx.data.organizationId)
      .is("parent_widget_id", null); // Exclude A/B test variants from listing

    if (widget_type) query = query.eq("widget_type", widget_type);
    if (status) query = query.eq("status", status);
    if (entity_type) query = query.eq("entity_type", entity_type);
    if (search) {
      // Escape ILIKE metacharacters to prevent wildcard injection
      const escaped = search.replace(/[%_\\]/g, "\\$&");
      query = query.ilike("name", `%${escaped}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    const total = count ?? 0;
    return {
      success: true,
      data: {
        items: data ?? [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (err) {
    console.error("listWidgets error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Get Widget (by UUID or slug) ────────────────────────────────────────

export async function getWidget(
  input: GetWidgetInput
): Promise<ActionResult<WidgetConfig>> {
  try {
    const validated = getWidgetInputSchema.safeParse(input);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message ?? "Validation failed" };
    }

    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    const { idOrSlug } = validated.data;

    // Try UUID first, fall back to widget_id slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabase
      .from("widget_configs")
      .select("*")
      .eq("organization_id", ctx.data.organizationId);

    if (isUuid) {
      query = query.eq("id", idOrSlug);
    } else {
      query = query.eq("widget_id", idOrSlug);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return { success: false, error: "Widget not found" };
    }

    return { success: true, data };
  } catch (err) {
    console.error("getWidget error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Preview Data (for widget builder live preview) ────────────────────────

export interface PreviewProfile {
  full_name?: string | null;
  avatar_url?: string | null;
  photo_url?: string | null;
  nmls_id?: string | null;
  title?: string | null;
  average_rating: number;
  total_reviews: number;
  licensing_states?: string[] | null;
  organization_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  rating_distribution?: { 5: number; 4: number; 3: number; 2: number; 1: number } | null;
  source_breakdown?: { source: string; count: number; average: number }[] | null;
}

export interface PreviewReview {
  id: string;
  reviewer_name: string | null;
  rating: number;
  text: string | null;
  review_date: string;
  source: string;
  avatar_url: string | null;
  featured: boolean | null;
  loan_type: string | null;
  first_time_homebuyer?: boolean | null;
}

export interface PreviewData {
  profile: PreviewProfile;
  reviews: PreviewReview[];
  profileUrl?: string | null;
}

export async function getEntityCtaDefaults(
  entityType: "user" | "branch" | "organization",
  entityId: string | null
): Promise<ActionResult<{ text: string; url: string }>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    const baseUrl = getBaseUrl();

    if (entityType === "user") {
      if (!entityId) {
        return { success: false, error: "A user must be selected" };
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("slug")
        .eq("id", entityId)
        .eq("organization_id", ctx.data.organizationId)
        .single();

      if (error || !user) {
        return { success: false, error: "User not found" };
      }

      return {
        success: true,
        data: {
          text: "View Profile",
          url: `${baseUrl}/pro/${user.slug || entityId}`,
        },
      };
    }

    if (entityType === "branch") {
      if (!entityId) {
        return { success: false, error: "A branch must be selected" };
      }

      const { data: branch, error } = await supabase
        .from("branches")
        .select("global_slug")
        .eq("id", entityId)
        .eq("organization_id", ctx.data.organizationId)
        .single();

      if (error || !branch) {
        return { success: false, error: "Branch not found" };
      }

      return {
        success: true,
        data: {
          text: "View Profile",
          url: `${baseUrl}/branch/${branch.global_slug || entityId}`,
        },
      };
    }

    const organizationId = entityId ?? ctx.data.organizationId;
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", organizationId)
      .single();

    if (error || !organization?.slug) {
      return { success: false, error: "Organization profile URL is unavailable" };
    }

    return {
      success: true,
      data: {
        text: "View Profile",
        url: `${baseUrl}/org/${organization.slug}`,
      },
    };
  } catch (err) {
    console.error("getEntityCtaDefaults error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getPreviewData(
  entityType: "user" | "branch" | "organization",
  entityId: string | null,
  filters?: WidgetConfigJson["filters"],
  language?: string,
): Promise<ActionResult<PreviewData>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    let profile: PreviewProfile = { average_rating: 0, total_reviews: 0 };
    const reviews: PreviewReview[] = [];

    if (entityType === "user") {
      if (!entityId) {
        return { success: false, error: "A user must be selected" };
      }

      const { data: user } = await supabase
        .from("users")
        .select("id, full_name, title, avatar_url, photo_url, nmls_id, average_rating, total_reviews")
        .eq("id", entityId)
        .eq("organization_id", ctx.data.organizationId)
        .single();

      if (user) {
        profile = {
          full_name: user.full_name,
          avatar_url: user.avatar_url ?? user.photo_url,
          nmls_id: user.nmls_id,
          title: user.title,
          average_rating: user.average_rating ?? 0,
          total_reviews: user.total_reviews ?? 0,
        };
      }
    } else if (entityType === "branch") {
      if (!entityId) {
        return { success: false, error: "A branch must be selected" };
      }

      const { data: branch } = await supabase
        .from("branches")
        .select("id, name, photo_url")
        .eq("id", entityId)
        .eq("organization_id", ctx.data.organizationId)
        .single();

      if (branch) {
        // Compute live aggregates from reviews via branch users
        const userIds = await getActiveBranchUserIds(entityId);
        let total = 0;
        let avg = 0;

        if (userIds.length > 0) {
          const { data: branchReviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("organization_id", ctx.data.organizationId)
            .in("user_id", userIds)
            .eq("status", "approved")
            .eq("is_published", true);

          total = branchReviews?.length ?? 0;
          avg = total > 0
            ? branchReviews!.reduce((sum, r) => sum + (r.rating ?? 0), 0) / total
            : 0;
        }

        profile = {
          organization_name: branch.name,
          logo_url: branch.photo_url,
          average_rating: Math.round(avg * 10) / 10,
          total_reviews: total,
        };
      }
    } else {
      const organizationId = entityId ?? ctx.data.organizationId;
      const orgProfile = await getOrganizationProfile(organizationId);

      if (orgProfile) {
        profile = {
          organization_name: orgProfile.organization_name ?? orgProfile.full_name ?? null,
          logo_url: orgProfile.logo_url ?? null,
          primary_color: orgProfile.primary_color ?? null,
          average_rating: orgProfile.average_rating ?? 0,
          total_reviews: orgProfile.total_reviews ?? 0,
          rating_distribution: orgProfile.rating_distribution ?? null,
          source_breakdown: orgProfile.source_breakdown ?? null,
        };
      }
    }

    const { reviews: reviewData } = await getPublicReviews({
      organizationId: ctx.data.organizationId,
      entityType,
      entityId,
      filters,
      limit: filters?.maxReviews ?? 10,
    });

    for (const review of reviewData) {
      reviews.push({
        id: review.id,
        reviewer_name: review.reviewer_name ?? "Anonymous",
        rating: review.rating ?? 5,
        text: review.text ?? "",
        review_date: review.review_date ?? new Date().toISOString(),
        source: review.source ?? "internal",
        avatar_url: review.avatar_url ?? null,
        featured: review.featured ?? false,
        loan_type: review.loan_type ?? null,
        first_time_homebuyer: review.first_time_homebuyer ?? false,
      });
    }

    // Translate review text if non-English language requested
    if (language && language !== "en" && reviews.length > 0) {
      try {
        const { translateTexts } = await import("@/lib/ai/translation");
        const texts = reviews.map((r) => r.text).filter((t): t is string => !!t);
        if (texts.length > 0) {
          const translations = await translateTexts(texts, language);
          for (const review of reviews) {
            if (review.text && translations[review.text]) {
              review.text = translations[review.text];
            }
          }
        }
      } catch (err) {
        console.error("Preview translation failed:", err);
        // Non-fatal: return untranslated reviews
      }
    }

    // Resolve profile URL for badge link
    const ctaResult = await getEntityCtaDefaults(entityType, entityId);
    const profileUrl = ctaResult.success ? ctaResult.data.url : null;

    return { success: true, data: { profile, reviews, profileUrl } };
  } catch (err) {
    console.error("getPreviewData error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}




// ── Search Entities (for widget entity selector) ─────────────────────────

export interface EntitySearchResult {
  id: string;
  name: string;
  subtitle: string | null;
  avatarUrl: string | null;
}

export async function searchEntities(
  entityType: "user" | "branch" | "organization",
  search: string
): Promise<ActionResult<EntitySearchResult[]>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    const escaped = search.replace(/[%_\\]/g, "\\$&");
    const results: EntitySearchResult[] = [];

    if (entityType === "user") {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, title, avatar_url, photo_url, nmls_id")
        .eq("organization_id", ctx.data.organizationId)
        .ilike("full_name", `%${escaped}%`)
        .order("full_name", { ascending: true })
        .limit(20);

      if (error) return { success: false, error: error.message };

      for (const u of data ?? []) {
        results.push({
          id: u.id,
          name: u.full_name ?? "Unnamed",
          subtitle: u.title ?? (u.nmls_id ? `NMLS# ${u.nmls_id}` : null),
          avatarUrl: u.avatar_url ?? u.photo_url ?? null,
        });
      }
    } else if (entityType === "branch") {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, photo_url")
        .eq("organization_id", ctx.data.organizationId)
        .ilike("name", `%${escaped}%`)
        .order("name", { ascending: true })
        .limit(20);

      if (error) return { success: false, error: error.message };

      for (const b of data ?? []) {
        results.push({
          id: b.id,
          name: b.name,
          subtitle: null,
          avatarUrl: b.photo_url ?? null,
        });
      }
    } else {
      // organization — typically just the user's own org
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, logo_url")
        .eq("id", ctx.data.organizationId)
        .order("name", { ascending: true })
        .limit(5);

      if (error) return { success: false, error: error.message };

      for (const o of data ?? []) {
        results.push({
          id: o.id,
          name: o.name,
          subtitle: null,
          avatarUrl: o.logo_url ?? null,
        });
      }
    }

    return { success: true, data: results };
  } catch (err) {
    console.error("searchEntities error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Get Organization Brand Colors (for brand_match preset) ──────────────

export interface OrgBrandColors {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export async function getOrgBrandColors(): Promise<ActionResult<OrgBrandColors>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    const { data: org, error } = await supabase
      .from("organizations")
      .select("primary_color, settings")
      .eq("id", ctx.data.organizationId)
      .single();

    if (error || !org) {
      return { success: false, error: "Organization not found" };
    }

    const settings = org.settings as Record<string, unknown> | null;

    return {
      success: true,
      data: {
        primaryColor: (settings?.primary_color as string) ?? org.primary_color ?? "#3B82F6",
        secondaryColor: (settings?.secondary_color as string) ?? "#1E40AF",
        fontFamily: (settings?.font_family as string) ?? "'Inter', sans-serif",
      },
    };
  } catch (err) {
    console.error("getOrgBrandColors error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Get Filtered Review Count (for Widget Builder preview) ──────────────

export interface FilteredReviewCountInput {
  entityType: "user" | "branch" | "organization";
  entityId: string | null;
  filters: {
    minRating?: number;
    dateRange?: { preset?: string; start?: string; end?: string };
    sources?: string[];
    featuredOnly?: boolean;
    keywords?: string[];
    loanTypes?: string[];
  };
}

export async function getFilteredReviewCount(
  input: FilteredReviewCountInput
): Promise<ActionResult<{ count: number }>> {
  try {
    const supabase = createAdminClient();
    const ctx = await getAuthedUserContext(supabase);
    if (!ctx.success) return ctx;

    let query = supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.data.organizationId)
      .eq("status", "approved")
      .eq("is_published", true);

    if (input.entityType === "user" && input.entityId) {
      query = query.eq("user_id", input.entityId);
    } else if (input.entityType === "branch" && input.entityId) {
      const { data: branchUsers } = await supabase
        .from("users")
        .select("id")
        .eq("branch_id", input.entityId)
        .eq("is_active", true);
      const userIds = (branchUsers ?? []).map((u) => u.id);
      if (userIds.length > 0) {
        query = query.in("user_id", userIds);
      } else {
        return { success: true, data: { count: 0 } };
      }
    }

    const { minRating, dateRange, sources, featuredOnly, keywords, loanTypes } = input.filters;

    if (minRating) {
      query = query.gte("rating", minRating);
    }
    if (dateRange) {
      const { preset, start, end } = dateRange;
      if (preset && preset !== "all_time" && preset !== "custom" && !start) {
        const days: Record<string, number> = { last_30d: 30, last_90d: 90, last_year: 365 };
        const d = days[preset];
        if (d) {
          const s = new Date(Date.now() - d * 86_400_000);
          query = query.gte("review_date", s.toISOString().split("T")[0]);
        }
      }
      if (start) query = query.gte("review_date", start);
      if (end) query = query.lte("review_date", end);
    }
    if (sources && sources.length > 0) {
      query = query.in("source", sources);
    }
    if (featuredOnly) {
      query = query.eq("featured", true);
    }
    if (keywords && keywords.length > 0) {
      const tsQuery = keywords
        .map((kw) => kw.replace(/[^a-zA-Z0-9\s]/g, "").trim())
        .filter(Boolean)
        .join(" | ");
      if (tsQuery) {
        query = query.textSearch("text_search", tsQuery, { type: "plain", config: "english" });
      }
    }
    if (loanTypes && loanTypes.length > 0) {
      const ALLOWED_LOAN_TYPES = [
        "Purchase", "Refinance", "VA", "FHA", "Jumbo", "USDA", "Conventional",
      ];
      const safeLoanTypes = loanTypes.filter((lt) =>
        ALLOWED_LOAN_TYPES.includes(lt)
      );
      if (safeLoanTypes.length > 0) {
        const loanTypeFilter = safeLoanTypes
          .map((lt) => `metadata->>loan_type.eq.${lt}`)
          .join(",");
        query = query.or(loanTypeFilter);
      }
    }

    const { count, error } = await query;
    if (error) {
      console.error("getFilteredReviewCount error:", error);
      return { success: false, error: "Failed to count reviews" };
    }

    return { success: true, data: { count: count ?? 0 } };
  } catch (err) {
    console.error("getFilteredReviewCount error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ── Utility: deep merge for JSONB config ────────────────────────────────

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal &&
      typeof sourceVal === "object" &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === "object" &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else {
      result[key] = sourceVal;
    }
  }
  return result;
}
