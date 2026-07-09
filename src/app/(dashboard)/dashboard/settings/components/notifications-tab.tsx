'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Bell,
  EnvelopeSimple,
  SlackLogo,
  DeviceMobile,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { NotificationPreferencesCard } from '@/components/notifications';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';

function NotificationsSkeleton() {
  return (
    <Card className="border border-border/50 shadow-sm">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}

function QuickActionButton({ icon, title, description, href, onClick }: QuickActionButtonProps) {
  const content = (
    <>
      <div className="p-2 rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 group-hover:bg-repwell-sage-200/50 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-heading-accent">{title}</p>
        <p className="text-xs text-repwell-teal-300 truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-repwell-teal-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </>
  );

  const className = "w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/20 transition-colors text-left group";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function NotificationsTab() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-2xl font-bold text-heading-accent tracking-tight">
          Notification Preferences
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Choose how and when you want to be notified about reviews, surveys, and account activity.
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Status Hero Card */}
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200 px-6 py-8 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Bell weight="duotone" className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Notification Channels</p>
                        <h3 className="text-2xl font-bold">
                          Your Preferences
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="border bg-white/20 text-white border-white/30">
                        <DeviceMobile weight="bold" className="h-3 w-3 mr-1" />
                        In-App
                      </Badge>
                      <Badge className="border bg-white/20 text-white border-white/30">
                        <EnvelopeSimple weight="bold" className="h-3 w-3 mr-1" />
                        Email
                      </Badge>
                      <Badge className="border bg-white/20 text-white border-white/30">
                        <SlackLogo weight="bold" className="h-3 w-3 mr-1" />
                        Slack
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-white/90 text-sm">
                  Stay informed about new reviews, request responses, and team activity through your preferred channels.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Notification Preferences Card */}
          <motion.div variants={fadeInUp}>
            <Suspense fallback={<NotificationsSkeleton />}>
              <NotificationPreferencesCard />
            </Suspense>
          </motion.div>
        </div>

        {/* Right Column - Quick Settings */}
        <motion.div variants={fadeInUp}>
          <Card className="h-fit border-border/50 sticky top-6">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-heading-accent">Quick Settings</h4>

              <div className="space-y-3">
                <QuickActionButton
                  icon={<EnvelopeSimple weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="Email Preferences"
                  description="Manage email settings"
                  href="/dashboard/settings/email-preferences"
                />

                <QuickActionButton
                  icon={<SlackLogo weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="Slack Integration"
                  description="Connect to get alerts"
                  onClick={() => {
                    // Navigate to integrations tab
                    const tabTrigger = document.querySelector('[data-state][value="integrations"]');
                    if (tabTrigger instanceof HTMLElement) {
                      tabTrigger.click();
                    }
                  }}
                />
              </div>

              {/* Notification Types */}
              <div className="pt-4 border-t border-border/50 space-y-3">
                <p className="text-xs font-medium text-heading-accent">You&apos;ll Be Notified About</p>
                <ul className="space-y-2">
                  {[
                    'New reviews received',
                    'Survey completions',
                    'Team member activity',
                    'Weekly performance reports',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-repwell-teal-300">
                      <CheckCircle weight="duotone" className="h-4 w-4 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
