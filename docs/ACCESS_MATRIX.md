# Access Control Matrix

Regenerated for ADR 0007 from `src/proxy.ts`, `src/lib/nav/config.ts`, and the page guards in `src/app`. Middleware is the first gate, page guards are the source of truth for rendered pages, and nav permissions are only discoverability.

## Route Access Table

| Route | Source | Middleware guard | Page-level guard | Nav permission | Individual owner | Enterprise admin | Enterprise manager | Enterprise user | Platform staff |
|---|---|---|---|---|---|---|---|---|---|
| /dashboard | nav | auth | dashboard shell/auth | VIEW_DASHBOARD | Y | Y | Y | Y | By account |
| /dashboard/reviews | nav | auth | `getAccessContext` | VIEW_REVIEWS | Y | Y | Y | Y | By account |
| /dashboard/reviews?tab=contacts | nav | auth | `getAccessContext` (Contacts tab gated by `SEND_SURVEY`) | VIEW_REVIEWS | Y | Y | Y | Y | By account |
| /dashboard/share-studio | nav, proxy | roles admin/manager for enterprise accounts | `checkPageAccess({ minRole: "manager" })` | VIEW_SHARE_STUDIO | Y | Y | Y | N | By account |
| /dashboard/tasks | nav | auth | `checkPageAccess({})` | VIEW_TASKS | Y | Y | Y | Y | By account |
| /dashboard/campaigns | nav, proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | VIEW_CAMPAIGNS | N | Y | Y | N | By account |
| /dashboard/recognition | nav, proxy | `requiresEnterprise` | `requireEnterprise` | VIEW_RECOGNITION | N | Y | Y | Y | By account |
| /dashboard/analytics | nav | auth | `getAccessContext` | VIEW_ANALYTICS | Y | Y | Y | Y | By account |
| /dashboard/analytics/trends | nav | auth | `getAccessContext` | VIEW_TRENDS | Y | Y | Y | Y | By account |
| /dashboard/analytics/leaderboard | nav, proxy | `requiresEnterprise` | `requireEnterprise` | VIEW_LEADERBOARD | N | Y | Y | Y | By account |
| /dashboard/analytics/agents | nav | auth | `requireEnterpriseManager` | VIEW_TEAM | N | Y | Y | N | By account |
| /dashboard/analytics/team | nav, proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | VIEW_TEAM | N | Y | Y | N | By account |
| /dashboard/insights | nav, proxy | `minTier: pro` | `requireProTier` | VIEW_AI_INSIGHTS | Pro only | Y | Y | Y | By account |
| /dashboard/analytics/website | proxy, page | `minTier: pro` | `requireProTier` | Not in nav | Pro only | Y | Y | Y | By account |
| /dashboard/people | nav, proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | VIEW_TEAM | N | Y | Y | N | By account |
| /dashboard/surveys | nav | auth | `getAccessContext` | VIEW_SURVEYS | Y | Y | Y | Y | By account |
| /dashboard/ex-surveys | nav, proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | VIEW_EX_SURVEYS | N | Y | Y | N | By account |
| /dashboard/widgets | nav | auth | `getAccessContext` in loader | VIEW_DASHBOARD | Y | Y | Y | Y | By account |
| /dashboard/media | nav | auth | `requireIndividualOrEnterpriseAdmin` | VIEW_ORGANIZATION | Y | Y | N | N | By account |
| /dashboard/organization | nav, proxy | `requiresOrgAdmin` | `requireIndividualOrEnterpriseAdmin` | VIEW_ORGANIZATION | Y | Y | N | N | By account |
| /dashboard/settings | nav | auth | dashboard shell/auth | VIEW_SETTINGS | Y | Y | Y | Y | By account |
| /dashboard/help | nav | auth | dashboard shell/auth | VIEW_HELP | Y | Y | Y | Y | By account |
| /dashboard/approvals | proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | Not in nav | N | Y | Y | N | By account |
| /staff | proxy | `requiresPlatformAdmin` | staff layout `requirePlatformAdmin` | Not in nav | N | N | N | N | Y |
| /staff/announcements | staff page | `/staff` `requiresPlatformAdmin` | `requirePlatformAdmin` | Not in nav | N | N | N | N | Y |
| /staff/email-ab-tests | staff page | `/staff` `requiresPlatformAdmin` | `requirePlatformAdmin` | Not in nav | N | N | N | N | Y |
| /staff/email-ab-tests/new | staff page | `/staff` `requiresPlatformAdmin` | `requirePlatformAdmin` | Not in nav | N | N | N | N | Y |
| /staff/email-ab-tests/[id] | staff page | `/staff` `requiresPlatformAdmin` | `requirePlatformAdmin` | Not in nav | N | N | N | N | Y |
| /staff/email-analytics | staff page | `/staff` `requiresPlatformAdmin` | `requirePlatformAdmin` | Not in nav | N | N | N | N | Y |
| /staff/email-preview | staff page | `/staff` `requiresPlatformAdmin` | `requirePlatformAdmin` | Not in nav | N | N | N | N | Y |

## Persona Summary

| Persona | Effective access |
|---|---|
| Individual owner | Core dashboard, Reviews, Contacts, Share Studio, Tasks, Analytics/Trends, Surveys, Widgets, Workspace, Media, Settings, Help. AI Insights and Website Analytics only when Pro. No enterprise manager areas (Campaigns, People, Team overview, EX Surveys, Recognition) or staff tools. |
| Enterprise admin | All core dashboard areas, enterprise manager areas (Campaigns, People, Share Studio, Team overview, EX Surveys, Approvals), Workspace, Media, Recognition, Analytics/Trends/Leaderboard, Surveys, Widgets, Settings, Help. No staff tools unless separately flagged `is_platform_admin`. |
| Enterprise manager | Core dashboard, Campaigns, People, Share Studio, Team overview, EX Surveys, Approvals, Recognition, Analytics/Trends/Leaderboard, Surveys, Widgets, Settings, Help. No Workspace or Media (org-admin only), or staff tools. |
| Enterprise user | Core dashboard, Reviews, Contacts, Tasks, Recognition, Analytics/Trends/Leaderboard, Surveys, Widgets, Settings, Help. No Share Studio, enterprise manager areas, Workspace, Media, or staff tools. |
| Platform staff | `/staff/*` only by the staff flag. Dashboard access is still determined by that user's account type, role, and tier. |

## Notes From Code

- `/dashboard/admin/:path*` permanently redirects to `/staff/:path*` in `next.config.js`.
- **ADR 0007 IA moves** (all permanently redirected in `next.config.js`):
  - `/dashboard/emails` → `/dashboard/campaigns?tab=templates`; the email builder moved to `/dashboard/campaigns/templates/*`.
  - `/dashboard/settings?tab={billing,integrations,api,webhooks}` → the matching Workspace tab (`/dashboard/organization?tab=...`). Settings is personal-only.
  - `/dashboard/team` → `/dashboard/people?tab=members`; `/dashboard/team?tab=overview` → `/dashboard/analytics/team`.
  - `/dashboard/employees` → `/dashboard/people?tab=employees`.
  - `/dashboard/organization?tab=team` (the retired "Users" tab) → `/dashboard/people?tab=members`.
- The org-scoped area is nav-labelled **Workspace** but keeps the route `/dashboard/organization` (page guard `requireIndividualOrEnterpriseAdmin`, unchanged). "Organization" is no longer a nav destination.
- `/dashboard/people` and `/dashboard/analytics/team` are new routes carved out of the former Team page; both use `requireEnterpriseManager` and `requiresEnterprise`+roles at the middleware layer.
- **Contacts** is a nav item deep-linking to the reviews hub's Contacts tab (`/dashboard/reviews?tab=contacts`); the tab itself is gated by `SEND_SURVEY`.
- `/dashboard/surveys` and `/dashboard/widgets` use `getAccessContext`, matching their broad nav permissions.
- `/dashboard/media` uses `requireIndividualOrEnterpriseAdmin` so direct URL access matches nav discoverability (`VIEW_ORGANIZATION`).
- `/dashboard/share-studio` uses `checkPageAccess({ minRole: "manager" })`, which admits individual accounts and requires enterprise manager/admin role; proxy mirrors that with an `allowedRoles` row and no `requiresEnterprise` flag.
