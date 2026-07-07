/**
 * Send-time suppression guard for acquisition sends (ADR 0004).
 *
 * Every acquisition send path (survey invitation/reminder, video
 * invitation/reminder, review→video upsell) must pass the single suppression
 * check before dispatching email. This wraps B1's {@link isSuppressed} with the
 * compliance requirement that a blocked send leaves a durable trace rather than
 * vanishing: on suppression it records a row in `acquisition_send_skips` and
 * returns true so the caller can move the queue item / request to a terminal
 * state instead of sending.
 *
 * Keep the two responsibilities together here so no send path can check
 * suppression without also leaving the audit trace. Uses the untyped admin
 * client (house pattern for the new tables).
 */
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { isSuppressed, type SuppressionChannel } from "@/lib/contacts/actions";
import { sha256Email } from "@/lib/contacts/identity";

export type AcquisitionSendKind =
  | "survey_invitation"
  | "survey_reminder"
  | "video_invitation"
  | "video_reminder"
  | "review_video_upsell";

export interface AcquisitionSendGuardInput {
  organizationId: string;
  email: string;
  /** Defaults to 'email'; kept flexible for when SMS returns (ADR 0005). */
  channel?: SuppressionChannel;
  sendKind: AcquisitionSendKind;
  /** The Contact this send targets, when resolved. */
  contactId?: string | null;
  /** Originating row for the trace, e.g. the survey_distribution_queue item. */
  sourceTable?: string | null;
  sourceId?: string | null;
}

/**
 * Returns true when the send is SUPPRESSED and must be skipped (a skip row has
 * been recorded). Returns false when the send may proceed. Never throws for a
 * missing/garbage email — an unnormalizable address is treated as not
 * suppressed (nothing to match), consistent with {@link isSuppressed}.
 */
export async function guardAcquisitionSend(
  input: AcquisitionSendGuardInput
): Promise<boolean> {
  const channel = input.channel ?? "email";
  const suppressed = await isSuppressed(input.organizationId, input.email, channel);
  if (!suppressed) return false;

  await recordSuppressedSend({ ...input, channel });
  return true;
}

/** Insert one audit row for a suppressed send. Best-effort provenance. */
async function recordSuppressedSend(
  input: AcquisitionSendGuardInput & { channel: SuppressionChannel }
): Promise<void> {
  const supabase = createUntypedAdminClient();
  const { error } = await supabase.from("acquisition_send_skips").insert({
    organization_id: input.organizationId,
    contact_id: input.contactId ?? null,
    email_sha256: sha256Email(input.email),
    channel: input.channel,
    send_kind: input.sendKind,
    source_table: input.sourceTable ?? null,
    source_id: input.sourceId ?? null,
    reason: "suppressed",
  });
  if (error) {
    throw new Error(`guardAcquisitionSend: audit insert failed: ${error.message}`);
  }
}
