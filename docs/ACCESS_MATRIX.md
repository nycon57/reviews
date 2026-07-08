# Access Control Matrix

Regenerated for ADR 0007 from `src/proxy.ts`, `src/lib/nav/config.ts`, and the page guards in `src/app`. Middleware is the first gate, page guards are the source of truth for rendered pages, and nav permissions are only discoverability.

## Route Access Table

| Route | Source | Middleware guard | Page-level guard | Nav permission | Individual owner | Enterprise admin | Enterprise manager | Enterprise user | Platform staff |
|---|---|---|---|---|---|---|---|---|---|
| /dashboard | nav | auth | dashboard shell/auth | VIEW_DASHBOARD | Y | Y | Y | Y | By account |
| /dashboard/reviews | nav | auth | `getAccessContext` | VIEW_REVIEWS | Y | Y | Y | Y | By account |
| /dashboard/tasks | nav | auth | `checkPageAccess({})` | VIEW_TASKS | Y | Y | Y | Y | By account |
| /dashboard/emails | nav | auth | `requireEnterpriseManager` | VIEW_CAMPAIGNS | N | Y | Y | N | By account |
| /dashboard/recognition | nav, proxy | `requiresEnterprise` | `requireEnterprise` | VIEW_RECOGNITION | N | Y | Y | Y | By account |
| /dashboard/analytics | nav | auth | `getAccessContext` | VIEW_ANALYTICS | Y | Y | Y | Y | By account |
| /dashboard/analytics/trends | nav | auth | `getAccessContext` | VIEW_TRENDS | Y | Y | Y | Y | By account |
| /dashboard/analytics/leaderboard | nav, proxy | `requiresEnterprise` | `requireEnterprise` | VIEW_LEADERBOARD | N | Y | Y | Y | By account |
| /dashboard/insights | nav, proxy | `minTier: pro` | `requireProTier` | VIEW_AI_INSIGHTS | Pro only | Y | Y | Y | By account |
| /dashboard/team | nav, proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | VIEW_TEAM | N | Y | Y | N | By account |
| /dashboard/employees | nav, proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | VIEW_EX_SURVEYS | N | Y | Y | N | By account |
| /dashboard/campaigns | nav, proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | VIEW_CAMPAIGNS | N | Y | Y | N | By account |
| /dashboard/approvals | proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | Not in nav | N | Y | Y | N | By account |
| /dashboard/organization | nav, proxy | `requiresOrgAdmin` | `requireIndividualOrEnterpriseAdmin` | VIEW_ORGANIZATION | Y | Y | N | N | By account |
| /dashboard/surveys | nav | auth | `getAccessContext` | VIEW_SURVEYS | Y | Y | Y | Y | By account |
| /dashboard/widgets | nav | auth | `getAccessContext` in loader | VIEW_DASHBOARD | Y | Y | Y | Y | By account |
| /dashboard/ex-surveys | nav, proxy | `requiresEnterprise`, roles admin/manager | `requireEnterpriseManager` | VIEW_EX_SURVEYS | N | Y | Y | N | By account |
| /dashboard/media | nav | auth | `requireIndividualOrEnterpriseAdmin` | VIEW_ORGANIZATION | Y | Y | N | N | By account |
| /dashboard/settings | nav | auth | dashboard shell/auth | VIEW_SETTINGS | Y | Y | Y | Y | By account |
| /dashboard/help | nav | auth | dashboard shell/auth | VIEW_HELP | Y | Y | Y | Y | By account |
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
| Individual owner | Core dashboard, Reviews, Tasks, Analytics/Trends, Surveys, Widgets, Workspace/Organization, Settings, Help. AI Insights only when Pro. No enterprise manager areas or staff tools. |
| Enterprise admin | All core dashboard areas, enterprise manager areas, Workspace/Organization, Surveys, Widgets, Recognition, EX Surveys, Settings, Help. No staff tools unless separately flagged `is_platform_admin`. |
| Enterprise manager | Core dashboard, Emails/Campaigns, Team, Employees, Approvals, EX Surveys, Recognition, Analytics/Trends/Leaderboard, Surveys, Widgets, Settings, Help. No Workspace/Organization, Media nav, or staff tools. |
| Enterprise user | Core dashboard, Reviews, Tasks, Recognition, Analytics/Trends/Leaderboard, Surveys, Widgets, Settings, Help. No enterprise manager areas, Workspace/Organization, or staff tools. |
| Platform staff | `/staff/*` only by the staff flag. Dashboard access is still determined by that user's account type, role, and tier. |

## Notes From Code

- `/dashboard/admin/:path*` now permanently redirects to `/staff/:path*` in `next.config.js`.
- `/dashboard/surveys` previously blocked enterprise non-admins at the page level. The page now uses `getAccessContext`, matching `VIEW_SURVEYS`, so enterprise users regain Surveys along with Widgets.
- `/dashboard/widgets` already used an authenticated `getAccessContext` loader and matched the broad `VIEW_DASHBOARD` nav permission.
- `/dashboard/media` had nav-only protection through `VIEW_ORGANIZATION`; it now uses `requireIndividualOrEnterpriseAdmin` so direct URL access matches nav discoverability.
