# 0005. SMS is unsold now, restored later on Contact foundations

Date: 2026-07-07

## Status

Accepted

## Context

A complete SMS system (E18, stories S096–S113: Twilio service layer, TCPA
consent engine, 10DLC registration wizard, templates, two-way conversations,
credits/billing) was built and then archived to the `archive/sms-features`
branch; `src/lib/sms` no longer exists. The product surface never caught up
with the amputation: marketing pages still promise Twilio-powered SMS
(`config/feature-pages.ts`, `solution-pages.ts`), the public preference center
shows SMS consent toggles that no-op, the campaign builder offers a "Send SMS"
node that silently routes to email, and `twilio_*` columns linger in the
schema. Meanwhile SMS review requests are a headline capability of direct
competitors (Birdeye, Experience.com) and typically outperform email response
rates severalfold.

## Decision

Two moves, in order:

1. **Unsell now (honesty pass).** Strip SMS claims from marketing/docs, remove
   the dead SMS preference toggles and the campaign-builder "Send SMS" node,
   and leave the dormant `twilio_*` columns untouched. The product claims only
   what it does.
2. **Restore after Contacts + Acquisition Sequences land.** SMS returns as the
   second acquisition channel by restoring the archived E18 implementation
   onto the new foundations — `contact_id` identity (ADR 0004), per-channel
   Suppression (TCPA consent maps directly onto the channel-scoped
   suppression model), and sequence steps with a channel field — rather than
   rebuilding from scratch or re-plumbing it onto the old fragmented recipient
   tables.

## Considered options

- **Rebuild now, inside the acquisition program** — rejected: roughly doubles
  the program's scope and re-enters 10DLC/TCPA operational weight before the
  email channel even works end-to-end.
- **Unsell permanently** — rejected: concedes a proven high-conversion channel
  competitors sell, and abandons a substantial working asset.
- **BYO-SMS via integrations** — rejected: no tracking, no suppression
  enforcement, no product credit for results.

## Consequences

- The Contact schema stays phone-ready from day one (E.164 storage, per-org
  phone uniqueness, email nullable-capable) so the restore is additive.
- The archive branch is a protected asset: do not delete
  `archive/sms-features`; the restore is a merge-and-adapt, not a rewrite.
- Anyone auditing marketing claims or the campaign builder should expect SMS
  to be absent on purpose until the restore phase; its absence is not a bug.
- The kanban `sms` domain label stays reserved for the restore phase.
