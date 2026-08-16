# Stripe Go Live Checklist

This checklist must be reviewed before deploying Stripe integration to production.
Based on [Stripe's official Go Live Checklist](https://docs.stripe.com/get-started/checklist/go-live).

## API Configuration

- [ ] **API Version**: Using recent API version (`2025-12-15.clover`)
- [ ] **Live vs Test Keys**: Ensure `STRIPE_SECRET_KEY` uses live key (`sk_live_...`) in production
- [ ] **Publishable Key**: Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` uses live key (`pk_live_...`)
- [ ] **Webhook Secret**: Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
- [ ] **Price IDs**: Update all `STRIPE_*_PRICE_*` env vars with production price IDs

## Webhook Configuration

- [ ] **Webhook Endpoint**: Register production webhook URL in Stripe Dashboard
  - URL: `https://yourdomain.com/api/webhooks/stripe`
- [ ] **Signature Verification**: Webhook signature verification is enabled (✅ implemented)
- [ ] **Event Types**: Subscribe to all required events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.updated`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `invoice.upcoming`
  - `invoice.finalized`
  - `payment_method.attached`
  - `payment_method.detached`
- [ ] **Retry Logic**: Critical events return 500 on failure for retry (✅ implemented)

## Payment Methods

- [ ] **Dynamic Payment Methods**: Enabled in Stripe Dashboard (not hardcoded)
- [ ] **Supported Methods**: Review which payment methods to enable:
  - Cards (Visa, Mastercard, Amex, etc.)
  - Apple Pay / Google Pay
  - Bank debits (if applicable)
- [ ] **Payment Method Configuration**: Configure in Dashboard > Settings > Payment methods

## Checkout & Billing

- [ ] **Customer Portal**: Configure in Stripe Dashboard
  - Business name and branding
  - Allowed actions (update payment, cancel, etc.)
  - Invoice history access
- [ ] **Checkout Branding**: Add logo and colors in Stripe Dashboard
- [ ] **Invoice Customization**: Configure invoice template
- [ ] **Receipt Emails**: Enable/configure receipt emails
- [ ] **Trial Period**: 14-day trial configured correctly
- [ ] **Proration**: Proration behavior set for plan changes

## Products & Pricing

- [ ] **Products Created**: Create products in Stripe Dashboard
  - Starter plan
  - Professional plan
  - Enterprise plan (if using Stripe for it)
- [ ] **Prices Created**: Create prices for each billing cycle
  - Monthly prices
  - Yearly prices (with discount)
- [ ] **Price IDs Mapped**: Update environment variables with production price IDs

## Security & Compliance

- [ ] **PCI Compliance**: Using Stripe Checkout (PCI DSS compliant)
- [ ] **TLS/HTTPS**: Production site uses HTTPS
- [ ] **API Key Security**: Secret keys stored in environment variables, never in code
- [ ] **Error Logging**: Errors logged but sensitive data redacted

## Customer Experience

- [ ] **Support Contact**: Add support email/phone in Stripe Dashboard
- [ ] **Refund Policy**: Define and configure refund policy
- [ ] **Cancellation Flow**: Test cancellation flow works correctly
- [ ] **Dunning Emails**: Payment failure email sequence configured (✅ implemented)

## Testing

- [ ] **End-to-End Test**: Complete a test subscription in production
  - Sign up flow
  - Payment processing
  - Webhook delivery
  - Email notifications
- [ ] **Upgrade/Downgrade**: Test plan change flow
- [ ] **Cancellation**: Test subscription cancellation
- [ ] **Payment Failure**: Test payment failure recovery flow
- [ ] **Portal Access**: Test Customer Portal access

## Monitoring & Alerting

- [ ] **Webhook Logs**: Monitor webhook delivery in Stripe Dashboard
- [ ] **Billing Events**: Check `billing_events` table for failures
- [ ] **Error Alerting**: Set up alerts for webhook failures
- [ ] **Revenue Monitoring**: Configure Stripe Dashboard revenue alerts

## Database

- [ ] **RLS Policies**: Verify RLS policies are in place for billing tables
- [ ] **Migrations Applied**: Ensure all billing migrations are applied
- [ ] **Backup Strategy**: Database backups configured

## Documentation

- [ ] **Team Training**: Team knows how to access Stripe Dashboard
- [ ] **Runbook**: Document common billing support scenarios
- [ ] **Escalation Path**: Define escalation for billing issues

---

## Quick Environment Variable Reference

```bash
# Production environment variables needed:
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (get from Stripe Dashboard > Products)
STRIPE_STARTER_PRICE_MONTHLY=price_...
STRIPE_STARTER_PRICE_YEARLY=price_...
STRIPE_PROFESSIONAL_PRICE_MONTHLY=price_...
STRIPE_PROFESSIONAL_PRICE_YEARLY=price_...
STRIPE_ENTERPRISE_PRICE_MONTHLY=price_...
STRIPE_ENTERPRISE_PRICE_YEARLY=price_...
```

## Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Checkout Sessions API | ✅ | Using recommended API |
| Dynamic Payment Methods | ✅ | Removed hardcoded types |
| Webhook Signature | ✅ | Verified on all requests |
| Critical Event Retry | ✅ | Returns 500 on failure |
| Idempotency Keys | ✅ | Added to API calls |
| Customer Portal | ✅ | Integrated |
| Dunning Sequence | ✅ | 5-step email sequence |
| Billing Events Audit | ✅ | All events logged |
| RLS Policies | ✅ | User/admin separation |

Last updated: 2025-01-23
