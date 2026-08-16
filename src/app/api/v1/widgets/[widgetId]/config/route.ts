import { NextResponse, type NextRequest } from "next/server";
import {
  getPublicWidgetConfig,
  getEntityProfile,
  getOrganizationProfile,
  getBranchProfile,
  getVideoTestimonials,
  getNpsData,
} from "@/lib/widgets/public-queries";
import { getPublicAbTestConfig } from "@/lib/widgets/ab-testing";
import {
  resolveAllowedOrigin,
  buildCorsHeaders,
  widgetError,
  withCorsAndCache,
  checkForbiddenRateLimit,
} from "@/lib/widgets/cors";
import {
  resolveWidgetEntityContext,
  WidgetEntityOverrideError,
} from "@/lib/widgets/public-entity-resolution";

const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=60";

/** Widget types that require an LO entity profile. */
const LO_PROFILE_WIDGET_TYPES = new Set(["lo_review"]);
/** Widget types that require an organization-level profile. */
const ORG_PROFILE_WIDGET_TYPES = new Set(["company_review"]);
/** Widget types that require a branch-level profile (with team members). */
const BRANCH_PROFILE_WIDGET_TYPES = new Set(["branch_review"]);
/** Widget types that resolve profile based on entity_type (org or LO). */
const ENTITY_AWARE_WIDGET_TYPES = new Set([
  "review_profile",
  "star_rating_badge",
  "review_carousel",
  "review_wall",
  "video_testimonial",
  "social_proof_banner",
]);

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

  let resolvedEntity;
  try {
    resolvedEntity = await resolveWidgetEntityContext(widget, request.nextUrl.searchParams);
  } catch (error) {
    if (error instanceof WidgetEntityOverrideError) {
      return widgetError(error.message, error.code, error.status, allowedOrigin);
    }
    throw error;
  }

  const effectiveWidget = {
    ...widget,
    entity_type: resolvedEntity.entityType,
    entity_id: resolvedEntity.entityId,
    override_applied: resolvedEntity.overrideApplied,
  };

  // Enrich with entity profile based on widget type and entity_type
  let entityProfile = null;
  if (LO_PROFILE_WIDGET_TYPES.has(effectiveWidget.widget_type) && effectiveWidget.entity_id) {
    entityProfile = await getEntityProfile(effectiveWidget.entity_id);
  } else if (ORG_PROFILE_WIDGET_TYPES.has(effectiveWidget.widget_type)) {
    entityProfile = await getOrganizationProfile(effectiveWidget.organization_id);
  } else if (
    BRANCH_PROFILE_WIDGET_TYPES.has(effectiveWidget.widget_type) &&
    effectiveWidget.entity_id
  ) {
    entityProfile = await getBranchProfile(effectiveWidget.entity_id);
  } else if (ENTITY_AWARE_WIDGET_TYPES.has(effectiveWidget.widget_type)) {
    if (effectiveWidget.entity_type === "user" && effectiveWidget.entity_id) {
      entityProfile = await getEntityProfile(effectiveWidget.entity_id);
    } else if (effectiveWidget.entity_type === "branch" && effectiveWidget.entity_id) {
      entityProfile = await getBranchProfile(effectiveWidget.entity_id);
    } else {
      entityProfile = await getOrganizationProfile(effectiveWidget.organization_id);
    }
  }

  // For branch entity type without a profile yet, fetch branch data
  if (!entityProfile && effectiveWidget.entity_type === "branch" && effectiveWidget.entity_id) {
    entityProfile = await getBranchProfile(effectiveWidget.entity_id);
  }

  // Fetch video testimonials for video_testimonial widgets
  let videoTestimonials = null;
  if (effectiveWidget.widget_type === "video_testimonial") {
    videoTestimonials = await getVideoTestimonials(
      effectiveWidget.organization_id,
      effectiveWidget.entity_id,
      effectiveWidget.entity_type,
    );
  }

  // Fetch NPS data for nps_score_badge widgets
  let npsData = null;
  if (effectiveWidget.widget_type === "nps_score_badge") {
    npsData = await getNpsData(effectiveWidget.organization_id);
  }

  // Resolve A/B test config if widget has an active test
  let abTest = null;
  if (effectiveWidget.ab_test_config) {
    const abCfg = effectiveWidget.ab_test_config as {
      enabled?: boolean;
      status?: string;
    };
    if (abCfg.enabled && abCfg.status === "running") {
      abTest = await getPublicAbTestConfig(effectiveWidget.id);
    }
  }

  // Strip internal fields from public response
  const {
    allowed_domains: _ad,
    organization_id: _oid,
    id: _id,
    ab_test_config: _abc,
    ...publicWidget
  } = effectiveWidget;
  // Unset extras stay `undefined` so `NextResponse.json` omits their keys entirely.
  const body = {
    ...publicWidget,
    entity_profile: entityProfile,
    video_testimonials: videoTestimonials ?? undefined,
    nps_data: npsData ?? undefined,
    ab_test: abTest ?? undefined,
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
