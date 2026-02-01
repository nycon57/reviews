import { NextResponse } from "next/server";
import type { EmbedManifest } from "@/lib/widgets/manifest-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
} as const;

/**
 * CDN health check endpoint.
 * Fetches the manifest and verifies the embed script is reachable via HTTP,
 * ensuring the CDN is actually serving the files (not just checking disk).
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const manifestUrl = `${origin}/embed/v1/manifest.json`;

  try {
    const manifestRes = await fetch(manifestUrl, {
      next: { revalidate: 0 },
    });

    if (!manifestRes.ok) {
      return NextResponse.json(
        {
          status: "unavailable",
          error: "Embed manifest not reachable from CDN.",
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-cache", ...CORS_HEADERS },
        }
      );
    }

    const manifest: EmbedManifest = await manifestRes.json();
    const { current } = manifest;

    // Verify the hashed embed file is reachable via CDN
    const embedUrl = `${origin}/embed/v1/${current.filename}`;
    const embedRes = await fetch(embedUrl, {
      method: "HEAD",
      next: { revalidate: 0 },
    });

    const fileReachable = embedRes.ok;

    return NextResponse.json(
      {
        status: fileReachable ? "healthy" : "degraded",
        version: current.version,
        hash: current.hash,
        filename: current.filename,
        size: current.size,
        gzipSize: current.gzipSize,
        brotliSize: current.brotliSize,
        buildTimestamp: current.buildTimestamp,
        previousVersions: manifest.previous.length,
        cdnReachable: fileReachable,
      },
      {
        status: fileReachable ? 200 : 503,
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=30",
          ...CORS_HEADERS,
        },
      }
    );
  } catch {
    return NextResponse.json(
      { status: "error", error: "Failed to verify embed CDN health." },
      {
        status: 500,
        headers: { "Cache-Control": "no-cache", ...CORS_HEADERS },
      }
    );
  }
}
