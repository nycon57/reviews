/**
 * Announcements List API Route (S088)
 *
 * Returns list of announcements for the admin dashboard.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";

// Type for announcement row (table not yet in generated types)
interface AnnouncementRow {
  id: string;
  title: string;
  type: string;
  status: string;
  audience: string;
  sent_at: string | null;
  scheduled_at: string | null;
  total_recipients: number | null;
  total_sent: number | null;
  total_opened: number | null;
  total_clicked: number | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is admin
    const user = await unifiedGetUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Parse query params for pagination
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const statusFilter = searchParams.get("status");

    // Use admin client to bypass RLS
    // Note: Using type assertion until migration is applied and types regenerated
    const adminClient = createAdminClient();

    // Build query - using 'as any' for announcements table (not yet in generated types)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (adminClient as any)
      .from("announcements")
      .select(
        "id, title, type, status, audience, sent_at, scheduled_at, total_recipients, total_sent, total_opened, total_clicked, created_at"
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (statusFilter && ["draft", "scheduled", "sending", "sent", "cancelled"].includes(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data: announcements, error } = (await query) as {
      data: AnnouncementRow[] | null;
      error: { message: string } | null;
    };

    // If error (table might not exist yet), return empty array
    if (error) {
      console.error("Fetch announcements error:", error);
      return NextResponse.json({
        success: true,
        announcements: [],
      });
    }

    // Transform to client format
    const formattedAnnouncements = (announcements || []).map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      status: a.status,
      audience: a.audience,
      sentAt: a.sent_at,
      scheduledAt: a.scheduled_at,
      totalRecipients: a.total_recipients || 0,
      totalSent: a.total_sent || 0,
      totalOpened: a.total_opened || 0,
      totalClicked: a.total_clicked || 0,
    }));

    return NextResponse.json({
      success: true,
      announcements: formattedAnnouncements,
    });
  } catch (error) {
    console.error("List announcements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
