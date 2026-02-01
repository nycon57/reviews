import { NextResponse, type NextRequest } from "next/server";
import { getPublicWidgetConfig } from "@/lib/widgets/public-queries";
import {
  resolveAllowedOrigin,
  buildCorsHeaders,
  widgetError,
  withCorsAndCache,
} from "@/lib/widgets/cors";

const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=60";

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

  const response = NextResponse.json(widget);
  return withCorsAndCache(response, allowedOrigin, CACHE_CONTROL);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders("*"),
  });
}
