import {
  GSM7_BASIC_CHARS,
  GSM7_EXTENSION_CHARS,
  GSM7_SINGLE_SEGMENT_LIMIT,
  GSM7_MULTI_SEGMENT_LIMIT,
  UCS2_SINGLE_SEGMENT_LIMIT,
  UCS2_MULTI_SEGMENT_LIMIT,
} from "./constants";

export interface SegmentInfo {
  /** Total number of SMS segments */
  segments: number;
  /** Total character count (GSM-7 extension chars count as 2) */
  characterCount: number;
  /** Encoding used for this message */
  encoding: "GSM-7" | "UCS-2";
  /** Maximum characters per single segment for this encoding */
  singleSegmentLimit: number;
  /** Maximum characters per segment in a multi-part message */
  multiSegmentLimit: number;
}

/**
 * Determine whether a message can be encoded in GSM-7 or requires UCS-2.
 * A single non-GSM-7 character forces the entire message to UCS-2.
 */
export function detectEncoding(message: string): "GSM-7" | "UCS-2" {
  for (const char of message) {
    if (!GSM7_BASIC_CHARS.has(char) && !GSM7_EXTENSION_CHARS.has(char)) {
      return "UCS-2";
    }
  }
  return "GSM-7";
}

/**
 * Count the effective character length of a message under GSM-7 encoding.
 * Extension table characters consume 2 bytes each.
 */
export function gsm7Length(message: string): number {
  let length = 0;
  for (const char of message) {
    length += GSM7_EXTENSION_CHARS.has(char) ? 2 : 1;
  }
  return length;
}

/**
 * Calculate the number of SMS segments and encoding details for a message.
 */
export function calculateSegments(message: string): SegmentInfo {
  if (!message) {
    return {
      segments: 0,
      characterCount: 0,
      encoding: "GSM-7",
      singleSegmentLimit: GSM7_SINGLE_SEGMENT_LIMIT,
      multiSegmentLimit: GSM7_MULTI_SEGMENT_LIMIT,
    };
  }

  const encoding = detectEncoding(message);

  if (encoding === "GSM-7") {
    const charCount = gsm7Length(message);
    const segments =
      charCount <= GSM7_SINGLE_SEGMENT_LIMIT
        ? 1
        : Math.ceil(charCount / GSM7_MULTI_SEGMENT_LIMIT);

    return {
      segments,
      characterCount: charCount,
      encoding: "GSM-7",
      singleSegmentLimit: GSM7_SINGLE_SEGMENT_LIMIT,
      multiSegmentLimit: GSM7_MULTI_SEGMENT_LIMIT,
    };
  }

  // UCS-2
  const charCount = message.length;
  const segments =
    charCount <= UCS2_SINGLE_SEGMENT_LIMIT
      ? 1
      : Math.ceil(charCount / UCS2_MULTI_SEGMENT_LIMIT);

  return {
    segments,
    characterCount: charCount,
    encoding: "UCS-2",
    singleSegmentLimit: UCS2_SINGLE_SEGMENT_LIMIT,
    multiSegmentLimit: UCS2_MULTI_SEGMENT_LIMIT,
  };
}
