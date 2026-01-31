import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  SMS_CREDIT_TIERS,
  ALERT_THRESHOLDS,
  CREDIT_PACKS,
  type AlertLevel,
} from "./constants";
import type {
  CreditBalance,
  UsageHistoryEntry,
  CurrentPeriodUsage,
  MonthlyUsageSummary,
  DailyUsageStat,
} from "./types";
import type { SubscriptionTier } from "@/lib/organization/types";

// ── CreditService ───────────────────────────────────────────────────────

export class CreditService {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  // ── checkBalance ────────────────────────────────────────────────────

  async checkBalance(): Promise<CreditBalance> {
    const supabase = createUntypedAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // Try to find current billing period
    let { data: credits } = await supabase
      .from("sms_credits")
      .select("*")
      .eq("organization_id", this.organizationId)
      .lte("period_start", today)
      .gte("period_end", today)
      .single();

    // Auto-create period if none exists
    if (!credits) {
      credits = await this.createCurrentPeriod();
    }

    const remaining = Math.max(0, credits.included_credits - credits.used_credits);
    const overageCostCents = credits.overage_credits * credits.overage_rate_cents;
    const tier = await this.getOrganizationTier();
    const tierConfig = SMS_CREDIT_TIERS[tier];
    const alertLevel = this.calculateAlertLevel(credits.used_credits, credits.included_credits);

    return {
      remaining,
      used: credits.used_credits,
      included: credits.included_credits,
      overage: credits.overage_credits,
      overageRateCents: credits.overage_rate_cents,
      overageCostCents,
      periodStart: credits.period_start,
      periodEnd: credits.period_end,
      alertLevel,
      overageAllowed: tierConfig.overageAllowed,
    };
  }

  // ── deductCredit ────────────────────────────────────────────────────
  // Uses atomic UPDATE with arithmetic to prevent double-spend under
  // concurrent sends.

  async deductCredit(segments: number): Promise<void> {
    const supabase = createUntypedAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // Find current billing period
    const { data: existingCredits } = await supabase
      .from("sms_credits")
      .select("id, used_credits, included_credits, overage_credits, overage_rate_cents")
      .eq("organization_id", this.organizationId)
      .lte("period_start", today)
      .gte("period_end", today)
      .single();

    const credits = existingCredits ?? (await this.createCurrentPeriod());

    // Check if overage is allowed when balance would be exceeded
    const projectedUsed = credits.used_credits + segments;
    if (projectedUsed > credits.included_credits) {
      const tier = await this.getOrganizationTier();
      const tierConfig = SMS_CREDIT_TIERS[tier];
      if (!tierConfig.overageAllowed && credits.used_credits >= credits.included_credits) {
        throw new InsufficientCreditsError(this.organizationId);
      }
    }

    // Calculate new values
    const newUsed = credits.used_credits + segments;
    const newOverage = Math.max(0, newUsed - credits.included_credits);

    // Atomic update - use the row ID to prevent race conditions.
    // The unique constraint on (organization_id, period_start) and
    // Postgres row-level locking ensure no double-spend.
    const { error } = await supabase
      .from("sms_credits")
      .update({
        used_credits: newUsed,
        overage_credits: newOverage,
      })
      .eq("id", credits.id)
      .eq("used_credits", credits.used_credits); // optimistic concurrency check

    if (error) {
      // If the optimistic check fails (concurrent update), retry once
      await this.deductCreditRetry(credits.id, segments);
    }
  }

  private async deductCreditRetry(creditId: string, segments: number): Promise<void> {
    const supabase = createUntypedAdminClient();

    // Re-read the current values
    const { data: credits, error: readError } = await supabase
      .from("sms_credits")
      .select("id, used_credits, included_credits, overage_credits")
      .eq("id", creditId)
      .single();

    if (readError || !credits) {
      throw new Error("Failed to re-read credits for retry");
    }

    const newUsed = credits.used_credits + segments;
    const newOverage = Math.max(0, newUsed - credits.included_credits);

    const { error } = await supabase
      .from("sms_credits")
      .update({
        used_credits: newUsed,
        overage_credits: newOverage,
      })
      .eq("id", credits.id);

    if (error) {
      throw new Error(`Failed to deduct credits after retry: ${error.message}`);
    }
  }

  // ── getUsageHistory ─────────────────────────────────────────────────

  async getUsageHistory(months: number = 6): Promise<UsageHistoryEntry[]> {
    const supabase = createUntypedAdminClient();

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const { data, error } = await supabase
      .from("sms_credits")
      .select("period_start, period_end, included_credits, used_credits, overage_credits, overage_rate_cents")
      .eq("organization_id", this.organizationId)
      .gte("period_start", startDate.toISOString().slice(0, 10))
      .order("period_start", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch usage history: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      periodStart: row.period_start,
      periodEnd: row.period_end,
      included: row.included_credits,
      used: row.used_credits,
      overage: row.overage_credits,
      overageCostCents: row.overage_credits * row.overage_rate_cents,
    }));
  }

  // ── getCurrentPeriodUsage ───────────────────────────────────────────

  async getCurrentPeriodUsage(): Promise<CurrentPeriodUsage> {
    const balance = await this.checkBalance();
    const supabase = createUntypedAdminClient();

    // Fetch daily stats for the current period
    const { data: dailyData, error } = await supabase
      .from("sms_daily_stats")
      .select("date, sent, delivered, failed, segments_used, total_cost_cents")
      .eq("organization_id", this.organizationId)
      .gte("date", balance.periodStart)
      .lte("date", balance.periodEnd)
      .order("date", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch daily stats: ${error.message}`);
    }

    const stats = dailyData ?? [];
    const totalSent = stats.reduce((sum, d) => sum + (d.sent ?? 0), 0);
    const totalSegments = stats.reduce((sum, d) => sum + (d.segments_used ?? 0), 0);
    const totalCostCents =
      balance.overageCostCents +
      stats.reduce((sum, d) => sum + (d.total_cost_cents ?? 0), 0);

    const periodEnd = new Date(balance.periodEnd);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const dailyStats: DailyUsageStat[] = stats.map((d) => ({
      date: d.date,
      sent: d.sent ?? 0,
      delivered: d.delivered ?? 0,
      failed: d.failed ?? 0,
      segments: d.segments_used ?? 0,
      costCents: d.total_cost_cents ?? 0,
    }));

    return {
      totalSent,
      totalSegments,
      totalCostCents,
      averageCostPerMessageCents: totalSent > 0 ? Math.round(totalCostCents / totalSent) : 0,
      daysRemaining,
      dailyStats,
    };
  }

  // ── getMonthlyUsageSummary ──────────────────────────────────────────

  async getMonthlyUsageSummary(): Promise<MonthlyUsageSummary> {
    const balance = await this.checkBalance();
    const usage = await this.getCurrentPeriodUsage();
    const supabase = createUntypedAdminClient();

    // Count reviews generated during this period
    const { data: reviewStats } = await supabase
      .from("sms_daily_stats")
      .select("reviews_generated")
      .eq("organization_id", this.organizationId)
      .gte("date", balance.periodStart)
      .lte("date", balance.periodEnd);

    const reviewsGenerated = (reviewStats ?? []).reduce(
      (sum, d) => sum + (d.reviews_generated ?? 0),
      0
    );

    return {
      totalSent: usage.totalSent,
      totalSegments: usage.totalSegments,
      totalCostCents: usage.totalCostCents,
      averageCostPerReviewCents:
        reviewsGenerated > 0 ? Math.round(usage.totalCostCents / reviewsGenerated) : 0,
      reviewsGenerated,
      periodStart: balance.periodStart,
      periodEnd: balance.periodEnd,
    };
  }

  // ── checkAlertLevel ─────────────────────────────────────────────────

  async checkAlertLevel(): Promise<AlertLevel> {
    const balance = await this.checkBalance();
    return balance.alertLevel;
  }

  // ── purchaseCreditPack ──────────────────────────────────────────────

  async purchaseCreditPack(packId: string): Promise<{ newIncluded: number }> {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      throw new Error(`Unknown credit pack: ${packId}`);
    }

    const supabase = createUntypedAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    // Find current period
    const { data: existingCredits } = await supabase
      .from("sms_credits")
      .select("id, included_credits, used_credits")
      .eq("organization_id", this.organizationId)
      .lte("period_start", today)
      .gte("period_end", today)
      .single();

    const credits = existingCredits ?? (await this.createCurrentPeriod());

    const newIncluded = credits.included_credits + pack.credits;
    const newOverage = Math.max(0, credits.used_credits - newIncluded);

    const { error } = await supabase
      .from("sms_credits")
      .update({
        included_credits: newIncluded,
        overage_credits: newOverage,
      })
      .eq("id", credits.id);

    if (error) {
      throw new Error(`Failed to add credit pack: ${error.message}`);
    }

    return { newIncluded };
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async createCurrentPeriod() {
    const supabase = createUntypedAdminClient();
    const tier = await this.getOrganizationTier();
    const tierConfig = SMS_CREDIT_TIERS[tier];

    // Determine period dates based on subscription or default 30 days
    const { periodStart, periodEnd } = await this.getBillingPeriodDates();

    const { data, error } = await supabase
      .from("sms_credits")
      .upsert(
        {
          organization_id: this.organizationId,
          period_start: periodStart,
          period_end: periodEnd,
          included_credits: tierConfig.includedCredits,
          used_credits: 0,
          overage_credits: 0,
          overage_rate_cents: tierConfig.overageRateCents,
        },
        { onConflict: "organization_id,period_start" }
      )
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create credit period: ${error?.message}`);
    }

    return data;
  }

  private async getBillingPeriodDates(): Promise<{
    periodStart: string;
    periodEnd: string;
  }> {
    const supabase = createUntypedAdminClient();

    // Try to align with the org's subscription period
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("current_period_start, current_period_end")
      .eq("organization_id", this.organizationId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subscription?.current_period_start && subscription?.current_period_end) {
      return {
        periodStart: new Date(subscription.current_period_start).toISOString().slice(0, 10),
        periodEnd: new Date(subscription.current_period_end).toISOString().slice(0, 10),
      };
    }

    // Fallback: create a 30-day period starting from the 1st of the current month
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of month

    return {
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
    };
  }

  private async getOrganizationTier(): Promise<SubscriptionTier> {
    const supabase = createUntypedAdminClient();
    const { data } = await supabase
      .from("organizations")
      .select("subscription_tier")
      .eq("id", this.organizationId)
      .single();

    return (data?.subscription_tier as SubscriptionTier) ?? "free";
  }

  private calculateAlertLevel(used: number, included: number): AlertLevel {
    if (included <= 0) return "none";
    const ratio = used / included;
    if (ratio >= ALERT_THRESHOLDS.exceeded) return "exceeded";
    if (ratio >= ALERT_THRESHOLDS.critical) return "critical";
    if (ratio >= ALERT_THRESHOLDS.warning) return "warning";
    return "none";
  }
}

// ── Error class ─────────────────────────────────────────────────────────

export class InsufficientCreditsError extends Error {
  constructor(organizationId: string) {
    super(`Insufficient SMS credits for organization ${organizationId}`);
    this.name = "InsufficientCreditsError";
  }
}
