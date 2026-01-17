/**
 * API Key Generation Utilities
 * Handles secure generation, hashing, and prefix extraction
 */

import crypto from 'crypto';
import { ApiKeyEnvironment, KEY_PREFIXES } from './types';

// Key length constants
const KEY_RANDOM_BYTES = 32; // 256 bits of entropy
const KEY_PREFIX_DISPLAY_LENGTH = 12; // Characters shown in UI (e.g., "rw_live_abc1")

/**
 * Generate a new API key
 * @param environment - 'live' or 'test'
 * @returns Object with rawKey (full key), keyHash (for storage), and keyPrefix (for display)
 */
export function generateApiKey(environment: ApiKeyEnvironment = 'live'): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  // Generate random bytes
  const randomBytes = crypto.randomBytes(KEY_RANDOM_BYTES);

  // Convert to URL-safe base64 and remove padding
  const randomPart = randomBytes
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Build the full key with prefix
  const prefix = KEY_PREFIXES[environment];
  const rawKey = `${prefix}${randomPart}`;

  // Hash the key for storage (using SHA-256)
  const keyHash = hashApiKey(rawKey);

  // Extract prefix for display (prefix + first 4 chars of random part)
  const keyPrefix = `${prefix}${randomPart.substring(0, 4)}`;

  return {
    rawKey,
    keyHash,
    keyPrefix,
  };
}

/**
 * Hash an API key for secure storage
 * @param rawKey - The full API key
 * @returns SHA-256 hash of the key
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Extract the display prefix from a raw API key
 * @param rawKey - The full API key
 * @returns The display prefix (e.g., "rw_live_abc1...")
 */
export function extractKeyPrefix(rawKey: string): string {
  const prefixLength = rawKey.startsWith('rw_test_')
    ? KEY_PREFIXES.test.length
    : KEY_PREFIXES.live.length;

  return rawKey.substring(0, prefixLength + KEY_PREFIX_DISPLAY_LENGTH);
}

/**
 * Determine the environment from a raw API key
 * @param rawKey - The full API key
 * @returns 'live' or 'test'
 */
export function getKeyEnvironment(rawKey: string): ApiKeyEnvironment {
  return rawKey.startsWith(KEY_PREFIXES.test) ? 'test' : 'live';
}

/**
 * Validate API key format
 * @param rawKey - The API key to validate
 * @returns true if the key format is valid
 */
export function isValidKeyFormat(rawKey: string): boolean {
  // Must start with a valid prefix
  const hasValidPrefix =
    rawKey.startsWith(KEY_PREFIXES.live) ||
    rawKey.startsWith(KEY_PREFIXES.test);

  if (!hasValidPrefix) {
    return false;
  }

  // Extract the random part
  const prefixLength = rawKey.startsWith(KEY_PREFIXES.test)
    ? KEY_PREFIXES.test.length
    : KEY_PREFIXES.live.length;

  const randomPart = rawKey.substring(prefixLength);

  // Random part should be URL-safe base64 without padding
  // At least 32 characters (from 24 bytes minimum)
  const isValidLength = randomPart.length >= 32;
  const isValidChars = /^[A-Za-z0-9_-]+$/.test(randomPart);

  return isValidLength && isValidChars;
}

/**
 * Generate a request ID for tracking
 * @returns A unique request ID prefixed with 'req_'
 */
export function generateRequestId(): string {
  const randomBytes = crypto.randomBytes(16);
  const randomPart = randomBytes.toString('hex');
  return `req_${randomPart}`;
}

/**
 * Timing-safe comparison for API key hashes
 * @param hash1 - First hash
 * @param hash2 - Second hash
 * @returns true if hashes match
 */
export function timingSafeCompare(hash1: string, hash2: string): boolean {
  if (hash1.length !== hash2.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(hash1), Buffer.from(hash2));
  } catch {
    return false;
  }
}
