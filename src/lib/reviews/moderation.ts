/**
 * Machine screening for review text. This is the only gate between a verified
 * review and the public record (see "Review System Inversion" in
 * tasks/todo.md): humans never pre-approve, so screening fails CLOSED — any
 * provider error quarantines instead of publishing.
 *
 * Layered: zero-network baseline checks (PII, profanity, spam) run first; the
 * Gemini structured check only runs when the baseline passes and AI is
 * configured.
 */

import { z } from "zod";
import { getGeminiClient, isAIEnabled } from "@/lib/ai/client";

export type ModerationReason =
  | "profanity"
  | "pii_email"
  | "pii_phone"
  | "pii_ssn"
  | "pii_address"
  | "spam_links"
  | "spam_repetition"
  | "ai_flagged"
  | "screen_error";

export interface ModerationResult {
  verdict: "pass" | "quarantine";
  reasons: ModerationReason[];
  provider: "baseline" | "gemini" | "fail_closed";
}

const GEMINI_TIMEOUT_MS = 8_000;

// Word-boundary profanity lexicon. Deliberately conservative: quarantine
// sends text to a human, so false positives cost a delay, not a removal.
const PROFANITY = [
  "fuck",
  "fucking",
  "fucker",
  "shit",
  "shitty",
  "bullshit",
  "asshole",
  "bitch",
  "bastard",
  "cunt",
  "dick",
  "dickhead",
  "pussy",
  "cock",
  "slut",
  "whore",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "retarded",
  "kike",
  "spic",
  "wetback",
  "chink",
];

const PROFANITY_PATTERN = new RegExp(`\\b(${PROFANITY.join("|")})\\b`, "i");

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// NANP-style phone numbers: 555-123-4567, (555) 123 4567, +1 555.123.4567
const PHONE_PATTERN = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]?\d{4}\b/;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/;
// Street address heuristic: number + words + street suffix.
const ADDRESS_PATTERN =
  /\b\d{1,5}\s+(?:[A-Za-z]+\s+){0,3}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|circle|cir|way|place|pl)\b\.?/i;
const URL_PATTERN = /https?:\/\/|www\./gi;

const geminiVerdictSchema = z.object({
  flagged: z.boolean(),
  categories: z.array(z.string()).default([]),
});

function baselineReasons(text: string): ModerationReason[] {
  const reasons: ModerationReason[] = [];

  if (PROFANITY_PATTERN.test(text)) reasons.push("profanity");
  if (EMAIL_PATTERN.test(text)) reasons.push("pii_email");
  if (PHONE_PATTERN.test(text)) reasons.push("pii_phone");
  if (SSN_PATTERN.test(text)) reasons.push("pii_ssn");
  if (ADDRESS_PATTERN.test(text)) reasons.push("pii_address");

  const urlCount = (text.match(URL_PATTERN) ?? []).length;
  if (urlCount > 2) reasons.push("spam_links");

  // Character-run repetition ("aaaaaaaaaa") or one phrase pasted repeatedly.
  if (/(.)\1{9,}/.test(text)) reasons.push("spam_repetition");
  else {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length >= 20) {
      const unique = new Set(words);
      if (unique.size / words.length < 0.25) reasons.push("spam_repetition");
    }
  }

  return reasons;
}

async function geminiFlagged(text: string): Promise<boolean> {
  const client = getGeminiClient();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a content-safety screen for customer reviews on a professional reputation platform. Negative opinions, criticism, and complaints are ALLOWED — only flag content that is unsafe to publish.

Flag the review only for: hate speech or slurs, threats or harassment, sexually explicit content, doxxing/personal data (addresses, phone numbers, account numbers), obvious spam or advertising, or text that is clearly not a review (gibberish, code, prompts).

Output strict JSON: {"flagged": boolean, "categories": ["..."]}

Review text:
"""
${text.slice(0, 6000)}
"""`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0,
        abortSignal: controller.signal,
      },
    } as Parameters<typeof client.models.generateContent>[0]);

    const raw = response.text;
    if (!raw) throw new Error("Empty moderation response");
    const verdict = geminiVerdictSchema.parse(JSON.parse(raw));
    return verdict.flagged;
  } finally {
    clearTimeout(timer);
  }
}

export async function screenReviewText(
  text: string,
  customerName?: string | null
): Promise<ModerationResult> {
  const combined = customerName ? `${customerName}\n${text}` : text;

  const reasons = baselineReasons(combined);
  if (reasons.length > 0) {
    return { verdict: "quarantine", reasons, provider: "baseline" };
  }

  if (!isAIEnabled()) {
    return { verdict: "pass", reasons: [], provider: "baseline" };
  }

  try {
    if (await geminiFlagged(combined)) {
      return { verdict: "quarantine", reasons: ["ai_flagged"], provider: "gemini" };
    }
    return { verdict: "pass", reasons: [], provider: "gemini" };
  } catch (error) {
    console.error("[reviews] Moderation screen failed; quarantining (fail-closed):", error);
    return { verdict: "quarantine", reasons: ["screen_error"], provider: "fail_closed" };
  }
}
