import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getWidgetDetailAnalytics } from "@/lib/widgets/analytics-actions";

export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
    const status = result.error === "Not authenticated" ? 401 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result.data);
}
