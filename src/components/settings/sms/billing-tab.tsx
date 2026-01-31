'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Warning,
  Receipt,
} from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';
import { staggerContainer, fadeInUp } from '@/lib/motion/variants';
import {
  getCreditBalance,
  getCurrentPeriodUsage,
  getMonthlyUsageSummary,
} from '@/lib/sms/credits/billing-actions';
import { formatCents } from '@/lib/sms/credits/format';
import type { CreditBalance, CurrentPeriodUsage, MonthlyUsageSummary } from '@/lib/sms/credits/types';
import { CreditBalanceCard, UsageAlertBanner } from './credit-balance-card';
import { UsageChart, UsageTable } from './usage-chart';
import { CreditPacksSection } from './credit-packs-section';
import { OverageSettings } from './overage-settings';

export function SmsBillingTab() {
  const { toast } = useToast();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [usage, setUsage] = useState<CurrentPeriodUsage | null>(null);
  const [summary, setSummary] = useState<MonthlyUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const creditPacksRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [balanceResult, usageResult, summaryResult] = await Promise.all([
        getCreditBalance(),
        getCurrentPeriodUsage(),
        getMonthlyUsageSummary(),
      ]);

      if (balanceResult.success && balanceResult.data) setBalance(balanceResult.data);
      if (usageResult.success && usageResult.data) setUsage(usageResult.data);
      if (summaryResult.success && summaryResult.data) setSummary(summaryResult.data);

      if (!balanceResult.success) {
        toast({ title: 'Error', description: balanceResult.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load billing data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scrollToCreditPacks = useCallback(() => {
    creditPacksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 bg-muted rounded-xl" />
          <div className="lg:col-span-2 h-80 bg-muted rounded-xl" />
        </div>
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!balance || !usage) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <Warning weight="duotone" className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <p className="text-lg font-semibold text-repwell-teal-500">SMS not configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your Twilio credentials in the SMS tab before viewing billing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-2xl font-bold text-repwell-teal-500 tracking-tight">
          SMS Billing
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Monitor credit usage, view cost breakdowns, and purchase additional credits.
        </p>
      </motion.div>

      {/* Alert banner */}
      <UsageAlertBanner alertLevel={balance.alertLevel} onBuyCredits={scrollToCreditPacks} />

      {/* Balance + Chart grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balance card (sidebar) */}
        <div className="space-y-6">
          <CreditBalanceCard balance={balance} usage={usage} />

          {/* Cost per review metric */}
          {summary && summary.reviewsGenerated > 0 && (
            <motion.div variants={fadeInUp}>
              <div className="rounded-xl border border-border/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-repwell-teal-300">
                  <Receipt weight="duotone" className="h-3.5 w-3.5" />
                  Cost per review
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-repwell-teal-500 tabular-nums">
                    {formatCents(summary.averageCostPerReviewCents)}
                  </p>
                  <p className="text-xs text-repwell-teal-300">
                    from {summary.reviewsGenerated} review{summary.reviewsGenerated !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Chart area */}
        <div className="lg:col-span-2 space-y-6">
          <UsageChart
            dailyStats={usage.dailyStats}
            periodStart={balance.periodStart}
            periodEnd={balance.periodEnd}
          />
        </div>
      </div>

      {/* Daily breakdown table */}
      <UsageTable dailyStats={usage.dailyStats} />

      {/* Credit packs */}
      <div ref={creditPacksRef}>
        <CreditPacksSection onPurchased={loadData} />
      </div>

      {/* Overage settings */}
      <OverageSettings balance={balance} usage={usage} />
    </motion.div>
  );
}
