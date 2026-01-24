import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  startWelcomeSequence,
  getWelcomeSequenceStatus,
  pauseWelcomeSequence,
  resumeWelcomeSequence,
} from "@/lib/email/welcome-sequence-service";

// Schema for starting a welcome sequence
const startSequenceSchema = z.object({
  userId: z.string().uuid(),
});

// Schema for managing a sequence
const manageSequenceSchema = z.object({
  sequenceId: z.string().uuid(),
  action: z.enum(["pause", "resume"]),
});

/**
 * POST /api/email/welcome-sequence
 *
 * Start a welcome sequence for a user.
 * Can be called:
 * - By the signup flow after user creation
 * - By a Supabase database webhook on user insert
 * - Manually by admins
 *
 * Body:
 * - userId: UUID of the user to start the sequence for
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = startSequenceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || "Invalid request body",
        },
        { status: 400 }
      );
    }

    const { userId } = parseResult.data;

    // Verify authorization - either internal call (webhook) or authenticated admin/manager
    const currentUser = await unifiedGetUser();

    // Allow if authenticated user is starting their own sequence
    const isSelf = currentUser?.id === userId;

    // Allow if authenticated user is admin/manager in same org
    let isAuthorized = isSelf;
    if (!isAuthorized && currentUser) {
      const adminSupabase = createAdminClient();

      // Get the target user's org
      const { data: targetUser } = await adminSupabase
        .from("users")
        .select("organization_id")
        .eq("id", userId)
        .single();

      // Get current user's role and org
      const { data: currentUserData } = await adminSupabase
        .from("users")
        .select("organization_id, role")
        .eq("id", currentUser.id)
        .single();

      if (
        targetUser &&
        currentUserData &&
        targetUser.organization_id === currentUserData.organization_id &&
        (currentUserData.role === "admin" || currentUserData.role === "manager")
      ) {
        isAuthorized = true;
      }
    }

    // Also allow internal webhook calls (check for webhook secret)
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    const authHeader = request.headers.get("authorization");
    if (webhookSecret && authHeader === `Bearer ${webhookSecret}`) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Start the welcome sequence
    const result = await startWelcomeSequence(userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sequenceId: result.sequenceId,
      message: "Welcome sequence started successfully",
    });
  } catch (error) {
    console.error("Error starting welcome sequence:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/welcome-sequence?userId=<uuid>
 *
 * Get the welcome sequence status for a user.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId query parameter is required" },
        { status: 400 }
      );
    }

    // Verify the user has access
    const currentUser = await unifiedGetUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user can view this sequence
    const isSelf = currentUser.id === userId;
    let canView = isSelf;

    if (!canView) {
      const adminSupabase = createAdminClient();

      const { data: targetUser } = await adminSupabase
        .from("users")
        .select("organization_id")
        .eq("id", userId)
        .single();

      const { data: currentUserData } = await adminSupabase
        .from("users")
        .select("organization_id, role")
        .eq("id", currentUser.id)
        .single();

      if (
        targetUser &&
        currentUserData &&
        targetUser.organization_id === currentUserData.organization_id &&
        (currentUserData.role === "admin" || currentUserData.role === "manager")
      ) {
        canView = true;
      }
    }

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const status = await getWelcomeSequenceStatus(userId);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Error getting welcome sequence status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/email/welcome-sequence
 *
 * Pause or resume a welcome sequence.
 *
 * Body:
 * - sequenceId: UUID of the sequence
 * - action: "pause" | "resume"
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = manageSequenceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message || "Invalid request body",
        },
        { status: 400 }
      );
    }

    const { sequenceId, action } = parseResult.data;

    // Verify authorization
    const currentUser = await unifiedGetUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get sequence to verify ownership
    const adminSupabase = createAdminClient();
    // Note: email_sequences table added in migration 20240101000043
    // Types will be updated after running npm run db:types
    const { data: sequence } = await (adminSupabase as ReturnType<typeof createAdminClient>)
      .from("email_sequences" as "users")
      .select("user_id, organization_id")
      .eq("id", sequenceId)
      .single() as { data: { user_id: string; organization_id: string } | null };

    if (!sequence) {
      return NextResponse.json(
        { success: false, error: "Sequence not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const isSelf = currentUser.id === sequence.user_id;
    let canManage = isSelf;

    if (!canManage) {
      const { data: currentUserData } = await adminSupabase
        .from("users")
        .select("organization_id, role")
        .eq("id", currentUser.id)
        .single();

      if (
        currentUserData &&
        sequence.organization_id === currentUserData.organization_id &&
        currentUserData.role === "admin"
      ) {
        canManage = true;
      }
    }

    if (!canManage) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Perform the action
    const result =
      action === "pause"
        ? await pauseWelcomeSequence(sequenceId)
        : await resumeWelcomeSequence(sequenceId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Sequence ${action}d successfully`,
    });
  } catch (error) {
    console.error("Error managing welcome sequence:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
