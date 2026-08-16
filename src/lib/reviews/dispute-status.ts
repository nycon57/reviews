"use server";

import { unifiedGetUser } from "@/lib/auth/actions";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import type { ReviewFlagReason } from "./types";

export type MyDisputeStatusValue = "open" | "upheld" | "dismissed";

export interface MyDisputeStatus {
  flagId: string;
  reviewId: string;
  status: MyDisputeStatusValue;
  reason: ReviewFlagReason | "other";
  details: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface MyDisputeStatusRow {
  id: string;
  review_id: string;
  status: string;
  reason: string;
  details: string | null;
  resolution_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapDisputeStatus(status: string): MyDisputeStatusValue {
  if (status === "actioned") return "upheld";
  if (status === "dismissed") return "dismissed";
  return "open";
}

export async function getMyDisputeStatus(
  reviewId: string
): Promise<MyDisputeStatus | null> {
  if (!UUID_PATTERN.test(reviewId)) {
    return null;
  }

  const user = await unifiedGetUser();
  if (!user) {
    return null;
  }

  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("review_flags")
    .select(
      "id, review_id, status, reason, details, resolution_note, reviewed_at, created_at"
    )
    .eq("review_id", reviewId)
    .eq("flagged_by_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching reporter dispute status:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as MyDisputeStatusRow;
  return {
    flagId: row.id,
    reviewId: row.review_id,
    status: mapDisputeStatus(row.status),
    reason: row.reason as ReviewFlagReason | "other",
    details: row.details,
    resolutionNote: row.resolution_note,
    resolvedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}
