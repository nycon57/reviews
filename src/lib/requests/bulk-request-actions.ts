"use server";

import { z } from "zod";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { createSurveyAndQueue } from "@/lib/distribution/actions";
import { sendSmsReviewRequest } from "@/lib/sms/send/actions";
import {
  createVideoTestimonialRequest,
  type CreateVideoTestimonialRequestInput,
} from "@/lib/video-testimonials/actions";
import { toE164 } from "@/lib/sms/phone-utils";
import { revalidatePath } from "next/cache";
import {
  MAX_REQUEST_IMPORT_ROWS,
  smsPlaceholderEmail,
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
  templateId: string
): Promise<ActionResult<BulkSendResult>> {
  return processBulkRows(rows, async (row, _i, userId) => {
    if (!row.email) return { success: false, error: "Missing email" };
    return createSurveyAndQueue({
      loanOfficerId: userId,
      templateId,
      customerName: row.name,
      customerEmail: row.email,
      sendImmediately: true,
    });
  });
}

// ── Bulk Send: Text Review via SMS ───────────────────────────────────

export async function bulkSendTextReviewsViaSms(
  rows: ParsedRequestRow[],
  templateId: string
): Promise<ActionResult<BulkSendResult>> {
  return processBulkRows(rows, async (row, _i, userId) => {
    if (!row.phone) return { success: false, error: "Missing phone" };
    return sendSmsReviewRequest({
      borrowerName: row.name,
      borrowerPhone: row.phone,
      loanOfficerId: userId,
      templateId,
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

// ── Bulk Send: Video Request via SMS ─────────────────────────────────
// Creates video request (sendImmediately: false to suppress email),
// then sends SMS with the request URL

export async function bulkSendVideoRequestsViaSms(
  rows: ParsedRequestRow[],
  templateId: string
): Promise<ActionResult<BulkSendResult>> {
  return processBulkRows(rows, async (row, _i, userId) => {
    if (!row.phone) return { success: false, error: "Missing phone" };

    const phoneE164 = toE164(row.phone);
    if (!phoneE164) return { success: false, error: "Invalid phone number" };

    const input: CreateVideoTestimonialRequestInput = {
      loanOfficerId: userId,
      customerName: row.name,
      customerEmail: row.email || smsPlaceholderEmail(phoneE164),
      customerPhone: row.phone,
      sendImmediately: false,
      maxDurationSeconds: 120,
    };

    const videoResult = await createVideoTestimonialRequest(input);
    if (!videoResult.success) {
      return { success: false, error: videoResult.error || "Failed to create video request" };
    }

    const smsResult = await sendSmsReviewRequest({
      borrowerName: row.name,
      borrowerPhone: row.phone,
      loanOfficerId: userId,
      templateId,
    });

    if (!smsResult.success) {
      // TODO: Clean up orphaned video request (created above) — either delete it
      // or mark it with a status so it can be retried/reconciled later.
      console.error(
        "[bulkSendVideoRequestsViaSms] SMS failed after video request created",
        {
          userId,
          phoneLast4: row.phone ? `****${row.phone.slice(-4)}` : undefined,
          smsError: smsResult.error,
        }
      );
      return {
        success: false,
        error: `Video request created but SMS delivery failed: ${smsResult.error || "Unknown SMS error"}`,
      };
    }

    return smsResult;
  });
}
