"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthedContext } from "./actions";
import type { ActionResult, ExportFormat, RenderResult } from "./types";

const STORAGE_BUCKET = "social-graphics";

export async function uploadRenderedGraphic(input: {
  graphicId: string;
  imageBase64: string;
  format: ExportFormat;
  width: number;
  height: number;
}): Promise<ActionResult<RenderResult>> {
  const auth = await getAuthedContext();
  if (!auth.success) return auth;

  const { organizationId: orgId } = auth.data;
  const supabase = createAdminClient();

  // Verify graphic belongs to the user's organization
  const { data: graphic, error: fetchErr } = await supabase
    .from("social_proof_graphics")
    .select("id")
    .eq("id", input.graphicId)
    .eq("organization_id", orgId)
    .single();

  if (fetchErr || !graphic) {
    return { success: false, error: "Graphic not found" };
  }

  // Update status to rendering
  await supabase
    .from("social_proof_graphics")
    .update({ render_status: "rendering" })
    .eq("id", input.graphicId)
    .eq("organization_id", orgId);

  try {
    // Decode base64 and upload to storage
    const base64Data = input.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filePath = `${orgId}/${input.graphicId}.${input.format}`;
    const contentType = input.format === "jpg" ? "image/jpeg" : `image/${input.format}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (uploadError) {
      await supabase
        .from("social_proof_graphics")
        .update({ render_status: "failed" })
        .eq("id", input.graphicId)
        .eq("organization_id", orgId);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    // Update graphic with render URL and status
    await supabase
      .from("social_proof_graphics")
      .update({
        render_url: urlData.publicUrl,
        render_status: "complete",
      })
      .eq("id", input.graphicId)
      .eq("organization_id", orgId);

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
        format: input.format,
        width: input.width,
        height: input.height,
      },
    };
  } catch (err) {
    await supabase
      .from("social_proof_graphics")
      .update({ render_status: "failed" })
      .eq("id", input.graphicId)
      .eq("organization_id", orgId);
    return { success: false, error: err instanceof Error ? err.message : "Render failed" };
  }
}

export async function getRenderStatus(
  graphicId: string
): Promise<ActionResult<{ status: string; url: string | null }>> {
  const auth = await getAuthedContext();
  if (!auth.success) return auth;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_proof_graphics")
    .select("render_status, render_url")
    .eq("id", graphicId)
    .eq("organization_id", auth.data.organizationId)
    .single();

  if (error) return { success: false, error: error.message };
  return {
    success: true,
    data: { status: data.render_status ?? "pending", url: data.render_url },
  };
}

export async function getDownloadUrl(
  graphicId: string
): Promise<ActionResult<{ url: string; filename: string }>> {
  const auth = await getAuthedContext();
  if (!auth.success) return auth;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_proof_graphics")
    .select("name, render_url, render_status")
    .eq("id", graphicId)
    .eq("organization_id", auth.data.organizationId)
    .single();

  if (error) return { success: false, error: error.message };
  if (data.render_status !== "complete" || !data.render_url) {
    return { success: false, error: "Graphic not yet rendered" };
  }

  const ext = data.render_url.split(".").pop() ?? "png";
  const safeName = (data.name ?? "graphic").replace(/[^a-zA-Z0-9-_ ]/g, "").trim();
  return {
    success: true,
    data: { url: data.render_url, filename: `${safeName}.${ext}` },
  };
}
