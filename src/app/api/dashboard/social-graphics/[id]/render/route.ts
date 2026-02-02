import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { uploadRenderedGraphic } from "@/lib/social-graphics/render-actions";

const renderSchema = z.object({
  imageBase64: z.string().min(1),
  format: z.enum(["png", "jpg", "webp"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = renderSchema.parse(body);

    const result = await uploadRenderedGraphic({
      graphicId: id,
      imageBase64: parsed.imageBase64,
      format: parsed.format,
      width: parsed.width,
      height: parsed.height,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
