import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicWidgetConfig } from "@/lib/widgets/public-queries";
import {
  resolveAllowedOrigin,
  buildCorsHeaders,
  widgetError,
  withCorsAndCache,
} from "@/lib/widgets/cors";
import {
  generateStructuredData,
  resolveDefaultSchemaType,
  type EntityData,
  type ReviewData,
} from "@/lib/widgets/structured-data-generator";

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

  const schemaType =
    widget.structured_data_type ??
    resolveDefaultSchemaType(widget.entity_type);

  const { entity, reviews } = await fetchEntityAndReviews(
    widget.organization_id,
    widget.entity_type,
    widget.entity_id
  );

  const jsonLd = generateStructuredData(schemaType, entity, reviews);

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

// ── Data fetching ─────────────────────────────────────────────────────

async function fetchEntityAndReviews(
  organizationId: string,
  entityType: string,
  entityId: string | null
): Promise<{ entity: EntityData; reviews: ReviewData[] }> {
  const supabase = createAdminClient();

  const entity: EntityData = { name: "Unknown" };

  if (entityType === "user" && entityId) {
    const { data: user } = await supabase
      .from("users")
      .select("full_name, title")
      .eq("id", entityId)
      .maybeSingle();

    if (user?.full_name) {
      entity.name = user.full_name;
      entity.title = user.title;
    }

    // Get organization name for worksFor
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();

    if (org?.name) {
      entity.works_for = org.name;
    }
  } else if (entityType === "branch" && entityId) {
    const { data: branch } = await supabase
      .from("branches")
      .select("name, address, phone, website_url")
      .eq("id", entityId)
      .eq("is_active", true)
      .maybeSingle();

    if (branch) {
      entity.name = branch.name;
      entity.telephone = branch.phone;
      entity.url = branch.website_url;
      const rawAddr = branch.address as Record<string, string | null> | null;
      if (rawAddr) {
        entity.address = {
          street: rawAddr.street ?? null,
          city: rawAddr.city ?? null,
          state: rawAddr.state ?? null,
          zip: rawAddr.zip ?? null,
          country: rawAddr.country ?? null,
        };
      }
    }
  } else {
    const { data: org } = await supabase
      .from("organizations")
      .select("name, logo_url")
      .eq("id", organizationId)
      .maybeSingle();

    if (org) {
      entity.name = org.name;
      entity.logo_url = org.logo_url;
    }
  }

  // Fetch approved, published reviews
  let query = supabase
    .from("reviews")
    .select("rating, customer_name, text, review_date")
    .eq("organization_id", organizationId)
    .eq("status", "approved")
    .eq("is_published", true);

  if (entityType === "user" && entityId) {
    query = query.eq("user_id", entityId);
  }

  const { data: reviewRows } = await query
    .order("review_date", { ascending: false })
    .limit(50);

  const reviews: ReviewData[] = (reviewRows ?? []).map((r) => ({
    rating: r.rating,
    customer_name: r.customer_name,
    text: r.text,
    review_date: r.review_date,
  }));

  return { entity, reviews };
}
