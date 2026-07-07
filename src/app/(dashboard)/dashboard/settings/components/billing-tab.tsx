'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CreditCard,
  Calendar,
  Lightning as Zap,
  Warning as AlertTriangle,
  Crown,
  SpinnerGap as Loader2,
  EnvelopeSimple,
  Sparkle,
  ArrowRight,
  ShieldCheck,
} from '@phosphor-icons/react';
import {
  getBillingOverview,
  createPortalSession,
  type BillingOverview,
  isStripeAvailable,
} from '@/lib/stripe';

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  active: { label: 'Active', variant: 'default', className: 'bg-repwell-sage-200/20 text-repwell-sage-200 border-repwell-sage-200/30' },
  trialing: { label: 'Trial', variant: 'secondary', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  past_due: { label: 'Past Due', variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200' },
  canceled: { label: 'Canceled', variant: 'outline', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelled', variant: 'outline', className: 'bg-muted text-muted-foreground border-border' },
  paused: { label: 'Paused', variant: 'outline', className: 'bg-muted text-muted-foreground border-border' },
  unpaid: { label: 'Unpaid', variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200' },
};

const TIER_CONFIG: Record<string, { name: string; gradient: string; icon: React.ReactNode }> = {
  basic: { name: 'Basic', gradient: 'from-repwell-sage-200 to-repwell-teal-300', icon: <Zap weight="duotone" className="h-6 w-6" /> },
  pro: { name: 'Pro', gradient: 'from-repwell-teal-300 to-repwell-teal-400', icon: <Crown weight="duotone" className="h-6 w-6" /> },
  enterprise: { name: 'Enterprise', gradient: 'from-repwell-teal-400 to-repwell-teal-500', icon: <ShieldCheck weight="duotone" className="h-6 w-6" /> },
};

export function BillingTab() {
  const router = useRouter();
  const [billingData, setBillingData] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const stripeAvailable = isStripeAvailable();
  const isAdmin = billingData?.userRole === 'admin';

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const result = await getBillingOverview();
        if (mounted && result.success && result.data) {
          setBillingData(result.data);
        }
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const currentTier = billingData?.tier?.id || 'basic';
  const currentStatus = billingData?.subscription?.status || 'active';
  const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.basic;
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.active;

  const { isTrialing, daysRemaining } = useMemo(() => {
    const trialEnd = billingData?.subscription?.trialEnd;
    const now = new Date();
    const trialing = currentStatus === 'trialing' && trialEnd && trialEnd > now;
    const days = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    return { isTrialing: trialing, daysRemaining: days };
  }, [currentStatus, billingData]);

  const subscriptionEndsAt = billingData?.subscription?.currentPeriodEnd;
  const hasPaidSubscription = stripeAvailable;

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const result = await createPortalSession();
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
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
          Billing & Subscription
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Manage your subscription, view usage, and update payment methods.
        </p>
      </motion.div>

      {/* Trial Alert */}
      {isTrialing && (
        <motion.div variants={fadeInUp}>
          <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-800/50">
            <Zap weight="duotone" className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800 font-semibold">Trial Period Active</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your trial ends in <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>.
              {isAdmin
                ? ' Upgrade now to continue using all features.'
                : ' Contact your administrator to manage billing.'}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Past Due Alert */}
      {currentStatus === 'past_due' && (
        <motion.div variants={fadeInUp}>
          <Alert variant="destructive" className="border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 dark:border-red-800/50">
            <AlertTriangle weight="duotone" className="h-5 w-5" />
            <AlertTitle className="font-semibold">Payment Past Due</AlertTitle>
            <AlertDescription>
              Your payment is past due.
              {isAdmin
                ? ' Please update your payment method to avoid service interruption.'
                : ' Contact your administrator to resolve billing issues.'}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current Plan Card */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card className="overflow-hidden border-0 shadow-lg">
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${tierConfig.gradient} px-6 py-8 text-white`}>
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      {tierConfig.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">Current Plan</p>
                      <h3 className="text-2xl font-bold">{tierConfig.name}</h3>
                    </div>
                  </div>
                  <Badge className={`${statusConfig.className} border`}>
                    {statusConfig.label}
                  </Badge>
                </div>

                {billingData?.subscription?.cancelAtPeriodEnd && (
                  <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                    Cancels at period end
                  </Badge>
                )}
              </div>

              {subscriptionEndsAt && (
                <div className="mt-6 flex items-center gap-3 text-white/90">
                  <Calendar weight="duotone" className="h-5 w-5" />
                  <span className="text-sm">
                    {billingData?.subscription?.cancelAtPeriodEnd
                      ? 'Access ends '
                      : 'Next billing '}
                    <strong>
                      {subscriptionEndsAt.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Card Body */}
            <CardContent className="p-6 space-y-6">
              <p className="text-repwell-teal-400 dark:text-repwell-sage-100/80">
                {billingData?.tier?.description || 'Get started with basic features to manage your reputation.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {hasPaidSubscription && (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white shadow-md"
                  >
                    {portalLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard weight="duotone" className="mr-2 h-4 w-4" />
                    )}
                    Manage Subscription
                  </Button>
                )}

                {currentTier !== 'enterprise' && (
                  <Button
                    variant="outline"
                    onClick={() => router.push('/pricing')}
                    className="border-repwell-teal-300 text-repwell-teal-400 dark:text-repwell-sage-100/80 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10"
                  >
                    View All Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions Card */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full border-border/50">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-heading-accent">Quick Actions</h4>

              {hasPaidSubscription ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 group-hover:bg-repwell-sage-200/50 transition-colors">
                      <CreditCard weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-heading-accent">Update Payment</p>
                      <p className="text-xs text-repwell-teal-300">Change card or billing info</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 group-hover:bg-repwell-sage-200/50 transition-colors">
                      <EnvelopeSimple weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-heading-accent">View Invoices</p>
                      <p className="text-xs text-repwell-teal-300">Download past invoices</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 group-hover:bg-repwell-sage-200/50 transition-colors">
                      <Crown weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-heading-accent">Change Plan</p>
                      <p className="text-xs text-repwell-teal-300">Upgrade or downgrade</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 mx-auto bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 rounded-xl flex items-center justify-center">
                    <Sparkle weight="duotone" className="h-6 w-6 text-repwell-teal-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading-accent">Unlock More Features</p>
                    <p className="text-xs text-repwell-teal-300 mt-1">
                      Upgrade to access advanced analytics, AI insights, and more.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/pricing')}
                    size="sm"
                    className="w-full bg-repwell-teal-300 hover:bg-repwell-teal-400"
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Non-Admin Info Card */}
      {!isAdmin && hasPaidSubscription && (
        <motion.div variants={fadeInUp}>
          <Card className="border-repwell-sage-200/30 bg-gradient-to-r from-repwell-sage-100/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10">
                  <CreditCard weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-heading-accent">Need to make billing changes?</h4>
                  <p className="text-sm text-repwell-teal-300">
                    Billing management is available to organization administrators.
                    Contact your admin to upgrade plans, update payment methods, or manage your subscription.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
}
