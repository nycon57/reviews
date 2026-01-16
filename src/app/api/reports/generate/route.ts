import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReport } from "@/lib/reporting";
import type { DateRangePreset } from "@/lib/reporting/types";
import { verifyNotBot } from "@/lib/botid";

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
    const { templateId, dateRange, filters } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Parse date range
    const parsedDateRange = {
      preset: (dateRange?.preset || "last_30_days") as DateRangePreset,
      start: dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: dateRange?.end ? new Date(dateRange.end) : new Date(),
    };

    const result = await generateReport(
      templateId,
      parsedDateRange,
      filters || {}
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
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
