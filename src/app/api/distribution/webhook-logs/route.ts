import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Fetch webhook logs for the organization
  const { data: logs, error } = await supabase
    .from("webhook_logs")
    .select(
      `
      id,
      event_type,
      status,
      created_at,
      processing_time_ms,
      error_message,
      ip_address
    `
    )
    .eq("organization_id", userData.organization_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching webhook logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhook logs" },
      { status: 500 }
    );
  }

  return NextResponse.json({ logs: logs || [] });
}
