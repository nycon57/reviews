"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PlugsConnected,
  GoogleLogo,
  SlackLogo,
  ArrowRight,
  CheckCircle,
  ArrowSquareOut as ExternalLink,
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GoogleIntegrationCard } from "@/components/google/google-integration-card";
import { SocialIntegrationCard } from "@/components/social";
import { SlackIntegrationCard, TeamsIntegrationCard } from "@/components/integrations";
import { SalesforceIntegrationCard } from "@/components/salesforce";
import { fadeInUp, staggerContainer } from "@/lib/motion/variants";
import { getOrgIntegrationSettings, type OrgIntegrations } from "@/lib/organization";

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
      <div className="rounded-lg bg-repwell-sage-100/50 p-2 transition-colors group-hover:bg-repwell-sage-200/50 dark:bg-repwell-teal-300/15">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-heading-accent">{title}</p>
        <p className="truncate text-xs text-repwell-teal-300">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-repwell-teal-300 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
    </>
  );

  const className =
    "w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10 transition-colors text-left group";

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
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15">
          <PlugsConnected weight="duotone" className="h-7 w-7 text-repwell-teal-300" />
        </div>
        <h3 className="text-lg font-semibold text-heading-accent">No Integrations Available</h3>
        <p className="mt-2 max-w-sm text-sm text-repwell-teal-300">
          Your organization administrator has not enabled any integrations. Contact your admin to
          request access.
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

  const googleEnabled = isEnabled(integrations, "google");
  const socialEnabled = isEnabled(integrations, "social");
  const slackEnabled = isEnabled(integrations, "slack");
  const teamsEnabled = isEnabled(integrations, "teams");
  const salesforceEnabled = isEnabled(integrations, "salesforce");

  const anyEnabled =
    googleEnabled || socialEnabled || slackEnabled || teamsEnabled || salesforceEnabled;

  // Show empty state only after loading confirms all are disabled
  if (loaded && !anyEnabled) {
    return (
      <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
        <motion.div variants={fadeInUp}>
          <h2 className="font-display text-2xl font-bold tracking-tight text-heading-accent">
            Connected Services
          </h2>
          <p className="mt-1 text-repwell-teal-300">
            Manage integrations with external platforms to sync reviews, publish testimonials, and
            more.
          </p>
        </motion.div>
        <motion.div variants={fadeInUp}>
          <EmptyState />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-2xl font-bold tracking-tight text-heading-accent">
          Connected Services
        </h2>
        <p className="mt-1 text-repwell-teal-300">
          Manage integrations with external platforms to sync reviews, publish testimonials, and
          more.
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Integration Status Hero Card */}
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-repwell-sage-200 to-repwell-teal-300 px-6 py-8 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                        <PlugsConnected weight="duotone" className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Integration Status</p>
                        <h3 className="text-2xl font-bold">Connected Services</h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {googleEnabled && (
                        <Badge className="border border-white/30 bg-white/20 text-white">
                          <GoogleLogo weight="bold" className="mr-1 h-3 w-3" />
                          Google
                        </Badge>
                      )}
                      {slackEnabled && (
                        <Badge className="border border-white/30 bg-white/20 text-white">
                          <SlackLogo weight="bold" className="mr-1 h-3 w-3" />
                          Slack
                        </Badge>
                      )}
                      {socialEnabled && (
                        <Badge className="border border-white/30 bg-white/20 text-white">
                          Social
                        </Badge>
                      )}
                      {salesforceEnabled && (
                        <Badge className="border border-white/30 bg-white/20 text-white">
                          Salesforce
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-sm text-white/90">
                  Connect your accounts to automatically sync reviews, share testimonials, and
                  streamline your workflow.
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

          {salesforceEnabled && (
            <motion.div variants={fadeInUp} data-integration="salesforce">
              <Suspense fallback={<IntegrationCardSkeleton />}>
                <SalesforceIntegrationCard />
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
          <Card className="sticky top-6 h-fit border-border/50">
            <CardContent className="space-y-4 p-6">
              <h4 className="font-semibold text-heading-accent">Quick Connect</h4>

              <div className="space-y-3">
                {googleEnabled && (
                  <QuickActionButton
                    icon={<GoogleLogo weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                    title="Connect Google"
                    description="Sync Google Business reviews"
                    onClick={() => {
                      const element = document.querySelector('[data-integration="google"]');
                      element?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                )}

                {salesforceEnabled && (
                  <QuickActionButton
                    icon={
                      <PlugsConnected weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                    }
                    title="Connect Salesforce"
                    description="Sync CRM contacts and opportunities"
                    onClick={() => {
                      const element = document.querySelector('[data-integration="salesforce"]');
                      element?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                      element?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  />
                )}

                <QuickActionButton
                  icon={<ExternalLink weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="View Documentation"
                  description="Learn about integrations"
                  href="/docs/integrations/webhooks"
                />
              </div>

              {/* Integration Benefits */}
              <div className="space-y-3 border-t border-border/50 pt-4">
                <p className="text-xs font-medium text-heading-accent">Why Connect?</p>
                <ul className="space-y-2">
                  {[
                    "Auto-sync reviews from Google",
                    "Share testimonials to social media",
                    "Get instant Slack notifications",
                    "Sync data with your CRM",
                  ].map((benefit, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-xs text-repwell-teal-300"
                    >
                      <CheckCircle
                        weight="duotone"
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-repwell-sage-200"
                      />
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
