import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { generateUniqueShortCode } from "./code-generator";
import type {
  SmsShortLink,
  CreateShortLinkInput,
  ShortLinkClickStats,
} from "./types";

const DEFAULT_EXPIRY_DAYS = 30;
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.repwell.com";
const ALLOWED_PROTOCOLS = ["http:", "https:"];

/** Validate that a destination URL uses an allowed protocol. */
function validateDestinationUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid destination URL");
  }
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error(`Disallowed URL protocol: ${parsed.protocol}`);
  }
}

/**
 * ShortLinkService handles creation, resolution, click tracking,
 * and analytics for SMS short links.
 */
export const ShortLinkService = {
  /**
   * Create a short link for a destination URL.
   * Returns the full short URL (e.g., https://app.repwell.com/r/abc123).
   */
  async createShortLink(
    input: CreateShortLinkInput
  ): Promise<{ shortLink: SmsShortLink; shortUrl: string }> {
    validateDestinationUrl(input.destinationUrl);

    const supabase = createUntypedAdminClient();
    const shortCode = await generateUniqueShortCode();

    const expiresInDays =
      input.metadata?.expiresInDays ?? DEFAULT_EXPIRY_DAYS;
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("sms_short_links")
      .insert({
        organization_id: input.organizationId,
        short_code: shortCode,
        destination_url: input.destinationUrl,
        borrower_phone: input.metadata?.borrowerPhone ?? null,
        loan_officer_id: input.metadata?.loanOfficerId ?? null,
        message_id: input.metadata?.messageId ?? null,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create short link: ${error.message}`);
    }

    const shortUrl = `${APP_DOMAIN}/r/${shortCode}`;
    return { shortLink: data as SmsShortLink, shortUrl };
  },

  /**
   * Resolve a short code to its short link record.
   * Returns null if the code does not exist.
   */
  async resolveShortLink(shortCode: string): Promise<SmsShortLink | null> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from("sms_short_links")
      .select("*")
      .eq("short_code", shortCode)
      .maybeSingle();

    if (error) {
      console.error("[ShortLink] Failed to resolve:", error.message);
      return null;
    }

    return (data as SmsShortLink) ?? null;
  },

  /**
   * Record a click on a short link. Uses atomic SQL increment for
   * concurrency safety. Captures user-agent and referrer.
   */
  async recordClick(
    shortCode: string,
    headers: { userAgent?: string; referrer?: string }
  ): Promise<void> {
    const supabase = createUntypedAdminClient();
    const now = new Date().toISOString();

    // Atomic increment of click_count + update timestamps
    const { error } = await supabase.rpc("increment_short_link_click", {
      p_short_code: shortCode,
      p_now: now,
    });

    if (error) {
      console.error("[ShortLink] RPC increment failed, using fallback:", error.message);
      // Fallback: update last_clicked_at only (click_count won't be atomic)
      const { error: updateError } = await supabase
        .from("sms_short_links")
        .update({ last_clicked_at: now })
        .eq("short_code", shortCode);

      if (updateError) {
        console.error("[ShortLink] Fallback update failed:", updateError.message);
      }
    }

    // Log click details for analytics (user-agent, referrer)
    if (headers.userAgent || headers.referrer) {
      console.info("[ShortLink] Click recorded", {
        shortCode,
        userAgent: headers.userAgent?.substring(0, 200),
        referrer: headers.referrer?.substring(0, 500),
      });
    }
  },

  /**
   * Get click statistics for a short link by its ID.
   */
  async getClickStats(shortLinkId: string): Promise<ShortLinkClickStats | null> {
    const supabase = createUntypedAdminClient();

    const { data, error } = await supabase
      .from("sms_short_links")
      .select("*")
      .eq("id", shortLinkId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const link = data as SmsShortLink;
    const isExpired = link.expires_at
      ? new Date(link.expires_at) < new Date()
      : false;

    return {
      shortLinkId: link.id,
      shortCode: link.short_code,
      destinationUrl: link.destination_url,
      clickCount: link.click_count,
      firstClickedAt: link.first_clicked_at,
      lastClickedAt: link.last_clicked_at,
      createdAt: link.created_at,
      expiresAt: link.expires_at,
      isExpired,
    };
  },

  /**
   * Check if a short link is expired.
   */
  isExpired(link: SmsShortLink): boolean {
    if (!link.expires_at) return false;
    return new Date(link.expires_at) < new Date();
  },

  /**
   * Build the full short URL from a short code.
   */
  buildShortUrl(shortCode: string): string {
    return `${APP_DOMAIN}/r/${shortCode}`;
  },
};
