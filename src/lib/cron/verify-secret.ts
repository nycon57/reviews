import type { NextRequest } from "next/server";

/**
 * Verify that a cron request carries the correct CRON_SECRET bearer token.
 * In development, requests are allowed through when no secret is configured.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}
