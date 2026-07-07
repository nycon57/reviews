# 0001. Customer rating gates video testimonial publishing

Date: 2026-06-09

## Status

Accepted

## Context

Video testimonial responses carry full NIL/usage consent, so legally any
submitted video can be published. But a video recorded alongside a 1–3 star
rating is, more often than not, content the professional does not want
auto-flowing into smart links, widgets, and social publishing. The
alternative considered was to keep one pipeline and merely badge low-rated
videos, leaving distribution decisions entirely to org admins.

## Decision

A required customer rating (1–5) is collected before recording. Responses
below the org's celebration threshold (default 4, stored in
`organizations.settings` in the same shape as auto-approval rules) are
**quarantined**: flagged needs-attention in the dashboard and excluded from
all public surfaces until explicitly approved. Consent is unaffected; the
gate is distribution, not retention. The customer-facing flow branches on
the same threshold (High Path: share/passthrough/referral CTAs; Low Path:
private feedback box, professional notification, follow-up task).

## Consequences

- Publishing eligibility now depends on a field collected in the public
  flow; downstream surfaces (smart links, widgets, social publishing) must
  check quarantine state, not just approval status.
- Some genuinely usable consented content sits idle until a human approves
  it; that is the accepted trade for brand safety by default.
- Because the threshold is an org setting, changing an org's appetite for
  risk is a settings change, not a code change.
- A null rating is impossible by design (rating is required), so branch
  logic needs no sentiment fallback.
