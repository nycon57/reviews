'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PlugsConnected,
  GoogleLogo,
  SlackLogo,
  ArrowRight,
  CheckCircle,
  ArrowSquareOut as ExternalLink,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GoogleIntegrationCard } from '@/components/google/google-integration-card';
import { SocialIntegrationCard } from '@/components/social';
import { SlackIntegrationCard, TeamsIntegrationCard } from '@/components/integrations';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';
import { getOrgIntegrationSettings, type OrgIntegrations } from '@/lib/organization';

function IntegrationCardSkeleton() {
  return (
    <Card className="border border-border/50 shadow-sm">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
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

  const className = "w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10 transition-colors text-left group";

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

function isEnabled(integrations: OrgIntegrations | null, key: keyof OrgIntegrations): boolean {
  if (!integrations) return true; // default all enabled until loaded
  return integrations[key]?.enabled !== false;
}

function EmptyState() {
  return (
    <Card className="border-2 border-dashed border-border/60">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 mb-4">
          <PlugsConnected weight="duotone" className="h-7 w-7 text-repwell-teal-300" />
        </div>
        <h3 className="text-lg font-semibold text-heading-accent">
          No Integrations Available
        </h3>
        <p className="mt-2 max-w-sm text-sm text-repwell-teal-300">
          Your organization administrator has not enabled any integrations. Contact your admin to request access.
        </p>
      </CardContent>
    </Card>
  );
}

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<OrgIntegrations | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getOrgIntegrationSettings().then(({ integrations: data, error }) => {
      if (!error && data) {
        setIntegrations(data);
      }
      // On error (e.g. individual user with no org) → integrations stays null → all shown
      setLoaded(true);
    });
  }, []);

  const googleEnabled = isEnabled(integrations, 'google');
  const socialEnabled = isEnabled(integrations, 'social');
  const slackEnabled = isEnabled(integrations, 'slack');
  const teamsEnabled = isEnabled(integrations, 'teams');

  const anyEnabled = googleEnabled || socialEnabled || slackEnabled || teamsEnabled;

  // Show empty state only after loading confirms all are disabled
  if (loaded && !anyEnabled) {
    return (
      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerContainer}
        className="space-y-8"
      >
        <motion.div variants={fadeInUp}>
          <h2 className="font-display text-2xl font-bold text-heading-accent tracking-tight">
            Connected Services
          </h2>
          <p className="text-repwell-teal-300 mt-1">
            Manage integrations with external platforms to sync reviews, publish testimonials, and more.
          </p>
        </motion.div>
        <motion.div variants={fadeInUp}>
          <EmptyState />
        </motion.div>
      </motion.div>
    );
  }

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
          Connected Services
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Manage integrations with external platforms to sync reviews, publish testimonials, and more.
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Integration Status Hero Card */}
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-repwell-sage-200 to-repwell-teal-300 px-6 py-8 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <PlugsConnected weight="duotone" className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Integration Status</p>
                        <h3 className="text-2xl font-bold">
                          Connected Services
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {googleEnabled && (
                        <Badge className="bg-white/20 text-white border-white/30 border">
                          <GoogleLogo weight="bold" className="h-3 w-3 mr-1" />
                          Google
                        </Badge>
                      )}
                      {slackEnabled && (
                        <Badge className="bg-white/20 text-white border-white/30 border">
                          <SlackLogo weight="bold" className="h-3 w-3 mr-1" />
                          Slack
                        </Badge>
                      )}
                      {socialEnabled && (
                        <Badge className="bg-white/20 text-white border-white/30 border">
                          Social
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-white/90 text-sm">
                  Connect your accounts to automatically sync reviews, share testimonials, and streamline your workflow.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Integration Cards */}
          {googleEnabled && (
            <motion.div variants={fadeInUp}>
              <Suspense fallback={<IntegrationCardSkeleton />}>
                <GoogleIntegrationCard />
              </Suspense>
            </motion.div>
          )}

          {socialEnabled && (
            <motion.div variants={fadeInUp}>
              <Suspense fallback={<IntegrationCardSkeleton />}>
                <SocialIntegrationCard />
              </Suspense>
            </motion.div>
          )}

          {slackEnabled && (
            <motion.div variants={fadeInUp}>
              <Suspense fallback={<IntegrationCardSkeleton />}>
                <SlackIntegrationCard />
              </Suspense>
            </motion.div>
          )}

          {teamsEnabled && (
            <motion.div variants={fadeInUp}>
              <Suspense fallback={<IntegrationCardSkeleton />}>
                <TeamsIntegrationCard />
              </Suspense>
            </motion.div>
          )}
        </div>

        {/* Right Column - Quick Actions */}
        <motion.div variants={fadeInUp}>
          <Card className="h-fit border-border/50 sticky top-6">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-heading-accent">Quick Connect</h4>

              <div className="space-y-3">
                {googleEnabled && (
                  <QuickActionButton
                    icon={<GoogleLogo weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                    title="Connect Google"
                    description="Sync Google Business reviews"
                    onClick={() => {
                      const element = document.querySelector('[data-integration="google"]');
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                )}

                {slackEnabled && (
                  <QuickActionButton
                    icon={<SlackLogo weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                    title="Connect Slack"
                    description="Get review notifications"
                    onClick={() => {
                      const element = document.querySelector('[data-integration="slack"]');
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                )}

                <QuickActionButton
                  icon={<ExternalLink weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="View Documentation"
                  description="Learn about integrations"
                  href="/developers/docs"
                />
              </div>

              {/* Integration Benefits */}
              <div className="pt-4 border-t border-border/50 space-y-3">
                <p className="text-xs font-medium text-heading-accent">Why Connect?</p>
                <ul className="space-y-2">
                  {[
                    'Auto-sync reviews from Google',
                    'Share testimonials to social media',
                    'Get instant Slack notifications',
                    'Sync data with your CRM',
                  ].map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-repwell-teal-300">
                      <CheckCircle weight="duotone" className="h-4 w-4 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
                      {benefit}
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
