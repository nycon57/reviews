'use client';

import { motion } from 'framer-motion';
import {
  Coins,
  TrendUp,
  Calendar,
  Warning,
  ArrowUp,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fadeInUp } from '@/lib/motion/variants';
import type { CreditBalance, CurrentPeriodUsage } from '@/lib/sms/credits/types';
import type { AlertLevel } from '@/lib/sms/credits/constants';

interface CreditBalanceCardProps {
  balance: CreditBalance;
  usage: CurrentPeriodUsage;
}

function CircularProgress({
  used,
  total,
  alertLevel,
}: {
  used: number;
  total: number;
  alertLevel: AlertLevel;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = total > 0 ? total : 1;
  const percentage = Math.min((used / safeTotal) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  const strokeColor = {
    none: 'stroke-repwell-sage-200',
    warning: 'stroke-amber-400',
    critical: 'stroke-orange-500',
    exceeded: 'stroke-red-500',
  }[alertLevel];

  const bgColor = {
    none: 'text-repwell-sage-200',
    warning: 'text-amber-500',
    critical: 'text-orange-500',
    exceeded: 'text-red-500',
  }[alertLevel];

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-repwell-sage-100/50"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={strokeColor}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold tabular-nums ${bgColor}`}>
          {Math.round(percentage)}%
        </span>
        <span className="text-xs text-repwell-teal-300">used</span>
      </div>
    </div>
  );
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CreditBalanceCard({ balance, usage }: CreditBalanceCardProps) {
  const periodStart = new Date(balance.periodStart).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const periodEnd = new Date(balance.periodEnd).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div variants={fadeInUp}>
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
            <Coins weight="duotone" className="h-5 w-5" />
            Current Balance
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-repwell-teal-300">
            <Calendar weight="duotone" className="h-3.5 w-3.5" />
            {periodStart} &ndash; {periodEnd}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <CircularProgress
            used={balance.used}
            total={balance.included}
            alertLevel={balance.alertLevel}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-0.5">
              <p className="text-2xl font-bold text-repwell-teal-500 tabular-nums">
                {balance.remaining.toLocaleString()}
              </p>
              <p className="text-xs text-repwell-teal-300">Credits remaining</p>
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-2xl font-bold text-repwell-teal-500 tabular-nums">
                {balance.used.toLocaleString()}
              </p>
              <p className="text-xs text-repwell-teal-300">
                of {balance.included.toLocaleString()} used
              </p>
            </div>
          </div>

          {balance.overage > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
              <ArrowUp weight="bold" className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-orange-700">
                  {balance.overage.toLocaleString()} overage
                </span>
                <span className="text-orange-600">
                  {' '}&middot; {formatCents(balance.overageCostCents)} estimated
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-repwell-teal-300">
                <TrendUp weight="bold" className="h-3 w-3" />
                Est. cost this period
              </div>
              <p className="text-sm font-semibold text-repwell-teal-500 tabular-nums">
                {formatCents(balance.overageCostCents)}
              </p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-repwell-teal-300">
                <Calendar weight="bold" className="h-3 w-3" />
                Days remaining
              </div>
              <p className="text-sm font-semibold text-repwell-teal-500 tabular-nums">
                {usage.daysRemaining}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Alert banner displayed when usage thresholds are crossed
export function UsageAlertBanner({ alertLevel, onBuyCredits }: { alertLevel: AlertLevel; onBuyCredits: () => void }) {
  if (alertLevel === 'none') return null;

  const config = {
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-500',
      title: '75% of credits used',
      text: 'You\'re approaching your credit limit for this period.',
      btn: 'bg-amber-500 hover:bg-amber-600',
    },
    critical: {
      bg: 'bg-orange-50 border-orange-200',
      icon: 'text-orange-500',
      title: '90% of credits used',
      text: 'You\'re close to exceeding your included credits.',
      btn: 'bg-orange-500 hover:bg-orange-600',
    },
    exceeded: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-500',
      title: 'Credits exceeded',
      text: 'You\'ve exceeded your included credits. Overage charges may apply.',
      btn: 'bg-red-500 hover:bg-red-600',
    },
  }[alertLevel];

  return (
    <motion.div variants={fadeInUp}>
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${config.bg}`}>
        <Warning weight="duotone" className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.icon}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-repwell-teal-500">{config.title}</p>
          <p className="text-sm text-repwell-teal-400 mt-0.5">{config.text}</p>
        </div>
        <button
          onClick={onBuyCredits}
          className={`text-xs font-medium text-white px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${config.btn}`}
        >
          Buy credits
        </button>
      </div>
    </motion.div>
  );
}
