/**
 * Asset Kit auto-generation (CONTEXT.md § Asset Generation): queue quote-card
 * images for reviews at/above the org's celebration threshold the moment they
 * go public. Runs post-response via after(); failures never affect the
 * publish itself.
 */

import { after } from "next/server";
import { cache } from "react";
import {
  createUntypedAdminClient,
  type UntypedSupabaseClient,
} from "@/lib/supabase/admin";
import { queueQuoteCardKitForReviews } from "@/lib/share-studio/service";

async function readCelebrationThreshold(
  supabase: UntypedSupabaseClient,
  organizationId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("Error reading celebration threshold, using default:", error);
    return 4;
  }

  const settings = (data as { settings?: unknown } | null)?.settings as {
    videoCelebrationThreshold?: unknown;
  } | null;
  const raw = settings?.videoCelebrationThreshold;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : 4;
}

const getCelebrationThresholdCached = cache(async (organizationId: string) =>
  readCelebrationThreshold(createUntypedAdminClient(), organizationId)
);

export async function getCelebrationThreshold(
  organizationId: string,
  supabase?: UntypedSupabaseClient
): Promise<number> {
  if (supabase) {
    return readCelebrationThreshold(supabase, organizationId);
  }
  return getCelebrationThresholdCached(organizationId);
}

export function queueQuoteCardKitAfterPublish(
  organizationId: string,
  reviewIds: string[],
  actorUserId: string,
  minRating?: number
): void {
  if (!reviewIds.length) return;
  after(async () => {
    try {
      const effectiveMinRating =
        minRating ?? (await getCelebrationThreshold(organizationId));
      await queueQuoteCardKitForReviews({
        organizationId,
        reviewIds,
        actorUserId,
        minRating: effectiveMinRating,
      });
    } catch (err) {
      console.error("Asset kit: quote card queue failed after publish", {
        organizationId,
        reviewIds,
        error: err,
      });
    }
  });
}
