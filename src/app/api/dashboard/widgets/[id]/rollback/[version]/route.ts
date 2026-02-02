import { NextResponse } from "next/server";
import { rollbackToVersion } from "@/lib/widgets/version-actions";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; version: string }> }
) {
  const { id, version } = await params;

  const versionNum = parseInt(version, 10);
  if (isNaN(versionNum) || versionNum < 1) {
    return NextResponse.json(
      { error: "Invalid version number" },
      { status: 400 }
    );
  }

  const result = await rollbackToVersion(id, versionNum);
  if (!result.success) {
    const status =
      result.error === "Not authenticated"
        ? 401
        : result.error === "Widget not found" || result.error === "Target version not found"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
