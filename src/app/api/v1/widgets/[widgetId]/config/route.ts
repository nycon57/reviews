import { NextResponse, type NextRequest } from "next/server";
import { getPublicWidgetConfig, getEntityProfile, getOrganizationProfile, getBranchProfile } from "@/lib/widgets/public-queries";
import {
  resolveAllowedOrigin,
  buildCorsHeaders,
  widgetError,
  withCorsAndCache,
  checkForbiddenRateLimit,
} from "@/lib/widgets/cors";

const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=60";

/** Widget types that require an LO entity profile. */
const LO_PROFILE_WIDGET_TYPES = new Set(["lo_review"]);
/** Widget types that require an organization-level profile. */
const ORG_PROFILE_WIDGET_TYPES = new Set(["company_review"]);
/** Widget types that resolve profile based on entity_type (org or LO). */
const ENTITY_AWARE_WIDGET_TYPES = new Set(["star_rating_badge"]);

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
    return widgetError("Origin not allowed", "FORBIDDEN", 403, origin ?? "*");
  }

  // Enrich with entity profile based on widget type and entity_type
  let entityProfile = null;
  if (LO_PROFILE_WIDGET_TYPES.has(widget.widget_type) && widget.entity_id) {
    entityProfile = await getEntityProfile(widget.entity_id);
  } else if (ORG_PROFILE_WIDGET_TYPES.has(widget.widget_type)) {
    entityProfile = await getOrganizationProfile(widget.organization_id);
  } else if (ENTITY_AWARE_WIDGET_TYPES.has(widget.widget_type)) {
    if (widget.entity_type === "user" && widget.entity_id) {
      entityProfile = await getEntityProfile(widget.entity_id);
    } else if (widget.entity_type === "branch" && widget.entity_id) {
      entityProfile = await getBranchProfile(widget.entity_id);
    } else {
      entityProfile = await getOrganizationProfile(widget.organization_id);
    }
  }

  // For branch entity type without a profile yet, fetch branch data
  if (!entityProfile && widget.entity_type === "branch" && widget.entity_id) {
    entityProfile = await getBranchProfile(widget.entity_id);
  }

  // Strip internal fields from public response
  const { allowed_domains: _ad, organization_id: _oid, ...publicWidget } = widget;
  const body = { ...publicWidget, entity_profile: entityProfile };
  const response = NextResponse.json(body);
  return withCorsAndCache(response, allowedOrigin, CACHE_CONTROL);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders("*"),
  });
}
