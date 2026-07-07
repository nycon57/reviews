# Task Tracking

# Phase 0 — Land codex/graphics-video (2026-07-07, PM session)

- [x] Recon: 100 M / 16 D / 52 untracked, +7104/−3396
- [x] Remove stale agent worktree polluting vitest
- [x] Fix .gitignore: un-ignore docs/ + **supabase/migrations/ (60 untracked migrations!)**; restore .auth/.mcp.json/.worktrees ignores; ignore vendored skill dirs + docs/test-users.md
- [x] vitest excludes (worktrees/.claude/mobile/packages/tests-e2e); true baseline = 24 failed / 431 passed
- [x] opus-diff-reviewer: full diff review — ZERO blockers; 13 review fixes applied via opus-small-fixes (all verified)
- [x] opus-test-fixer: 24 failures + 9 tsc errors → green (2 justified src fixes)
- [x] opus-lint-fixer: 34 standing lint errors → 0 (13 orphaned surveys/shared files deleted, import-graph verified)
- [x] /simplify: 4-angle review, 8 findings applied (3 new shared hooks + theme constants + parallelizations), 4 skips recorded
- [x] /react-doctor: changed-scope 2 errors fixed (PM); full-repo 543-unauth-server-actions finding logged as campaign H12
- [x] Commit chunks C1–C10 executed; tree clean
- [x] Gates at commit time: build ✓ lint 0 errors ✓ tsc 0 ✓ vitest 450/450 ✓; lockfile reconciled (was CI-breaking stale)
- [ ] db:types regen (blocked: needs remote migration state; untyped casts tagged TODO in code)
- [ ] PR to claude/fullstack-nextjs-mobile-setup-UPonj; wait checks; merge on Jarrett's word

## Enterprise vs Individual Architecture Refactor

### Workstream A: Public Visibility Rules (no schema changes)

- [x] A1: `getPublicLOProfile()` — add `account_type` to org join, return `OrgDisplay` shape with `href` (null for individual)
- [x] A1: `getPublicOrganizationProfile()` — early return notFound for individual orgs, `.neq("role", "admin")` on professionals + total count
- [x] A1: `getPublicBranchProfile()` — `.neq("role", "admin")` to exclude enterprise admins from branch lists
- [x] A1: `searchProfessionals()` — add `account_type`+`role` to query, post-filter enterprise admins, add `is_enterprise` to `DirectoryProfessional`
- [x] A1: `getAllOrganizationSlugs()` — filter to non-individual orgs for sitemap
- [x] A2: `contact-cta-card.tsx` — org link vs plain text driven by `href` presence
- [x] A2: `pro-profile-content.tsx` — accept `OrgDisplay` type, update `logoUrl` refs
- [x] A2: `pro/[slug]/page.tsx` — breadcrumbs only link to org for enterprise (href present)
- [x] A2: `directory-card.tsx` — org badge only shown when `is_enterprise` (both list + grid variants)

### Workstream B: Branch Manager Auto-Assignment

- [x] B1: DB trigger `fn_auto_assign_branch_manager()` — auto-assign on branch_id/is_active changes

### Workstream C: Contacts + EX Survey + Department Deprecation

- [ ] C1: contacts table migration
- [ ] C2: contacts CRUD + bulk import
- [ ] C3: EX survey refactor to use contacts
- [ ] C4: department deprecation

### Verification

- [x] `npm run build` passes
- [x] `npm run lint` passes (17 pre-existing errors, 0 from our changes)

## Completed

- Workstream A: Public Visibility Rules
- Workstream B: Branch Manager Auto-Assignment Migration

---

# Video Testimonial Phase 2

Decisions locked 2026-06-09 via grill session. Glossary: CONTEXT.md. ADR: docs/adr/0001.

## 1. Rating collection + branching foundation
- [x] Migration: `customer_rating` (1-5, nullable for legacy rows), `quarantined` flag, `platform_passthrough_clicked_at`, `recapture_email_sent_at` on `video_testimonial_responses`
- [x] Tap-to-rate stars on About-you step (required, before consents)
- [x] `submitCustomerInfoAndConsent` stores rating; threshold from org settings (default 4)
- [x] Low path: quarantine response at submission

## 2. Thank-you screen branching
- [x] High path (rating >= threshold): celebration screen, CTA stack: share > platform passthrough > contact card > referral prompt
- [x] Low path: warm thanks + optional private feedback textarea -> stored + sent to professional
- [x] Low path comms: professional notification + dashboard follow-up task

## 3. High-path CTAs
- [x] Share block: thumbnail, first-person AI caption from transcript, Web Share API mobile / platform buttons + copy fallback desktop (smart link via ensureSmartLinkForSource)
- [x] Passthrough review: copy AI review text + open GMB write-review (google_place_id) / Zillow (zillow_profile_url); only when URLs exist; record click timestamp
- [x] Contact card: reuse ContactCTACard
- [x] Referral: collapsed prompt opening existing ReferFriendModal

## 4. Recapture email
- [x] Cron sweep: high-path responses, no passthrough click, no kit sent, older than ~4h -> email Review Kit

## 5. Smart link landing parity
- [x] /s/[slug] video view: ContactCTACard + referral prompt below player

## 6. Quarantine enforcement
- [x] Exclude quarantined responses from smart links, widgets, social publishing
- [x] Dashboard: needs-attention flag + approve action lifts quarantine

## Done previously
- [x] Redesigned customer recording flow (/video-testimonial/[token])
- [x] Fixed AI pipeline: post-submit kick, signed URL for private bucket, word_timestamps migration, silent failure hardened

---

# Video Post-Production + Asset Kits

Decisions locked 2026-06-09 via grill session. Glossary: CONTEXT.md § Asset Generation. ADR: docs/adr/0003 (Remotion Lambda).

## Locked decisions
- Auto kit on review approval + tweak-and-regenerate panel. Video kit: one 9:16 captioned Clip. Text kit: quote-card images (1:1 + 9:16). Other formats on demand.
- Captions: TikTok-style pages via @remotion/captions, active word in org primary color. Text-only transcript correction (timings preserved).
- Audio: curated royalty-free music bundle (4-6 tracks, org default, per-render override/off), full bed auto-ducked under speech, loudness-normalize source to ~-16 LUFS.
- Framing: adaptive (portrait full-bleed, landscape styled-card). End Card: pro photo/name/title/org logo/CTA + QR to smart link. Auto-trim silence from word timestamps + manual start/end handles.
- Clip length: full video; >60s flagged for manual trim, not auto-cut.
- Styling: brand-token driven, functional tweaks only. No style editors.
- Distribution: review detail page + Share Studio library only. Customer share kit keeps the raw video. No auto-posting (later phase).
- Render infra: Remotion Lambda (worker dispatches, polls, stores).

## 1. Foundations
- [x] Install Remotion agent skills (npx skills add remotion-dev/skills) -> .agents/skills/remotion-best-practices
- [x] Asset history via proof_assets metadata (composition + applied_options); completion polling so "Queued" resolves
- [x] Render backend seam: RENDER_BACKEND env (local default, lambda stub per ADR 0003 first pass); Lambda deployment deferred until AWS account
- [x] Audio prep step: ffmpeg loudnorm (-16 LUFS) producing prepared source, cached per response, graceful skip without ffmpeg

## 2. Clip pipeline
- [x] Switch composition `Video` -> `OffthreadVideo`, wire startFrom/endAt (trim)
- [x] Auto-trim from word timestamps (first word -0.5s, last word +0.5s)
- [x] Captions: @remotion/captions TikTok pages, brand highlight color (old caption-timing util removed)
- [x] Adaptive framing: parseMedia source probe, portrait full-bleed vs landscape styled-card
- [x] Music bed plumbing: ClipMusic prop + duck ramps under speech; defaults OFF until org tracks configured (organizations.settings.clipMusic)
- [x] End Card: pro photo/name/title/CTA pill/website + smart-link QR + org logo, replaces hardcoded outro CTA
- [x] >60s flag surfaced in tweak panel
- [x] Fixed: quote-segment duration mismatch (composition vs calculator) left dead frames; AI quote clipped to sentence excerpt

## 3. Auto-kit trigger
- [x] On video review approval/publish at >= celebration threshold: queue 9:16 Clip (idempotent per response)
- [x] On text review approval (single + bulk) at >= threshold: queue 1:1 + 9:16 quote cards (video-sourced reviews excluded)
- [x] Kit assets in proof_assets -> Share Studio library + review detail

## 4. Tweak panel (in asset creator modal, opened from video review detail)
- [x] Captions on/off, music on/off, intro+end-card toggle, trim start/end seconds (auto default), format picker
- [x] Transcript correction: word-count-preserving edits keep timings, else re-interpolate within speech window
- [x] Live render progress with polling; completed clip previews inline + download; modal available from "approved" (was published-only)

## Verification
- [x] End-to-end render of real response d07d2ae9 (37s landscape webcam source): 1080x1920, 51.5s, frames verified (intro, card framing + paged captions, quote excerpt, End Card with QR)
- [x] tsc clean, eslint clean, build exit 0; unit test failures in transcription-service.test.ts are pre-existing (fail identically in untouched worktrees)

## Resolved open questions (2026-06-09)
- [x] Music tracks: Jarrett sources them himself later. Build the bundle plumbing with placeholder slots; music defaults OFF until tracks land.
- [x] Render infra first pass: local renderer; Lambda dispatch stubbed behind env flag (RENDER_BACKEND=local default). ADR 0003 unchanged as target state.
- [x] Auto-kit gating: only videos rated >= celebration threshold. Below-threshold approved videos render manually via the modal.

---

# Review System Inversion + Video UX (2026-06-10)

Locked decisions: machine checks only gate the public record (any rating); negative reviews publish + notify + response workflow; approval inverts into disputes (enterprise org admins adjudicate, individual escalates to platform, disputed reviews stay visible unbadged); direct submissions need email verification; published text immutable; video assets keep approval but no longer gate the extracted review (reject still removes it).

## Phase 1: write-side inversion
- [x] Migration `20260610000002_review_publish_inversion` (+ `review_flags` applied remotely; it was missing) - moderation columns, verification token, 'direct' source, flag adjudication columns
- [x] `src/lib/reviews/moderation.ts` screenReviewText: baseline PII/profanity/spam regex -> Gemini structured check -> fail-closed quarantine; 16 vitest cases
- [x] submitPublicReview -> `reviews` (source 'direct'; old public_review_submissions table was a dead end nothing read), email verification token (sha256 hash only), IP rate limit, verify route `/review/verify/[token]`
- [x] createCanonicalReviewForResponse publishes screened reviews at any rating; auto-approval rules machinery deleted (surveys path converted too)
- [x] Video approve/publish no longer touch the review (reject still removes); published text immutable
- [x] Quote-card kit + needs-response notification fire at publish time (shared asset-kit.ts / notifications.ts)
- [x] Backfill ran: 28 stuck pending reviews published, 0 quarantined

## Phase 2: disputes
- [x] flag-actions.ts: uphold (enterprise-only, audit row in organization_audit_logs, required note), dismiss, reportReviewAsPro, routeNewFlag (enterprise -> admin notifications; individual -> REVIEW_DISPUTE_ESCALATION_EMAIL)
- [x] Disputes tab in reviews dashboard (admins/managers), dispute-queue.tsx; report action + internal Disputed chip on review detail
- [x] Relabel: Needs attention / Live / Removed (+ moderation reason chips); live reviews lose Reject (dispute-only removal)

## Phase 3: unified view
- [x] /dashboard/reviews/[id] composes both artifacts: video view gains Review record card, review view gains Source video card, cross-links; video panel notes asset-level scope
- [x] Source badge: "Video review" with VideoCamera icon (was "Video Testimonial")

## Phase 4: 9:16 capture + crop
- [x] Portrait preset chain on mobile (useIsDesktop), desktop keeps 16:9 with 9:16 framing-guide overlay
- [x] ClipRenderOptions.framing crop|card|auto, default crop (landscape sources now center-crop full-bleed); modal Framing toggle; verified with real render
- [ ] Follow-up: customer info chip at bottom 34% can overlap faces on tight crops

## Phase 5: upsell
- [x] Verify-page upsell at >= threshold -> creates video request inline (source_metadata.origin review_upsell, idempotent) -> /video-testimonial/[token]
- [x] Daily cron /api/cron/review-video-upsell (vercel.json, 24-72h window, batch 25, metadata stamps + email idempotency)

## Verification
- [x] build/lint/tsc green; moderation + source-label + flag tests pass; simplify pass applied (shared REVIEW_STATUS_LABELS, token crypto centralized in verification.ts, getCelebrationThreshold request-cached)
- [x] Browser-verified: queue shows Live/Removed badges + Video review chips; backfilled reviews live

## Follow-ups noted
- [ ] publishReviewIfClean shared helper (screen-then-publish now in 4 paths)
- [ ] Platform admin UI for individual-license disputes (email-only v1); set REVIEW_DISPUTE_ESCALATION_EMAIL in env
- [ ] db:types regen blocked until consolidate_review_widgets migration applied remotely (untyped casts used meanwhile)
- [ ] Public embed widgets still label source "Video Testimonial" (out of scope, flagged)
