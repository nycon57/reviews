# Polish list — cosmetic dedupe/cleanup queued from build review panels

Not blocking PRs (per the build-tail process). Burn down in a dedicated pass.

## From the Zapier build (2026-07-08)
- `src/components/settings/webhooks/outbound-webhook-actions.ts` — the whole
  snake→camel adapter layer is removable: have the lib actions return
  camelCase directly (precedent: `src/lib/webhooks/actions.ts` mapRowToWebhookLog).
- `src/lib/webhooks/outbound/actions.ts` — local `ActionResult<T>` redeclaration
  (30+ modules do this; extract a canonical `@/lib/types` ActionResult someday).
- `mapSubscription` (REST route) vs `mapSubscriptionRow` (actions) — near-identical
  row mappers; share one.
- `process-webhook-deliveries` route clamps batchSize, then the service clamps
  again — drop the route-level clamp.
- `packages/zapier-app/scripts/check-syntax.js` — replace the hand-rolled
  `node --check` walk with `validate`/`typecheck` in the build script.
- Shared `formatRelativeTime` helper in `src/lib/utils.ts` — the
  `formatDistanceToNow` wrapper is copy-pasted 10+ times across the app
  (outbound-endpoints-section, staff-disputes-client, campaigns-dashboard,
  webhook-logs-viewer, ...).
- `buildReviewWebhookData` lives in `src/lib/reviews/publish.ts` — placement:
  belongs in the outbound module with the other payload builders.
- `incrementSubscriptionFailureCount` is read-modify-write (display-only today);
  make atomic (SQL function) if failure_count ever drives auto-disable.
- REST DELETE subscriptions/[id]: SELECT-then-UPDATE could be one UPDATE
  returning a row.

## From the engagement build (2026-07-08)
- `useSkipInitialFetch(hasInitialResult)` hook — the SSR skip-first-mount-fetch
  guard is repeated 4× across the converted list components.
- `milestoneBaseTags(data)` helper — org/LO tag-pair assembly repeated in all
  10 milestone send wrappers.
- Seed existence checks fetch full rows (`SELECT *` → `.length === 0`); a
  head-count would do (negligible tables, noted for completeness).
- Teams DB remnants (notification_preferences.teams_* columns,
  teams_webhook_logs table + its migration) — drop with the drift-decision
  batch; code references are already zero.

## From the analytics/reports build (2026-07-08)
- Two pre-existing state-synced-to-prop-in-effect warnings in older files
  (react-doctor: `ab-tests-list-client.tsx`, `public-survey-form.tsx`,
  `dispute-queue.tsx` area).

## Standing queued items (other)
- Shared uphold/dismiss dialog extraction (reviews area, skipped in its W4).
- `/dashboard/people/[id]` member-edit route move.
- better-auth 1.5.6 → 1.6.x security upgrade (own validated pass; OAuth state
  advisory GHSA-wxw3-q3m9-c3jr; module behind default-off USE_BETTER_AUTH).
