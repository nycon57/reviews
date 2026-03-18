"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { MEDIA_MAX_SIZE, MEDIA_ALLOWED_TYPES } from "./constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUserContext() {
  const user = await unifiedGetUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!data) throw new Error("User not found");
  return {
    userId: data.id,
    organizationId: data.organization_id as string,
    role: data.role as string,
  };
}

/** Bypass strict table name check — media_assets not yet in generated types */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mediaTable(supabase: ReturnType<typeof createAdminClient>): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from as any)("media_assets");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MediaCategory = "upload" | "brand" | "team" | "location";

export type MediaAsset = {
  id: string;
  organization_id: string;
  uploaded_by: string | null;
  filename: string;
  url: string;
  content_type: string;
  size_bytes: number;
  category: MediaCategory;
  created_at: string;
};

export type MediaItem = {
  label: string;
  url: string;
  type: string;
};

export type MediaLibraryData = {
  brand: MediaItem[];
  team: MediaItem[];
  locations: MediaItem[];
  uploads: MediaAsset[];
};

export type MediaStats = {
  totalAssets: number;
  totalSizeBytes: number;
};

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export async function uploadMediaAsset(
  formData: FormData
): Promise<{ url: string; assetId: string }> {
  const ctx = await getUserContext();
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  if (file.size > MEDIA_MAX_SIZE) throw new Error("File too large (max 5MB)");

  if (!MEDIA_ALLOWED_TYPES.includes(file.type as (typeof MEDIA_ALLOWED_TYPES)[number])) {
    throw new Error("Invalid file type. Allowed: PNG, JPG, GIF, SVG, WebP");
  }

  const ext = file.name.split(".").pop() ?? "png";
  const storagePath = `${ctx.organizationId}/${crypto.randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("media")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("media")
    .getPublicUrl(storagePath);

  const url = urlData.publicUrl;

  const { data: asset, error: insertErr } = await mediaTable(supabase)
    .insert({
      organization_id: ctx.organizationId,
      uploaded_by: ctx.userId,
      filename: file.name,
      url,
      content_type: file.type,
      size_bytes: file.size,
      category: "upload",
    })
    .select("id")
    .single();

  if (insertErr) {
    await supabase.storage.from("media").remove([storagePath]).catch(() => {});
    throw new Error(
      `Failed to track upload: ${(insertErr as { message: string }).message}`
    );
  }

  if (!asset || !(asset as { id: string }).id) {
    await supabase.storage.from("media").remove([storagePath]).catch(() => {});
    throw new Error("Asset record missing after insert");
  }

  return { url, assetId: (asset as { id: string }).id };
}

// ---------------------------------------------------------------------------
// List / Delete
// ---------------------------------------------------------------------------

export async function listMediaAssets(): Promise<MediaAsset[]> {
  const ctx = await getUserContext();
  const supabase = createAdminClient();

  const { data, error } = await mediaTable(supabase)
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .eq("category", "upload")
    .order("created_at", { ascending: false });

  if (error)
    throw new Error(
      `Failed to list assets: ${(error as { message: string }).message}`
    );
  return (data ?? []) as MediaAsset[];
}

export async function deleteMediaAsset(assetId: string): Promise<void> {
  const ctx = await getUserContext();
  const supabase = createAdminClient();

  const { data: asset, error: fetchErr } = await mediaTable(supabase)
    .select("url, uploaded_by")
    .eq("id", assetId)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (fetchErr || !asset) throw new Error("Asset not found");

  const row = asset as { url: string; uploaded_by: string | null };

  const isAdmin = ctx.role === "admin" || ctx.role === "owner";
  if (!isAdmin && row.uploaded_by !== ctx.userId) {
    throw new Error("Not authorized to delete this asset");
  }

  // Try to clean up from both buckets (media + legacy email-assets)
  const mediaMatch = row.url.match(/\/media\/(.+)$/);
  if (mediaMatch) {
    await supabase.storage.from("media").remove([mediaMatch[1]]).catch(() => {});
  }
  const emailMatch = row.url.match(/\/email-assets\/(.+)$/);
  if (emailMatch) {
    await supabase.storage
      .from("email-assets")
      .remove([emailMatch[1]])
      .catch(() => {});
  }

  const { error: delErr } = await mediaTable(supabase)
    .delete()
    .eq("id", assetId)
    .eq("organization_id", ctx.organizationId);

  if (delErr)
    throw new Error(
      `Failed to delete asset: ${(delErr as { message: string }).message}`
    );
}

// ---------------------------------------------------------------------------
// Aggregated library data (brand + team + locations + uploads)
// ---------------------------------------------------------------------------

export async function getMediaLibraryData(): Promise<MediaLibraryData> {
  const ctx = await getUserContext();
  const supabase = createAdminClient();

  const [orgResult, teamResult, branchResult, uploadsResult] =
    await Promise.all([
      // Brand images from organization (only logo_url exists as a column)
      supabase
        .from("organizations")
        .select("name, logo_url")
        .eq("id", ctx.organizationId)
        .single(),

      // Team member images
      supabase
        .from("users")
        .select("full_name, avatar_url, banner_url")
        .eq("organization_id", ctx.organizationId)
        .eq("is_active", true)
        .order("full_name"),

      // Branch / location images
      supabase
        .from("branches")
        .select("name, photo_url, cover_image_url")
        .eq("organization_id", ctx.organizationId)
        .order("name"),

      // Custom uploads only (brand/team/location tracked separately)
      mediaTable(supabase)
        .select("*")
        .eq("organization_id", ctx.organizationId)
        .eq("category", "upload")
        .order("created_at", { ascending: false }),
    ]);

  // Log query errors (non-fatal — degrade gracefully per category)
  if (orgResult.error) {
    console.error("[MediaLibrary] Failed to fetch org data:", orgResult.error.message);
  }
  if (teamResult.error) {
    console.error("[MediaLibrary] Failed to fetch team data:", teamResult.error.message);
  }
  if (branchResult.error) {
    console.error("[MediaLibrary] Failed to fetch branch data:", branchResult.error.message);
  }
  if (uploadsResult.error) {
    console.error("[MediaLibrary] Failed to fetch uploads:", (uploadsResult.error as { message: string }).message);
  }

  // Build brand items
  const brand: MediaItem[] = [];
  const org = orgResult.data as {
    name: string;
    logo_url: string | null;
  } | null;

  if (org?.logo_url)
    brand.push({ label: `${org.name} Logo`, url: org.logo_url, type: "logo" });

  // Build team items
  const team: MediaItem[] = [];
  const users = (teamResult.data ?? []) as {
    full_name: string;
    avatar_url: string | null;
    banner_url: string | null;
  }[];
  for (const u of users) {
    if (u.avatar_url)
      team.push({ label: u.full_name, url: u.avatar_url, type: "avatar" });
    if (u.banner_url)
      team.push({
        label: `${u.full_name} Banner`,
        url: u.banner_url,
        type: "banner",
      });
  }

  // Build location items
  const locations: MediaItem[] = [];
  const branches = (branchResult.data ?? []) as {
    name: string;
    photo_url: string | null;
    cover_image_url: string | null;
  }[];
  for (const b of branches) {
    if (b.photo_url)
      locations.push({ label: b.name, url: b.photo_url, type: "photo" });
    if (b.cover_image_url)
      locations.push({
        label: `${b.name} Cover`,
        url: b.cover_image_url,
        type: "cover",
      });
  }

  return {
    brand,
    team,
    locations,
    uploads: (uploadsResult.data ?? []) as MediaAsset[],
  };
}

// ---------------------------------------------------------------------------
// Stats (for admin footer)
// ---------------------------------------------------------------------------

export async function getMediaStats(): Promise<MediaStats> {
  const ctx = await getUserContext();
  const supabase = createAdminClient();

  const { data, error } = await mediaTable(supabase)
    .select("size_bytes")
    .eq("organization_id", ctx.organizationId);

  if (error) return { totalAssets: 0, totalSizeBytes: 0 };

  const rows = (data ?? []) as { size_bytes: number }[];
  return {
    totalAssets: rows.length,
    totalSizeBytes: rows.reduce((sum, r) => sum + r.size_bytes, 0),
  };
}
