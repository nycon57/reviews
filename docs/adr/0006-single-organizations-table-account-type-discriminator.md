# 0006. One organizations table with an account_type discriminator

Date: 2026-07-07

## Status

Accepted — supersedes the prior working rule "individuals must not use the
organizations/branches tables."

## Context

Two patterns for individual accounts coexisted: `organizations` rows with
`account_type='individual'` (live for existing individual admins) and a
separate `individual_organizations` table (written by signup and onboarding).
Every feature picked one ad hoc, producing the audit's bug factory:
middleware/nav/page disagreements, unreachable pages, and visibility leaks.
The original separation rule existed for a legitimate reason: individual-
entered org/branch details cannot be company-verified and must never display
as verified enterprise data. Meanwhile the Contact architecture (ADR 0004)
scopes contacts, suppression, and sequences to "the organization" — which
forces the question of what that means for individuals.

## Decision

Every account has exactly one `organizations` row. `account_type`
('individual' | 'enterprise') is the discriminator. `individual_organizations`
merges into `organizations` and is dropped. The verification concern is
handled as an explicit gating rule, not a table boundary: enterprise-only
features (branches, teams, verified company display, org admin tooling) are
gated on `account_type='enterprise'` in RLS policies and display logic, and
individual org details are always presented as self-reported.

## Considered options

- **Complete the separation** (purge individuals from `organizations`,
  polymorphic scope on every shared table) — rejected: dual FKs/branches in
  every org-scoped feature forever, starting with the entire Contact
  architecture.
- **User-scoped individuals** (no org row) — rejected: same polymorphism tax
  plus individual→enterprise upgrades become data migrations.
- **Freeze the duality** — rejected: the ad-hoc choice is the demonstrated
  source of the bugs.

## Consequences

- Shared tables (contacts, suppression, sequences, widgets, …) carry one
  `organization_id` FK, no polymorphism.
- A migration must fold `individual_organizations` rows into `organizations`
  and repoint references; signup/onboarding write paths change accordingly.
- "Individual org data is never displayed as verified" becomes a testable
  display/RLS invariant keyed on `account_type` — auditable in one place.
- Individual→enterprise upgrade is an `account_type` flip plus feature
  enablement, not a data move.
- Public visibility rules from the 2026-06 workstream (enterprise-only org
  links, directory badges) remain correct; they already key on `account_type`.
