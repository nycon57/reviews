/**
 * Send-time A/B resolution.
 *
 * The A/B admin surface lets an org run subject-line tests and apply a winner.
 * This module is the single point the send path consults so those two things
 * actually influence outgoing mail:
 *
 *   1. Running test — if an active subject_line/preview_text test exists for
 *      (org, email_type), assign a variant (weighted split, via the existing
 *      `assign_ab_test_variant` RPC), use its copy, and return the ab_test
 *      stamps so the send can record them on email_logs. The aggregation trigger
 *      on email_logs then fills email_ab_test_results — the test collects data.
 *   2. Applied winner — otherwise, if a winner was applied
 *      (`email_type_overrides`, written by applyWinnerToFuture), use that copy.
 *   3. Neither — return the caller's defaults unchanged.
 *
 * Everything is best-effort: any lookup failure (including the tables/columns
 * not existing yet) degrades to the caller's defaults. Email delivery must never
 * be blocked by the A/B layer.
 */

import type { EmailTemplate } from "@/lib/email/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedClient = import("@supabase/supabase-js").SupabaseClient<any, any, any>;

interface VariantCopy {
  id: string;
  subjectLine?: string;
  previewText?: string;
}

export interface EmailTypeSendResolution {
  /** Effective subject line to send (defaults through unchanged when no A/B match). */
  subject: string;
  /** Effective preview/preheader text, when overridden. */
  previewText?: string;
  /** Set when a running test assigned this send a variant — stamp on email_logs. */
  abTestId?: string;
  abTestVariant?: string;
}

interface ResolveInput {
  organizationId?: string | null;
  emailType?: EmailTemplate | null;
  subject: string;
  previewText?: string;
}

interface ResolutionPatch {
  subjectLine?: string | null;
  previewText?: string | null;
  abTestId?: string;
  abTestVariant?: string;
}

export type EmailTypeSendResolver = (
  supabase: UntypedClient,
  input: ResolveInput
) => Promise<EmailTypeSendResolution>;

/** Test types whose winning copy this choke point can inject at send time. */
const SUPPORTED_TEST_TYPES = ["subject_line", "preview_text"] as const;

/**
 * Read the applied-winner override (email_type_overrides) for an email type.
 * Returns null when there is no override or the store is unavailable.
 */
export async function resolveEmailTypeOverride(
  supabase: UntypedClient,
  organizationId: string,
  emailType: EmailTemplate
): Promise<{ subjectLine: string | null; previewText: string | null } | null> {
  const { data, error } = await supabase
    .from("email_type_overrides")
    .select("subject_line, preview_text")
    .eq("organization_id", organizationId)
    .eq("email_type", emailType)
    .maybeSingle();

  if (error || !data) return null;
  return {
    subjectLine: (data.subject_line as string | null) ?? null,
    previewText: (data.preview_text as string | null) ?? null,
  };
}

/**
 * Assign a variant from an active subject-line/preview-text test for this email
 * type, if one is running. Returns the variant's copy + ids to stamp, or null.
 */
export async function assignRunningTestVariant(
  supabase: UntypedClient,
  organizationId: string,
  emailType: EmailTemplate
): Promise<{
  abTestId: string;
  variant: string;
  subjectLine: string | null;
  previewText: string | null;
} | null> {
  const { data: test, error } = await supabase
    .from("email_ab_tests")
    .select("id, variants, test_type")
    .eq("organization_id", organizationId)
    .eq("email_type", emailType)
    .eq("status", "active")
    .in("test_type", [...SUPPORTED_TEST_TYPES])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !test) return null;

  const { data: variantId, error: rpcError } = await supabase.rpc(
    "assign_ab_test_variant",
    { p_ab_test_id: test.id }
  );
  if (rpcError || !variantId) return null;

  const variants = (test.variants as VariantCopy[] | null) ?? [];
  const variant = variants.find((v) => v.id === variantId);

  return {
    abTestId: test.id as string,
    variant: variantId as string,
    subjectLine: variant?.subjectLine?.trim() || null,
    previewText: variant?.previewText?.trim() || null,
  };
}

async function resolveEmailTypePatch(
  supabase: UntypedClient,
  organizationId: string,
  emailType: EmailTemplate
): Promise<ResolutionPatch> {
  try {
    const assignment = await assignRunningTestVariant(
      supabase,
      organizationId,
      emailType
    );
    if (assignment) {
      return {
        subjectLine: assignment.subjectLine,
        previewText: assignment.previewText,
        abTestId: assignment.abTestId,
        abTestVariant: assignment.variant,
      };
    }

    const override = await resolveEmailTypeOverride(
      supabase,
      organizationId,
      emailType
    );
    if (override) {
      return {
        subjectLine: override.subjectLine,
        previewText: override.previewText,
      };
    }
  } catch (err) {
    console.error("resolveEmailTypeSend failed; using defaults:", err);
  }

  return {};
}

function applyResolutionPatch(
  { subject, previewText }: ResolveInput,
  patch: ResolutionPatch
): EmailTypeSendResolution {
  return {
    subject: patch.subjectLine ?? subject,
    previewText: patch.previewText ?? previewText,
    abTestId: patch.abTestId,
    abTestVariant: patch.abTestVariant,
  };
}

/**
 * Resolve the effective subject/preview for a send, applying (in priority order)
 * a running test assignment, then an applied winner override, then the caller's
 * defaults. Never throws — any failure returns the defaults.
 */
export async function resolveEmailTypeSend(
  supabase: UntypedClient,
  { organizationId, emailType, subject, previewText }: ResolveInput
): Promise<EmailTypeSendResolution> {
  if (!organizationId || !emailType) {
    return { subject, previewText };
  }

  const patch = await resolveEmailTypePatch(supabase, organizationId, emailType);
  return applyResolutionPatch({ organizationId, emailType, subject, previewText }, patch);
}

/**
 * Create a per-invocation resolver for batch processors. It memoizes the
 * A/B lookup/assignment by organization + email template for this drain only.
 */
export function createEmailTypeSendResolver(): EmailTypeSendResolver {
  const cache = new Map<string, Promise<ResolutionPatch>>();

  return async (supabase, input) => {
    const { organizationId, emailType, subject, previewText } = input;
    if (!organizationId || !emailType) {
      return { subject, previewText };
    }

    const key = `${organizationId}\0${emailType}`;
    let patchPromise = cache.get(key);
    if (!patchPromise) {
      patchPromise = resolveEmailTypePatch(supabase, organizationId, emailType);
      cache.set(key, patchPromise);
    }

    const patch = await patchPromise;
    return applyResolutionPatch(input, patch);
  };
}
