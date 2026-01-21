/**
 * Video Render API Endpoint
 *
 * POST /api/v1/render
 *
 * Triggers video generation for various composition types.
 * Supports async rendering with status polling.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { renderVideo } from "@/lib/remotion/render-service";
import type { RenderRequest } from "@/lib/remotion/types";

// Request validation schemas
const baseSchema = z.object({
  compositionType: z.enum([
    "video-testimonial",
    "text-testimonial",
    "leaderboard-celebration",
    "report-summary",
    "social-clip",
    "video-thumbnail",
  ]),
  format: z.enum(["16:9", "1:1", "9:16"]).default("16:9"),
  organizationId: z.string().uuid(),
});

const videoTestimonialSchema = baseSchema.extend({
  compositionType: z.literal("video-testimonial"),
  videoResponseId: z.string().uuid(),
  template: z.enum(["modern", "minimal", "bold"]).optional(),
});

const textTestimonialSchema = baseSchema.extend({
  compositionType: z.literal("text-testimonial"),
  testimonialId: z.string().uuid(),
  template: z.enum(["modern", "minimal", "bold"]).optional(),
});

const leaderboardCelebrationSchema = baseSchema.extend({
  compositionType: z.literal("leaderboard-celebration"),
  celebrationType: z.enum(["new_leader", "weekly_highlights", "achievement"]),
  leaderboardId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  badgeType: z.string().optional(),
});

const reportSummarySchema = baseSchema.extend({
  compositionType: z.literal("report-summary"),
  reportId: z.string().uuid(),
  period: z.string(),
});

const socialClipSchema = baseSchema.extend({
  compositionType: z.literal("social-clip"),
  clipType: z.enum([
    "testimonial_quote",
    "review_highlight",
    "stat_celebration",
    "team_shoutout",
  ]),
  sourceId: z.string().uuid(),
  sourceType: z.enum(["testimonial", "review", "stat", "team"]),
});

const videoThumbnailSchema = baseSchema.extend({
  compositionType: z.literal("video-thumbnail"),
  videoResponseId: z.string().uuid(),
});

// Combined schema with discriminated union
const renderRequestSchema = z.discriminatedUnion("compositionType", [
  videoTestimonialSchema,
  textTestimonialSchema,
  leaderboardCelebrationSchema,
  reportSummarySchema,
  socialClipSchema,
  videoThumbnailSchema,
]);

/**
 * POST /api/v1/render
 *
 * Trigger video generation
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = renderRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const renderRequest = parseResult.data as RenderRequest;

    // Verify user has access to organization
    const { data: membership, error: membershipError } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("organization_id", renderRequest.organizationId)
      .eq("id", user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Access denied to organization" },
        { status: 403 }
      );
    }

    // Check organization's video generation quota (if applicable)
    const quotaCheck = await checkRenderQuota(renderRequest.organizationId);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: "Video generation quota exceeded",
          remaining: quotaCheck.remaining,
          resetAt: quotaCheck.resetAt,
        },
        { status: 429 }
      );
    }

    // Trigger render (async)
    const result = await renderVideo(renderRequest);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Video generation failed",
          message: result.error,
          jobId: result.jobId,
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        jobId: result.jobId,
        outputUrl: result.outputUrl,
        storagePath: result.storagePath,
        durationSeconds: result.durationSeconds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Render API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/render?jobId=xxx
 *
 * Check render job status
 * Note: generated_videos table not yet implemented
 */
export async function GET(_request: NextRequest) {
  // Note: This endpoint requires the generated_videos table which doesn't exist yet
  // TODO: Create generated_videos table and implement job tracking
  return NextResponse.json(
    { error: "Not implemented - generated_videos table not yet created" },
    { status: 501 }
  );
}

/**
 * Check organization's video generation quota
 * Note: generated_videos table not yet implemented
 */
async function checkRenderQuota(_organizationId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt?: string;
}> {
  // Note: generated_videos table doesn't exist yet
  // TODO: Create generated_videos table and implement quota tracking
  // For now, allow all renders with a generous limit
  const monthlyLimit = 100;

  // Reset at end of month
  const resetAt = new Date();
  resetAt.setDate(1);
  resetAt.setMonth(resetAt.getMonth() + 1);
  resetAt.setHours(0, 0, 0, 0);

  return {
    allowed: true,
    remaining: monthlyLimit,
    resetAt: resetAt.toISOString(),
  };
}
