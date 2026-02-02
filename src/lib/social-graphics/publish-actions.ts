"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import type { ActionResult, SocialConnection, SocialPost } from "./types";

const GRAPHICS_PATH = "/dashboard/social-graphics";

function socialDb() {
  return createUntypedAdminClient();
}

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

const POST_FIELDS = "id, platform, status, caption, platform_post_url, error_message, scheduled_for, published_at, created_at";

export async function getSocialConnections(): Promise<ActionResult<SocialConnection[]>> {
  const auth = await getAuthedOrgId();
  if (!auth.success) return auth;

  const db = socialDb();
  const { data, error } = await db
    .from("social_connections")
    .select("id, platform, account_name, is_active")
    .eq("organization_id", auth.data.orgId)
    .eq("is_active", true);

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data ?? []) as SocialConnection[] };
}

export async function publishToSocial(input: {
  graphicId: string;
  platforms: string[];
  caption: string;
}): Promise<ActionResult<SocialPost[]>> {
  const auth = await getAuthedOrgId();
  if (!auth.success) return auth;

  // Get the graphic render URL
  const supabase = createAdminClient();
  const { data: graphic, error: gErr } = await supabase
    .from("social_proof_graphics")
    .select("render_url, render_status")
    .eq("id", input.graphicId)
    .single();

  if (gErr || !graphic?.render_url || graphic.render_status !== "complete") {
    return { success: false, error: "Graphic must be rendered before publishing" };
  }

  const db = socialDb();
  const posts: SocialPost[] = [];

  for (const platform of input.platforms) {
    // In production, this would call the platform's API via OAuth tokens
    // For now, create the post record as published (simulated)
    const { data: post, error } = await db
      .from("social_posts")
      .insert({
        organization_id: auth.data.orgId,
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
      // Create as failed if insert fails
      const { data: failedPost } = await db
        .from("social_posts")
        .insert({
          organization_id: auth.data.orgId,
          graphic_id: input.graphicId,
          platform,
          caption: input.caption,
          image_url: graphic.render_url,
          status: "failed",
          error_message: error.message,
          created_by: auth.data.userId,
        })
        .select(POST_FIELDS)
        .single();

      if (failedPost) posts.push(failedPost as SocialPost);
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
  const auth = await getAuthedOrgId();
  if (!auth.success) return auth;

  const supabase = createAdminClient();
  const { data: graphic, error: gErr } = await supabase
    .from("social_proof_graphics")
    .select("render_url, render_status")
    .eq("id", input.graphicId)
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
        organization_id: auth.data.orgId,
        graphic_id: input.graphicId,
        platform,
        caption: input.caption,
        image_url: graphic.render_url,
        status: "scheduled",
        scheduled_for: input.scheduledFor,
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
  const auth = await getAuthedOrgId();
  if (!auth.success) return auth;

  const db = socialDb();
  let query = db
    .from("social_posts")
    .select(POST_FIELDS)
    .eq("organization_id", auth.data.orgId)
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
  const auth = await getAuthedOrgId();
  if (!auth.success) return auth;

  const db = socialDb();

  // In production, would re-call the platform API
  // For now, simulate success on retry
  const { data, error } = await db
    .from("social_posts")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", postId)
    .eq("organization_id", auth.data.orgId)
    .select(POST_FIELDS)
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(GRAPHICS_PATH);
  return { success: true, data: data as SocialPost };
}

export async function executeScheduledPosts(): Promise<ActionResult<number>> {
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
    // In production, would call platform API here
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
