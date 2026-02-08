import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_PER_NUMBER_RATE_LIMIT,
  DEFAULT_PER_NUMBER_WINDOW_MS,
  DEFAULT_ORG_RATE_LIMIT,
  DEFAULT_ORG_WINDOW_MS,
} from "./constants";

export interface RateLimitResult {
  allowed: boolean;
  /** When the next send will be allowed (ISO string), if rate-limited */
  retryAfter?: string;
  reason?: string;
}

/**
 * Check per-phone-number rate limit: max N messages to the same number per window.
 * Uses the sms_messages table to count recent outbound messages.
 */
export async function checkPerNumberRateLimit(
  toNumber: string,
  organizationId: string,
  limit = DEFAULT_PER_NUMBER_RATE_LIMIT,
  windowMs = DEFAULT_PER_NUMBER_WINDOW_MS
): Promise<RateLimitResult> {
  const supabase = createUntypedAdminClient();
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { count, error } = await supabase
    .from("sms_messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("to_number", toNumber)
    .eq("direction", "outbound")
    .gte("created_at", windowStart);

  if (error) {
    // Fail closed: if we cannot check, deny the send and log the error
    console.error("[SMS RateLimit] Failed to check per-number rate:", error.message);
    return { allowed: false, reason: "Rate limit check unavailable" };
  }

  if ((count ?? 0) >= limit) {
    const retryAfter = new Date(Date.now() + windowMs).toISOString();
    return {
      allowed: false,
      retryAfter,
      reason: `Rate limit exceeded: max ${limit} message(s) per ${windowMs / 60000} minute(s) to this number`,
    };
  }

  return { allowed: true };
}

/**
 * Check org-level rate limit: max N messages per minute for the entire organization.
 */
export async function checkOrgRateLimit(
  organizationId: string,
  limit = DEFAULT_ORG_RATE_LIMIT,
  windowMs = DEFAULT_ORG_WINDOW_MS
): Promise<RateLimitResult> {
  const supabase = createUntypedAdminClient();
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  const { count, error } = await supabase
    .from("sms_messages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("direction", "outbound")
    .gte("created_at", windowStart);

  if (error) {
    // Fail closed: if we cannot check, deny the send and log the error
    console.error("[SMS RateLimit] Failed to check org rate:", error.message);
    return { allowed: false, reason: "Rate limit check unavailable" };
  }

  if ((count ?? 0) >= limit) {
    const retryAfter = new Date(Date.now() + windowMs).toISOString();
    return {
      allowed: false,
      retryAfter,
      reason: `Organization rate limit exceeded: max ${limit} messages per minute`,
    };
  }

  return { allowed: true };
}

/**
 * Run both rate limit checks. Returns the first failure or { allowed: true }.
 */
export async function checkRateLimits(
  toNumber: string,
  organizationId: string
): Promise<RateLimitResult> {
  // Run both checks concurrently
  const [perNumber, perOrg] = await Promise.all([
    checkPerNumberRateLimit(toNumber, organizationId),
    checkOrgRateLimit(organizationId),
  ]);

  if (!perNumber.allowed) return perNumber;
  if (!perOrg.allowed) return perOrg;
  return { allowed: true };
}
