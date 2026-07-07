# Feature Audit Campaign — Planning Document

**Date:** 2026-07-06 · **Status:** Planning (recon in progress) · **Owner:** Jarrett + PM session

Purpose: identify every broad feature/UX area that has NOT had a recent improvement pass (or whose last pass is stale), audit each comprehensively, then run `/grill-with-docs` per area and hand execution to PM-led agent teams per `fable-pm-opus-teams.md`.

---

## 1. Shipping history — what already got improvement passes

| Pass | Scope | When | Evidence |
|---|---|---|---|
| Widgets/embed (E20, S132–S165) | Builder, 10 widget types, analytics, compliance, CDN, E2E | Feb 2026 (Ralph 3-pass) | `.ralph/progress.md` |
| Competitor pages (E19) | 16-section config-driven template, 5 competitors | Feb 2026 (Ralph) | git `(S11x-S13x)` |
| Dashboard cleanup batch | nav links, insights N+1, NPS org-scoping, review detail roles, team confirmations, settings hardcoded counts, campaigns coming-soon, analytics mock removal, approvals, sidebar, header | Mar 2026 | commits `1ece8be`…`412bbf8` |
| Marketing site (REP-181…200) | header/footer/nav, breadcrumbs+JSON-LD, compare index, integrations dir, case studies, security page, cross-links | Mar–May 2026 | commits `c0c14fa`…`b00ee42` |
| Security hardening | RLS (unsubscribes, video, users self-escalation), OAuth state signing, password-reset host poisoning, PII in directory, SECURITY DEFINER RPC, JSON-LD XSS | May 2026 | `codex/*` branches |
| Enterprise vs Individual visibility (Workstreams A+B) | public profile/directory filtering, branch-manager auto-assign | Jun 2026 | `tasks/todo.md` |
| Video testimonial Phase 2 + post-production + review inversion + share/graphics | rating branching, review kits, Remotion clips, auto-kits, disputes system, 9:16 capture | Jun 2026 — **largely UNCOMMITTED on `codex/graphics-video`** | `tasks/todo.md`, working tree |

**Structural facts discovered:**
- SMS (E18, 18 stories) was built then **fully archived** — `src/lib/sms` gone, settings dir has no SMS pages; only `archive/sms-features` branch retains it. Kanban config still lists `sms` domain label.
- Settings dir contains only `api-keys`, `components`, `email-preferences`, `page.tsx` — **no billing page** despite Stripe (S056) marked done.
- Three PRDs pending: **agent-readiness** (16 open — llms.txt, public API v2, WebMCP, agent analytics), **share-studio** (23 pending), Workstream C (contacts table, CRUD/bulk import, EX-survey refactor, department deprecation).
- Linear REP backlog is thin: widget compliance configs (REP-174–179), blocked S140/S154. The audit campaign generates net-new tracked work.

## 2. Staleness table (git last-touched, committed history)

| Area | Last commit | 2026 commits | Note |
|---|---|---|---|
| dashboard/notifications | **2026-01-16** | 3 | stalest dashboard area |
| docs portal, public unsubscribe, public ex-survey | 2026-01-24 | ≤5 | |
| dashboard/reports | 2026-01-25 | 6 | |
| social-graphics | 2026-02-01 | 2 | Share Studio PRD pending |
| marketing directory | 2026-02-24 | 6 | |
| public embed/testimonials, /s | 2026-02-28 | ≤6 | /s has uncommitted work |
| campaigns, recognition, ex-surveys, geo, help, employees | 2026-03-06 | ≤9 | employees: 1 commit |
| surveys, public survey, auth pages, approvals, insights, widgets | 2026-03-14 | | |
| analytics, admin, reviews, team, media (1), emails (1) | 2026-03-17 | | |
| tasks (1), onboarding, organization, pro/org/branch | 2026-03-28 | | pro/org/branch have uncommitted work |
| settings, marketing pass | 2026-03-29 | 32 (settings) | |
| api, mobile, packages, marketing /for | 2026-05-10 | | newest committed work |

Even the newest committed work is ~2 months old; June work is uncommitted on this branch. **Getting `codex/graphics-video` reviewed/committed/merged is a precondition for the campaign.**

---

## 3. Recon findings per cluster

(10 read-only recon agents; findings folded in as they complete.)

### 3.1 People & Engagement (team, employees, recognition, ex-surveys, gamification, notifications, tasks, help) — COMPLETE

**Verdict: feature-complete surface with broken connective tissue; notifications least-touched since Jan.**

Critical/dead ends:
- **404 drill-down everywhere:** `enhanced-leaderboard.tsx:233`, `dashboard/manager/performance-leaderboard.tsx:95`, `performance-alerts.tsx:123`, `user-comparison-table.tsx:270` all link `/dashboard/team/${id}` — **route does not exist** (real one: `/dashboard/analytics/member/[id]`). Primary interaction of the whole gamification/team surface dead-ends.
- **Slack/Teams push orphaned:** `sendSlackNotification`/`sendTeamsNotification` (`lib/notifications/actions.ts:293/577`) have no callers; preferences UI offers toggles that never fire. Only email digests actually send (cron).
- **Notifications type filter broken:** `getNotifications` has no `type` param; `notifications-list.tsx:126-131` filters client-side within current 20-row page; counts wrong.
- Help center: 4 dead `#` links (`help-center.tsx:117/124/130/146`) incl. Live Chat.
- Employee deactivation is one-click, no confirmation (`employees-page-client.tsx:229`).

Health: `notifications/actions.ts` 796 lines, `team-management.tsx` 752; duplicated icon/color/label maps between notification components; `initializeDefaultBadges`/`initializeDefaultEXTemplates` run on every page visit; untyped admin clients in notifications+gamification (type-safety debt); EX-surveys mid-migration to contacts model (departments marked DEPRECATED in `lib/ex-surveys/actions.ts:49`).

Positive: org-scoping healthy in gamification; empty/loading/error states strong; no mock data.

Top fixes (ranked): 1) repoint 404 links; 2) real type filtering; 3) wire-or-remove Slack/Teams; 4) help links; 5) delete confirmation; 6) SSR leaderboard/employees lists; 7) dedupe notification maps; 8) move seed-init off hot path; 9) finish contacts migration; 10) split oversized files.

### 3.2 Surveys + Campaigns + Distribution — COMPLETE

**Verdict: solid engine, broken conversion endpoints, and a half-finished refactor + SMS amputation leaving stubs everywhere.**

Critical:
- **Dead "Leave a Google Review" CTA on the public survey** (`survey/[token]/public-survey-form.tsx:188-194`): button has no onClick/href; no review URL is ever passed (`public-actions.ts:~362`). The high-rating redirect — the primary conversion moment — is inert.
- **5 dead links to nonexistent `/dashboard/surveys/send`**: `lib/tasks/rules.ts:139,188`, `lib/ai/insights-actions.ts:1295`, `lib/email/profile-setup-reminder-service.ts:896`, `lib/email/abandoned-action-recovery-service.ts:510` — tasks, AI-insight actions, and two outbound emails 404. Real send UI lives in `unified-content-hub.tsx:193`.
- **"Send SMS" campaign node is a silent lie:** still in builder palette (`node-registry.ts:259-289`), serializes to `channel:"sms"`, but backend routes everything to email (`channel-router.ts:13` "With SMS removed…"). Users can activate campaigns with steps that never do what they say.

Dead code:
- **~1,800 lines of orphaned duplicate survey builder** — decomposed `components/surveys/shared/` tree has zero importers except `SharedTemplateDetail`; live routes still use the old monolith (`survey-builder.tsx` 610, `question-editor.tsx` 584). Refactor abandoned midway.
- Orphaned `components/distribution/distribution-dashboard.tsx` + `webhook-config-manager.tsx` (no route mounts them); deprecated `getLoanOfficersForSend` still exported; stale `twilio_*` columns in database.types.ts:5509-5731; `ChannelType` still lists sms/whatsapp/rcs.

UX/consistency: no `error.tsx` in campaigns/ or surveys/; surveys list is client useEffect-fetch behind a useless Suspense while campaigns server-fetches — two loading models in one cluster. Org-scoping verified healthy in distribution + campaigns. Workflow builder itself mature (autosave, dirty tracking, edit locks).

Top fixes: 1) wire the Google-review CTA; 2) fix 5 dead send links; 3) remove/flag SMS node; 4) error boundaries; 5) delete-or-finish shared/ builder tree; 6) purge SMS/Twilio residue; 7) SSR surveys list; 8) remove orphaned distribution dashboard; 9) split 1,000-line modules; 10) drop deprecated exports.

### 3.3 Email System (sequences, builder, templates, preferences, A/B) — COMPLETE

**Verdict: the flagship finding of the campaign — E16's lifecycle email program does not run in production.**

Critical:
- **No lifecycle crons scheduled.** `vercel.json` schedules only 6 crons (share-render, campaigns, video-AI/queue, recapture, upsell). The ~8 sequence processors (welcome, reengagement, org-onboarding, role-onboarding, profile-reminders, abandoned-actions, team-invites, subscription-lifecycle) have cron routes + wired caller graphs but are **never scheduled** — no alternate scheduler exists. Only dunning + announcements (event-driven via Stripe webhook / admin send) and review-video-upsell (cron) actually fire.
- **Fully orphaned code, zero callers:** trial-ending-service.ts (1,319 lines, 5-email trial→paid sequence — highest-revenue email, dead); referral-service.ts (983 lines, all 8 exports dead AND mock-backed: hardcoded leaderboard/stats/codes at `:727-946`); all milestone emails (~13 templates + senders + queue readers); video approved/shared emails.
- **A/B testing winner is a no-op:** `email-ab-testing/actions.ts:904,942` — stats collected, winner never applied.
- **Placeholder content in emails that DO send:** weekly summaries hardcode `"< 24 hours"` response time (`weekly-team-metrics.ts:431`, `weekly-lo-metrics.ts:336`); subscription emails use placeholder Stripe data (`subscription-service.ts:1067`).

Structure/UX:
- **Two divergent unsubscribe flows:** legacy `/unsubscribed` (S007-era) vs token `/unsubscribe/[token]` — contradictory copy, different behavior; unsubscribe page says "contact support to resubscribe" while preferences page has real resubscribe.
- Public token pages are client-only useEffect fetches — blank spinner, no SSR/metadata.
- Email IA is siloed: `/dashboard/emails` (builder, enterprise-manager-only, test-send only) and `/dashboard/admin/email-analytics` (admin-only, real data, 856-line component) are unlinked, differently gated.
- Builder is NOT orphaned — output consumed by campaign-email-sender + send.ts `resolveTemplateById`.

Health: send.ts 2,907 lines / templates.ts 2,860 / types.ts 2,564; the 3,049-line orchestration engine is used ONLY by campaigns while ~10 lifecycle services hand-roll identical queue scaffolding (drift risk); error handling is good (retries, backoff, DB logging) but failures land in DB rows with **no alerting**.

Top fixes: 1) schedule the crons; 2) wire-or-delete trial-ending; 3) finish-or-remove referrals; 4) fire milestone emails; 5) apply A/B winners; 6) consolidate unsubscribe flows; 7) fix placeholder metrics in live sends; 8) alert on failed sends; 9) collapse sequences onto orchestration engine; 10) de-silo builder/analytics + SSR token pages.

### 3.4 Analytics / Insights / Reports / Geo — COMPLETE

**Verdict: core analytics (trends, leaderboard, member, insights, website) are real and well-built; GEO is a Potemkin feature; reports has dead premium surface area.**

Critical (trust-level):
- **GEO platform (S043) pervasively fake:** per-platform visibility scores = `overallScore * (0.9 + Math.random()*0.2)` (`lib/geo/actions.ts:125-130`); `getAISearchPerformance` all-random (`:788-814`); dashboard summary hardcodes "42 mentions / 12 citations / 3 implemented" + 3 fabricated mentions (`:874-946`); competitor scores random (`:1241-1248`); **and `recordPerformance` persists random data to `geo_performance_history`** (`:1538-1556`). FAQ/Schema tabs non-functional (`geo-dashboard.tsx:70,82,92` — selectedEntityId never set, handlers underscore-unused, onImplement/onDismiss are console.log). Nav entry commented out but route live.
- **"Export as PDF" downloads .html** (`reports-dashboard.tsx:145-152`, `export-options.tsx:62`) — no PDF renderer exists. CSV/JSON exports work.
- **Report sharing + scheduling: full backend, zero UI callers** (`reporting/actions.ts:98-487` — create/get/revoke share, CRUD scheduled reports ~450 dead lines); header "Scheduled"/"Shared Links" buttons and "Create Schedule" have no onClick; Export History always empty because UI bypasses `exportAndRecordReport`. Public `/reports/shared/[token]` regenerates full report per unauthenticated hit (DoS/cost risk) but nothing can create a share.
- **Admin "Reviews by Source" chart fabricated:** fixed 45/30/15/10 split of real total (`admin-analytics-dashboard.tsx:149-155`).
- `/dashboard/analytics/competitor-pages` is a permanently-empty placeholder page.

Health:
- `lib/ai/insights-actions.ts` 2,082 lines; `lib/geo/actions.ts` 1,688; insights re-queries the same reviews table 6× per load (parallel, not deduplicated — the "N+1 fix" parallelized it); GEO refresh has true sequential N+1 over loan officers (`:854-861`); `ab-testing/mock-data.ts` now dead code (no runtime callers); duplicated TrendIndicator/getInitials/ReportViewer boilerplate; org-scoping verified healthy incl. NPS.
- Positive: trends dashboard is best-in-class (real data, empty/error/retry states); website analytics real; SEO audit performance score is placeholder (`seo-audit.ts:473`).

Top fixes: 1) GEO honesty (demo-label or wire real data); 2) stop persisting random GEO data; 3) real PDF or honest label; 4) wire report sharing/scheduling UI; 5) fix GEO FAQ/Schema tabs; 6) real reviews-by-source query; 7) record exports; 8) batch GEO N+1; 9) single-fetch insights dataset; 10) split oversized files + dedupe utils.

### 3.5 Reviews Core (post-inversion) — COMPLETE

**Verdict: inversion migration itself is solid (labels, disputes, moderation chips all correct), but it disconnected the alerting/response nervous system, and all four known follow-ups remain open.**

Critical:
- **S018 alerts orphaned by the inversion:** the rich preference-aware `createNotification` dispatcher (email/Slack/Teams fan-out) is no longer called from any live publish path — its only caller is `auto-reply-processor.ts:293`, which itself runs on an **unscheduled** cron. All three publish paths call only `notifyReviewNeedsResponse`, which fires solely for below-threshold reviews. Net: **no alert of any kind for new positive published reviews; negative reviews get in-app only.**
- **Google replies are a dead end:** composer + auto-reply engine insert `google_review_replies` with `status:'pending'` for "a background job" that **does not exist** (`response-actions.ts:398-418`, `auto-reply-processor.ts:264-269`). Replies never reach Google. (Google ingestion itself is REAL — OAuth, sync, reply API all built — but `google-sync` cron is also unscheduled; sync only happens once on connect.)
- **~19 cron routes exist; vercel.json schedules 6.** Same systemic finding as email cluster.
- **Response-confirmation email only sent when `source === "internal"`** (`response-actions.ts:421`) — direct/video reviews (the new model's main sources) never notify the reviewer of a response.
- All four todo.md follow-ups confirmed open: no `publishReviewIfClean` helper (4 divergent screen-then-publish copies confirmed, drift already visible); individual-dispute escalation is email-only and **silently no-ops if env var unset** (`flag-actions.ts:580-586`); db:types regen blocked (pervasive `as any`/untyped clients); embed widgets still say "Video Testimonial" (`embed/core/source-labels.ts:9`).

Stale seams:
- `ReviewSource` type omits `direct`/`video_testimonial`/`survey`/`manual_json`/`repwell` (`types.ts:58`) → source filter can't filter the new model's reviews.
- Old-model vocabulary: quarantine release still labeled "Approve/Reject"; `PublishingStatusPanel` "approved" copy pre-inversion; notification type `review_needs_response` missing from S018 `NotificationType` union.
- `/dashboard/approvals` is NOT review approvals — it's the Share Studio proof-item edit queue; separate domain, colliding vocabulary, reachable only via command palette.
- `canComposeResponse` allows public responses to quarantined (not-yet-public) reviews (`review-detail-view.tsx:291-292`).

Health: `video-testimonials/actions.ts` 2,770 lines, `public-actions.ts` 2,357 (holds `createCanonicalReviewForResponse` — a reviews concern buried in video code); triplicated status-badge logic; org scoping verified consistent (trust it — don't re-litigate).

Top fixes: 1) reconnect publish paths to createNotification; 2) fix Google reply dead end; 3) register missing crons (audit all ~19); 4) response emails for direct/video; 5) extract publishReviewIfClean; 6) individual-dispute UI + env guard; 7) fix ReviewSource type/filter; 8) embed label parity; 9) approval→publish vocabulary; 10) regen types + dedupe badges.

### 3.6 Public Surfaces (pro/org/branch, directory+maps, smart links, SEO) — COMPLETE

**Verdict: strong metadata/JSON-LD baseline, but conversion/SEO leaks and a dead short-link domain; maps built-but-unmounted.**

Critical:
- **Dead `/r/[shortCode]` short links:** commit `011c1e6` deleted the resolver route + `src/lib/sms/short-links/` service, but `sms_short_links` table remains (`database.types.ts:5752`) and `email-builder/merge-fields.ts:30` still advertises `…/r/abc123` as the review-link format. Outstanding SMS/email links hit generic 404 (not even `/r/expired`).
- **No generated OG images for pro/org/branch** — they reuse uploaded photos; a professional without a photo ships zero OG image. Only `/s/[slug]` has a real `opengraph-image.tsx`. Biggest social-CTR win.
- **Maps built but unmounted:** `OfficeLocationMap` (+static fallback) exported but unused (`pro/[slug]/components/index.ts:8`); `leaflet-map.tsx` reachable only through it → **pro profiles show no map**; and `leaflet-map.tsx:44` disables both zoom control and scroll zoom. Leaflet CSS imported globally in root `layout.tsx:4` on every marketing page.
- **Profile bodies fully client:** `organization-profile-content.tsx` (707), `branch-profile-content.tsx` (569), `pro-profile-content.tsx` (334) all `"use client"` + framer-motion on SEO-critical URLs; no loading.tsx/error.tsx anywhere in cluster → slow query = blank page.

Other:
- Base-URL split: `getBaseUrl()` (NEXT_PUBLIC_SITE_URL→VERCEL_URL) vs `NEXT_PUBLIC_APP_URL` in testimonials/embed — canonicals/OG can disagree; VERCEL_URL fallback can emit preview-deploy canonicals.
- Directory double-fetches `searchProfessionals` per load (page + content, both `/directory` and `/directory/[industry]`); ~150 lines duplicated between the two directory pages.
- Review-list/StarRating/getInitials re-implemented inline in org+branch instead of reusing pro's `ReviewsList` (~400 lines drift).
- Pro Twitter card `summary` (should be `summary_large_image`); robots.ts allow-list omits /org /branch /directory.
- Enterprise-vs-individual gating verified consistent and graceful across all public surfaces (no broken-individual cases). Video recording flow is strong (device pre-check, retries, ARIA, no-camera fallback).

Top fixes: 1) OG images for profiles; 2) fix/purge `/r` short links; 3) server-componentize profile bodies; 4) unify base-URL env; 5) dedupe directory fetch; 6) mount OfficeLocationMap + re-enable zoom; 7) loading/error boundaries; 8) Twitter card + robots consistency; 9) shared reviews module; 10) DirectoryPageShell extraction.

### 3.7 Platform & Account (settings, billing, onboarding, auth, admin, media) — COMPLETE

**Verdict: billing is real end-to-end (checkout, portal, dunning, grace periods) — but tier-gating bugs charge users and deny them the product; auth runs a risky dual system.**

Critical (revenue/user-facing):
- **Individual Pro tier treated as Basic everywhere:** middleware (`proxy.ts:276-278`) and access module (`access/index.ts:129-131`) hardcode `subscription_tier:"basic"` for individual accounts — **paying individual Pro users are locked out of Pro features** (insights etc.).
- **Billing tab shows "Free" to paying customers:** `TIER_CONFIG` keyed `free/starter/professional/enterprise` but real tier ids are `basic/pro/enterprise` → no match → falls back to Free (`billing-tab.tsx:53-58,94-96`).
- **Organization access contradiction confirmed** (same as §3.9): nav+page welcome individuals, middleware `requiresEnterpriseAdmin` bounces them (`proxy.ts:46,320-326` vs `organization/page.tsx:54`).
- **Ungated admin pages:** `admin/announcements/page.tsx` and `admin/email-preview/page.tsx` render with no server-side auth check (send API is gated; UI is not). Inconsistent gates: email-analytics accepts bare `role==='admin'`, email-ab-tests requires enterprise admin. **No true platform super-admin role exists.**
- **Onboarding:** dead link on completion — "Connect integrations" → `/dashboard/settings/integrations` (route doesn't exist; needs `?tab=integrations`) (`completion-client.tsx:41`); `completeOnboarding` fires from client useEffect — user who never lands on completion page loops back into onboarding forever; individual completion detection relies on fragile address heuristic (`proxy.ts:270-278`).
- **Auth:** no OAuth sign-in (password + magic link only); **no app-level rate limiting on the active legacy path** (only Better Auth branch has it, `USE_BETTER_AUTH` default off); no cooldown on verification/magic-link resend. Password reset verified poisoning-safe. Signup always creates individual accounts — enterprise is provisioned out-of-band.

Settings/billing details: Smart Links tab read-only by design; "API Status: All systems operational" hardcoded (`api-tab.tsx:327-329`); `usage.apiCallsToday` hardcoded 0; three billing Quick Actions all open the same portal link despite invoices/paymentMethods already fetched; two parallel billing UIs (settings BillingTab + organization-billing.tsx). Media library is real (1 commit in 2026).

Health: dual auth system (`USE_BETTER_AUTH` branches proxy/actions/callback) doubles surface + drift risk; middleware fetches `/api/auth/get-session` per request in Better Auth mode; billing/onboarding tables absent from generated types (`as any` everywhere); `auth/callback` stalest (Jan 24).

Top fixes: 1) real tier for individuals; 2) Organization access alignment; 3) TIER_CONFIG keys; 4) gate admin pages + unify checks; 5) onboarding dead link + server-side completion; 6) auth rate limiting/cooldowns; 7) real reviews-by-source; 8) real billing quick actions; 9) single billing UI; 10) retire dual auth + regen types.

### 3.8 Integrations / Developer / Mobile (API v1, webhooks, docs, Expo) — COMPLETE

**Verdict: core API/webhooks/Google/social are real; a layer of advertised-but-nonexistent integrations sits on top; mobile is half mock.**

Integration reality map:
- REAL: public REST API (hashed keys, scopes, DB rate limiting), inbound webhooks (HMAC + retries; **inbound only** — no outbound delivery system despite docs implying it), Encompass/LOS inbound, Google Business Profile sync (cron), social auto-publish (FB/Twitter/LinkedIn/IG via cron), embed CDN, WordPress plugin.
- PARTIAL: Salesforce (full backend, but UI card **orphaned** — not rendered anywhere — and no sync cron; manual server-action only); `@repwell/react-widgets` (builds, unpublished, dist uncommitted, no publishConfig).
- STUB/FALSE ADVERTISING: **Zapier** (docs at `lib/docs/content.ts:1322-1423` describe a published app with triggers/actions; zero code), **Slack, Teams, HubSpot** (marketing pages only, `config/integration-pages.ts:290,422,554,686`).
- DEAD: **Apple Business Connect (S041) — zero matches in repo**, story never implemented.

Critical defects:
- **WordPress plugin default embed URL 404s:** shortcode loads `{api_base}/embed.js` defaulting to `https://app.repwell.com/embed.js`, but app serves only `/embed/v1/embed(.min).js` and no rewrite exists (`class-repwell-shortcode.php:94-96`, `next.config.js:216`).
- **Twitter OAuth PKCE fake:** hardcoded `code_challenge='challenge'`, method `plain` (`lib/social/client.ts:52-53,101`).
- **Rate limiting + usage logging fail open** (`lib/api-keys/validate.ts:127-135,177`).
- **Mobile app:** HomeScreen metrics hardcoded (47 reviews/4.8★/NPS 72, fake refresh), ReviewsScreen renders MOCK_REVIEWS, Settings has 4 "Coming Soon" alerts; only video-testimonials flow + auth are real. Talks directly to Supabase, bypassing api/v1. Uncommitted deletion of `mobile/babel.config.js` risks breaking Metro alias resolution (module-resolver still in devDeps).
- **OpenAPI spec drift:** registry omits implemented share-studio/*, transcribe, render, widgets/* routes.

Top fixes: 1) remove/gate false integration claims; 2) fix WP embed URL; 3) real data or hide mobile Home/Reviews; 4) resolve babel.config deletion; 5) real PKCE; 6) mount Salesforce card + cron; 7) fail-closed rate limiting; 8) sync OpenAPI; 9) publish or mark private react-widgets; 10) fix webhooks docs scope (inbound-only).

### 3.9 Dashboard IA & Semantics (account vs org vs admin) — COMPLETE

**Verdict: the dashboard's IA has real semantic rot — "admin" means three unrelated things, people management has four homes, and nav/middleware/page guards disagree about who can go where.**

Critical:
- **Cross-org data exposure via overloaded "admin":** `/dashboard/admin/*` (email analytics, A/B tests, announcements) gated only by `role === "admin"` (`admin/email-analytics/page.tsx:16-31`) — but enterprise org admins and individual owners also carry that role (`(dashboard)/layout.tsx:99`). `admin/announcements/page.tsx` has **no server access check at all**. Needs a distinct platform-admin flag.
- **Individuals see a dead "Organization" nav item:** nav shows it (`config.ts:133-138`), middleware bounces them to `/dashboard?error=admin_only` (`proxy.ts:53,320-326`), while the page guard `requireIndividualOrEnterpriseAdmin` (`organization/page.tsx:54`) was written to welcome them with individual-specific tabs. Three layers disagree; the individual-facing org UI is unreachable code.
- **Nav-only enforcement:** Admin section `hideForEnterpriseUser` strips Surveys/Widgets from enterprise users with no matching server guard — contradicts ACCESS_MATRIX and its own defense-in-depth claim.
- **Weak/no guards on hidden routes:** media, social-graphics, notifications pages have no role guard; geo's nav entry commented out (`config.ts:97-103`) but route live behind requireProTier.

Structure:
- **Billing in 2 places** (Settings→Account→billing AND Organization→Billing) — all CTAs (sidebar upgrade, user dropdown) point only at Settings. **Integrations also in 2 places.**
- **People in 4 surfaces / 3 names:** Team ("Members"), Employees, Organization→"Users" tab, `organization/users/[id]` ("member"). `/dashboard/organization/users` and `/branches` base paths 404 (no index page).
- **"Emails" (Core) vs "Campaigns" (Team):** same permission (VIEW_CAMPAIGNS), duplicate concept, two sections.
- **Terminology drift table** built: Team/Employees/Members/Users; Emails/Campaigns; Surveys/EX Surveys/Requests; Organization/Company; "Admin" ×3; ghost "Messages" reference in config comment.
- **ACCESS_MATRIX.md substantially stale:** documents 4 phantom routes (requests, share-studio, messages, contacts), omits ~11 real ones, wrong widget rule for enterprise users.
- **No breadcrumbs anywhere in dashboard**; "Team" section contains "Team" item; hidden-but-live routes: social-graphics, notifications, reports, geo, approvals, admin/*.

Top fixes: 1) platform-admin flag + rename `/staff`; 2) resolve individual Organization dead-end (hide or admit + rename section "Workspace"); 3) merge Emails/Campaigns; 4) consolidate People; 5) single billing home; 6) permission-based (not section-hide) nav filtering; 7) regenerate ACCESS_MATRIX from code; 8) guard hidden routes; 9) rename Surveys/EX Surveys/Requests semantics; 10) breadcrumbs + section renames.

Key files: `lib/nav/config.ts`, `lib/nav/use-filtered-nav.ts`, `lib/permissions/index.ts`, `proxy.ts`, `organization/page.tsx`, `settings/components/settings-tabs.tsx`, `docs/ACCESS_MATRIX.md`.

### 3.10 Acquisition Pipeline (contacts → text/video review) — COMPLETE

**Verdict: the revenue engine's manual path works; every automated path is dead-on-arrival; recipient identity is fragmented across 6+ tables.**

Critical (revenue):
- **`process-queue` cron orphaned** — sole caller of `processDistributionQueue`; not in vercel.json. **All non-immediate survey sends and ALL 3d/7d survey reminders never fire.** (Video reminders DO run — separate scheduled queue.)
- **Every automated ingestion channel queues and dies:** API v1 surveys (`api/v1/surveys/route.ts:237`), webhooks incl. Encompass (`survey-trigger/route.ts:650`), Salesforce closed-won (`salesforce/actions.ts:790`) — all create `pending` surveys that never send and show as perpetual "pending" in the dashboard. Manual single + bulk CSV work (sendImmediately:true).
- **Salesforce attribution bug:** auto-surveys assigned to *first active user* in the org (`salesforce/actions.ts:733-739`) — wrong professional gets the review.
- **SMS sold, not implemented:** marketing promises Twilio/SMS (`feature-pages.ts:961,995`, `solution-pages.ts:80`), SMS toggles in preference center, `twilio_*` columns — zero sender code. Capability/marketing gap + false-advertising exposure.
- **Mobile video requests skip reminders, dedup, and audit** (`mobile/src/lib/video-testimonials.ts:322-365` vs web `actions.ts:264,404`).

Structural:
- **No customer contacts layer (Workstream C unbuilt; note: the `contacts` table that existed was renamed `employees` — it's EX-survey infra).** "A person we asked for feedback" lives in 6+ tables: surveys, video_testimonial_requests, salesforce_contact_mappings, profile_referrals, reviews(direct), survey_responses (+ employees/ex_survey_invitations). No cross-table dedup/suppression → over-messaging + compliance risk.
- **Funnel half-blind:** survey `opened_at` captured but dropped from the unified view (`unified-requests.ts:137`); no "published" stage; stats capped at 500 rows; no per-professional funnel anywhere.
- **Rating-less survey responses create no review** (`surveys/public-actions.ts:282`) — text/NPS-only completions forfeit publishable proof.
- **"Review collection" campaigns are aspirational:** campaign engine can only enroll internal `user_id`s into email_sequences (`campaign-engine.ts:64`); the customer-acquisition categories in the modal have no execution path.
- No API path for video requests (api/v1/testimonials only has /transcribe); base-URL inconsistency between survey and video links.

Top fixes: 1) schedule process-queue; 2) verify automated channels end-to-end; 3) Salesforce attribution; 4) SMS decision (build or unsell); 5) mobile parity; 6) video via API; 7) contacts/suppression layer (Workstream C); 8) full funnel view; 9) review-from-text decision; 10) campaigns-for-customers decision or remove categories.

### 3.11 Agent Readiness (from PRD, no recon needed)
All 16 stories open: JSON-LD on profile/org pages, llms.txt, public API v2 (search/detail/reviews/rollups/OpenAPI 3.1), usage logging + rate limiting, agent traffic detection, agent analytics dashboard, WebMCP registration, robots.txt AI crawlers, API dev docs.

---

## 4. Cross-cutting themes (synthesis)

Recon of all 10 clusters converged on seven systemic patterns. These, not the individual bugs, should shape the campaign:

**T1 — The cron catastrophe (single highest-impact finding).** `vercel.json` schedules 6 cron routes; ~25 exist. Dead as a result: survey distribution queue + ALL survey reminders (acquisition), all 8 lifecycle email sequences (welcome/onboarding/reengagement/reminders/team-invite/subscription), google-sync (external review ingestion after first connect), auto-replies, alerts/digests/weekly summaries, social post publishing, scheduled reports. One infrastructure fix + per-route verification revives ~7 "dead" features at once.

**T2 — Fabricated data shown as real.** GEO dashboard (Math.random, persisted to DB), admin reviews-by-source chart, mobile Home/Reviews screens, hardcoded "API Status: operational", "< 24 hours" response time in live weekly emails, "Free" plan label for paying customers.

**T3 — Advertised-but-nonexistent capabilities.** Zapier (docs describe a published app), Slack, Teams, HubSpot, SMS/Twilio (marketing + preference toggles), Apple Business Connect (S041 never built), review-collection campaigns (no customer enrollment path).

**T4 — Revenue-path breaks.** Individual Pro hardcoded to basic (paying users denied features); billing tab shows "Free"; trial-ending sequence dead (zero callers); dead "Leave a Google Review" CTA on surveys; `/r` short links 404; automated acquisition channels dead (T1); Salesforce mis-attribution.

**T5 — Dead-end links & orphaned routes.** `/dashboard/team/[id]` (×4 components), `/dashboard/surveys/send` (×5 callers incl. 2 emails), onboarding→settings/integrations, help-center `#` links (×4), `/r/[shortCode]`, org users/branches base paths.

**T6 — Built-but-unmounted features.** Report sharing/scheduling backend (~450 lines, no UI), Salesforce dashboard card, distribution dashboard, `surveys/shared/` builder tree (~1,800 lines), OfficeLocationMap (pro profiles have no map), Slack/Teams notification senders, S018 alert dispatcher (orphaned by inversion), react-widgets package (unpublished), email builder (siloed).

**T7 — Semantic rot in IA + access control.** "admin" = 3 meanings with cross-org leak; nav/middleware/page disagreement on Organization; people management ×4 surfaces ×3 names; billing ×2 places; Emails vs Campaigns split; ACCESS_MATRIX.md stale; nav-only enforcement; dual auth system.

## 5. Campaign plan

### Phase 0 — Preconditions (before any audit team spawns)
1. **Land the June work**: review, commit, and merge `codex/graphics-video` (~110 modified files incl. review inversion + video post-production). Everything else diffs against it.
2. **db:types regen** (blocked on applying `consolidate_review_widgets` migration remotely) — unblocks removing `as any` across reviews/billing/onboarding.

### Phase 1 — Hotfix sprint (objective bugs; no grill needed; 1 PM team)
The recon found bugs that need no product decision — fixing them before audits prevents every audit from re-reporting them:
- H1: Cron registration audit — schedule the ~19 orphaned routes (verify each is intended; stagger schedules). [T1]
- H2: Individual Pro tier gating (`proxy.ts:276`, `access/index.ts:129`) + TIER_CONFIG keys (`billing-tab.tsx:53`). [T4]
- H3: Dead links batch: team/[id] ×4, surveys/send ×5, onboarding integrations link, help links, WP `/embed.js` rewrite. [T5]
- H4: Survey "Leave a Google Review" CTA wiring. [T4]
- H5: Reconnect publish paths → `createNotification` (new_review/negative_review). [T6]
- H6: Server-gate `admin/announcements` + `admin/email-preview`; unify admin checks. [T7]
- H7: Rate limiter fail-closed + auth resend cooldowns. 
- H8: Stop persisting random GEO data (`geo/actions.ts:1538`); label GEO as preview or disable route.
- H9: Google reply processor (post pending `google_review_replies`) or disable composer for Google reviews.
- H10: Employee-deactivation confirm dialog; notifications type filter.
- H11: Directory contact form is an open email relay — `to: professionalEmail` taken from client input (`lib/directory/contact-action.ts:39`) and professional's raw email exposed in client props; resolve recipient server-side from professional id. (Found during Phase 0 diff review, pre-existing.)
- **H12 (triage workstream, not a sweep): react-doctor full-repo scan (2026-07-07) reports "unauthenticated server action callable directly" ×543 across 89 files** — the `recordConsentEvent`-class exposure at repo scale. Many are false positives (actions that auth internally via getAuthenticatedOrganizationContext etc.), but the true positives are IDOR/forgery surface. Needs: sample-triage per the tool's own guidance → a standard `requireX` wrapper convention → area-by-area remediation folded into each Phase 2 team's scope. Also logged from same scan: 88 oversized components, 79 full framer-motion imports (bundle), 1 a11y error + 163 warnings — feed into the perf/a11y standards work (Grill #11).

### Phase 2 — Audit + grill + rebuild, per area (priority order)
Each area: (a) full audit using recon §3 as the map, (b) `/grill-with-docs` session, (c) Linear issues, (d) PM-team execution per `fable-pm-opus-teams.md`.

| # | Area | Why this order | Key grill decisions |
|---|---|---|---|
| 1 | **Acquisition pipeline + surveys/campaigns** (§3.2+§3.10) | Revenue engine; most dead automation | Contacts/suppression architecture (Workstream C); SMS build-or-unsell; campaigns-for-customers vision; Salesforce attribution model; rating-less→review policy |
| 2 | **Email system** (§3.3) | 23 stories dark; retention + trial revenue | Which sequences SHOULD exist; trial-ending/referral/milestone keep-or-kill; consolidate onto orchestration engine; unsubscribe flow merge; send-failure alerting |
| 3 | **Dashboard IA + platform/account** (§3.7+§3.9) | User-facing confusion + access-control correctness; blocks other UI work | admin→/staff split + platform-admin flag; People consolidation + naming; billing home; Emails/Campaigns merge; individual nav model; dual-auth retirement; ACCESS_MATRIX regen |
| 4 | **Reviews core** (§3.5) | Fresh inversion needs its follow-through | Alerting policy per rating; individual-dispute platform UI; approval→publish vocabulary; response-to-quarantined policy |
| 5 | **Public surfaces + SEO** (§3.6) | Compounding SEO/conversion returns | OG image design; maps on profiles; server-componentization scope; base-URL unification |
| 6 | **Analytics/reports/GEO** (§3.4) | Trust + premium surface | GEO kill/demo/build decision; report sharing+scheduling productization; real PDF vs honest label |
| 7 | **Integrations + mobile** (§3.8) | Honesty pass + platform reach | Which stub integrations to actually build (Zapier? Slack?); mobile app scope (fix Home/Reviews or cut to video-only); react-widgets publish |
| 8 | **People & engagement** (§3.1) | Mostly execution after H-fixes | Slack/Teams push wanted?; help center content plan; leaderboard SSR |
| 9 | **Agent readiness** (PRD, §3.11) | Net-new build, 16 stories ready | API v2 tiering; WebMCP scope; agent analytics placement |
| 10 | **Share Studio** (PRD, 23 stories) | Net-new build; depends on Phase 0 merge | Template DSL scope; already spec'd — grill on sequencing only |

### Phase 3 — Execution mechanics (per fable-pm-opus-teams.md)
- One PM session per area, worktree-per-team (`git worktree add ../reviews-<team>`), Opus workers with self-contained prompts (verified facts from §3 recon, file boundaries, pre-made decisions from grill).
- Gates per kanban config: `npm run build`, `npm run lint`, `/simplify`, `/react-doctor`; Tier-2 escalations (silent-failure-hunter on error-handling changes, type-design-analyzer on new types); code-simplifier pre-commit.
- Skill battery per audit: feature-dev:code-reviewer + fallow (dead code) + supabase-postgres-best-practices (queries/RLS) + /preflight per route + impeccable/web-design-guidelines + agent-browser walk-throughs (empty-account, individual, enterprise-admin, enterprise-user personas).
- Linear: team REP, kanban states already configured (`.agents/kanban/project-config.json`); one epic per area, hotfixes as standalone issues.

## 6. Grill #1 — Acquisition (2026-07-07): DECISIONS LOCKED

Glossary: CONTEXT.md § Acquisition. ADRs: 0004 (Contact architecture), 0005 (SMS deferral).

1. **Contact is first-class** (not a suppression overlay). 2. **Separate from Employee** — original C3 unification formally overruled. 3. Term **Contact**, table `contacts`; "customer" demoted to informal role language. 4. **Org-scoped + single reassignable Owner**; admins/managers see all, professionals see owned; individual scope = their individual org. 5. **Email identity per org, phone-ready** (E.164, per-org unique, email nullable-capable later). 6. **Suppression: org-level, per-channel, reason-tracked**, one send-time check; folds in legacy `email_unsubscribes`. 7. **Migration: backfill + link + send-time snapshots** (request rows keep inline PII as immutable audit truth). 8. **Campaigns: extend the existing engine with polymorphic (user|contact) enrollment**; review_collection/testimonial categories become real Acquisition Sequences; default template = invitation + 3d/7d. 9. **SMS: unsell now, restore archived E18 onto Contact foundations post-Contacts+Sequences** (ADR 0005). 10. **Salesforce attribution: opportunity-owner email match; unmatched → Held Request queue, never sent misattributed**; optional org default-assignee setting. 11. **Two survey kinds, validated**: Review-Generating Surveys require a rating question; Feedback Surveys never publish and say so; no NPS→stars manufacturing. 12. **Contacts UI = tab in the reviews content hub beside Requests** (list, import, suppression, timeline); full funnel (sent→opened→started→submitted→published + Held/stuck attention states) on Requests; per-professional funnel card in Analytics; top-level nav placement deferred to the IA overhaul.

Execution prerequisites unchanged: Phase 0 (merge branch, db:types) and Phase 1 hotfixes H1 (crons) + H2–H4 precede or accompany this build.

## 6b. Grill #2 — Email (2026-07-07): DECISIONS LOCKED

1. **Activate the 8 cron-wired sequences via H1; build + schedule trial-ending's missing cron.** 2. **Referral emails: delete now** (mock-backed, callerless); rebuild later as a real post-Contacts feature. 3. **Milestone emails: fire them** (write the one missing cron). 4. **A/B testing: finish the winner-apply step** (keep the feature). 5. **Orchestration: opportunistic migration** — new sequences MUST use the engine (Contacts build extends it anyway); existing services migrate only when touched. 6. **Unsubscribe end-state: two purpose-built flows** — Contact-scoped page writing Suppression for acquisition emails; token preference center for platform-user emails; legacy `/unsubscribed` dies with redirects. 7. **Failure alerting: daily admin digest over threshold + failure-rate card in admin email-analytics.** Also carried from recon into execution without grill: fix placeholder metrics in weekly summaries; placeholder Stripe data in subscription emails.

## 6c. Grill #3 — IA / Platform / Account (2026-07-07): DECISIONS LOCKED

ADRs: 0006 (single organizations table + account_type discriminator — **supersedes the "individuals must not use organizations tables" rule**; individual_organizations merges in and dies; verification is an explicit account_type display/RLS gate), 0007 (IA end-state). Glossary: CONTEXT.md § Platform & IA.

1. **Data model: one organizations table, account_type discriminator** (ADR 0006). 2. **Platform staff: `is_platform_admin` flag + `/staff` namespace**, one `requirePlatformAdmin` guard. 3. **Auth: commit to Better Auth**, complete the migration then delete legacy + flag; H7 hardens legacy meanwhile. 4. **People: one area, two rosters** (Members = accounts; Employees = EX roster); Team overview/leaderboards → Analytics; Org→Users dies. 5. **Me-vs-Us split:** Settings personal-only; **Workspace** holds all org-scoped config (billing, branding, integrations, webhooks, API keys, templates); redirects + CTA repoints. 6. **Campaigns absorbs Emails** (tabs: Sequences, Templates). 7. **Org area named "Workspace"** for both account types. 8. **Contacts promoted to Core nav** when IA ships (hub tab interim). Also locked as execution defaults (no alternatives worth grilling): permission-based nav filtering replaces section-hide; breadcrumbs added dashboard-wide; ACCESS_MATRIX regenerated from code and CI-checked.

## 6d. Grill #4 — Reviews Core (2026-07-07): DECISIONS LOCKED

1. **Notification policy: every published review notifies the owning professional** (in-app + email via S018 preferences); below-threshold additionally alerts managers/admins urgently + needs-response task. 2. **Google replies: unified queue + new cron + posting status** on the row; composer and auto-reply engine share one path with retries. 3. **Individual disputes: /staff dispute queue** (mirrors enterprise queue, uphold/dismiss + audit trail); reporter sees status; env email becomes notification-only. 4. **Vocabulary: full sweep** — Publish/Remove verbs, PublishingStatusPanel rewrite, embed labels → "Video review". 5. **Responses on quarantined reviews: draft-only until Live** (auto-surface on publish). Execution defaults (no grill needed): extract `publishReviewIfClean` (4 copies); fix `ReviewSource` type + source filter; response-confirmation emails for direct/video sources; regen types.

## 6e. Grill #5 — Public Surfaces & SEO (2026-07-07): DECISIONS LOCKED

1. **OG images: generated branded card per profile type** (name, org, stars, count; embeds photo/logo when present, monogram fallback) — modeled on the /s/ generator. 2. **Maps: static-first OfficeLocationMap on pro/branch profiles, interactive Leaflet on tap; zoom enabled; Leaflet CSS scoped to the component.** Execution defaults: server-componentize profile bodies (client islands), single base-URL env, loading/error boundaries, directory fetch dedupe + DirectoryPageShell, shared reviews module, robots/Twitter-card fixes, `/r` short-link purge-or-restore folded into H3.

## 6f. Grill #6 — Analytics / Reports / GEO (2026-07-07): DECISIONS LOCKED

1. **GEO: kill now** — remove route + fake-data writers, purge fabricated `geo_performance_history` rows; honest AI-visibility work revisits inside agent-readiness (area #9). 2. **Report sharing + scheduling: wire the UI** onto the existing backend (share links, revoke, scheduled CRUD, export history via `exportAndRecordReport`) + cache the public viewer (per-hit regeneration is a DoS risk). 3. **PDF export: real PDFs via `@react-pdf/renderer`** (pure JS, Vercel-function-safe; report layout re-authored as react-pdf components; also becomes the scheduled-report attachment format). *Note: Remotion explicitly rejected for PDFs — video-only tool (Jarrett correction).* Execution defaults: real reviews-by-source query in admin analytics; single-fetch insights dataset (kill the 6× re-query); delete dead `ab-testing/mock-data.ts`; competitor-pages analytics page gets real data or is removed; dedupe chart utils.

## 6g. Grill #7 — Integrations / Developer / Mobile (2026-07-07): DECISIONS LOCKED

1. **Delist Teams/HubSpot/Apple-Business-Connect (S041 formally dropped) + fix the fictional Zapier doc; then BUILD Zapier for real** inside the acquisition program (thin app over existing public API + webhook triggers). Slack's marketing claim resolves via the Grill #8 notification decision. Salesforce (already real): mount the orphaned card + add sync cron. 2. **Mobile app: out of v1 entirely (Jarrett)** — archived like SMS: `archive/mobile-app` branch, removed from main, no store/marketing presence; the babel.config question dies with it. 3. **@repwell/react-widgets: archived** — evaluation found zero internal imports, zero external consumers, never published, not in docs; embed.js + WP plugin cover embedding. Execution defaults: real PKCE for Twitter OAuth, fail-closed rate limiting, OpenAPI registry synced to actual routes, webhooks docs corrected to inbound-only, WP `/embed.js` rewrite (H3).

## 6h. Grill #8 — People & Engagement (2026-07-07): DECISIONS LOCKED

1. **Slack push: wire it inside H5** (createNotification calls the existing sender per user preference) — this also makes the Slack marketing page true (closes the Grill #7 carve-out). **Teams: senders + toggles removed.** 2. **Help center: wire Getting Started + API cards to /docs, remove Video Tutorials until content exists, Live Chat becomes email support.** Execution defaults: H3 (404 leaderboard links), H10 (delete confirm, notification type filter), SSR leaderboard/employees, dedupe notification maps, seed-init off hot path, finish employees-side contacts cleanup (per ADR 0004 boundary).

## 6i. Grill #9 — Agent Readiness (2026-07-07): DECISIONS LOCKED

**Adopt all 16 stories**, sequenced: JSON-LD/llms.txt/robots first (SEO-adjacent, public-surfaces team can carry), then API v2 + logging + rate limiting, then agent analytics (the honest successor to GEO's promise), **WebMCP last**. **Open (keyless) search tier stays**, protected by the PRD's own rate-limit/logging stories.

## 6j. Grill #10 — Share Studio (2026-07-07): DECISIONS LOCKED

**Reconcile before executing:** a scoping pass maps all 23 stories against the shipped June branch work; obsoleted stories (likely most of S300–S305) are formally dropped; the survivors (S100–S104 link CTA/analytics/bulk ops; S200-series gallery deltas) become area #10's backlog. The PRD predates the code.

## 6k. Grill #11 — Engineering Standards (2026-07-07): DECISIONS LOCKED

Cross-cutting standards binding on ALL campaign teams (these amend §5 Phase 3 mechanics):

1. **Merge gates go full:** build + lint + type-check + full vitest + db-types drift check; Phase 0 fixes the standing test failures; new features ship with tests for their money paths. (Update `.agents/kanban/project-config.json` qualityGates + CLAUDE.md accordingly.) 2. **Golden-flows Playwright suite** (acquisition, video, billing, auth+onboarding, public profile/widget) runs pre-merge on main. 3. **Cron guard, two layers:** CI test asserting every `api/cron/*` route is scheduled-or-exempted + dead-man's-switch heartbeat monitoring with alerts. 4. **Performance regime:** Vercel Speed Insights RUM + budgets on SEO-critical routes (LCP<2.5s, INP<200ms, CLS<0.1) + Lighthouse CI on touching PRs. 5. **Accessibility:** axe-core wired into golden-flows + one manual keyboard/SR audit pass per Phase 2 area. 6. **Product analytics: PostHog core activation funnel** (signup→first request→first review published + key feature events); each team instruments its area as it works — baseline starts now. 7. **PII: right-to-erasure ships inside the Contacts migration** (anonymize across contact/snapshots/responses, retention note, suppression tombstones against re-import). 8. **QA model: Vercel previews + permanently-seeded QA org** (+ Supabase branch DB for migration-bearing PRs); golden-flows run against previews. Consciously skipped: backups/DR (Supabase-managed), browser matrix (evergreen standard), app i18n (deferred; widget ES stays), design-system enforcement (already mandated by workflow).

## 7. Grill queue: EMPTY — all product decisions locked (2026-07-07)

Ten grill sessions complete (§6–§6k: nine feature areas + engineering standards). Every Phase 2 area now has pre-made decisions; remaining choices are implementation-level and belong to PM teams under the deviation rules of `fable-pm-opus-teams.md`.

## 7b. Scoped follow-ups logged during Team A execution (2026-07-07)

- **Milestone email templates incomplete** (from A1): dispatcher sends first_review / review_milestone / first_5_star; rating_improvement / nps_improvement / profile_completion have NO templates; leaderboard/badge/streak/video milestone types need richer payload assembly (rank, participants, badge meta). Belongs to the engagement area (#8).
- **Google reply auto-retry**: migration 20260707000001 adds retry_count/last_attempt_at; A1 extending processor.
- **Nav/middleware "Organization for individuals" contradiction intentionally NOT hotfixed** — resolution is ADR 0006/0007 work (IA area), not a patch.
- **Contact erasure covers PII columns only** (from B1): video_testimonial_responses media/transcripts carry likeness beyond columns — a media-deletion path on erasure is a video-area follow-up (noted in eraseContact doc comment).

## 8. Phase 1b — Honesty Sweep (new workstream from grill decisions)

One team removes every shipped fiction in a single pass: delist SMS/Teams/HubSpot/Apple-Business-Connect marketing claims + fix the fictional Zapier doc (real Zapier build comes later with acquisition); archive mobile app (`archive/mobile-app`) and `@repwell/react-widgets` (`archive/react-widgets`); delete referral email service + templates; kill GEO route + fake-data writers + purge fabricated rows; remove SMS preference toggles, Send-SMS builder node, Teams senders/toggles; hardcoded "API status" pill and mobile-era claims. Paired with H-fixes so honesty and correctness land together.
