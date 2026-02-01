import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPublicWidgetConfig,
  getWidgetOrganizationId,
} from "@/lib/widgets/public-queries";
import {
  resolveAllowedOrigin,
  buildCorsHeaders,
  widgetError,
  withCorsAndCache,
} from "@/lib/widgets/cors";

const CACHE_CONTROL = "public, max-age=3600";

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

  if (!widget.enable_structured_data) {
    return widgetError("Structured data not enabled", "NOT_FOUND", 404);
  }

  const allowedOrigin = resolveAllowedOrigin(origin, widget.allowed_domains);
  if (!allowedOrigin) {
    return widgetError("Origin not allowed", "FORBIDDEN", 403);
  }

  const organizationId = await getWidgetOrganizationId(widgetId);
  if (!organizationId) {
    return widgetError("Widget not found", "NOT_FOUND", 404);
  }

  const jsonLd = await buildJsonLd(
    widget.name,
    widget.structured_data_type || "LocalBusiness",
    organizationId,
    widget.entity_type,
    widget.entity_id
  );

  const response = NextResponse.json(jsonLd);
  response.headers.set("Content-Type", "application/ld+json");
  return withCorsAndCache(response, allowedOrigin, CACHE_CONTROL);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders("*"),
  });
}

async function buildJsonLd(
  name: string,
  schemaType: string,
  organizationId: string,
  entityType: string,
  entityId: string | null
): Promise<Record<string, unknown>> {
  const supabase = createAdminClient();

  let query = supabase
    .from("reviews")
    .select("rating")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .eq("is_published", true);

  if (entityType === "user" && entityId) {
    query = query.eq("user_id", entityId);
  }

  const { data: reviews } = await query;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name,
  };

  if (reviews && reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round((sum / reviews.length) * 10) / 10;

    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      ratingCount: reviews.length,
    };
  }

  return jsonLd;
}
