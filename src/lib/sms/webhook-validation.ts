import Twilio from "twilio";
import { ENV_TWILIO_AUTH_TOKEN } from "./constants";

/**
 * Validate that an incoming request was signed by Twilio.
 * Uses Twilio's `validateRequest` helper to verify the X-Twilio-Signature header
 * against the request URL and POST parameters.
 *
 * Returns true if the signature is valid; false otherwise.
 */
export function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  if (!signature) return false;

  const authToken = process.env[ENV_TWILIO_AUTH_TOKEN];
  if (!authToken) {
    console.error("[SMS Webhook] TWILIO_AUTH_TOKEN is not configured");
    return false;
  }

  return Twilio.validateRequest(authToken, signature, url, params);
}

/**
 * Build the full webhook URL from a NextRequest.
 * In production, the X-Forwarded-Proto and Host headers provide the public URL.
 * Falls back to the request URL if headers are unavailable.
 */
export function buildWebhookUrl(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host");

  if (forwardedProto && host) {
    const url = new URL(request.url);
    return `${forwardedProto}://${host}${url.pathname}`;
  }

  // Fallback: use the full request URL (path only, no query)
  const url = new URL(request.url);
  return `${url.origin}${url.pathname}`;
}

/** STOP/UNSUBSCRIBE keywords per Twilio / TCPA best practices */
export const OPT_OUT_KEYWORDS = new Set([
  "stop",
  "stopall",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
]);

/** START/SUBSCRIBE keywords for re-opt-in */
export const OPT_IN_KEYWORDS = new Set(["start", "yes", "unstop"]);

/** HELP keyword triggers a help response */
export const HELP_KEYWORDS = new Set(["help", "info"]);
