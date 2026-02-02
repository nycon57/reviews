import { NextRequest, NextResponse } from "next/server";
import { autoGenerateFromReview } from "@/lib/social-graphics/auto-generate";
import { batchGenerateFromReviews } from "@/lib/social-graphics/batch-generate";
import { CANVAS_PRESETS, type TemplateId } from "@/lib/social-graphics/types";
import { z } from "zod";

const autoGenerateSchema = z.object({
  mode: z.literal("auto"),
  reviewId: z.string().uuid(),
  templateId: z
    .enum([
      "five-star-spotlight",
      "monthly-roundup",
      "lo-spotlight",
      "milestone",
      "nps-announcement",
      "before-after",
      "team-excellence",
      "holiday-themed",
    ])
    .optional(),
  canvasWidth: z.number().int().min(100).max(4000).optional(),
  canvasHeight: z.number().int().min(100).max(4000).optional(),
});

const batchGenerateSchema = z.object({
  mode: z.literal("batch"),
  reviewIds: z.array(z.string().uuid()).min(1).max(50),
  templateId: z.enum([
    "five-star-spotlight",
    "monthly-roundup",
    "lo-spotlight",
    "milestone",
    "nps-announcement",
    "before-after",
    "team-excellence",
    "holiday-themed",
  ]),
  canvasWidth: z.number().int().min(100).max(4000).optional(),
  canvasHeight: z.number().int().min(100).max(4000).optional(),
});

const generateSchema = z.discriminatedUnion("mode", [
  autoGenerateSchema,
  batchGenerateSchema,
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateSchema.parse(body);

    const canvasSize = parsed.canvasWidth && parsed.canvasHeight
      ? { width: parsed.canvasWidth, height: parsed.canvasHeight, name: `Custom ${parsed.canvasWidth}x${parsed.canvasHeight}` }
      : CANVAS_PRESETS[0];

    if (parsed.mode === "auto") {
      const result = await autoGenerateFromReview({
        reviewId: parsed.reviewId,
        templateId: parsed.templateId as TemplateId | undefined,
        canvasSize,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ data: result.data }, { status: 201 });
    }

    // Batch mode
    const result = await batchGenerateFromReviews({
      reviewIds: parsed.reviewIds,
      templateId: parsed.templateId as TemplateId,
      canvasSize,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(
      { data: result.data, count: result.data.length },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
