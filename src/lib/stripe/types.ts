import { z } from "zod";

// Subscription tier definitions
export const SUBSCRIPTION_TIERS = {
  FREE: "free",
  STARTER: "starter",
  PROFESSIONAL: "professional",
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
    maxLoanOfficers: number;
    maxSurveysPerMonth: number;
    maxApiCallsPerDay: number;
  };
  popular?: boolean;
  cta: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with basic features",
    monthlyPrice: 0,
    yearlyPrice: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      "Up to 3 team members",
      "5 loan officer profiles",
      "100 surveys/month",
      "Basic analytics",
      "Email support",
    ],
    limits: {
      maxUsers: 3,
      maxLoanOfficers: 5,
      maxSurveysPerMonth: 100,
      maxApiCallsPerDay: 100,
    },
    cta: "Get Started",
  },
  {
    id: "starter",
    name: "Starter",
    description: "For growing teams",
    monthlyPrice: 49,
    yearlyPrice: 470,
    stripePriceIdMonthly: process.env.STRIPE_STARTER_PRICE_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_STARTER_PRICE_YEARLY || "",
    features: [
      "Up to 10 team members",
      "25 loan officer profiles",
      "500 surveys/month",
      "Advanced analytics",
      "Google Business integration",
      "Priority email support",
    ],
    limits: {
      maxUsers: 10,
      maxLoanOfficers: 25,
      maxSurveysPerMonth: 500,
      maxApiCallsPerDay: 1000,
    },
    cta: "Start Free Trial",
  },
  {
    id: "professional",
    name: "Professional",
    description: "For established businesses",
    monthlyPrice: 149,
    yearlyPrice: 1430,
    stripePriceIdMonthly: process.env.STRIPE_PROFESSIONAL_PRICE_MONTHLY || "",
    stripePriceIdYearly: process.env.STRIPE_PROFESSIONAL_PRICE_YEARLY || "",
    features: [
      "Up to 50 team members",
      "100 loan officer profiles",
      "2,500 surveys/month",
      "AI-powered insights",
      "All integrations",
      "API access",
      "Phone support",
      "Custom branding",
    ],
    limits: {
      maxUsers: 50,
      maxLoanOfficers: 100,
      maxSurveysPerMonth: 2500,
      maxApiCallsPerDay: 10000,
    },
    popular: true,
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: -1, // Custom pricing
    yearlyPrice: -1,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      "Unlimited team members",
      "Unlimited loan officers",
      "Unlimited surveys",
      "Dedicated success manager",
      "Custom integrations",
      "SSO/SAML support",
      "SLA guarantee",
      "On-premise option",
    ],
    limits: {
      maxUsers: -1, // Unlimited
      maxLoanOfficers: -1,
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
    currentLoanOfficers: number;
    surveysThisMonth: number;
    apiCallsToday: number;
  };
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

// Check if subscription allows access (includes grace period)
export function hasSubscriptionAccess(status: SubscriptionStatus): boolean {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" // Grace period for past due
  );
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
