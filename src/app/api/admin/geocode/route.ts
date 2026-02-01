import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { batchGeocodeUsers, batchGeocodeBranches } from "@/lib/directory/actions";

/**
 * POST /api/admin/geocode
 * Batch geocode branches or users without coordinates
 * Requires admin role
 *
 * Body options:
 * - target: "branches" (default) or "users"
 * - limit: number of records to process (default 50, max 100)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await unifiedGetUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin role required" }, { status: 403 });
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(body.limit || 50, 100); // Max 100 per batch
    const allowedTargets = ["branches", "users"] as const;
    const target = body.target && allowedTargets.includes(body.target)
      ? body.target
      : body.target
        ? null // invalid target provided
        : "branches"; // default when missing

    if (target === null) {
      return NextResponse.json(
        { error: `Invalid target. Must be one of: ${allowedTargets.join(", ")}` },
        { status: 400 }
      );
    }

    if (target === "branches") {
      // Get count of branches without coordinates
      const { count: pendingCount } = await supabase
        .from("branches")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("latitude", null);

      // Run batch geocoding for branches
      const result = await batchGeocodeBranches(limit);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Geocoding failed" },
          { status: 500 }
        );
      }

      // Get updated count
      const { count: remainingCount } = await supabase
        .from("branches")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("latitude", null);

      return NextResponse.json({
        success: true,
        target: "branches",
        processed: result.processed,
        remaining: remainingCount || 0,
        previousPending: pendingCount || 0,
        message: `Geocoded ${result.processed} branches. ${remainingCount || 0} remaining.`,
      });
    } else {
      // Geocode users (fallback for users not assigned to branches)
      const { count: pendingCount } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("latitude", null);

      const result = await batchGeocodeUsers(limit);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Geocoding failed" },
          { status: 500 }
        );
      }

      const { count: remainingCount } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("latitude", null);

      return NextResponse.json({
        success: true,
        target: "users",
        processed: result.processed,
        remaining: remainingCount || 0,
        previousPending: pendingCount || 0,
        message: `Geocoded ${result.processed} users. ${remainingCount || 0} remaining.`,
      });
    }
  } catch (error) {
    console.error("Geocode API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/geocode
 * Get geocoding status for both branches and users
 */
export async function GET() {
  try {
    // Verify authentication
    const user = await unifiedGetUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const supabase = createAdminClient();
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin role required" }, { status: 403 });
    }

    // Get branch counts
    const { count: branchesPending } = await supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("latitude", null);

    const { count: branchesGeocoded } = await supabase
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .not("latitude", "is", null);

    // Get user counts
    const { count: usersPending } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .is("latitude", null);

    const { count: usersGeocoded } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .not("latitude", "is", null);

    return NextResponse.json({
      branches: {
        pending: branchesPending || 0,
        geocoded: branchesGeocoded || 0,
        total: (branchesPending || 0) + (branchesGeocoded || 0),
      },
      users: {
        pending: usersPending || 0,
        geocoded: usersGeocoded || 0,
        total: (usersPending || 0) + (usersGeocoded || 0),
      },
      // Legacy format for backwards compatibility
      pending: usersPending || 0,
      geocoded: usersGeocoded || 0,
      total: (usersPending || 0) + (usersGeocoded || 0),
    });
  } catch (error) {
    console.error("Geocode status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
