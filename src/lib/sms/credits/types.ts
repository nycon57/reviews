import { z } from "zod";
import type { AlertLevel } from "./constants";

// ── Credit balance result ───────────────────────────────────────────────

export interface CreditBalance {
  remaining: number;
  used: number;
  included: number;
  overage: number;
  overageRateCents: number;
  overageCostCents: number;
  periodStart: string;
  periodEnd: string;
  alertLevel: AlertLevel;
  overageAllowed: boolean;
}

// ── Usage history entry ─────────────────────────────────────────────────

export interface UsageHistoryEntry {
  periodStart: string;
  periodEnd: string;
  included: number;
  used: number;
  overage: number;
  overageCostCents: number;
}

// ── Current period usage ────────────────────────────────────────────────

export interface CurrentPeriodUsage {
  totalSent: number;
  totalSegments: number;
  totalCostCents: number;
  averageCostPerMessageCents: number;
  daysRemaining: number;
  dailyStats: DailyUsageStat[];
}

export interface DailyUsageStat {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
  segments: number;
  costCents: number;
}

// ── Monthly usage summary ───────────────────────────────────────────────

export interface MonthlyUsageSummary {
  totalSent: number;
  totalSegments: number;
  totalCostCents: number;
  averageCostPerReviewCents: number;
  reviewsGenerated: number;
  periodStart: string;
  periodEnd: string;
}

// ── Credit usage report ─────────────────────────────────────────────────

export interface CreditUsageReport {
  balance: CreditBalance;
  currentPeriod: CurrentPeriodUsage;
  monthlySummary: MonthlyUsageSummary;
}

// ── Zod schemas ─────────────────────────────────────────────────────────

export const deductCreditSchema = z.object({
  organizationId: z.string().uuid(),
  segments: z.number().int().positive(),
});

export const getUsageHistorySchema = z.object({
  organizationId: z.string().uuid(),
  months: z.number().int().min(1).max(24).default(6),
});

export const getCurrentPeriodUsageSchema = z.object({
  organizationId: z.string().uuid(),
});

export const purchaseCreditPackSchema = z.object({
  organizationId: z.string().uuid(),
  packId: z.enum(["pack_100", "pack_500", "pack_1000"]),
});

export const getCreditBalanceSchema = z.object({
  organizationId: z.string().uuid(),
});

export const creditAlertCheckSchema = z.object({
  organizationId: z.string().uuid(),
});
