'use client';

import { Suspense } from 'react';
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
      <div className="p-2 rounded-lg bg-repwell-sage-100/50 group-hover:bg-repwell-sage-200/50 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-repwell-teal-500">{title}</p>
        <p className="text-xs text-repwell-teal-300 truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-repwell-teal-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </>
  );

  const className = "w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 hover:bg-repwell-sage-100/50 transition-colors text-left group";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function IntegrationsTab() {
  // In a real implementation, these would come from a hook or server action
  const connectedCount = 0; // Would be calculated from actual connection states
  const totalIntegrations = 5;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-2xl font-bold text-repwell-teal-500 tracking-tight">
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
                          {connectedCount} of {totalIntegrations} Connected
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-white/20 text-white border-white/30 border">
                        <GoogleLogo weight="bold" className="h-3 w-3 mr-1" />
                        Google
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 border">
                        <SlackLogo weight="bold" className="h-3 w-3 mr-1" />
                        Slack
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 border">
                        Social
                      </Badge>
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
          <motion.div variants={fadeInUp}>
            <Suspense fallback={<IntegrationCardSkeleton />}>
              <GoogleIntegrationCard />
            </Suspense>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Suspense fallback={<IntegrationCardSkeleton />}>
              <SocialIntegrationCard />
            </Suspense>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Suspense fallback={<IntegrationCardSkeleton />}>
              <SlackIntegrationCard />
            </Suspense>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Suspense fallback={<IntegrationCardSkeleton />}>
              <TeamsIntegrationCard />
            </Suspense>
          </motion.div>
        </div>

        {/* Right Column - Quick Actions */}
        <motion.div variants={fadeInUp}>
          <Card className="h-fit border-border/50 sticky top-6">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-repwell-teal-500">Quick Connect</h4>

              <div className="space-y-3">
                <QuickActionButton
                  icon={<GoogleLogo weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="Connect Google"
                  description="Sync Google Business reviews"
                  onClick={() => {
                    const element = document.querySelector('[data-integration="google"]');
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />

                <QuickActionButton
                  icon={<SlackLogo weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="Connect Slack"
                  description="Get review notifications"
                  onClick={() => {
                    const element = document.querySelector('[data-integration="slack"]');
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />

                <QuickActionButton
                  icon={<ExternalLink weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="View Documentation"
                  description="Learn about integrations"
                  href="/developers/docs"
                />
              </div>

              {/* Integration Benefits */}
              <div className="pt-4 border-t border-border/50 space-y-3">
                <p className="text-xs font-medium text-repwell-teal-500">Why Connect?</p>
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
