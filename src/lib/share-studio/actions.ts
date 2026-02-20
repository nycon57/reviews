"use server";

import { revalidatePath } from "next/cache";
import { unifiedGetUser } from "@/lib/auth/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  createProofItem,
  createSmartLink,
  publishProofItem,
} from "@/lib/share-studio/service";

interface ShareResult {
  success: boolean;
  slug?: string;
  url?: string;
  error?: string;
}

/**
 * One-click share: creates a proof item + smart link + publishes, all in one call.
 * Idempotent — if a published proof link already exists for this review, returns it.
 */
export async function shareReviewAsSmartLink(
  reviewId: string
): Promise<ShareResult> {
  const user = await unifiedGetUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = createUntypedAdminClient();

  // Get user profile for org_id + CTA settings
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("organization_id, cta_button_url, personal_website_url")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Could not load user profile" };
  }

  const orgId = profile.organization_id as string;
  const destinationUrl =
    (profile.cta_button_url as string | null) ??
    (profile.personal_website_url as string | null) ??
    undefined;

  // Idempotency: check if a proof item already exists for this review
  const { data: existingItem } = await supabase
    .from("proof_items")
    .select("id")
    .eq("organization_id", orgId)
    .eq("source_type", "review")
    .eq("source_id", reviewId)
    .limit(1)
    .maybeSingle();

  if (existingItem) {
    // Check for any existing link (published or not)
    const { data: existingLink } = await supabase
      .from("proof_links")
      .select("slug, published")
      .eq("proof_item_id", existingItem.id)
      .limit(1)
      .maybeSingle();

    if (existingLink) {
      if (existingLink.published) {
        return {
          success: true,
          slug: existingLink.slug as string,
          url: `/s/${existingLink.slug}`,
        };
      }

      // Link exists but unpublished — publish it and return
      try {
        await publishProofItem(orgId, existingItem.id as string, user.id);
        revalidatePath("/dashboard/share-studio");
        return {
          success: true,
          slug: existingLink.slug as string,
          url: `/s/${existingLink.slug}`,
        };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to publish existing link",
        };
      }
    }

    // Item exists but no link — create link and publish using existing item
    try {
      const link = await createSmartLink({
        organizationId: orgId,
        proofItemId: existingItem.id as string,
        destinationUrl,
        createdBy: user.id,
      });

      const slug = link.slug as string;
      await publishProofItem(orgId, existingItem.id as string, user.id);
      revalidatePath("/dashboard/share-studio");
      return { success: true, slug, url: `/s/${slug}` };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create smart link",
      };
    }
  }

  try {
    // 1. Create proof item (auto-approved)
    const item = await createProofItem({
      organizationId: orgId,
      createdBy: user.id,
      source: { review_id: reviewId },
    });

    const itemId = item.id as string;

    // 2. Create smart link
    const link = await createSmartLink({
      organizationId: orgId,
      proofItemId: itemId,
      destinationUrl,
      createdBy: user.id,
    });

    const slug = link.slug as string;

    // 3. Publish (sets published=true on link)
    await publishProofItem(orgId, itemId, user.id);

    revalidatePath("/dashboard/share-studio");

    return { success: true, slug, url: `/s/${slug}` };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create smart link",
    };
  }
}

interface SmartLinkSettings {
  ctaButtonUrl: string | null;
  ctaButtonText: string | null;
}

export async function getSmartLinkSettings(): Promise<SmartLinkSettings | null> {
  const user = await unifiedGetUser();
  if (!user) return null;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .select("cta_button_url, cta_button_text")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return {
    ctaButtonUrl: data.cta_button_url,
    ctaButtonText: data.cta_button_text,
  };
}

interface SettingsResult {
  success: boolean;
  error?: string;
}

export async function updateSmartLinkSettings(
  ctaButtonUrl: string | null,
  ctaButtonText: string | null
): Promise<SettingsResult> {
  const user = await unifiedGetUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({
      cta_button_url: ctaButtonUrl || null,
      cta_button_text: ctaButtonText || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
