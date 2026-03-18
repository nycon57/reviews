import { z } from "zod";

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  BASIC: "basic",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type SubscriptionTier =
  (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS];

// Subscription status
export const SUBSCRIPTION_STATUSES = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
  PAUSED: "paused",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES];

// Billing cycle
export const BILLING_CYCLES = {
  MONTH: "month",
  YEAR: "year",
} as const;

export type BillingCycle =
  (typeof BILLING_CYCLES)[keyof typeof BILLING_CYCLES];

// Pricing configuration
export interface PricingTier {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  features: string[];
  limits: {
    maxUsers: number;
    maxProfessionals: number;
    maxSurveysPerMonth: number;
    maxApiCallsPerDay: number;
  };
  popular?: boolean;
  cta: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Build Your Reputation",
    monthlyPrice: 49,
    yearlyPrice: 468,
    stripePriceIdMonthly: process.env.STRIPE_BASIC_PRICE_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_BASIC_PRICE_YEARLY || "",
    features: [
      "1 user profile",
      "200 surveys/month",
      "Email distribution",
      "Review monitoring & management",
      "Basic analytics (rating trends, NPS)",
      "Testimonial collection (text + video)",
      "Embeddable widgets",
      "Google Business integration",
      "Email support",
    ],
    limits: {
      maxUsers: 1,
      maxProfessionals: 1,
      maxSurveysPerMonth: 200,
      maxApiCallsPerDay: 100,
    },
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    description: "AI-Powered Reputation Intelligence",
    monthlyPrice: 99,
    yearlyPrice: 948,
    stripePriceIdMonthly: process.env.STRIPE_PRO_PRICE_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_PRO_PRICE_YEARLY || "",
    features: [
      "Everything in Basic",
      "AI sentiment analysis",
      "AI response suggestions",
      "AI visibility / GEO reports",
      "AI performance scorecards",
      "1,000 surveys/month",
      "Advanced analytics & reporting",
      "API access (1,000 calls/day)",
      "Custom branding",
      "Priority support",
    ],
    limits: {
      maxUsers: 1,
      maxProfessionals: 1,
      maxSurveysPerMonth: 1000,
      maxApiCallsPerDay: 1000,
    },
    popular: true,
    cta: "Upgrade to Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Reputation at Scale",
    monthlyPrice: -1, // Custom pricing
    yearlyPrice: -1,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Unlimited surveys & API",
      "Team management & leaderboards",
      "Manager dashboard with org-wide analytics",
      "Employee experience surveys",
      "SSO/SAML & white-label",
      "Webhooks & CSV bulk import",
      "Dedicated success manager",
    ],
    limits: {
      maxUsers: -1, // Unlimited
      maxProfessionals: -1,
      maxSurveysPerMonth: -1,
      maxApiCallsPerDay: -1,
    },
    cta: "Contact Sales",
  },
];

// Checkout session input
export const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1),
  billingCycle: z.enum(["month", "year"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;

// Portal session input
export const createPortalSessionSchema = z.object({
  returnUrl: z.string().url().optional(),
});

export type CreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>;

// Subscription update input
export const updateSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
  priceId: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

// Subscription response
export interface SubscriptionData {
  id: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  planTier: SubscriptionTier;
  billingCycle: BillingCycle | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  quantity: number;
}

// Invoice data
export interface InvoiceData {
  id: string;
  stripeInvoiceId: string;
  number: string | null;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  dueDate: Date | null;
  paidAt: Date | null;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  createdAt: Date;
}

// Payment method data
export interface PaymentMethodData {
  id: string;
  stripePaymentMethodId: string;
  type: string;
  cardBrand: string | null;
  cardLast4: string | null;
  cardExpMonth: number | null;
  cardExpYear: number | null;
  isDefault: boolean;
}

// Billing overview
export interface BillingOverview {
  subscription: SubscriptionData | null;
  invoices: InvoiceData[];
  paymentMethods: PaymentMethodData[];
  tier: PricingTier;
  usage: {
    currentUsers: number;
    currentMembers: number;
    surveysThisMonth: number;
    apiCallsToday: number;
  };
  userRole: 'admin' | 'manager' | 'user';
}

// Webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.updated",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.upcoming",
  "invoice.finalized",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_method.attached",
  "payment_method.detached",
] as const;

export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];

// Get pricing tier by ID
export function getPricingTier(tierId: SubscriptionTier): PricingTier {
  return (
    PRICING_TIERS.find((tier) => tier.id === tierId) || PRICING_TIERS[0]
  );
}

// Check if subscription is active
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}

// Check if subscription allows access (includes grace period for past_due)
export function hasSubscriptionAccess(status: SubscriptionStatus): boolean {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" // Grace period for past due
  );
}

// Check if organization is in grace period (cancelled but within 30-day window)
// During grace period: read-only access (can view data, but can't send surveys/use features)
export function isInGracePeriod(
  status: string | null | undefined,
  gracePeriodEndsAt: string | null | undefined
): boolean {
  if (status !== "cancelled" && status !== "canceled") return false;
  if (!gracePeriodEndsAt) return false;
  return new Date(gracePeriodEndsAt) > new Date();
}

// Check if grace period has expired (should block all access)
export function isGracePeriodExpired(
  status: string | null | undefined,
  gracePeriodEndsAt: string | null | undefined
): boolean {
  if (status !== "cancelled" && status !== "canceled") return false;
  if (!gracePeriodEndsAt) return true; // No grace period set, treat as expired
  return new Date(gracePeriodEndsAt) <= new Date();
}

// Format price for display
export function formatPrice(
  amount: number,
  currency: string = "usd"
): string {
  if (amount === -1) return "Custom";
  if (amount === 0) return "Free";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format price from cents
export function formatPriceFromCents(
  cents: number,
  currency: string = "usd"
): string {
  return formatPrice(cents / 100, currency);
}
