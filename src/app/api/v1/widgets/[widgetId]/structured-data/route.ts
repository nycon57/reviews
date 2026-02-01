import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicWidgetConfig } from "@/lib/widgets/public-queries";
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

  const organizationId = widget.organization_id;

  const jsonLd = await buildJsonLd(
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

// ── JSON-LD builder ──────────────────────────────────────────────────────

async function buildJsonLd(
  schemaType: string,
  organizationId: string,
  entityType: string,
  entityId: string | null
): Promise<Record<string, unknown>> {
  const supabase = createAdminClient();

  // Resolve entity name from the actual entity (users table, not loan_officers)
  let entityName = "";
  if (entityType === "user" && entityId) {
    const { data: user } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", entityId)
      .maybeSingle();
    entityName = user?.full_name ?? "";
  }
  if (!entityName) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();
    entityName = org?.name ?? "Unknown";
  }

  // Fetch approved, published reviews for aggregate rating + snippets
  let query = supabase
    .from("reviews")
    .select("rating, customer_name, text, review_date")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .eq("is_published", true);

  if (entityType === "user" && entityId) {
    query = query.eq("user_id", entityId);
  }

  const { data: reviews } = await query
    .order("review_date", { ascending: false })
    .limit(50);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: entityName,
  };

  if (reviews && reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Math.round((sum / reviews.length) * 10) / 10;

    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      bestRating: "5",
      worstRating: "1",
      reviewCount: reviews.length,
    };

    // Include up to 10 individual review snippets
    jsonLd.review = reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.customer_name ?? "Anonymous",
      },
      datePublished: r.review_date,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      // Truncate to 200 chars per spec
      reviewBody: r.text ? r.text.slice(0, 200) : "",
    }));
  }

  return jsonLd;
}
