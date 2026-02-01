import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  isValidEventType,
  hashIp,
  insertWidgetEvent,
  checkEventRateLimit,
  getWidgetOrganizationId,
} from "@/lib/widgets/public-queries";
import { buildCorsHeaders, widgetError } from "@/lib/widgets/cors";

const eventBodySchema = z.object({
  event_type: z.string(),
  page_url: z.string().url().nullable().optional(),
  referrer: z.string().url().or(z.literal("")).nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  session_id: z.string().max(128).nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  const { widgetId } = await params;

  const orgId = await getWidgetOrganizationId(widgetId);
  if (!orgId) {
    return widgetError("Widget not found", "NOT_FOUND", 404);
  }

  let body: z.infer<typeof eventBodySchema>;
  try {
    const raw = await request.json();
    const parsed = eventBodySchema.safeParse(raw);
    if (!parsed.success) {
      return widgetError(
        parsed.error.errors[0]?.message ?? "Invalid request body",
        "VALIDATION_ERROR",
        400
      );
    }
    body = parsed.data;
  } catch {
    return widgetError("Invalid JSON body", "VALIDATION_ERROR", 400);
  }

  if (!isValidEventType(body.event_type)) {
    return widgetError("Invalid event_type", "VALIDATION_ERROR", 400);
  }

  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ipHash = await hashIp(clientIp);

  if (!checkEventRateLimit(ipHash)) {
    const res = widgetError("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
    res.headers.set("Retry-After", "60");
    return res;
  }

  const userAgent = request.headers.get("user-agent");
  insertWidgetEvent({
    widgetId,
    eventType: body.event_type,
    pageUrl: body.page_url ?? null,
    referrer: body.referrer ?? null,
    ipHash,
    userAgent,
    metadata: body.metadata ?? null,
    sessionId: body.session_id ?? null,
  });

  const response = new NextResponse(null, { status: 202 });
  const cors = buildCorsHeaders("*", "POST, OPTIONS");
  for (const [key, value] of Object.entries(cors)) {
    response.headers.set(key, value);
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders("*", "POST, OPTIONS"),
  });
}
