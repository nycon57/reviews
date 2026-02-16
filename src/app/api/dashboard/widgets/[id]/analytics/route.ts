import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getWidgetDetailAnalytics } from "@/lib/widgets/analytics-actions";
import { unifiedGetUser } from "@/lib/auth/actions";

export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await unifiedGetUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sp = request.nextUrl.searchParams;
  const range = sp.get("range") ?? "30d";
  const customStart = sp.get("start") ?? undefined;
  const customEnd = sp.get("end") ?? undefined;

  const result = await getWidgetDetailAnalytics(
    id,
    range,
    customStart,
    customEnd
  );

  if (!result.success) {
    const status =
      result.error === "Not authenticated" ? 401 :
      result.error === "Widget not found" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
