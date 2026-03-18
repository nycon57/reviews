import {
  DEFAULT_AUTO_REPLY_SETTINGS,
  type AutoReplySettings,
} from "./types";

const AUTO_REPLY_FEATURE_TIERS = new Set(["pro", "enterprise"]);
const AUTO_REPLY_TONES: ReadonlyArray<AutoReplySettings["auto_reply_tone"]> = [
  "professional",
  "friendly",
  "empathetic",
];
const AUTO_REPLY_MIN_RATINGS: ReadonlyArray<AutoReplySettings["auto_reply_min_rating"]> = [
  1,
  3,
  4,
];

export function hasAutoReplyFeature(
  subscriptionTier: string | null | undefined
): boolean {
  return !!subscriptionTier && AUTO_REPLY_FEATURE_TIERS.has(subscriptionTier);
}

export function coerceAutoReplySettings(settings: unknown): AutoReplySettings {
  const values = isRecord(settings) ? settings : {};

  const enabled =
    typeof values.auto_reply_enabled === "boolean"
      ? values.auto_reply_enabled
      : DEFAULT_AUTO_REPLY_SETTINGS.auto_reply_enabled;

  const tone = AUTO_REPLY_TONES.includes(
    values.auto_reply_tone as AutoReplySettings["auto_reply_tone"]
  )
    ? (values.auto_reply_tone as AutoReplySettings["auto_reply_tone"])
    : DEFAULT_AUTO_REPLY_SETTINGS.auto_reply_tone;

  const minRating = AUTO_REPLY_MIN_RATINGS.includes(
    values.auto_reply_min_rating as AutoReplySettings["auto_reply_min_rating"]
  )
    ? (values.auto_reply_min_rating as AutoReplySettings["auto_reply_min_rating"])
    : DEFAULT_AUTO_REPLY_SETTINGS.auto_reply_min_rating;

  return {
    auto_reply_enabled: enabled,
    auto_reply_tone: tone,
    // Product requirement: auto-reply window is always 24 hours.
    auto_reply_delay_hours: 24,
    auto_reply_min_rating: minRating,
  };
}

export function calculateAutoReplyEligibleAt(
  baseDate: string | null | undefined,
  delayHours: number = 24
): string {
  const parsed = baseDate ? new Date(baseDate) : null;
  const isValidParsed = !!parsed && !Number.isNaN(parsed.getTime());
  const baseMs = isValidParsed ? parsed.getTime() : Date.now();

  return new Date(baseMs + delayHours * 60 * 60 * 1000).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
