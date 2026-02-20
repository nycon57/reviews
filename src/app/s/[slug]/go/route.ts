import { NextRequest, NextResponse } from "next/server";
import { getProofLinkBySlug, recordProofLinkEvent } from "@/lib/share-studio/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = await getProofLinkBySlug(slug);

  if (!data || !data.link.published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let target = request.nextUrl.origin;
  const rawDestination = data.link.destination_url as string | null;
  if (rawDestination) {
    try {
      const parsed = new URL(rawDestination);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        target = parsed.href;
      }
    } catch {
      // Invalid URL — fall back to origin
    }
  }

  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip");

  await recordProofLinkEvent({
    organizationId: String(data.link.organization_id),
    proofLinkId: String(data.link.id),
    eventType: "click",
    requestId: request.headers.get("x-vercel-id") ?? undefined,
    userAgent,
    referrer,
    ipAddress,
    metadata: {
      slug,
      target,
    },
  });

  return NextResponse.redirect(target, 302);
}
