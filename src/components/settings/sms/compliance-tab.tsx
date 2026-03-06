'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Info,
  Warning,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';
import { getSmsSettings } from '@/lib/sms/settings/actions';
import { getComplianceHealthScore, type ComplianceHealthScore } from '@/lib/sms/compliance/actions';
import type { SmsSettings } from '@/lib/sms/types';
import { QuietHoursForm } from './quiet-hours-form';
import { OptOutSettingsForm } from './opt-out-settings-form';
import { ConsentLanguageForm } from './consent-language-form';
import { ComplianceReport } from './compliance-report';

export function ComplianceTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [healthScore, setHealthScore] = useState<ComplianceHealthScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsResult, healthResult] = await Promise.all([
        getSmsSettings(),
        getComplianceHealthScore(),
      ]);

      if (settingsResult.success && settingsResult.data) {
        setSettings(settingsResult.data);
      }
      if (healthResult.success && healthResult.data) {
        setHealthScore(healthResult.data);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load compliance settings', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-32 w-full bg-muted rounded-xl" />
        <div className="h-48 w-full bg-muted rounded-xl" />
        <div className="h-48 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <Warning weight="duotone" className="h-7 w-7 text-amber-500" />
        </div>
        <div>
          <p className="text-lg font-semibold text-heading">SMS not configured</p>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your Twilio credentials in the SMS tab before configuring compliance settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-2xl font-bold text-heading tracking-tight">
          SMS Compliance
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Configure quiet hours, opt-out behavior, consent language, and view compliance reports.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quiet Hours */}
          <motion.div variants={fadeInUp}>
            <QuietHoursForm settings={settings} onSaved={loadData} />
          </motion.div>

          {/* Opt-Out Settings */}
          <motion.div variants={fadeInUp}>
            <OptOutSettingsForm settings={settings} onSaved={loadData} />
          </motion.div>

          {/* Consent Language */}
          <motion.div variants={fadeInUp}>
            <ConsentLanguageForm settings={settings} onSaved={loadData} />
          </motion.div>

          {/* Compliance Report */}
          <motion.div variants={fadeInUp}>
            <ComplianceReport />
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Health Score */}
          <motion.div variants={fadeInUp}>
            <HealthScoreCard score={healthScore} />
          </motion.div>

          {/* Info Cards */}
          <motion.div variants={fadeInUp}>
            <ComplianceInfoCards />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function HealthScoreCard({ score }: { score: ComplianceHealthScore | null }) {
  if (!score) return null;

  const scoreLevel = (value: number) => {
    if (value >= 80) return { text: 'text-repwell-sage-200', bg: 'bg-repwell-sage-200/10' };
    if (value >= 50) return { text: 'text-amber-500', bg: 'bg-amber-50' };
    return { text: 'text-red-500', bg: 'bg-red-50' };
  };

  const items = [
    { label: 'Quiet hours configured', ok: score.details.quietHoursConfigured },
    { label: '10DLC registered', ok: score.details.tenDlcRegistered },
    { label: 'Consent language present', ok: score.details.consentLanguagePresent },
    { label: 'Opt-out rate healthy', ok: score.details.optOutRateHealthy },
    { label: 'Double opt-in enabled', ok: score.details.doubleOptInEnabled },
  ];

  return (
    <Card className="border-border/50 sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-heading flex items-center gap-2">
          <ShieldCheck weight="duotone" className="h-5 w-5" />
          Compliance Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Circle */}
        <div className="flex justify-center">
          <div className={`w-24 h-24 rounded-full ${scoreLevel(score.score).bg} flex items-center justify-center`}>
            <span className={`text-3xl font-bold ${scoreLevel(score.score).text}`}>
              {score.score}%
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2 pt-2">
          {items.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 text-sm">
                {item.ok ? (
                  <CheckCircle weight="fill" className="h-4 w-4 text-repwell-sage-200 flex-shrink-0" />
                ) : (
                  <XCircle weight="fill" className="h-4 w-4 text-red-400 flex-shrink-0" />
                )}
                <span className={item.ok ? 'text-label' : 'text-repwell-teal-300'}>
                  {item.label}
                </span>
              </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ComplianceInfoCards() {
  const cards = [
    {
      title: 'TCPA Requirements',
      description:
        'The TCPA requires prior express written consent before sending marketing SMS. Messages must not be sent during quiet hours (9 PM\u20138 AM local time).',
      badge: 'Federal Law',
      badgeColor: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50',
    },
    {
      title: 'CAN-SPAM Compliance',
      description:
        'CAN-SPAM principles extend to commercial SMS. Honor opt-out requests immediately and include your business identity in every message.',
      badge: 'Best Practice',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'RESPA Restrictions',
      description:
        'RESPA prohibits kickbacks for referrals. SMS review requests must not offer incentives for positive reviews.',
      badge: 'Mortgage Specific',
      badgeColor: 'bg-purple-50 text-purple-600 border-purple-200',
    },
  ];

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info weight="duotone" className="h-4 w-4 text-repwell-teal-300 flex-shrink-0" />
                <h4 className="text-sm font-semibold text-heading">{card.title}</h4>
              </div>
              <Badge variant="outline" className={`text-xs ${card.badgeColor} border`}>
                {card.badge}
              </Badge>
            </div>
            <p className="text-xs text-repwell-teal-300 leading-relaxed">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
