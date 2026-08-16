# 0007. Dashboard IA end-state: Workspace, People, Campaigns, /staff

Date: 2026-07-07

## Status

Accepted

## Context

The IA audit (2026-07-06 campaign, §3.9) found systemic semantic rot: "admin"
carried three unrelated meanings (nav section, platform tooling, DB role) with
a cross-org data leak; people management had four homes under three names;
billing and integrations each lived in two places; "Emails" and "Campaigns"
split one concept across two nav sections; individuals saw a dead
"Organization" link that middleware bounced. ADR 0006 (one organizations table
for every account) made a uniform structure possible.

## Decision

- **Platform staff tooling moves to `/staff`**, gated by a new
  `users.is_platform_admin` flag via a single `requirePlatformAdmin` guard.
  Inside orgs, "admin" again means only the org-admin role.
- **The org-scoped area is named "Workspace"** — one name for both account
  types — and follows a **"Me vs Us" split**: Settings holds personal-only
  concerns (profile, notification preferences, appearance); Workspace holds
  everything org-scoped (billing, branding, integrations, webhooks, API keys,
  templates). Displaced tabs become redirects; upgrade CTAs repoint to the
  Workspace billing home.
- **People**: one nav item with two rosters — Members (platform accounts:
  invites, roles, deactivation) and Employees (EX-survey roster, may include
  non-users). Team's overview/leaderboards move to Analytics. The
  Organization→Users tab dies.
- **Campaigns absorbs Emails**: tabs for Sequences (workflow builder, incl.
  Acquisition Sequences per ADR 0004) and Templates (the email builder).
- **Contacts** is a content-hub tab now and is promoted to a Core nav item
  when this IA ships.
- **Nav filtering is permission-based, never section-hide** — the
  `hideForEnterpriseUser` mechanism is removed; enterprise users regain what
  their permissions grant. ACCESS_MATRIX.md is regenerated from
  NAV_CONFIG + middleware + page guards and kept in CI-checkable sync.

## Consequences

- Middleware, nav config, and page guards must agree by construction; the
  individual "Organization dead link" class of bug becomes impossible rather
  than patched.
- Old routes (`/dashboard/admin/*`, `/dashboard/emails`, Organization tabs)
  need durable redirects; docs and onboarding copy need a relabel pass.
- The term "Organization" survives only as the enterprise account_type's
  self-description, not as a nav destination.
