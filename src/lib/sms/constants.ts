// ── SMS segment limits ─────────────────────────────────────────────────

export const GSM7_SINGLE_SEGMENT_LIMIT = 160;
export const GSM7_MULTI_SEGMENT_LIMIT = 153;
export const UCS2_SINGLE_SEGMENT_LIMIT = 70;
export const UCS2_MULTI_SEGMENT_LIMIT = 67;

// GSM-7 basic character set (plus extension table chars)
// See 3GPP TS 23.038 for the full spec.
export const GSM7_BASIC_CHARS = new Set(
  (
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ" +
    " !\"#¤%&'()*+,-./0123456789:;<=>?" +
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "ÄÖÑÜabcdefghijklmnopqrstuvwxyz" +
    "äöñüà§"
  ).split("")
);

// Characters that use 2 bytes in GSM-7 extension table
export const GSM7_EXTENSION_CHARS = new Set(["|", "^", "€", "{", "}", "[", "]", "~", "\\"]);

// ── Rate limiting ──────────────────────────────────────────────────────

/** Default: max 1 SMS per phone number per hour */
export const DEFAULT_PER_NUMBER_RATE_LIMIT = 1;
export const DEFAULT_PER_NUMBER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Default: max 200 messages per organization per minute */
export const DEFAULT_ORG_RATE_LIMIT = 200;
export const DEFAULT_ORG_WINDOW_MS = 60 * 1000; // 1 minute

// ── Twilio error codes mapped to user messages ─────────────────────────

export const TWILIO_ERROR_MAP: Record<number, string> = {
  21211: "The phone number is invalid.",
  21214: "The phone number is not a mobile number.",
  21217: "The phone number is not valid for this region.",
  21408: "Permission to send SMS has not been enabled.",
  21610: "The recipient has opted out of messages from this number.",
  21611: "This phone number is not owned by your account.",
  21612: "The phone number is not a valid SMS-capable number.",
  21614: "The phone number is not capable of receiving SMS.",
  30003: "The phone is unreachable.",
  30004: "Message blocked by carrier.",
  30005: "Unknown destination handset.",
  30006: "Landline or unreachable carrier.",
  30007: "Message filtered by carrier.",
  30008: "Unknown error from carrier.",
  30034: "Message body exceeds limit.",
  63038: "The A2P 10DLC campaign is suspended.",
};

/** Twilio HTTP status codes that should trigger a retry */
export const TRANSIENT_STATUS_CODES = [429, 502, 503];

/** Maximum retry attempts for transient failures */
export const MAX_RETRIES = 3;

/** Base delay for exponential backoff in ms */
export const RETRY_BASE_DELAY_MS = 1000;

// ── Phone formatting ───────────────────────────────────────────────────

/** US country code */
export const US_COUNTRY_CODE = "+1";

/** Regex to match a valid US phone number (10 digits, optionally with +1) */
export const US_PHONE_REGEX = /^(?:\+?1)?[\s.-]*\(?(\d{3})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})$/;

// ── Environment variables ──────────────────────────────────────────────

export const ENV_TWILIO_ACCOUNT_SID = "TWILIO_ACCOUNT_SID";
export const ENV_TWILIO_AUTH_TOKEN = "TWILIO_AUTH_TOKEN";

/** Encryption key env var for decrypting Twilio tokens stored in sms_settings */
export const ENV_SMS_ENCRYPTION_KEY = "SMS_ENCRYPTION_KEY";

/** Twilio Verify Service SID for OTP-based double opt-in */
export const ENV_TWILIO_VERIFY_SERVICE_SID = "TWILIO_VERIFY_SERVICE_SID";
