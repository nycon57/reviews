import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

interface ManifestEntry {
  version: string;
  hash: string;
  filename: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  buildTimestamp: string;
}

interface Manifest {
  current: ManifestEntry;
  previous: ManifestEntry[];
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * CDN health check endpoint.
 * Returns 200 with current embed version info, or 503 if manifest is missing.
 */
export async function GET() {
  const manifestPath = resolve(process.cwd(), "public/embed/v1/manifest.json");

  if (!existsSync(manifestPath)) {
    return NextResponse.json(
      {
        status: "unavailable",
        error: "Embed manifest not found. Run npm run build:embed first.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  try {
    const manifest: Manifest = JSON.parse(
      readFileSync(manifestPath, "utf-8")
    );
    const { current } = manifest;

    // Verify the actual file exists
    const embedPath = resolve(
      process.cwd(),
      "public/embed/v1",
      current.filename
    );
    const fileExists = existsSync(embedPath);

    return NextResponse.json(
      {
        status: fileExists ? "healthy" : "degraded",
        version: current.version,
        hash: current.hash,
        filename: current.filename,
        size: current.size,
        gzipSize: current.gzipSize,
        brotliSize: current.brotliSize,
        buildTimestamp: current.buildTimestamp,
        previousVersions: manifest.previous.length,
        fileExists,
      },
      {
        status: fileExists ? 200 : 503,
        headers: {
          "Cache-Control": "public, max-age=30, s-maxage=30",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { status: "error", error: "Failed to read embed manifest." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
