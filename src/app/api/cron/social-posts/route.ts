import { NextRequest, NextResponse } from "next/server";
import { executeScheduledPosts } from "@/lib/social-graphics/publish-actions";
import { withCronHeartbeat } from "@/lib/cron/heartbeat";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronHeartbeat("social-posts", async () => {
    const result = await executeScheduledPosts();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ published: result.data });
  });
}
