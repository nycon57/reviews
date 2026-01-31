"use server";

import { z } from "zod";
import { unifiedGetUserWithProfile } from "@/lib/auth/actions";
import { CreditService } from "./credit-service";
import { CREDIT_PACKS } from "./constants";
import type {
  CreditBalance,
  CurrentPeriodUsage,
  MonthlyUsageSummary,
} from "./types";
import { revalidatePath } from "next/cache";

const packIdSchema = z.enum(["pack_100", "pack_500", "pack_1000"]);

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function requireAdminOrManager(): Promise<
  { organizationId: string; userId: string } | { error: string }
> {
  const profile = await unifiedGetUserWithProfile();
  if (!profile) return { error: "Not authenticated" };
  if (!profile.organization_id) return { error: "No organization found" };
  if (profile.role !== "admin" && profile.role !== "manager") {
    return { error: "Insufficient permissions. Admin or manager role required." };
  }
  return { organizationId: profile.organization_id, userId: profile.id };
}

async function withCreditService<T>(
  fn: (service: CreditService) => Promise<T>,
  fallbackError: string
): Promise<ActionResult<T>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const service = new CreditService(auth.organizationId);
    const data = await fn(service);
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : fallbackError;
    return { success: false, error: message };
  }
}

export async function getCreditBalance(): Promise<ActionResult<CreditBalance>> {
  return withCreditService((s) => s.checkBalance(), "Failed to load credit balance");
}

export async function getCurrentPeriodUsage(): Promise<ActionResult<CurrentPeriodUsage>> {
  return withCreditService((s) => s.getCurrentPeriodUsage(), "Failed to load usage data");
}

export async function getMonthlyUsageSummary(): Promise<ActionResult<MonthlyUsageSummary>> {
  return withCreditService((s) => s.getMonthlyUsageSummary(), "Failed to load usage summary");
}

export async function purchaseCreditPack(
  packId: string
): Promise<ActionResult<{ newIncluded: number }>> {
  const auth = await requireAdminOrManager();
  if ("error" in auth) return { success: false, error: auth.error };

  const parsed = packIdSchema.safeParse(packId);
  if (!parsed.success) return { success: false, error: "Invalid credit pack" };

  const pack = CREDIT_PACKS.find((p) => p.id === parsed.data);
  if (!pack) return { success: false, error: "Invalid credit pack" };

  try {
    const service = new CreditService(auth.organizationId);
    const result = await service.purchaseCreditPack(parsed.data);
    revalidatePath("/dashboard/settings");
    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to purchase credit pack";
    return { success: false, error: message };
  }
}
