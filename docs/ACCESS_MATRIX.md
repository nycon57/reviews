# Access Control Matrix

Route-level access control for all dashboard pages. Three enforcement layers: **middleware** (edge, fast reject) -> **server component** (getAccessContext / checkPageAccess) -> **client** (permission-based nav filtering).

## Route Access Table

| Route | Ind Basic | Ind Pro | Ent User | Ent Mgr | Ent Admin | Guard |
|---|---|---|---|---|---|---|
| /dashboard | Y | Y | Y | Y | Y | auth |
| /dashboard/reviews | Y | Y | Y | Y | Y | getAccessContext |
| /dashboard/surveys | Y(full) | Y(full) | N | N | Y(full) | getAccessContext+branch |
| /dashboard/requests | Y | Y | Y | Y | Y | getAccessContext |
| /dashboard/share-studio | Y | Y | Y | Y | Y | getAccessContext |
| /dashboard/messages | Y | Y | Y | Y | Y | auth |
| /dashboard/recognition | N | N | Y | Y | Y | requireEnterprise |
| /dashboard/analytics | Y | Y | Y | Y | Y | getAccessContext |
| /dashboard/analytics/trends | Y | Y | Y | Y | Y | getAccessContext |
| /dashboard/analytics/leaderboard | N | N | N | Y | Y | middleware: requireEnterprise |
| /dashboard/insights | N | Y | Y | Y | Y | requireProTier |
| /dashboard/contacts | N | N | N | Y | Y | requireEnterpriseMgr |
| /dashboard/team | N | N | N | Y | Y | requireEnterpriseMgr |
| /dashboard/campaigns | N | N | N | Y | Y | requireEnterpriseMgr |
| /dashboard/organization | N | N | N | N | Y | requireEnterpriseAdmin |
| /dashboard/ex-surveys | N | N | N | Y | Y | requireEnterpriseMgr |
| /dashboard/widgets | Y | Y | Y | Y | Y | getAccessContext |
| /dashboard/settings | Y | Y | Y | Y | Y | auth |
| /dashboard/help | Y | Y | Y | Y | Y | auth |

## Guard Glossary

| Guard | Implementation | Effect |
|---|---|---|
| `auth` | Basic auth check (middleware + unifiedGetUser) | Redirect to /login if unauthenticated |
| `getAccessContext` | `src/lib/access/index.ts` -> getAccessContext() | Resolves org via organization_id OR individual_organization_id |
| `getAccessContext+branch` | getAccessContext() + account type branching | Different UI/behavior for individual vs enterprise |
| `requireEnterprise` | checkPageAccess({ requiresEnterprise: true }) | Redirects individual users to /dashboard |
| `requireEnterpriseMgr` | checkPageAccess({ requiresEnterprise: true, minRole: "manager" }) | Enterprise manager+ only |
| `requireEnterpriseAdmin` | checkPageAccess({ requiresEnterprise: true, minRole: "admin" }) | Enterprise admin only |
| `requireProTier` | checkPageAccess({ minTier: "pro" }) | Redirects basic-tier users to billing |

## Key Architecture Decisions

1. **Dual org column**: Individual users use `individual_organization_id`, enterprise uses `organization_id`. `getAccessContext()` resolves both transparently into `ctx.organizationId`.
2. **Middleware is first line**: Fast edge rejection for clearly-blocked routes (enterprise-only, admin-only). Prevents unnecessary SSR.
3. **Server component is source of truth**: `getAccessContext()` / `checkPageAccess()` in server components handles the full access decision.
4. **Client nav filtering**: `useFilteredNav` uses the permission system to hide inaccessible nav items. Defense-in-depth only.
