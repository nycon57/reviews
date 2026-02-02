"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type {
  ActionResult,
  SocialProofGraphic,
  CanvasSize,
  CanvasElement,
} from "./types";
import type { Json } from "@/types/database.types";

const GRAPHICS_PATH = "/dashboard/social-graphics";

// ── Auth Helper ──────────────────────────────────────────────────────────

interface AuthedContext {
  userId: string;
  organizationId: string;
  role: string;
}

async function getAuthedContext(): Promise<ActionResult<AuthedContext>> {
  const user = await unifiedGetUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = createAdminClient();
  const { data: userData, error } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (error || !userData?.organization_id) {
    return { success: false, error: "User not found or missing organization" };
  }

  return {
    success: true,
    data: {
      userId: user.id,
      organizationId: userData.organization_id,
      role: userData.role ?? "user",
    },
  };
}

// ── CRUD Actions ─────────────────────────────────────────────────────────

export async function getGraphics(): Promise<
  ActionResult<SocialProofGraphic[]>
> {
  const ctx = await getAuthedContext();
  if (!ctx.success) return ctx;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_proof_graphics")
    .select("*")
    .eq("organization_id", ctx.data.organizationId)
    .order("updated_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function getGraphic(
  id: string
): Promise<ActionResult<SocialProofGraphic>> {
  const ctx = await getAuthedContext();
  if (!ctx.success) return ctx;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_proof_graphics")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.data.organizationId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function createGraphic(params: {
  name: string;
  canvasSize: CanvasSize;
  elements: CanvasElement[];
  templateId?: string;
  reviewIds?: string[];
}): Promise<ActionResult<SocialProofGraphic>> {
  const ctx = await getAuthedContext();
  if (!ctx.success) return ctx;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("social_proof_graphics")
    .insert({
      organization_id: ctx.data.organizationId,
      created_by: ctx.data.userId,
      name: params.name,
      canvas_size: params.canvasSize as unknown as Json,
      elements: params.elements as unknown as Json,
      template_id: params.templateId ?? null,
      review_ids: params.reviewIds ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(GRAPHICS_PATH);
  return { success: true, data };
}

export async function updateGraphic(
  id: string,
  params: {
    name?: string;
    canvasSize?: CanvasSize;
    elements?: CanvasElement[];
    scheduleCron?: string | null;
    templateId?: string | null;
  }
): Promise<ActionResult<SocialProofGraphic>> {
  const ctx = await getAuthedContext();
  if (!ctx.success) return ctx;

  const supabase = createAdminClient();
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.name !== undefined) updateData.name = params.name;
  if (params.canvasSize !== undefined)
    updateData.canvas_size = params.canvasSize as unknown as Json;
  if (params.elements !== undefined)
    updateData.elements = params.elements as unknown as Json;
  if (params.scheduleCron !== undefined)
    updateData.schedule_cron = params.scheduleCron;
  if (params.templateId !== undefined)
    updateData.template_id = params.templateId;

  const { data, error } = await supabase
    .from("social_proof_graphics")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", ctx.data.organizationId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(GRAPHICS_PATH);
  revalidatePath(`${GRAPHICS_PATH}/${id}`);
  return { success: true, data };
}

export async function deleteGraphic(
  id: string
): Promise<ActionResult<void>> {
  const ctx = await getAuthedContext();
  if (!ctx.success) return ctx;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("social_proof_graphics")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.data.organizationId);

  if (error) return { success: false, error: error.message };

  revalidatePath(GRAPHICS_PATH);
  return { success: true, data: undefined };
}

export async function duplicateGraphic(
  id: string
): Promise<ActionResult<SocialProofGraphic>> {
  const ctx = await getAuthedContext();
  if (!ctx.success) return ctx;

  const supabase = createAdminClient();
  const { data: original, error: fetchError } = await supabase
    .from("social_proof_graphics")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.data.organizationId)
    .single();

  if (fetchError || !original) {
    return { success: false, error: "Graphic not found" };
  }

  const { data, error } = await supabase
    .from("social_proof_graphics")
    .insert({
      organization_id: ctx.data.organizationId,
      created_by: ctx.data.userId,
      name: `${original.name} (Copy)`,
      canvas_size: original.canvas_size,
      elements: original.elements,
      template_id: original.template_id,
      review_ids: original.review_ids,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(GRAPHICS_PATH);
  return { success: true, data };
}

// ── Review Fetching ──────────────────────────────────────────────────────

export async function getReviewsForGeneration(params?: {
  reviewIds?: string[];
  minRating?: number;
  limit?: number;
}): Promise<
  ActionResult<
    Array<{
      id: string;
      rating: number;
      text: string | null;
      customer_name: string | null;
      review_date: string;
      source: string;
      user_id: string | null;
    }>
  >
> {
  const ctx = await getAuthedContext();
  if (!ctx.success) return ctx;

  const supabase = createAdminClient();
  let query = supabase
    .from("reviews")
    .select(
      "id, rating, text, customer_name, review_date, source, user_id"
    )
    .eq("organization_id", ctx.data.organizationId)
    .eq("status", "approved");

  if (params?.reviewIds?.length) {
    query = query.in("id", params.reviewIds);
  }
  if (params?.minRating) {
    query = query.gte("rating", params.minRating);
  }

  query = query
    .order("rating", { ascending: false })
    .order("review_date", { ascending: false })
    .limit(params?.limit ?? 50);

  const { data, error } = await query;

  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

/** Get organization name for template population */
export async function getOrgName(): Promise<ActionResult<string>> {
  const ctx = await getAuthedContext();
  if (!ctx.success) return ctx;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", ctx.data.organizationId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data: data?.name ?? "Your Company" };
}
