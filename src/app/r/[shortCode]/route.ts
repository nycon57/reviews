import { NextRequest, NextResponse } from "next/server";
import { ShortLinkService } from "@/lib/sms/short-links/service";

// In-memory rate limiter: Map<shortCode, { count, windowStart }>
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function isRateLimited(shortCode: string): boolean {
  const now = Date.now();

  // Lazy cleanup of stale entries every 5 minutes
  if (now - lastCleanup > RATE_LIMIT_WINDOW_MS * 5) {
    for (const [key, entry] of rateLimitMap) {
      if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
        rateLimitMap.delete(key);
      }
    }
    lastCleanup = now;
  }

  const entry = rateLimitMap.get(shortCode);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(shortCode, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

/**
 * GET /r/[shortCode] - Resolve a short link and redirect.
 * Records click analytics and handles expired links.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  // Validate short code format (6 alphanumeric characters)
  if (!/^[a-zA-Z0-9]{6}$/.test(shortCode)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  // Rate limiting
  if (isRateLimited(shortCode)) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      }
    );
  }

  // Resolve the short link
  const link = await ShortLinkService.resolveShortLink(shortCode);

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // Check expiry
  if (ShortLinkService.isExpired(link)) {
    // Redirect to branded expired page
    const expiredUrl = new URL("/r/expired", request.url);
    expiredUrl.searchParams.set("code", shortCode);
    return NextResponse.redirect(expiredUrl.toString(), 302);
  }

  // Record click asynchronously (don't block the redirect)
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const referrer = request.headers.get("referer") ?? undefined;

  // Fire and forget - don't await to keep redirect fast
  ShortLinkService.recordClick(shortCode, { userAgent, referrer }).catch(
    (err) => console.error("[ShortLink] Async click recording failed:", err)
  );

  // 302 redirect to destination
  return NextResponse.redirect(link.destination_url, 302);
}
