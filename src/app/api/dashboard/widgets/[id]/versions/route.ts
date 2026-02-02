import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listWidgetVersions, getWidgetVersion } from "@/lib/widgets/version-actions";

export const revalidate = 0; // No caching for version history

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const version = searchParams.get("version");

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
      return NextResponse.json(
        { error: result.error },
        { status: result.error === "Not authenticated" ? 401 : 404 }
      );
    }

    return NextResponse.json(result.data);
  }

  // Otherwise return the full version list
  const result = await listWidgetVersions(id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error === "Not authenticated" ? 401 : 400 }
    );
  }

  return NextResponse.json(result.data);
}
