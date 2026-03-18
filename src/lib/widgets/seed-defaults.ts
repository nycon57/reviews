import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";
import type { WidgetType } from "./types";
import { WIDGET_TYPE_LABELS } from "./constants";

const DEFAULT_WIDGETS: { type: WidgetType; name: string }[] = [
  { type: "review_profile", name: WIDGET_TYPE_LABELS.review_profile },
  { type: "review_carousel", name: WIDGET_TYPE_LABELS.review_carousel },
  { type: "star_rating_badge", name: WIDGET_TYPE_LABELS.star_rating_badge },
  { type: "video_testimonial", name: WIDGET_TYPE_LABELS.video_testimonial },
  { type: "review_wall", name: WIDGET_TYPE_LABELS.review_wall },
  { type: "social_proof_banner", name: WIDGET_TYPE_LABELS.social_proof_banner },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Seed default widgets for an organization — one per widget type.
 * Uses admin client so it works during signup before user is fully authenticated.
 */
export async function seedDefaultWidgets(
  organizationId: string,
  userId: string
): Promise<number> {
  const supabase = createAdminClient();

  // Get existing widget types for this org
  const { data: existing, error: existingError } = await supabase
    .from("widget_configs")
    .select("widget_type")
    .eq("organization_id", organizationId);

  if (existingError || !existing) {
    console.error("seedDefaultWidgets: failed to query existing widgets:", existingError?.message);
    return 0;
  }

  const existingTypes = new Set(existing.map((w) => w.widget_type));

  const missing = DEFAULT_WIDGETS.filter((w) => !existingTypes.has(w.type));
  if (missing.length === 0) return 0;

  // Build insert rows
  const rows = missing.map((w) => {
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
    return {
      widget_id: `${slugify(w.name)}-${suffix}`,
      organization_id: organizationId,
      created_by: userId,
      name: w.name,
      widget_type: w.type,
      entity_type: "organization" as const,
      entity_id: null,
      config: {} as unknown as Json,
      allowed_domains: [] as string[],
      enable_structured_data: true,
      structured_data_type: "LocalBusiness",
      status: "active" as const,
      version: 1,
    };
  });

  const { data: inserted, error } = await supabase
    .from("widget_configs")
    .insert(rows)
    .select("id, name, status, config, version, allowed_domains, enable_structured_data, structured_data_type, entity_id");

  if (error) {
    console.error("seedDefaultWidgets insert error:", error.message);
    return 0;
  }

  // Create version snapshots (non-blocking, best-effort)
  if (inserted) {
    const snapshots = inserted.map((w) => ({
      widget_config_id: w.id,
      version: 1,
      config: (w.config ?? {}) as unknown as Json,
      name: w.name,
      status: w.status,
      allowed_domains: w.allowed_domains ?? [],
      enable_structured_data: w.enable_structured_data ?? true,
      structured_data_type: w.structured_data_type ?? "LocalBusiness",
      entity_id: w.entity_id,
      changed_by: userId,
      change_note: "Auto-created default widget",
      change_summary: "Initial version",
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("widget_config_versions")
      .insert(snapshots)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ error: snapErr }: any) => {
        if (snapErr) console.error("Version snapshot batch error:", snapErr.message);
      });
  }

  return inserted?.length ?? 0;
}

/**
 * Lazy entrypoint — only seeds if org has fewer than 9 widget types.
 * Safe to call on every widgets page load (single COUNT query when already seeded).
 */
export async function ensureDefaultWidgets(
  organizationId: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient();

  const { count } = await supabase
    .from("widget_configs")
    .select("widget_type", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if ((count ?? 0) >= DEFAULT_WIDGETS.length) return;

  await seedDefaultWidgets(organizationId, userId);
}
