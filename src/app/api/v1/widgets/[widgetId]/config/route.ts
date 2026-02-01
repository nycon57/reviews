import { NextResponse, type NextRequest } from "next/server";
import { getPublicWidgetConfig, getEntityProfile, getOrganizationProfile } from "@/lib/widgets/public-queries";
import {
  resolveAllowedOrigin,
  buildCorsHeaders,
  widgetError,
  withCorsAndCache,
} from "@/lib/widgets/cors";

const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=60";

/** Widget types that require an LO entity profile. */
const LO_PROFILE_WIDGET_TYPES = new Set(["lo_review"]);
/** Widget types that require an organization-level profile. */
const ORG_PROFILE_WIDGET_TYPES = new Set(["company_review"]);

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
    return widgetError("Origin not allowed", "FORBIDDEN", 403, origin ?? "*");
  }

  // Enrich with entity profile based on widget type
  let entityProfile = null;
  if (LO_PROFILE_WIDGET_TYPES.has(widget.widget_type) && widget.entity_id) {
    entityProfile = await getEntityProfile(widget.entity_id);
  } else if (ORG_PROFILE_WIDGET_TYPES.has(widget.widget_type)) {
    entityProfile = await getOrganizationProfile(widget.organization_id);
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
