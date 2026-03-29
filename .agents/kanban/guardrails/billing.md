# Billing Guardrails — RepWell

## Stack
- Stripe for payments and subscriptions

## Rules
- Never log or store raw card details
- Use Stripe webhooks for payment status updates (don't poll)
- Handle webhook signature verification
- Test with Stripe test mode cards
- Implement idempotency keys for payment operations
- Handle subscription lifecycle events (created, updated, canceled, failed)
