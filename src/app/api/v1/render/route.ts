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
      .from("organization_members")
      .select("role")
      .eq("organization_id", renderRequest.organizationId)
      .eq("user_id", user.id)
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
 */
export async function GET(request: NextRequest) {
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

    // Get job ID from query
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID required" },
        { status: 400 }
      );
    }

    // Fetch job from database
    const { data: job, error: jobError } = await supabase
      .from("generated_videos")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Verify user has access to organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", job.organization_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("videos")
      .getPublicUrl(job.storage_path);

    return NextResponse.json({
      id: job.id,
      status: "completed",
      compositionType: job.source_type,
      format: job.format,
      outputUrl: publicUrl,
      storagePath: job.storage_path,
      durationSeconds: job.duration_seconds,
      createdAt: job.created_at,
    });
  } catch (error) {
    console.error("Render status API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Check organization's video generation quota
 */
async function checkRenderQuota(organizationId: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt?: string;
}> {
  // TODO: Implement quota checking based on subscription tier
  // For now, allow all renders with a generous limit

  const supabase = await createClient();

  // Count videos generated this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("generated_videos")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", startOfMonth.toISOString());

  const videosThisMonth = count || 0;
  const monthlyLimit = 100; // Default limit

  // Reset at end of month
  const resetAt = new Date(startOfMonth);
  resetAt.setMonth(resetAt.getMonth() + 1);

  return {
    allowed: videosThisMonth < monthlyLimit,
    remaining: Math.max(0, monthlyLimit - videosThisMonth),
    resetAt: resetAt.toISOString(),
  };
}
