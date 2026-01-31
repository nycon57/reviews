"use server";

import { unifiedGetUser } from "@/lib/auth/actions";
import { CreditService } from "./credit-service";
import {
  purchaseCreditPackSchema,
  getCreditBalanceSchema,
  getCreditUsageReportSchema,
  creditAlertCheckSchema,
} from "./types";
import type {
  CreditBalance,
  CreditUsageReport,
} from "./types";
import type { AlertLevel } from "./constants";

// ── Result type ─────────────────────────────────────────────────────────

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── getCreditBalance ────────────────────────────────────────────────────

export async function getCreditBalance(
  input: { organizationId: string }
): Promise<ActionResult<CreditBalance>> {
  try {
    const user = await unifiedGetUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const parsed = getCreditBalanceSchema.parse(input);
    const service = new CreditService(parsed.organizationId);
    const balance = await service.checkBalance();

    return { success: true, data: balance };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get credit balance",
    };
  }
}

// ── purchaseCreditPack ──────────────────────────────────────────────────

export async function purchaseCreditPack(
  input: { organizationId: string; packId: string }
): Promise<ActionResult<{ newIncluded: number }>> {
  try {
    const user = await unifiedGetUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Only admins can purchase credit packs
    if (user.role !== "admin") {
      return { success: false, error: "Only administrators can purchase credit packs" };
    }

    const parsed = purchaseCreditPackSchema.parse(input);
    const service = new CreditService(parsed.organizationId);
    const result = await service.purchaseCreditPack(parsed.packId);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to purchase credit pack",
    };
  }
}

// ── getCreditUsageReport ────────────────────────────────────────────────

export async function getCreditUsageReport(
  input: { organizationId: string; startDate: string; endDate: string }
): Promise<ActionResult<CreditUsageReport>> {
  try {
    const user = await unifiedGetUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const parsed = getCreditUsageReportSchema.parse(input);
    const service = new CreditService(parsed.organizationId);

    const [balance, currentPeriod, monthlySummary] = await Promise.all([
      service.checkBalance(),
      service.getCurrentPeriodUsage(),
      service.getMonthlyUsageSummary(),
    ]);

    return {
      success: true,
      data: { balance, currentPeriod, monthlySummary },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get credit usage report",
    };
  }
}

// ── checkCreditAlerts ───────────────────────────────────────────────────

export async function checkCreditAlerts(
  input: { organizationId: string }
): Promise<ActionResult<{ alertLevel: AlertLevel; balance: CreditBalance }>> {
  try {
    const user = await unifiedGetUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const parsed = creditAlertCheckSchema.parse(input);
    const service = new CreditService(parsed.organizationId);
    const balance = await service.checkBalance();

    return {
      success: true,
      data: { alertLevel: balance.alertLevel, balance },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check credit alerts",
    };
  }
}

// ── getUsageHistory ─────────────────────────────────────────────────────

export async function getUsageHistory(
  input: { organizationId: string; months?: number }
): Promise<ActionResult<Awaited<ReturnType<CreditService["getUsageHistory"]>>>> {
  try {
    const user = await unifiedGetUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const service = new CreditService(input.organizationId);
    const history = await service.getUsageHistory(input.months ?? 6);

    return { success: true, data: history };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get usage history",
    };
  }
}
