import bcrypt from "bcrypt";
import crypto from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const TEMP_PASSWORD_BYTES = 20;
const PASSWORD_HASH_ROUNDS = 10;

export function generateTemporaryPassword(): string {
  return crypto.randomBytes(TEMP_PASSWORD_BYTES).toString("hex");
}

export async function upsertBetterAuthCredentialAccount({
  userId,
  password,
}: {
  userId: string;
  password: string;
}): Promise<{ error?: string }> {
  const supabase = createAdminClient();
  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  const { error } = await supabase.from("accounts").upsert(
    {
      id: crypto.randomUUID(),
      user_id: userId,
      account_id: userId,
      provider_id: "credential",
      password: passwordHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider_id" }
  );

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function deleteBetterAuthIdentity(userId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from("sessions").delete().eq("user_id", userId);
  await supabase.from("accounts").delete().eq("user_id", userId);
  await supabase.from("users").delete().eq("id", userId);

  await supabase.auth.admin.deleteUser(userId).catch((error) => {
    console.warn("[Better Auth provisioning] Legacy auth.users cleanup skipped:", error);
  });
}
