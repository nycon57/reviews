"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CreditCard,
  Calendar,
  TrendUp as TrendingUp,
  Warning as AlertTriangle,
  CheckCircle,
  Lightning as Zap,
  ArrowSquareOut as ExternalLink,
  DownloadSimple as Download,
  SpinnerGap as Loader2,
  ArrowsClockwise as RefreshCw,
} from "@phosphor-icons/react";
import {
  getCurrentOrganization,
  type Organization,
  TIER_FEATURES,
  TIER_LIMITS,
} from "@/lib/organization";
import {
  getBillingOverview,
  createPortalSession,
  cancelSubscription,
  resumeSubscription,
  type BillingOverview,
  formatPriceFromCents,
  isStripeAvailable,
} from "@/lib/stripe";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TIER_PRICING: Record<string, { monthly: number; annual: number; name: string }> = {
  basic: { monthly: 49, annual: 468, name: "Basic" },
  pro: { monthly: 99, annual: 948, name: "Pro" },
  enterprise: { monthly: -1, annual: -1, name: "Enterprise" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  active: { label: "Active", variant: "default", icon: <CheckCircle className="h-4 w-4" /> },
  trialing: { label: "Trial", variant: "secondary", icon: <Zap className="h-4 w-4" /> },
  past_due: { label: "Past Due", variant: "destructive", icon: <AlertTriangle className="h-4 w-4" /> },
  canceled: { label: "Canceled", variant: "outline", icon: <AlertTriangle className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", variant: "outline", icon: <AlertTriangle className="h-4 w-4" /> },
  paused: { label: "Paused", variant: "outline", icon: <AlertTriangle className="h-4 w-4" /> },
  unpaid: { label: "Unpaid", variant: "destructive", icon: <AlertTriangle className="h-4 w-4" /> },
};

export function OrganizationBilling() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [billingData, setBillingData] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const stripeAvailable = isStripeAvailable();

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [orgResult, billingResult] = await Promise.all([
          getCurrentOrganization(),
          getBillingOverview(),
        ]);

        if (mounted) {
          if (orgResult.organization) {
            setOrganization(orgResult.organization);
          }
          if (billingResult.success && billingResult.data) {
            setBillingData(billingResult.data);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading billing data:", error);
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

  const currentTier = organization?.subscription_tier || "basic";
  const currentStatus = billingData?.subscription?.status || organization?.subscription_status || "active";
  const pricing = TIER_PRICING[currentTier] || TIER_PRICING.basic;
  const status = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.active;
  const limits = TIER_LIMITS[currentTier] || TIER_LIMITS.basic;

  const subscriptionEndsAt = billingData?.subscription?.currentPeriodEnd
    ? billingData.subscription.currentPeriodEnd
    : organization?.subscription_ends_at
    ? new Date(organization.subscription_ends_at)
    : null;

  const { isTrialing, daysRemaining } = useMemo(() => {
    const trialEndsAt = billingData?.subscription?.trialEnd
      ? billingData.subscription.trialEnd
      : organization?.trial_ends_at
      ? new Date(organization.trial_ends_at)
      : null;
    const now = new Date();
    const trialing = currentStatus === "trialing" && trialEndsAt && trialEndsAt > now;
    const days = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    return { isTrialing: trialing, daysRemaining: days };
  }, [currentStatus, billingData, organization]);

  const handleManagePlan = async () => {
    setActionLoading(true);
    try {
      const result = await createPortalSession();
      if (result.success && result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Error opening billing portal:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!billingData?.subscription?.id) return;
    setActionLoading(true);
    try {
      const result = await cancelSubscription(billingData.subscription.id, false);
      if (result.success) {
        setCancelDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!billingData?.subscription?.id) return;
    setActionLoading(true);
    try {
      const result = await resumeSubscription(billingData.subscription.id);
      if (result.success) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error resuming subscription:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border border-border shadow-soft">
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
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <CreditCard className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
            </div>
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{pricing.name}</h3>
                <Badge variant={status.variant} className="flex items-center gap-1">
                  {status.icon}
                  {status.label}
                </Badge>
                {billingData?.subscription?.cancelAtPeriodEnd && (
                  <Badge variant="outline" className="text-orange-600">
                    Cancels at period end
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                {pricing.monthly === 0 ? (
                  "Free forever"
                ) : pricing.monthly < 0 ? (
                  "Custom pricing"
                ) : (
                  <>
                    ${pricing.monthly}/month or ${pricing.annual}/year
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {billingData?.subscription?.cancelAtPeriodEnd ? (
                <Button
                  variant="outline"
                  onClick={handleResumeSubscription}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Resume Subscription
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleManagePlan}
                  disabled={actionLoading || !stripeAvailable || !billingData?.subscription}
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Plan
                </Button>
              )}
            </div>
          </div>

          {/* Billing Cycle */}
          {pricing.monthly > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  Next Billing Date
                </div>
                <p className="font-medium">
                  {subscriptionEndsAt ? subscriptionEndsAt.toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border/50 bg-card">
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
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <TrendingUp className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
            </div>
            <div>
              <CardTitle className="text-lg">Usage & Limits</CardTitle>
              <CardDescription>
                Monitor your resource usage against plan limits
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Team Members</span>
                <span className="text-muted-foreground">
                  {limits.max_users === -1 ? "Unlimited" : `${billingData?.usage?.currentUsers || 0} / ${limits.max_users}`}
                </span>
              </div>
              {limits.max_users !== -1 && (
                <Progress value={((billingData?.usage?.currentUsers || 0) / limits.max_users) * 100} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Professionals</span>
                <span className="text-muted-foreground">
                  {limits.max_professionals === -1 ? "Unlimited" : `${billingData?.usage?.currentMembers || 0} / ${limits.max_professionals}`}
                </span>
              </div>
              {limits.max_professionals !== -1 && (
                <Progress value={((billingData?.usage?.currentMembers || 0) / limits.max_professionals) * 100} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Surveys This Month</span>
                <span className="text-muted-foreground">
                  {limits.max_surveys_per_month === -1 ? "Unlimited" : `${billingData?.usage?.surveysThisMonth || 0} / ${limits.max_surveys_per_month}`}
                </span>
              </div>
              {limits.max_surveys_per_month !== -1 && (
                <Progress value={((billingData?.usage?.surveysThisMonth || 0) / limits.max_surveys_per_month) * 100} className="h-2" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>API Calls Today</span>
                <span className="text-muted-foreground">
                  {limits.max_api_calls_per_day === -1 ? "Unlimited" : `${billingData?.usage?.apiCallsToday || 0} / ${limits.max_api_calls_per_day.toLocaleString()}`}
                </span>
              </div>
              {limits.max_api_calls_per_day !== -1 && (
                <Progress value={((billingData?.usage?.apiCallsToday || 0) / limits.max_api_calls_per_day) * 100} className="h-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      {currentTier !== "enterprise" && (
        <Card className="border border-border shadow-soft">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Zap className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-lg">Upgrade Your Plan</CardTitle>
                <CardDescription>
                  Get more features and higher limits with an upgraded plan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(TIER_PRICING)
                .filter(([tier]) => tier !== currentTier)
                .map(([tier, info]) => {
                  const tierKey = tier as keyof typeof TIER_LIMITS;
                  const tierLimits = TIER_LIMITS[tierKey];
                  const tierFeatures = TIER_FEATURES[tierKey];
                  return (
                    <div
                      key={tier}
                      className="p-4 rounded-xl border border-border/50 hover:border-repwell-teal-300 transition-colors"
                    >
                      <h4 className="font-semibold">{info.name}</h4>
                      <p className="text-2xl font-bold mt-1 text-heading-accent tracking-tight">
                        {info.monthly < 0 ? (
                          "Contact us"
                        ) : (
                          <>
                            ${info.monthly}
                            <span className="text-sm font-normal text-muted-foreground">/mo</span>
                          </>
                        )}
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <li>
                          {tierLimits.max_users === -1 ? "Unlimited" : tierLimits.max_users} team members
                        </li>
                        <li>
                          {tierLimits.max_professionals === -1 ? "Unlimited" : tierLimits.max_professionals} professionals
                        </li>
                        <li>
                          {tierLimits.max_surveys_per_month === -1 ? "Unlimited" : tierLimits.max_surveys_per_month.toLocaleString()} surveys/mo
                        </li>
                        {tierFeatures.custom_branding && <li>Custom branding</li>}
                        {tierFeatures.api_access && <li>API access</li>}
                        {tierFeatures.webhooks && <li>Webhooks</li>}
                      </ul>
                      <Button
                        className="w-full mt-4"
                        variant="outline"
                        onClick={() => router.push(`/pricing?upgrade=${tier}`)}
                      >
                        Upgrade to {info.name}
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

      {/* Payment Methods */}
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <CreditCard className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <CardDescription>
                  Manage your payment methods
                </CardDescription>
              </div>
            </div>
            {!!billingData?.subscription && stripeAvailable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManagePlan}
                disabled={actionLoading}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {billingData?.paymentMethods && billingData.paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {billingData.paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">
                        {pm.cardBrand} ending in {pm.cardLast4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {pm.cardExpMonth}/{pm.cardExpYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pm.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No payment methods on file
                </p>
                {!billingData?.subscription && (
                  <p className="text-sm text-muted-foreground">
                    Add a payment method when you upgrade
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Calendar className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
            </div>
            <div>
              <CardTitle className="text-lg">Invoice History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {billingData?.invoices && billingData.invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingData.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.number || invoice.stripeInvoiceId.slice(-8)}
                    </TableCell>
                    <TableCell>
                      {invoice.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {formatPriceFromCents(invoice.amountDue, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.status === "paid"
                            ? "default"
                            : invoice.status === "open"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {invoice.hostedInvoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={invoice.hostedInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {invoice.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-8 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No invoices yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Invoices will appear here after your first payment
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone - Cancel Subscription */}
      {!!billingData?.subscription && !billingData?.subscription?.cancelAtPeriodEnd && (
        <Card className="border-destructive/50 shadow-soft">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
              <div>
                <p className="font-medium">Cancel Subscription</p>
                <p className="text-sm text-muted-foreground">
                  Your subscription will remain active until the end of the billing period
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
                disabled={actionLoading}
              >
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period
              {subscriptionEndsAt && (
                <> on {subscriptionEndsAt.toLocaleDateString()}</>
              )}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={actionLoading}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
