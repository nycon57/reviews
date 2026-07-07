/**
 * Review Kit recapture email
 *
 * Sweeps high-path video testimonial responses where the customer never
 * clicked a platform passthrough button on the thank-you screen, and emails
 * them their Review Kit: their AI-generated review text plus deep links to
 * Google and Zillow, and their smart link.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getFromAddress, emailConfig } from "@/lib/email/client";
import { sendWithReliability } from "@/lib/email/send-utils";
import { ensureSmartLinkForSource } from "@/lib/share-studio/service";
import { getCelebrationThreshold } from "./public-actions";
import { escapeHtml, validateSafeUrl } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Hours after submission before the recapture email goes out */
export const RECAPTURE_DELAY_HOURS = 4;

/** Responses older than this are no longer recaptured */
export const RECAPTURE_MAX_AGE_DAYS = 14;

/** Maximum responses processed per sweep */
export const RECAPTURE_BATCH_LIMIT = 25;

/**
 * Coarse DB pre-filter floor for the sweep. The authoritative High Path gate is
 * per-organization (getCelebrationThreshold) and runs in the loop below, because
 * one cross-org query can't apply each org's configured threshold. 1 is the
 * lowest valid threshold, so this floor never excludes an eligible response.
 */
const MIN_CELEBRATION_THRESHOLD = 1;

// =============================================================================
// TYPES
// =============================================================================

export interface RecaptureSweepResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface RecaptureCandidate {
  id: string;
  organization_id: string;
  customer_rating: number | null;
  ai_generated_text: string | null;
  video_testimonial_requests: {
    customer_name: string;
    customer_email: string;
  } | null;
  users: {
    id: string;
    full_name: string | null;
    google_place_id: string | null;
    zillow_profile_url: string | null;
  } | null;
  organizations: {
    name: string;
  } | null;
}

// =============================================================================
// HTML HELPERS
// =============================================================================

/** Strip newlines to prevent header injection */
function sanitizeSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, " ").trim();
}

function buildGoogleReviewUrl(placeId: string | null): string | null {
  if (!placeId) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(placeId)) return null;
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

// =============================================================================
// EMAIL TEMPLATE
// =============================================================================

export interface ReviewKitEmailData {
  customerName: string;
  proName: string;
  reviewText: string;
  googleReviewUrl: string | null;
  zillowProfileUrl: string | null;
  smartLinkUrl: string | null;
}

export function getReviewKitRecaptureEmail(data: ReviewKitEmailData): {
  subject: string;
  html: string;
} {
  const safeCustomerFirstName = escapeHtml(
    data.customerName.trim().split(/\s+/)[0] || "there"
  );
  const safeProName = escapeHtml(data.proName);
  const safeReviewText = escapeHtml(data.reviewText).replace(/\n/g, "<br>");
  const googleUrl = validateSafeUrl(data.googleReviewUrl);
  const zillowUrl = validateSafeUrl(data.zillowProfileUrl);
  const smartLinkUrl = validateSafeUrl(data.smartLinkUrl);

  const subject = sanitizeSubject(
    `Your review of ${data.proName}, ready to paste`
  );

  const buttonStyle =
    "display: inline-block; padding: 14px 28px; background-color: #2f3e46; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px; font-size: 15px; margin: 6px 4px;";

  const platformButtons = [
    googleUrl
      ? `<a href="${googleUrl}" style="${buttonStyle}">Post it on Google</a>`
      : "",
    zillowUrl
      ? `<a href="${zillowUrl}" style="${buttonStyle}">Post it on Zillow</a>`
      : "",
  ]
    .filter(Boolean)
    .join("\n          ");

  const platformSection = platformButtons
    ? `
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #52525b;">
          If you have a minute, posting it publicly makes a real difference for ${safeProName}. Copy the text above, tap a button, and paste.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          ${platformButtons}
        </div>`
    : "";

  const smartLinkSection = smartLinkUrl
    ? `
        <p style="margin: 24px 0 0 0; font-size: 14px; color: #71717a;">
          Your video also has its own page if you&rsquo;d rather share that:
          <a href="${smartLinkUrl}" style="color: #52796f;">${smartLinkUrl}</a>
        </p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
            <tr>
              <td style="padding: 40px 32px;">
                <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b;">
                  Hi ${safeCustomerFirstName},
                </h1>
                <p style="margin: 0 0 24px 0; font-size: 16px; color: #52525b;">
                  Thank you again for the kind words you shared about ${safeProName}. We turned them into a written review so posting it takes seconds. These are your words, ready to go.
                </p>
                <div style="background-color: #f8faf9; border-left: 4px solid #84a98c; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
                  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #2f3e46; font-style: italic;">
                    ${safeReviewText}
                  </p>
                </div>
                ${platformSection}
                ${smartLinkSection}
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
                <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                  Sent by RepWell on behalf of ${safeProName}.<br>
                  ${escapeHtml(emailConfig.companyAddress)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}

// =============================================================================
// SWEEP
// =============================================================================

async function isEmailUnsubscribed(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  return !!data;
}

/**
 * Find high-path responses whose customers never used the on-screen
 * passthrough, and email them their Review Kit.
 */
export async function sendVideoReviewRecaptureEmails(
  batchSize: number = RECAPTURE_BATCH_LIMIT
): Promise<RecaptureSweepResult> {
  const supabase = createAdminClient();
  const limit = Math.min(Math.max(batchSize, 1), RECAPTURE_BATCH_LIMIT);

  const now = Date.now();
  const newestEligible = new Date(
    now - RECAPTURE_DELAY_HOURS * 60 * 60 * 1000
  ).toISOString();
  const oldestEligible = new Date(
    now - RECAPTURE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const result: RecaptureSweepResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const { data: candidates, error: queryError } = await supabase
    .from("video_testimonial_responses")
    .select(
      `
      id,
      organization_id,
      customer_rating,
      ai_generated_text,
      video_testimonial_requests!request_id(
        customer_name,
        customer_email
      ),
      users!user_id(
        id,
        full_name,
        google_place_id,
        zillow_profile_url
      ),
      organizations!organization_id(
        name
      )
    `
    )
    .gte("customer_rating", MIN_CELEBRATION_THRESHOLD)
    .is("platform_passthrough_clicked_at", null)
    .is("recapture_email_sent_at", null)
    .lt("created_at", newestEligible)
    .gt("created_at", oldestEligible)
    .eq("transcription_status", "completed")
    .eq("quarantined", false)
    .not("ai_generated_text", "is", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (queryError) {
    result.errors.push(`Sweep query failed: ${queryError.message}`);
    return result;
  }

  const rows = (candidates ?? []) as unknown as RecaptureCandidate[];

  for (const row of rows) {
    result.processed++;

    try {
      const request = row.video_testimonial_requests;
      const professional = row.users;
      const customerEmail = request?.customer_email?.trim();

      if (!customerEmail || !row.ai_generated_text || !professional) {
        result.skipped++;
        continue;
      }

      // Authoritative per-org High Path gate; the DB floor above is coarse.
      const celebrationThreshold = await getCelebrationThreshold(
        row.organization_id
      );
      if (
        typeof row.customer_rating !== "number" ||
        row.customer_rating < celebrationThreshold
      ) {
        result.skipped++;
        continue;
      }

      if (await isEmailUnsubscribed(customerEmail)) {
        result.skipped++;
        continue;
      }

      const proName = professional.full_name || "your professional";

      // Smart link is a nice-to-have; never block the email on it
      let smartLinkUrl: string | null = null;
      try {
        const smartLink = await ensureSmartLinkForSource({
          organizationId: row.organization_id,
          sourceType: "video_testimonial",
          sourceId: row.id,
        });
        smartLinkUrl = smartLink.url;
      } catch (smartLinkError) {
        console.error(
          `Recapture email: smart link unavailable for response ${row.id}:`,
          smartLinkError
        );
      }

      const { subject, html } = getReviewKitRecaptureEmail({
        customerName: request?.customer_name || "there",
        proName,
        reviewText: row.ai_generated_text,
        googleReviewUrl: buildGoogleReviewUrl(professional.google_place_id),
        zillowProfileUrl: professional.zillow_profile_url,
        smartLinkUrl,
      });

      const sendResult = await sendWithReliability({
        to: customerEmail,
        toName: request?.customer_name || undefined,
        from: getFromAddress(row.organizations?.name),
        subject,
        html,
        idempotencyKey: `video-review-recapture-${row.id}-${customerEmail.toLowerCase()}`,
        isTransactional: true,
        tags: [
          { name: "template", value: "video_review_recapture" },
          { name: "response_id", value: row.id },
          { name: "organization_id", value: row.organization_id },
        ],
      });

      if (!sendResult.success) {
        result.failed++;
        result.errors.push(
          `Response ${row.id}: send failed (${sendResult.error || "unknown error"})`
        );
        continue;
      }

      const { error: updateError } = await supabase
        .from("video_testimonial_responses")
        .update({ recapture_email_sent_at: new Date().toISOString() })
        .eq("id", row.id);

      if (updateError) {
        // Email went out but the flag did not stick; surface loudly because
        // the idempotency key is the only thing preventing a duplicate send.
        result.errors.push(
          `Response ${row.id}: sent but failed to set recapture_email_sent_at (${updateError.message})`
        );
      }

      result.sent++;
    } catch (error) {
      result.failed++;
      result.errors.push(
        `Response ${row.id}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return result;
}
