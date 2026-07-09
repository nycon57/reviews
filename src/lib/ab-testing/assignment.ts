// Cookie-based A/B variant assignment (S131)
// Deterministic: same visitor always gets the same variant per test

import { setCookie } from "@/lib/utils/cookies";
import type { ABVariant } from "./types";

const COOKIE_PREFIX = "rw_ab_";
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * Simple hash function to deterministically assign a variant based on a seed string.
 * Uses djb2 algorithm — fast and sufficient for 50/50 splits.
 */
function hashToVariant(seed: string): ABVariant {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return (hash >>> 0) % 2 === 0 ? "A" : "B";
}

/** Get the cookie name for a given test ID */
export function getTestCookieName(testId: string): string {
  return `${COOKIE_PREFIX}${testId}`;
}

/**
 * Read a variant from cookies. Returns null if not set.
 * Works in browser context only.
 */
export function readVariantFromCookie(testId: string): ABVariant | null {
  if (typeof document === "undefined") return null;

  const name = getTestCookieName(testId);
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;

  if (value === "A" || value === "B") return value;
  return null;
}

/** Write a cookie with standard A/B testing options (30-day expiry, SameSite=Lax). */
function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;

  setCookie(name, value, {
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
  });
}

/**
 * Write a variant to a cookie (30-day expiry).
 * Works in browser context only.
 */
export function writeVariantCookie(testId: string, variant: ABVariant): void {
  writeCookie(getTestCookieName(testId), variant);
}

/**
 * Get a visitor ID for deterministic assignment. Uses a persistent cookie.
 * If no visitor ID exists, creates one.
 */
function getOrCreateVisitorId(): string {
  if (typeof document === "undefined") return "server";

  const cookieName = "rw_ab_visitor";
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${cookieName}=([^;]*)`),
  );

  if (match) return decodeURIComponent(match[1]);

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  writeCookie(cookieName, id);
  return id;
}

/**
 * Get the assigned variant for a test. Returns existing cookie value if present,
 * otherwise deterministically assigns based on visitor ID + test ID.
 * Persists the assignment in a 30-day cookie.
 */
export function getVariantAssignment(testId: string): ABVariant {
  // Check for existing assignment
  const existing = readVariantFromCookie(testId);
  if (existing) return existing;

  // Deterministic assignment based on visitor ID + test ID
  const visitorId = getOrCreateVisitorId();
  const variant = hashToVariant(`${visitorId}:${testId}`);

  // Persist
  writeVariantCookie(testId, variant);
  return variant;
}

/**
 * Get all variant assignments for a page's active tests.
 * Returns a map of testId -> variant.
 */
export function getPageVariantAssignments(
  tests: Array<{ id: string; enabled: boolean }>,
): Record<string, ABVariant> {
  const assignments: Record<string, ABVariant> = {};
  for (const test of tests) {
    if (test.enabled) {
      assignments[test.id] = getVariantAssignment(test.id);
    }
  }
  return assignments;
}
