import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  trackActionStarted,
  trackActionCompleted,
  updateActionContext,
} from "@/lib/email/abandoned-action-recovery-service";
import type { AbandonedActionType } from "@/lib/email/types";

// Valid action types
const validActionTypes: AbandonedActionType[] = [
  "survey_creation",
  "survey_send",
  "video_request",
  "billing_upgrade",
  "profile_completion",
  "integration_setup",
];

// Helper function to validate URL is from application domain (prevents open redirect)
function isValidApplicationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const allowedHostname = new URL(baseUrl).hostname;

    // Allow exact match or localhost for development
    return (
      parsed.hostname === allowedHostname || parsed.hostname === "localhost"
    );
  } catch {
    return false;
  }
}

// Schema for tracking action start
const trackStartSchema = z.object({
  actionType: z.enum(validActionTypes as [string, ...string[]]),
  context: z.record(z.unknown()).optional().default({}),
  resumeUrl: z
    .string()
    .url()
    .refine(isValidApplicationUrl, {
      message: "Resume URL must be from the application domain",
    })
    .optional(),
});

// Schema for tracking action completion
const trackCompleteSchema = z.object({
  actionType: z.enum(validActionTypes as [string, ...string[]]),
});

// Schema for updating action context
const updateContextSchema = z.object({
  actionType: z.enum(validActionTypes as [string, ...string[]]),
  context: z.record(z.unknown()),
});

/**
 * POST /api/abandoned-actions/track
 *
 * Track abandoned action events from the client.
 *
 * Body parameters:
 * - action: "start" | "complete" | "update_context"
 * - actionType: One of the valid action types
 * - context: (optional) JSON object with action context
 * - resumeUrl: (optional) URL to resume the action
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: "User organization not found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const action = body.action as string;

    if (!action || !["start", "complete", "update_context"].includes(action)) {
      return NextResponse.json(
        {
          error:
            'Invalid action. Must be one of: "start", "complete", "update_context"',
        },
        { status: 400 }
      );
    }

    switch (action) {
      case "start": {
        const parsed = trackStartSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: parsed.error.errors[0]?.message || "Validation failed" },
            { status: 400 }
          );
        }

        const result = await trackActionStarted(
          user.id,
          userData.organization_id,
          parsed.data.actionType as AbandonedActionType,
          parsed.data.context,
          parsed.data.resumeUrl
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          actionId: result.actionId,
          message: "Action tracking started",
        });
      }

      case "complete": {
        const parsed = trackCompleteSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: parsed.error.errors[0]?.message || "Validation failed" },
            { status: 400 }
          );
        }

        const result = await trackActionCompleted(
          user.id,
          parsed.data.actionType as AbandonedActionType
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: "Action marked as completed",
        });
      }

      case "update_context": {
        const parsed = updateContextSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: parsed.error.errors[0]?.message || "Validation failed" },
            { status: 400 }
          );
        }

        const result = await updateActionContext(
          user.id,
          parsed.data.actionType as AbandonedActionType,
          parsed.data.context
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          actionId: result.actionId,
          message: "Action context updated",
        });
      }
    }
  } catch (error) {
    console.error("Abandoned action tracking error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/abandoned-actions/track
 *
 * Health check endpoint for the abandoned action tracking API.
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    endpoint: "abandoned-actions/track",
    description: "Abandoned action tracking API",
    supportedActions: ["start", "complete", "update_context"],
    actionTypes: validActionTypes,
    timestamp: new Date().toISOString(),
  });
}
