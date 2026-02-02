import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listWidgetVersions, getWidgetVersion } from "@/lib/widgets/version-actions";

export const revalidate = 0; // No caching for version history

function errorResponse(error: string, fallbackStatus: number): NextResponse {
  const status = error === "Not authenticated" ? 401 : fallbackStatus;
  return NextResponse.json({ error }, { status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const version = request.nextUrl.searchParams.get("version");

  // If a specific version is requested, return that single version
  if (version) {
    const versionNum = parseInt(version, 10);
    if (isNaN(versionNum) || versionNum < 1) {
      return NextResponse.json(
        { error: "Invalid version number" },
        { status: 400 }
      );
    }

    const result = await getWidgetVersion(id, versionNum);
    if (!result.success) {
      return errorResponse(result.error, 404);
    }

    return NextResponse.json(result.data);
  }

  // Otherwise return the full version list
  const result = await listWidgetVersions(id);
  if (!result.success) {
    return errorResponse(result.error, 400);
  }

  return NextResponse.json(result.data);
}
