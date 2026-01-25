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
  CheckCircle,
  Lightning as Zap,
  Warning as AlertTriangle,
  Crown,
  ArrowSquareOut as ExternalLink,
  SpinnerGap as Loader2,
  Users,
  UserCircle,
  EnvelopeSimple,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Infinity,
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
  canceled: { label: 'Canceled', variant: 'outline', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  cancelled: { label: 'Cancelled', variant: 'outline', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  paused: { label: 'Paused', variant: 'outline', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  unpaid: { label: 'Unpaid', variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-200' },
};

const TIER_CONFIG: Record<string, { name: string; gradient: string; icon: React.ReactNode }> = {
  free: { name: 'Free', gradient: 'from-gray-400 to-gray-500', icon: <Sparkle weight="duotone" className="h-6 w-6" /> },
  starter: { name: 'Starter', gradient: 'from-repwell-sage-200 to-repwell-teal-300', icon: <Zap weight="duotone" className="h-6 w-6" /> },
  professional: { name: 'Professional', gradient: 'from-repwell-teal-300 to-repwell-teal-400', icon: <Crown weight="duotone" className="h-6 w-6" /> },
  enterprise: { name: 'Enterprise', gradient: 'from-repwell-teal-400 to-repwell-teal-500', icon: <ShieldCheck weight="duotone" className="h-6 w-6" /> },
};

interface UsageBarProps {
  label: string;
  current: number;
  max: number;
  icon: React.ReactNode;
}

function UsageBar({ label, current, max, icon }: UsageBarProps) {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
  const isNearLimit = percentage > 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-repwell-teal-400">
          {icon}
          {label}
        </div>
        <span className="text-sm text-repwell-teal-300 font-medium tabular-nums">
          {isUnlimited ? (
            <span className="flex items-center gap-1">
              {current} <Infinity weight="bold" className="h-4 w-4" />
            </span>
          ) : (
            `${current} / ${max}`
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-repwell-sage-100/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className={`h-full rounded-full transition-colors ${
              isNearLimit ? 'bg-amber-400' : 'bg-gradient-to-r from-repwell-sage-200 to-repwell-teal-300'
            }`}
          />
        </div>
      )}
    </div>
  );
}

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

  const currentTier = billingData?.tier?.id || 'free';
  const currentStatus = billingData?.subscription?.status || 'active';
  const tierConfig = TIER_CONFIG[currentTier] || TIER_CONFIG.free;
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.active;

  const { isTrialing, daysRemaining } = useMemo(() => {
    const trialEnd = billingData?.subscription?.trialEnd;
    const now = new Date();
    const trialing = currentStatus === 'trialing' && trialEnd && trialEnd > now;
    const days = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    return { isTrialing: trialing, daysRemaining: days };
  }, [currentStatus, billingData]);

  const subscriptionEndsAt = billingData?.subscription?.currentPeriodEnd;
  const hasPaidSubscription = currentTier !== 'free' && stripeAvailable;

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
        <h2 className="font-display text-2xl font-bold text-repwell-teal-500 tracking-tight">
          Billing & Subscription
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Manage your subscription, view usage, and update payment methods.
        </p>
      </motion.div>

      {/* Trial Alert */}
      {isTrialing && (
        <motion.div variants={fadeInUp}>
          <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100/50">
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
          <Alert variant="destructive" className="border-red-200 bg-gradient-to-r from-red-50 to-red-100/50">
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

              {currentTier !== 'free' && subscriptionEndsAt && (
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
              <p className="text-repwell-teal-400">
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

                {currentTier === 'free' && (
                  <Button
                    onClick={() => router.push('/pricing')}
                    className="bg-gradient-to-r from-repwell-teal-300 to-repwell-teal-400 hover:from-repwell-teal-400 hover:to-repwell-teal-500 text-white shadow-md"
                  >
                    <Sparkle weight="duotone" className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                )}

                {currentTier !== 'free' && currentTier !== 'enterprise' && (
                  <Button
                    variant="outline"
                    onClick={() => router.push('/pricing')}
                    className="border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100/50"
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
              <h4 className="font-semibold text-repwell-teal-500">Quick Actions</h4>

              {hasPaidSubscription ? (
                <div className="space-y-3">
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 hover:bg-repwell-sage-100/50 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-repwell-sage-100/50 group-hover:bg-repwell-sage-200/50 transition-colors">
                      <CreditCard weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-repwell-teal-500">Update Payment</p>
                      <p className="text-xs text-repwell-teal-300">Change card or billing info</p>
                    </div>
                  </button>

                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 hover:bg-repwell-sage-100/50 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-repwell-sage-100/50 group-hover:bg-repwell-sage-200/50 transition-colors">
                      <EnvelopeSimple weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-repwell-teal-500">View Invoices</p>
                      <p className="text-xs text-repwell-teal-300">Download past invoices</p>
                    </div>
                  </button>

                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 hover:bg-repwell-sage-100/50 transition-colors text-left group"
                  >
                    <div className="p-2 rounded-lg bg-repwell-sage-100/50 group-hover:bg-repwell-sage-200/50 transition-colors">
                      <Crown weight="duotone" className="h-4 w-4 text-repwell-teal-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-repwell-teal-500">Change Plan</p>
                      <p className="text-xs text-repwell-teal-300">Upgrade or downgrade</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 mx-auto bg-repwell-sage-100/50 rounded-xl flex items-center justify-center">
                    <Sparkle weight="duotone" className="h-6 w-6 text-repwell-teal-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-repwell-teal-500">Unlock More Features</p>
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

      {/* Usage & Features Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Card */}
        {billingData?.usage && (
          <motion.div variants={fadeInUp}>
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-repwell-teal-500">Usage This Period</h4>
                  {subscriptionEndsAt && (
                    <span className="text-xs text-repwell-teal-300">
                      Resets {subscriptionEndsAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                <div className="space-y-5">
                  <UsageBar
                    label="Team Members"
                    current={billingData.usage.currentUsers}
                    max={billingData.tier?.limits?.maxUsers ?? 3}
                    icon={<Users weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  />

                  <UsageBar
                    label="Users"
                    current={billingData.usage.currentMembers}
                    max={billingData.tier?.limits?.maxProfessionals ?? 5}
                    icon={<UserCircle weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  />

                  <UsageBar
                    label="Surveys This Month"
                    current={billingData.usage.surveysThisMonth}
                    max={billingData.tier?.limits?.maxSurveysPerMonth ?? 100}
                    icon={<EnvelopeSimple weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Features Card */}
        <motion.div variants={fadeInUp}>
          <Card className="border-border/50 h-full">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-repwell-teal-500">
                {tierConfig.name} Plan Features
              </h4>

              <ul className="space-y-3">
                {(billingData?.tier?.features || [
                  'Basic review management',
                  'Email support',
                  'Up to 3 team members',
                ]).map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="flex items-start gap-3 text-sm text-repwell-teal-400"
                  >
                    <CheckCircle weight="duotone" className="h-5 w-5 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
                    {feature}
                  </motion.li>
                ))}
              </ul>

              {currentTier !== 'enterprise' && (
                <div className="pt-4 border-t border-border/50">
                  <button
                    onClick={() => router.push('/pricing')}
                    className="text-sm text-repwell-teal-300 hover:text-repwell-teal-400 font-medium flex items-center gap-1 group"
                  >
                    Compare all plans
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
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
                <div className="p-3 rounded-xl bg-repwell-sage-100/30">
                  <CreditCard weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-repwell-teal-500">Need to make billing changes?</h4>
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

      {/* Secure Payment Badge */}
      {hasPaidSubscription && (
        <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2 text-xs text-repwell-teal-300">
          <ShieldCheck weight="duotone" className="h-4 w-4" />
          <span>Secure payments powered by Stripe</span>
          <ExternalLink className="h-3 w-3" />
        </motion.div>
      )}
    </motion.div>
  );
}
