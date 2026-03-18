"use server";

import { z } from "zod";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { createSurveyAndQueue } from "@/lib/distribution/actions";
import {
  createVideoTestimonialRequest,
} from "@/lib/video-testimonials/actions";
import { revalidatePath } from "next/cache";
import {
  MAX_REQUEST_IMPORT_ROWS,
} from "./bulk-request-types";
import type { BulkSendResult, ParsedRequestRow } from "./bulk-request-types";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// ── Validation ───────────────────────────────────────────────────────

const bulkRowSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const bulkInputSchema = z.object({
  rows: z
    .array(bulkRowSchema)
    .min(1, "At least one row is required")
    .max(MAX_REQUEST_IMPORT_ROWS, `Maximum ${MAX_REQUEST_IMPORT_ROWS} rows per batch`),
});

const REVALIDATE_PATH = "/dashboard/reviews";

// ── Shared Bulk Processing ───────────────────────────────────────────

async function getAuthContext() {
  const profile = await unifiedGetUserWithProfile();
  if (!profile?.organization_id) return null;
  return {
    userId: profile.id,
    organizationId: profile.organization_id,
  };
}

async function processBulkRows(
  rows: ParsedRequestRow[],
  processRow: (row: ParsedRequestRow, index: number, userId: string) => Promise<{ success: boolean; error?: string }>
): Promise<ActionResult<BulkSendResult>> {
  const auth = await getAuthContext();
  if (!auth) return { success: false, error: "Not authenticated" };

  const parsed = bulkInputSchema.safeParse({ rows });
  if (!parsed.success)
    return { success: false, error: parsed.error.errors[0].message };

  let totalSent = 0;
  let totalFailed = 0;
  const errors: BulkSendResult["errors"] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = await processRow(rows[i], i, auth.userId);
    if (result.success) {
      totalSent++;
    } else {
      totalFailed++;
      errors.push({ rowIndex: i, error: result.error || "Failed to send" });
    }
  }

  revalidatePath(REVALIDATE_PATH);
  return { success: true, data: { totalSent, totalFailed, errors } };
}

// ── Bulk Send: Text Review via Email ─────────────────────────────────

export async function bulkSendTextReviewsViaEmail(
  rows: ParsedRequestRow[],
  customTemplateId?: string
): Promise<ActionResult<BulkSendResult>> {
  return processBulkRows(rows, async (row, _i, userId) => {
    if (!row.email) return { success: false, error: "Missing email" };
    return createSurveyAndQueue({
      loanOfficerId: userId,
      customerName: row.name,
      customerEmail: row.email,
      sendImmediately: true,
      customTemplateId,
    });
  });
}

// ── Bulk Send: Video Request via Email ───────────────────────────────

export async function bulkSendVideoRequestsViaEmail(
  rows: ParsedRequestRow[]
): Promise<ActionResult<BulkSendResult>> {
  return processBulkRows(rows, async (row, _i, userId) => {
    if (!row.email) return { success: false, error: "Missing email" };
    return createVideoTestimonialRequest({
      loanOfficerId: userId,
      customerName: row.name,
      customerEmail: row.email,
      sendImmediately: true,
      maxDurationSeconds: 120,
    });
  });
}
