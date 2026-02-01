import { NextResponse, type NextRequest, after } from "next/server";
import {
  isValidEventType,
  hashIp,
  insertWidgetEvent,
  checkEventRateLimit,
  getWidgetOrganizationId,
} from "@/lib/widgets/public-queries";
import { buildCorsHeaders } from "@/lib/widgets/cors";

// 1x1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> },
) {
  const { widgetId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const eventParam = searchParams.get("event");
  const sessionId = searchParams.get("session");

  // Always return the pixel regardless of validation outcome
  const pixelResponse = () =>
    new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": String(TRANSPARENT_GIF.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...buildCorsHeaders("*", "GET, OPTIONS"),
      },
    });

  // Validate event type
  if (!eventParam || !isValidEventType(eventParam)) {
    return pixelResponse();
  }

  // Validate widget exists
  const orgId = await getWidgetOrganizationId(widgetId);
  if (!orgId) {
    return pixelResponse();
  }

  // Rate limit check
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ipHash = await hashIp(clientIp);

  if (!checkEventRateLimit(ipHash)) {
    return pixelResponse();
  }

  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer") || null;

  // Insert event asynchronously
  after(async () => {
    await insertWidgetEvent({
      widgetId,
      eventType: eventParam,
      pageUrl: referrer,
      referrer: null,
      ipHash,
      userAgent,
      metadata: { source: "pixel" },
      sessionId: sessionId ?? null,
    });
  });

  return pixelResponse();
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders("*", "GET, OPTIONS"),
  });
}
