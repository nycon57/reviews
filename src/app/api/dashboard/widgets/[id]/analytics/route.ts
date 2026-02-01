import { NextRequest, NextResponse } from "next/server";
import { getWidgetDetailAnalytics } from "@/lib/widgets/analytics-actions";

export const revalidate = 300; // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const dateRange = searchParams.get("range") ?? "30d";
  const customStart = searchParams.get("start") ?? undefined;
  const customEnd = searchParams.get("end") ?? undefined;

  const result = await getWidgetDetailAnalytics(
    id,
    dateRange,
    customStart,
    customEnd
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data, {
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}
