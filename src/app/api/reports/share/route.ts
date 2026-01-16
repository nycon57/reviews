import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReportShare, revokeReportShare, getReportShares } from "@/lib/reporting";
import { verifyNotBot } from "@/lib/botid";

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Manager or admin access required" },
        { status: 403 }
      );
    }

    const result = await getReportShares();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching shares:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify request is not from a bot
    const botResponse = await verifyNotBot();
    if (botResponse) return botResponse;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Manager or admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { templateId, title, dateRange, filters, expiresInDays } = body;

    if (!templateId || !title || !dateRange?.start || !dateRange?.end) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: templateId, title, dateRange.start, dateRange.end" },
        { status: 400 }
      );
    }

    const result = await createReportShare(
      templateId,
      title,
      {
        preset: "custom",
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      },
      filters || {},
      expiresInDays || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error creating share:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "manager" && profile.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Manager or admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("id");

    if (!shareId) {
      return NextResponse.json(
        { success: false, error: "Share ID is required" },
        { status: 400 }
      );
    }

    const result = await revokeReportShare(shareId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error revoking share:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
