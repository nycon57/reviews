import { NextResponse, type NextRequest } from "next/server";
import {
  getPublicWidgetConfig,
  getPublicReviews,
} from "@/lib/widgets/public-queries";
import {
  resolveAllowedOrigin,
  buildCorsHeaders,
  widgetError,
  withCorsAndCache,
  checkForbiddenRateLimit,
} from "@/lib/widgets/cors";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";
import {
  resolveWidgetEntityContext,
  WidgetEntityOverrideError,
} from "@/lib/widgets/public-entity-resolution";

const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=30";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function isLocalhostOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;
  const origin = request.headers.get("origin");
  const localhost = isLocalhostOrigin(origin);

  const widget = await getPublicWidgetConfig(widgetId, { includeDraft: localhost });
  if (!widget) {
    return widgetError("Widget not found", "NOT_FOUND", 404);
  }

  const allowedOrigin = resolveAllowedOrigin(origin, widget.allowed_domains, widget.status);
  if (!allowedOrigin) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const delay = checkForbiddenRateLimit(ip);
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    return widgetError("Origin not allowed", "FORBIDDEN", 403);
  }

  let resolvedEntity;
  try {
    resolvedEntity = await resolveWidgetEntityContext(widget, request.nextUrl.searchParams);
  } catch (error) {
    if (error instanceof WidgetEntityOverrideError) {
      return widgetError(error.message, error.code, error.status, allowedOrigin);
    }
    throw error;
  }

  const orgId = widget.organization_id;

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor") || undefined;
  const rawLimit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

  // Start with config-level filters as defaults
  const configFilters = (widget.config as WidgetConfigJson)?.filters ?? {};

  // Parse interactive filter query params (override config when present)
  const qMinRating = searchParams.get("minRating");
  const qSortOrder = searchParams.get("sortOrder");
  const qSources = searchParams.get("sources");
  const qLoanTypes = searchParams.get("loanTypes");
  const qKeywords = searchParams.get("keywords");
  const qDateRange = searchParams.get("dateRange");

  const VALID_SORT_ORDERS = ["featured", "newest", "oldest", "highest", "lowest"];
  const VALID_LOAN_TYPES = ["Purchase", "Refinance", "VA", "FHA", "Jumbo", "USDA", "Conventional"];
  const VALID_SOURCES = ["google", "zillow", "internal", "facebook", "yelp"];

  const filters: WidgetConfigJson["filters"] = {
    ...configFilters,
    ...(qMinRating
      ? { minRating: Math.min(5, Math.max(1, parseInt(qMinRating, 10))) }
      : {}),
    ...(qSortOrder && VALID_SORT_ORDERS.includes(qSortOrder)
      ? {
          sortOrder: qSortOrder as
            | "featured"
            | "newest"
            | "oldest"
            | "highest"
            | "lowest",
        }
      : {}),
    ...(qSources
      ? { sources: qSources.split(",").filter((s) => VALID_SOURCES.includes(s)) }
      : {}),
    ...(qLoanTypes
      ? { loanTypes: qLoanTypes.split(",").filter((t) => VALID_LOAN_TYPES.includes(t)) }
      : {}),
    ...(qKeywords
      ? { keywords: qKeywords.split(",").map((k) => k.replace(/[^a-zA-Z0-9\s-]/g, "").trim()).filter(Boolean).slice(0, 10) }
      : {}),
  };

  // Handle dateRange presets
  if (qDateRange) {
    const now = new Date();
    const PRESETS: Record<string, number | null> = {
      last_30d: 30,
      last_90d: 90,
      last_year: 365,
      all_time: null,
    };
    if (qDateRange in PRESETS) {
      const days = PRESETS[qDateRange];
      if (days !== null) {
        const start = new Date(now.getTime() - days * 86_400_000);
        filters.dateRange = { start: start.toISOString().split("T")[0] };
      } else {
        delete filters.dateRange;
      }
    }
  }

  const effectiveLimit = filters?.maxReviews
    ? Math.min(limit, filters.maxReviews)
    : limit;

  const { reviews, nextCursor } = await getPublicReviews({
    organizationId: orgId,
    entityType: resolvedEntity.entityType,
    entityId: resolvedEntity.entityId,
    filters,
    cursor,
    limit: effectiveLimit,
  });

  // Translate review text when widget language is non-English
  const widgetConfig = widget.config as WidgetConfigJson;
  const widgetLang = widgetConfig?.content?.language;
  if (widgetLang && widgetLang !== "en" && reviews.length > 0) {
    try {
      const { translateTexts } = await import("@/lib/ai/translation");
      const texts = reviews.map((r) => r.text).filter(Boolean) as string[];
      if (texts.length > 0) {
        const translations = await translateTexts(texts, widgetLang);
        for (const review of reviews) {
          if (review.text && translations[review.text]) {
            review.text = translations[review.text];
          }
        }
      }
    } catch (err) {
      console.error("Embed translation failed:", err);
      // Non-fatal: serve untranslated reviews
    }
  }

  const body = {
    reviews,
    pagination: {
      next_cursor: nextCursor,
      limit: effectiveLimit,
      has_more: nextCursor !== null,
    },
  };

  const response = NextResponse.json(body);
  return withCorsAndCache(response, allowedOrigin, CACHE_CONTROL);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders("*"),
  });
}
