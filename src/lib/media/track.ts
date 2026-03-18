import { createAdminClient } from "@/lib/supabase/admin";
import type { MediaCategory } from "./actions";

/** Bypass strict table name check — media_assets not yet in generated types */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mediaTable(supabase: ReturnType<typeof createAdminClient>): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from as any)("media_assets");
}

/**
 * Track an uploaded image in the media_assets table.
 * Call this after any successful image upload (org branding, user profile, etc.)
 * so the asset appears in the Media Library.
 *
 * Best-effort: swallows errors to avoid breaking the primary upload flow.
 */
export async function trackMediaAsset(opts: {
  organizationId: string;
  uploadedBy: string;
  filename: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  category: MediaCategory;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await mediaTable(supabase).insert({
      organization_id: opts.organizationId,
      uploaded_by: opts.uploadedBy,
      filename: opts.filename,
      url: opts.url,
      content_type: opts.contentType,
      size_bytes: opts.sizeBytes,
      category: opts.category,
    });
    if (error) {
      console.error("[trackMediaAsset] Insert failed:", error.message);
    }
  } catch (err) {
    // Best-effort — don't break the upload flow if tracking fails
    console.error("[trackMediaAsset] Unexpected error:", err);
  }
}
