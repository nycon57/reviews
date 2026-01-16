import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

/**
 * Verify that the request is not from a bot.
 * Returns a 403 response if bot detected, null if legitimate.
 *
 * Usage:
 * ```ts
 * const botResponse = await verifyNotBot();
 * if (botResponse) return botResponse;
 * ```
 *
 * Note: In local development, checkBotId() returns isBot: false by default.
 * Bot detection only runs in production on Vercel.
 */
export async function verifyNotBot(): Promise<NextResponse | null> {
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  return null;
}

/**
 * Check if the request should skip BotID verification.
 * Returns true if an API key is present (server-to-server request).
 * Use this for webhook endpoints that accept both browser and server requests.
 */
export function hasApiKey(request: Request): boolean {
  return !!request.headers.get("x-api-key");
}
