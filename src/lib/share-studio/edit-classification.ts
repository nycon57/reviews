import type { ProofEditClassification, ProofSourceType } from "@/lib/share-studio/template-types";

const PROTECTED_FIELDS = new Set(["rating", "source_platform", "source_review_date"]);

const POSITIVE_TOKENS = [
  "great",
  "excellent",
  "amazing",
  "awesome",
  "helpful",
  "professional",
  "smooth",
  "happy",
  "recommend",
  "trust",
  "love",
  "friendly",
  "outstanding",
  "perfect",
];

const NEGATIVE_TOKENS = [
  "bad",
  "awful",
  "terrible",
  "horrible",
  "poor",
  "frustrating",
  "angry",
  "upset",
  "disappointed",
  "worst",
  "scam",
  "broken",
  "slow",
  "late",
  "rude",
];

export interface EditDiffEntry {
  field: string;
  before: unknown;
  after: unknown;
}

export interface EditClassificationResult {
  classification: ProofEditClassification;
  lexicalDeltaPercent: number;
  reason: string;
  protectedFieldChanged: boolean;
  sentimentFlipDetected: boolean;
  diff: EditDiffEntry[];
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeForLooseComparison(value: string): string {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "");
}

function toComparableString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function getTextForDelta(payload: Record<string, unknown>): string {
  const fields = ["title", "summary", "quote", "customer_name"];
  return fields
    .map((field) => toComparableString(payload[field]))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => []);

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function lexicalDeltaPercent(original: string, edited: string): number {
  const normalizedOriginal = normalizeWhitespace(original.toLowerCase());
  const normalizedEdited = normalizeWhitespace(edited.toLowerCase());

  if (!normalizedOriginal && !normalizedEdited) return 0;

  const distance = levenshteinDistance(normalizedOriginal, normalizedEdited);
  const base = Math.max(normalizedOriginal.length, normalizedEdited.length, 1);
  const delta = (distance / base) * 100;
  return Math.round(delta * 100) / 100;
}

function sentimentScore(text: string): number {
  if (!text) return 0;
  const tokens = normalizeForLooseComparison(text).split(" ").filter(Boolean);

  let score = 0;
  for (const token of tokens) {
    if (POSITIVE_TOKENS.includes(token)) score += 1;
    if (NEGATIVE_TOKENS.includes(token)) score -= 1;
  }
  return score;
}

function detectSentimentFlip(originalText: string, editedText: string): boolean {
  const originalScore = sentimentScore(originalText);
  const editedScore = sentimentScore(editedText);

  if (originalScore === 0 || editedScore === 0) return false;
  return Math.sign(originalScore) !== Math.sign(editedScore);
}

function buildDiff(
  originalPayload: Record<string, unknown>,
  editedPayload: Record<string, unknown>
): EditDiffEntry[] {
  const keys = new Set([
    ...Object.keys(originalPayload),
    ...Object.keys(editedPayload),
  ]);

  const diff: EditDiffEntry[] = [];

  for (const key of keys) {
    const before = originalPayload[key];
    const after = editedPayload[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diff.push({ field: key, before, after });
    }
  }

  return diff;
}

function isPunctuationCaseSpacingOnly(diff: EditDiffEntry[]): boolean {
  if (!diff.length) return true;

  return diff.every((entry) => {
    if (typeof entry.before !== "string" || typeof entry.after !== "string") {
      return false;
    }

    return (
      normalizeForLooseComparison(entry.before) ===
      normalizeForLooseComparison(entry.after)
    );
  });
}

function protectedFieldWasChanged(
  sourceType: ProofSourceType,
  diff: EditDiffEntry[]
): boolean {
  if (sourceType === "manual_json") return false;
  return diff.some((entry) => PROTECTED_FIELDS.has(entry.field));
}

export function classifyProofItemEdit(args: {
  sourceType: ProofSourceType;
  originalPayload: Record<string, unknown>;
  editedPayload: Record<string, unknown>;
}): EditClassificationResult {
  const diff = buildDiff(args.originalPayload, args.editedPayload);
  const textBefore = getTextForDelta(args.originalPayload);
  const textAfter = getTextForDelta(args.editedPayload);

  const protectedFieldChanged = protectedFieldWasChanged(args.sourceType, diff);
  const lexicalDelta = lexicalDeltaPercent(textBefore, textAfter);
  const sentimentFlipDetected = detectSentimentFlip(textBefore, textAfter);

  if (diff.length === 0) {
    return {
      classification: "minor",
      lexicalDeltaPercent: 0,
      reason: "No meaningful content change",
      protectedFieldChanged,
      sentimentFlipDetected,
      diff,
    };
  }

  if (protectedFieldChanged) {
    return {
      classification: "blocked",
      lexicalDeltaPercent: lexicalDelta,
      reason: "Protected source fields cannot be edited for sourced proof items",
      protectedFieldChanged,
      sentimentFlipDetected,
      diff,
    };
  }

  if (sentimentFlipDetected) {
    return {
      classification: "blocked",
      lexicalDeltaPercent: lexicalDelta,
      reason: "Edit introduces a sentiment reversal from the original source",
      protectedFieldChanged,
      sentimentFlipDetected,
      diff,
    };
  }

  if (lexicalDelta > 30) {
    return {
      classification: "blocked",
      lexicalDeltaPercent: lexicalDelta,
      reason: "Lexical delta exceeds 30% and is treated as a manipulative rewrite",
      protectedFieldChanged,
      sentimentFlipDetected,
      diff,
    };
  }

  if (isPunctuationCaseSpacingOnly(diff) || lexicalDelta <= 8) {
    return {
      classification: "minor",
      lexicalDeltaPercent: lexicalDelta,
      reason: "Typo/punctuation/case-level edit",
      protectedFieldChanged,
      sentimentFlipDetected,
      diff,
    };
  }

  return {
    classification: "material",
    lexicalDeltaPercent: lexicalDelta,
    reason: "Wording change requires manager/admin approval",
    protectedFieldChanged,
    sentimentFlipDetected,
    diff,
  };
}
