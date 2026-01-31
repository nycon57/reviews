import { randomBytes } from "node:crypto";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

// URL-safe alphanumeric alphabet (a-z, A-Z, 0-9)
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

/**
 * Generate a random 6-character alphanumeric short code.
 * Uses Node.js crypto for secure randomness.
 */
function generateRandomCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/**
 * Generate a unique short code by checking for collisions in the database.
 * Retries up to MAX_ATTEMPTS times if a collision is found.
 */
export async function generateUniqueShortCode(): Promise<string> {
  const supabase = createUntypedAdminClient();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateRandomCode();

    const { data } = await supabase
      .from("sms_short_links")
      .select("id")
      .eq("short_code", code)
      .maybeSingle();

    if (!data) {
      return code;
    }
  }

  throw new Error(
    `Failed to generate unique short code after ${MAX_ATTEMPTS} attempts`
  );
}
