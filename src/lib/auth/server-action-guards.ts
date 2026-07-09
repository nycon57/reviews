import { headers } from "next/headers";

async function getUnifiedUser() {
  const { unifiedGetUser } = await import("@/lib/auth/actions");
  return unifiedGetUser();
}

export async function requireAuthenticatedUser() {
  const user = await getUnifiedUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function getAuthenticatedUserResult() {
  const user = await getUnifiedUser();
  return user
    ? { success: true as const, user }
    : { success: false as const, error: "Not authenticated" };
}

export async function requireCronSecretRequest() {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV !== "production") {
    return;
  }

  const requestHeaders = await headers();
  if (!cronSecret || requestHeaders.get("authorization") !== `Bearer ${cronSecret}`) {
    throw new Error("Unauthorized");
  }
}
