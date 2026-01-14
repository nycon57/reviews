"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Calendar, TrendingUp, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import {
  getCurrentOrganization,
  type Organization,
  TIER_FEATURES,
  TIER_LIMITS,
} from "@/lib/organization";

const TIER_PRICING: Record<string, { monthly: number; annual: number; name: string }> = {
  free: { monthly: 0, annual: 0, name: "Free" },
  starter: { monthly: 49, annual: 470, name: "Starter" },
  professional: { monthly: 149, annual: 1430, name: "Professional" },
  enterprise: { monthly: 499, annual: 4790, name: "Enterprise" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  active: { label: "Active", variant: "default", icon: <CheckCircle className="h-4 w-4" /> },
  trialing: { label: "Trial", variant: "secondary", icon: <Zap className="h-4 w-4" /> },
  past_due: { label: "Past Due", variant: "destructive", icon: <AlertTriangle className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", variant: "outline", icon: <AlertTriangle className="h-4 w-4" /> },
  paused: { label: "Paused", variant: "outline", icon: <AlertTriangle className="h-4 w-4" /> },
};

export function OrganizationBilling() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadOrganization() {
      const result = await getCurrentOrganization();
      if (mounted) {
        if (result.organization) {
          setOrganization(result.organization);
        }
        setLoading(false);
      }
    }

    loadOrganization();

    return () => {
      mounted = false;
    };
  }, []);

  const currentTier = organization?.subscription_tier || "free";
  const currentStatus = organization?.subscription_status || "active";
  const pricing = TIER_PRICING[currentTier] || TIER_PRICING.free;
  const status = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.active;
  const limits = TIER_LIMITS[currentTier] || TIER_LIMITS.free;

  const subscriptionEndsAt = organization?.subscription_ends_at ? new Date(organization.subscription_ends_at) : null;

  const { isTrialing, daysRemaining } = useMemo(() => {
    const trialEndsAt = organization?.trial_ends_at ? new Date(organization.trial_ends_at) : null;
    const now = new Date();
    const trialing = currentStatus === "trialing" && trialEndsAt && trialEndsAt > now;
    const days = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    return { isTrialing: trialing, daysRemaining: days };
  }, [currentStatus, organization]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load organization data.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Alert */}
      {isTrialing && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertTitle>Trial Period</AlertTitle>
          <AlertDescription>
            Your trial ends in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}.
            Upgrade now to continue using all features.
          </AlertDescription>
        </Alert>
      )}

      {/* Past Due Alert */}
      {currentStatus === "past_due" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment Past Due</AlertTitle>
          <AlertDescription>
            Your payment is past due. Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{pricing.name}</h3>
                <Badge variant={status.variant} className="flex items-center gap-1">
                  {status.icon}
                  {status.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {pricing.monthly === 0 ? (
                  "Free forever"
                ) : (
                  <>
                    ${pricing.monthly}/month or ${pricing.annual}/year
                  </>
                )}
              </p>
            </div>
            <Button variant="outline" disabled>
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Plan
            </Button>
          </div>

          {/* Billing Cycle */}
          {pricing.monthly > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Next Billing Date
                </div>
                <p className="font-medium">
                  {subscriptionEndsAt ? subscriptionEndsAt.toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Current Period Usage
                </div>
                <p className="font-medium">
                  View detailed usage below
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>
            Monitor your resource usage against plan limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Team Members</span>
                <span className="text-muted-foreground">
                  {limits.max_users === -1 ? "Unlimited" : `0 / ${limits.max_users}`}
                </span>
              </div>
              {limits.max_users !== -1 && (
                <Progress value={0} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Loan Officers</span>
                <span className="text-muted-foreground">
                  {limits.max_loan_officers === -1 ? "Unlimited" : `0 / ${limits.max_loan_officers}`}
                </span>
              </div>
              {limits.max_loan_officers !== -1 && (
                <Progress value={0} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Surveys This Month</span>
                <span className="text-muted-foreground">
                  {limits.max_surveys_per_month === -1 ? "Unlimited" : `0 / ${limits.max_surveys_per_month}`}
                </span>
              </div>
              {limits.max_surveys_per_month !== -1 && (
                <Progress value={0} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>API Calls Today</span>
                <span className="text-muted-foreground">
                  {limits.max_api_calls_per_day === -1 ? "Unlimited" : `0 / ${limits.max_api_calls_per_day.toLocaleString()}`}
                </span>
              </div>
              {limits.max_api_calls_per_day !== -1 && (
                <Progress value={0} className="h-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      {currentTier !== "enterprise" && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Get more features and higher limits with an upgraded plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(TIER_PRICING)
                .filter(([tier]) => tier !== "free" && tier !== currentTier)
                .map(([tier, info]) => {
                  const tierKey = tier as keyof typeof TIER_LIMITS;
                  const tierLimits = TIER_LIMITS[tierKey];
                  const tierFeatures = TIER_FEATURES[tierKey];
                  return (
                    <div
                      key={tier}
                      className="p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <h4 className="font-semibold">{info.name}</h4>
                      <p className="text-2xl font-bold mt-1">
                        ${info.monthly}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <li>
                          {tierLimits.max_users === -1 ? "Unlimited" : tierLimits.max_users} team members
                        </li>
                        <li>
                          {tierLimits.max_loan_officers === -1 ? "Unlimited" : tierLimits.max_loan_officers} loan officers
                        </li>
                        <li>
                          {tierLimits.max_surveys_per_month === -1 ? "Unlimited" : tierLimits.max_surveys_per_month.toLocaleString()} surveys/mo
                        </li>
                        {tierFeatures.custom_branding && <li>Custom branding</li>}
                        {tierFeatures.api_access && <li>API access</li>}
                        {tierFeatures.webhooks && <li>Webhooks</li>}
                      </ul>
                      <Button className="w-full mt-4" variant="outline" disabled>
                        Upgrade
                      </Button>
                    </div>
                  );
                })}
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Contact sales for enterprise pricing and custom solutions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Method Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment methods and billing history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                Payment integration coming soon
              </p>
              <p className="text-sm text-muted-foreground">
                Stripe integration will be available in a future update
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
