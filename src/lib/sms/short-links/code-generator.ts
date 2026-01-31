import { randomBytes } from "node:crypto";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 5;

function generateRandomCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/** Generate a unique short code, retrying on collision up to MAX_ATTEMPTS times. */
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
