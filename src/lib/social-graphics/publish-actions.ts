"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { getAuthedContext } from "./actions";
import { requireCronSecretRequest } from "@/lib/auth/server-action-guards";
import type { ActionResult, SocialConnection, SocialPost } from "./types";

const GRAPHICS_PATH = "/dashboard/social-graphics";

function socialDb() {
  return createUntypedAdminClient();
}

const POST_FIELDS =
  "id, platform, status, caption, platform_post_url, error_message, scheduled_for, published_at, created_at";

export async function getSocialConnections(): Promise<ActionResult<SocialConnection[]>> {
  const auth = await getAuthedContext();
  if (!auth.success) return auth;

  const db = socialDb();
  const { data, error } = await db
    .from("social_connections")
    .select("id, platform, account_name, is_active")
    .eq("organization_id", auth.data.organizationId)
    .eq("is_active", true);

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as SocialConnection[] };
}

export async function publishToSocial(input: {
  graphicId: string;
  platforms: string[];
  caption: string;
}): Promise<ActionResult<SocialPost[]>> {
  const auth = await getAuthedContext();
  if (!auth.success) return auth;

  if (input.platforms.length === 0) {
    return { success: false, error: "At least one platform is required" };
  }

  // Verify graphic belongs to the user's org and is rendered
  const supabase = createAdminClient();
  const { data: graphic, error: gErr } = await supabase
    .from("social_proof_graphics")
    .select("render_url, render_status")
    .eq("id", input.graphicId)
    .eq("organization_id", auth.data.organizationId)
    .single();

  if (gErr || !graphic?.render_url || graphic.render_status !== "complete") {
    return { success: false, error: "Graphic must be rendered before publishing" };
  }

  const db = socialDb();
  const posts: SocialPost[] = [];

  for (const platform of input.platforms) {
    const { data: post, error } = await db
      .from("social_posts")
      .insert({
        organization_id: auth.data.organizationId,
        graphic_id: input.graphicId,
        platform,
        caption: input.caption,
        image_url: graphic.render_url,
        status: "published",
        published_at: new Date().toISOString(),
        created_by: auth.data.userId,
      })
      .select(POST_FIELDS)
      .single();

    if (error) {
      posts.push({
        id: crypto.randomUUID(),
        platform,
        status: "failed",
        caption: input.caption,
        platform_post_url: null,
        error_message: error.message,
        scheduled_for: null,
        published_at: null,
        created_at: new Date().toISOString(),
      } as SocialPost);
    } else if (post) {
      posts.push(post as SocialPost);
    }
  }

  revalidatePath(GRAPHICS_PATH);
  return { success: true, data: posts };
}

export async function schedulePost(input: {
  graphicId: string;
  platforms: string[];
  caption: string;
  scheduledFor: string;
}): Promise<ActionResult<SocialPost[]>> {
  const auth = await getAuthedContext();
  if (!auth.success) return auth;

  // Validate scheduled time is in the future
  const scheduledDate = new Date(input.scheduledFor);
  if (isNaN(scheduledDate.getTime())) {
    return { success: false, error: "Invalid date format" };
  }
  if (scheduledDate.getTime() <= Date.now()) {
    return { success: false, error: "Scheduled time must be in the future" };
  }

  if (input.platforms.length === 0) {
    return { success: false, error: "At least one platform is required" };
  }

  // Verify graphic belongs to user's org and is rendered
  const supabase = createAdminClient();
  const { data: graphic, error: gErr } = await supabase
    .from("social_proof_graphics")
    .select("render_url, render_status")
    .eq("id", input.graphicId)
    .eq("organization_id", auth.data.organizationId)
    .single();

  if (gErr || !graphic?.render_url || graphic.render_status !== "complete") {
    return { success: false, error: "Graphic must be rendered before scheduling" };
  }

  const db = socialDb();
  const posts: SocialPost[] = [];

  for (const platform of input.platforms) {
    const { data: post, error } = await db
      .from("social_posts")
      .insert({
        organization_id: auth.data.organizationId,
        graphic_id: input.graphicId,
        platform,
        caption: input.caption,
        image_url: graphic.render_url,
        status: "scheduled",
        scheduled_for: scheduledDate.toISOString(),
        created_by: auth.data.userId,
      })
      .select(POST_FIELDS)
      .single();

    if (error) return { success: false, error: error.message };
    if (post) posts.push(post as SocialPost);
  }

  revalidatePath(GRAPHICS_PATH);
  return { success: true, data: posts };
}

export async function getPostHistory(input?: {
  graphicId?: string;
}): Promise<ActionResult<SocialPost[]>> {
  const auth = await getAuthedContext();
  if (!auth.success) return auth;

  const db = socialDb();
  let query = db
    .from("social_posts")
    .select(POST_FIELDS)
    .eq("organization_id", auth.data.organizationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (input?.graphicId) {
    query = query.eq("graphic_id", input.graphicId);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as SocialPost[] };
}

export async function retryPost(postId: string): Promise<ActionResult<SocialPost>> {
  const auth = await getAuthedContext();
  if (!auth.success) return auth;

  const db = socialDb();

  // Verify the post belongs to the user's org and is in a failed state
  const { data: existingPost, error: fetchErr } = await db
    .from("social_posts")
    .select("id, status")
    .eq("id", postId)
    .eq("organization_id", auth.data.organizationId)
    .single();

  if (fetchErr || !existingPost) {
    return { success: false, error: "Post not found" };
  }

  if (existingPost.status !== "failed") {
    return { success: false, error: "Only failed posts can be retried" };
  }

  const { data, error } = await db
    .from("social_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", postId)
    .eq("organization_id", auth.data.organizationId)
    .select(POST_FIELDS)
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(GRAPHICS_PATH);
  return { success: true, data: data as SocialPost };
}

export async function executeScheduledPosts(): Promise<ActionResult<number>> {
  try {
    await requireCronSecretRequest();
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const db = socialDb();
  const now = new Date().toISOString();

  const { data: duePosts, error } = await db
    .from("social_posts")
    .select("id, platform, caption, image_url, organization_id")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .limit(100);

  if (error) return { success: false, error: error.message };
  if (!duePosts || duePosts.length === 0) return { success: true, data: 0 };

  let published = 0;
  for (const post of duePosts) {
    const { error: updateErr } = await db
      .from("social_posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    if (!updateErr) published++;
  }

  return { success: true, data: published };
}
