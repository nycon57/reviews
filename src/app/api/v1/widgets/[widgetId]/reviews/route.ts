import { NextResponse, type NextRequest } from "next/server";
import {
  getPublicWidgetConfig,
  getPublicReviews,
  getWidgetOrganizationId,
} from "@/lib/widgets/public-queries";
import {
  resolveAllowedOrigin,
  buildCorsHeaders,
  widgetError,
  withCorsAndCache,
} from "@/lib/widgets/cors";
import type { WidgetConfigJson } from "@/lib/widgets/schemas";

const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=30";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;
  const origin = request.headers.get("origin");

  const widget = await getPublicWidgetConfig(widgetId);
  if (!widget) {
    return widgetError("Widget not found", "NOT_FOUND", 404);
  }

  const allowedOrigin = resolveAllowedOrigin(origin, widget.allowed_domains);
  if (!allowedOrigin) {
    return widgetError("Origin not allowed", "FORBIDDEN", 403);
  }

  const orgId = await getWidgetOrganizationId(widgetId);
  if (!orgId) {
    return widgetError("Widget configuration error", "INTERNAL_ERROR", 500, allowedOrigin);
  }

  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor") || undefined;
  const rawLimit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

  const filters = (widget.config as WidgetConfigJson)?.filters ?? undefined;
  const effectiveLimit = filters?.maxReviews
    ? Math.min(limit, filters.maxReviews)
    : limit;

  const { reviews, nextCursor } = await getPublicReviews({
    organizationId: orgId,
    entityType: widget.entity_type,
    entityId: widget.entity_id,
    filters,
    cursor,
    limit: effectiveLimit,
  });

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
