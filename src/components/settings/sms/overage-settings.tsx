'use client';

import { motion } from 'framer-motion';
import {
  Gauge,
  Info,
  TrendUp,
  ShieldCheck,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fadeInUp } from '@/lib/motion/variants';
import type { CreditBalance, CurrentPeriodUsage } from '@/lib/sms/credits/types';

interface OverageSettingsProps {
  balance: CreditBalance;
  usage: CurrentPeriodUsage;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function OverageSettings({ balance, usage }: OverageSettingsProps) {
  // Project overage using 7-day rolling average
  const last7Days = usage.dailyStats.slice(-7);
  const avgDailySegments =
    last7Days.length > 0
      ? last7Days.reduce((sum, d) => sum + d.segments, 0) / last7Days.length
      : 0;
  const projectedTotalSegments = balance.used + avgDailySegments * usage.daysRemaining;
  const projectedOverage = Math.max(0, Math.round(projectedTotalSegments - balance.included));
  const projectedOverageCostCents = projectedOverage * balance.overageRateCents;

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
            <Gauge weight="duotone" className="h-5 w-5" />
            Overage Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between rounded-lg bg-repwell-sage-100/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <ShieldCheck weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
              <div>
                <p className="text-sm font-medium text-repwell-teal-500">Overage sends</p>
                <p className="text-xs text-repwell-teal-300">
                  {balance.overageAllowed
                    ? 'Sends continue after included credits are used'
                    : 'Sends are blocked when included credits are exhausted'}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                balance.overageAllowed
                  ? 'bg-repwell-sage-200/10 text-repwell-sage-200 border-repwell-sage-200/30'
                  : 'bg-red-50 text-red-600 border-red-200'
              }
            >
              {balance.overageAllowed ? 'Allowed' : 'Blocked'}
            </Badge>
          </div>

          {/* Rate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/50 p-4 space-y-1">
              <p className="text-xs text-repwell-teal-300 flex items-center gap-1">
                <Info weight="bold" className="h-3 w-3" />
                Overage rate
              </p>
              <p className="text-lg font-bold text-repwell-teal-500 tabular-nums">
                {formatCents(balance.overageRateCents)}
              </p>
              <p className="text-[10px] text-repwell-teal-300">per segment</p>
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-1">
              <p className="text-xs text-repwell-teal-300 flex items-center gap-1">
                <TrendUp weight="bold" className="h-3 w-3" />
                Projected overage
              </p>
              <p className="text-lg font-bold text-repwell-teal-500 tabular-nums">
                {projectedOverage > 0
                  ? `${projectedOverage.toLocaleString()} credits`
                  : 'None'}
              </p>
              <p className="text-[10px] text-repwell-teal-300">
                {projectedOverage > 0
                  ? `~${formatCents(projectedOverageCostCents)} estimated`
                  : 'On track to stay within plan'}
              </p>
            </div>
          </div>

          {/* Tier note */}
          <div className="flex items-start gap-2 text-xs text-repwell-teal-300">
            <Info weight="duotone" className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <p>
              Overage allowance and rates are determined by your subscription tier.
              Upgrade your plan for a higher credit allotment and lower overage rates.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
