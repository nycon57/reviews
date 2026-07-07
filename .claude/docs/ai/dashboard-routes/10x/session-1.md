# 10x Analysis: Dashboard Routes UX + Information Architecture
Session 1 | Date: 2026-02-25

## Current Value
The dashboard routes cover broad operational workflows (reviews, requests, campaigns, surveys, analytics, organization settings) with strong feature depth. Most pages are functional and role-aware, but cross-route UX consistency, route-level metadata strategy, and interaction accessibility were uneven.

## The Question
What would make this dashboard 10x more valuable for daily operators and managers?

---

## Massive Opportunities

### 1. Unified Command Center Layer
**What**: Introduce a shared cross-route command palette + global quick actions for top tasks (request review, launch campaign, create survey, open team member analytics).
**Why 10x**: Removes route hunting and collapses high-frequency workflows into a single interaction model.
**Unlocks**: Faster ops for managers, lower onboarding friction for new users.
**Effort**: High
**Risk**: Requires consistent action contracts and permission gating.
**Score**: 🔥

### 2. Cross-Route Insight Graph
**What**: Connect analytics, recognition, requests, and campaigns with causal overlays ("this campaign increased response rates for branch X").
**Why 10x**: Moves product from dashboards to decision intelligence.
**Unlocks**: Executive-level planning and coaching workflows.
**Effort**: Very High
**Risk**: Data attribution complexity.
**Score**: 👍

---

## Medium Opportunities

### 1. Shared Route Header + Contextual Actions
**What**: Standardize route headers with reusable primitives (title, subtitle, icon, role actions, breadcrumbs).
**Why 10x**: Reduces cognitive switching and creates predictable navigation behavior.
**Impact**: Better scanability and lower error rate.
**Effort**: Medium
**Score**: 🔥

### 2. Task-Centric Personalization
**What**: Role and usage-aware default tabs/cards per route (e.g., managers land on team metrics, ICs on personal scorecards).
**Why 10x**: Reduces time-to-value on every visit.
**Impact**: Higher daily active usage.
**Effort**: Medium
**Score**: 👍

---

## Small Gems

### 1. Icon-Only Controls Accessibility Sweep
**What**: Ensure all icon-only buttons have explicit labels.
**Why powerful**: Immediate usability gains for keyboard and screen-reader users.
**Effort**: Low
**Score**: 🔥

### 2. Metadata Consistency Across Routes
**What**: Full route metadata coverage with clear page-level intent.
**Why powerful**: Better shareability, indexing, and browser history context.
**Effort**: Low
**Score**: 🔥

### 3. Server Wrapper Pattern for Client-Heavy Pages
**What**: Split client pages into server wrappers to preserve metadata and RSC ergonomics.
**Why powerful**: Better architecture hygiene and future-proofing.
**Effort**: Low
**Score**: 🔥

---

## Recommended Priority

### Do Now
1. Complete route-level accessibility + metadata baseline.
2. Introduce a shared route-header primitive and migrate top 8 routes.

### Do Next
1. Add usage-aware default tabs/actions per role.
2. Build a global quick-action command surface.

### Explore
1. Prototype cross-route causal insights in analytics and campaigns.

---

## Questions

### Answered
- **Q**: Where is immediate leverage? **A**: Metadata, accessibility, and route composition consistency.

### Blockers
- **Q**: Which workflows are most time-critical per role? (requires product telemetry + PM input)

## Next Steps
- [ ] Define dashboard route-header API and migration list.
- [ ] Add instrumentation for route-to-route workflow dropoff.
- [ ] Prioritize command center MVP scope with permission model.
