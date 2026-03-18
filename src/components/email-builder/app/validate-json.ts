import type { TReaderDocument } from "@usewaypoint/email-builder";

/**
 * Validates a JSON string and checks it can be parsed as a Waypoint TReaderDocument.
 * Returns the parsed document or an error message string.
 */
export function validateJsonStringValue(
  value: string
): { error: string } | { data: TReaderDocument } {
  if (!value.trim()) {
    return { error: "JSON string is empty." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { error: "Invalid JSON syntax." };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      error: "JSON must be an object (Record<string, block>).",
    };
  }

  // Basic structural check: each value should have a "type" field
  const record = parsed as Record<string, unknown>;
  for (const [key, block] of Object.entries(record)) {
    if (
      typeof block !== "object" ||
      block === null ||
      !("type" in block) ||
      typeof (block as Record<string, unknown>).type !== "string"
    ) {
      return {
        error: `Block "${key}" is missing a valid "type" field.`,
      };
    }
  }

  return { data: record as TReaderDocument };
}
