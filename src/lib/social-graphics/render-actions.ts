"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult, ExportFormat, RenderResult } from "./types";

const STORAGE_BUCKET = "social-graphics";

async function getAuthedOrgId(): Promise<ActionResult<{ userId: string; orgId: string }>> {
  const user = await unifiedGetUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (error || !data?.organization_id) {
    return { success: false, error: "User not found" };
  }
  return { success: true, data: { userId: user.id, orgId: data.organization_id } };
}

export async function uploadRenderedGraphic(input: {
  graphicId: string;
  imageBase64: string;
  format: ExportFormat;
  width: number;
  height: number;
}): Promise<ActionResult<RenderResult>> {
  const auth = await getAuthedOrgId();
  if (!auth.success) return auth;

  const { orgId } = auth.data;
  const supabase = createAdminClient();

  // Update status to rendering
  await supabase
    .from("social_proof_graphics")
    .update({ render_status: "rendering" as never })
    .eq("id", input.graphicId);

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
        .update({ render_status: "failed" as never })
        .eq("id", input.graphicId);
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
        render_status: "complete" as never,
      } as never)
      .eq("id", input.graphicId);

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
      .update({ render_status: "failed" as never })
      .eq("id", input.graphicId);
    return { success: false, error: err instanceof Error ? err.message : "Render failed" };
  }
}

export async function getRenderStatus(
  graphicId: string
): Promise<ActionResult<{ status: string; url: string | null }>> {
  const auth = await getAuthedOrgId();
  if (!auth.success) return auth;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_proof_graphics")
    .select("render_status, render_url")
    .eq("id", graphicId)
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
  const auth = await getAuthedOrgId();
  if (!auth.success) return auth;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_proof_graphics")
    .select("name, render_url, render_status")
    .eq("id", graphicId)
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
