# Dashboard QA Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 56 QA issues found in the dashboard audit, in priority order from security-critical to polish.

**Architecture:** Fixes are organized into 8 phases. Phases 1-3 are sequential (security/critical first). Phases 4-8 can be parallelized by file area. Each fix is a discrete commit.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (Postgres + RLS), Better Auth, Tailwind CSS, Phosphor Icons, Shadcn UI, Framer Motion

---

## PHASE 1 — Security: Multi-Tenant Isolation Breaches

### Task 1.1: Fix `getSurveyTemplate` — Add Org Isolation

**Files:**
- Modify: `src/lib/surveys/actions.ts:86-125`

**Problem:** `getSurveyTemplate(id)` queries by `id` only — any authenticated user can read any org's template.

**Fix:** Resolve the caller's `organization_id` and add `.eq("organization_id", organizationId)` to the query.

```typescript
export async function getSurveyTemplate(id: string): Promise<ActionResult<SurveyTemplate>> {
  try {
    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Resolve caller's org to prevent cross-tenant reads
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const { data, error } = await supabase
      .from("survey_templates")
      .select("*")
      .eq("id", id)
      .eq("organization_id", userData.organization_id)  // ← ADD THIS
      .single();
    // ... rest unchanged
```

**Step 1:** Apply the fix above to `getSurveyTemplate` in `src/lib/surveys/actions.ts`

**Step 2:** Verify build passes
```bash
npm run type-check
```

**Step 3:** Commit
```bash
git add src/lib/surveys/actions.ts
git commit -m "fix(surveys): add org isolation to getSurveyTemplate to prevent cross-tenant reads"
```

---

### Task 1.2: Fix `duplicateSurveyTemplate` — Add Org Isolation

**Files:**
- Modify: `src/lib/surveys/actions.ts:310-370`

**Problem:** `duplicateSurveyTemplate` fetches original by `id` only — any user can copy another org's template.

**Fix:** Resolve `organization_id` from the calling user, then filter the source template fetch.

```typescript
export async function duplicateSurveyTemplate(id: string): Promise<ActionResult<SurveyTemplate>> {
  try {
    const permError = await requireSurveyTemplatePermission();
    if (permError) return permError as ActionResult<SurveyTemplate>;

    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Resolve caller's org
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    // Fetch the original template — scoped to caller's org
    const { data: original, error: fetchError } = await supabase
      .from("survey_templates")
      .select("*")
      .eq("id", id)
      .eq("organization_id", userData.organization_id)  // ← ADD THIS
      .single();
    // ... rest unchanged, but replace `original.organization_id` with `userData.organization_id`
    // in the insert:
    //   organization_id: userData.organization_id,
```

**Step 1:** Apply fix to `duplicateSurveyTemplate`

**Step 2:** Run type check
```bash
npm run type-check
```

**Step 3:** Commit
```bash
git add src/lib/surveys/actions.ts
git commit -m "fix(surveys): add org isolation to duplicateSurveyTemplate"
```

---

### Task 1.3: Fix `toggleTemplateStatus` — Add Org Isolation

**Files:**
- Modify: `src/lib/surveys/actions.ts:373-395`

**Problem:** `toggleTemplateStatus` updates by `id` only — any user can toggle another org's template.

**Fix:** Resolve `organization_id` and add it to the UPDATE query.

```typescript
export async function toggleTemplateStatus(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const permError = await requireSurveyTemplatePermission();
    if (permError) return permError;

    const supabase = createAdminClient();

    const user = await unifiedGetUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Resolve caller's org
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

    const { error } = await supabase
      .from("survey_templates")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", userData.organization_id);  // ← ADD THIS
    // ... rest unchanged
```

**Step 1:** Apply fix

**Step 2:** Run type check + lint
```bash
npm run type-check && npm run lint
```

**Step 3:** Commit
```bash
git add src/lib/surveys/actions.ts
git commit -m "fix(surveys): add org isolation to toggleTemplateStatus"
```

---

### Task 1.4: Add Middleware Protection for `/dashboard/approvals`

**Files:**
- Modify: `src/middleware.ts:35-54`

**Problem:** Approvals page gated by `VIEW_APPROVALS` (enterprise + manager/admin) in permissions, but middleware `roleProtectedRoutes` never enforces it.

**Fix:** Add to `roleProtectedRoutes`:
```typescript
{ path: "/dashboard/approvals", requiresEnterprise: true, allowedRoles: ["admin", "manager"] },
```

Insert this line after the `/dashboard/campaigns` entry (line 38).

**Step 1:** Edit `src/middleware.ts` and add the approvals entry

**Step 2:** Verify
```bash
npm run type-check
```

**Step 3:** Commit
```bash
git add src/middleware.ts
git commit -m "fix(auth): add middleware protection for /dashboard/approvals route"
```

---

### Task 1.5: Fix Surveys Middleware Gap for Enterprise Managers

**Problem:** Enterprise managers cannot see Surveys in nav (permission requires admin), but can access `/dashboard/surveys` directly since no middleware protection exists. The correct fix depends on intent:
- Option A: Add middleware protection `{ path: "/dashboard/surveys", requiresEnterprise: true, allowedRoles: ["admin"] }` — blocks managers from direct URL access (matching the nav behavior)
- Option B: Expand the permission to allow managers — allows managers to manage survey templates

**Decision:** Apply Option A (consistent with nav behavior — surveys management is admin-only in enterprise).

**Files:**
- Modify: `src/middleware.ts:35-54`

**Fix:** Add to `roleProtectedRoutes`:
```typescript
{ path: "/dashboard/surveys", requiresEnterpriseAdmin: true },
```

**Step 1:** Edit `src/middleware.ts` and add the surveys entry

**Step 2:** Commit
```bash
git add src/middleware.ts
git commit -m "fix(auth): add middleware protection for /dashboard/surveys (enterprise admin only)"
```

---

## PHASE 2 — Broken Routes & Dead Links

### Task 2.1: Fix All `/dashboard/settings/billing` Links → 404

**Problem:** 13 files reference `/dashboard/settings/billing` which doesn't exist. Billing tab is at `/dashboard/settings?tab=billing`.

**Files to update:**
- `src/components/dashboard/sidebar.tsx:128`
- `src/components/dashboard/header.tsx:249`
- `src/components/dashboard/mobile-nav.tsx:125`
- `src/components/subscription/subscription-banner.tsx:55,77`
- `src/app/(dashboard)/checkout/success/checkout-success-client.tsx:91`
- `src/lib/access/index.ts:144` (upgrade redirect)
- `src/middleware.ts:321` (tier gate redirect)

**For the middleware/access redirects** that also pass query params like `?upgrade=pro&feature=/dashboard/insights`, the target needs to become `/dashboard/settings?tab=billing&upgrade=pro&feature=/dashboard/insights` — the `tab=billing` must be added before other params.

**Email service files** (these generate URL strings in email bodies — update them too):
- `src/lib/email/abandoned-action-recovery-service.ts:529`
- `src/lib/email/trial-ending-service.ts:896`
- `src/lib/email/subscription-service.ts:323`
- `src/lib/email/dunning-service.ts:688,791`
- `src/lib/email/role-onboarding-service.ts:890,892`
- `src/lib/email/org-onboarding-service.ts:735`
- `src/lib/email/welcome-sequence-service.ts:665`

**For email files:** Simple string replacement `/dashboard/settings/billing` → `/dashboard/settings?tab=billing`. Sub-paths like `/billing/invoices`, `/billing/upgrade`, `/billing/update-payment`, `/billing/reactivate` should become `/dashboard/settings?tab=billing` (the portal handles sub-navigation).

**Step 1:** Update `sidebar.tsx:128` — change `href="/dashboard/settings/billing"` to `href="/dashboard/settings?tab=billing"`

**Step 2:** Update `header.tsx:249` — same replacement

**Step 3:** Update `mobile-nav.tsx:125` — same replacement (both sidebar and mobile-nav NavLink components)

**Step 4:** Update `subscription-banner.tsx:55,77` — same replacement

**Step 5:** Update `checkout-success-client.tsx:91` — same replacement

**Step 6:** Update `src/lib/access/index.ts:144`:
```typescript
// Before:
const upgradeUrl = `/dashboard/settings/billing?upgrade=${minTier}`;
// After:
const upgradeUrl = `/dashboard/settings?tab=billing&upgrade=${minTier}`;
```

**Step 7:** Update `src/middleware.ts:321`:
```typescript
// Before:
const redirectUrl = new URL("/dashboard/settings/billing", request.url);
redirectUrl.searchParams.set("upgrade", routeConfig.minTier);
redirectUrl.searchParams.set("feature", request.nextUrl.pathname);
// After:
const redirectUrl = new URL("/dashboard/settings", request.url);
redirectUrl.searchParams.set("tab", "billing");
redirectUrl.searchParams.set("upgrade", routeConfig.minTier);
redirectUrl.searchParams.set("feature", request.nextUrl.pathname);
```

**Step 8:** Update all email service files — replace `/dashboard/settings/billing` with `/dashboard/settings?tab=billing` and sub-paths (`/billing/invoices`, `/billing/upgrade`, etc.) with `/dashboard/settings?tab=billing`

**Step 9:** Run lint + type check
```bash
npm run lint && npm run type-check
```

**Step 10:** Commit
```bash
git add -p  # stage all changed files
git commit -m "fix(nav): replace broken /dashboard/settings/billing links with /dashboard/settings?tab=billing"
```

---

### Task 2.2: Fix All `/dashboard/send` Links → `/dashboard/requests`

**Problem:** 5 locations reference `/dashboard/send` which doesn't exist.

**Files:**
- `src/app/(dashboard)/dashboard/page.tsx:48,63`
- `src/components/shared/empty-state.tsx:218`
- `src/components/gamification/reputation-breakdown.tsx:100`
- `src/components/dashboard/user-recent-reviews.tsx:185`

**Step 1:** In each file, replace `/dashboard/send` with `/dashboard/requests`

For `empty-state.tsx:218`:
```typescript
{ label: "Send your first survey", href: "/dashboard/requests", done: false },
```

For `dashboard/page.tsx:48,63`:
```typescript
{ label: "Send Your First Survey", href: "/dashboard/requests", iconName: "send" },
```

For `reputation-breakdown.tsx:100` and `user-recent-reviews.tsx:185`:
Replace the `href="/dashboard/send"` attribute value.

**Step 2:** Run build
```bash
npm run build 2>&1 | tail -20
```

**Step 3:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/page.tsx src/components/shared/empty-state.tsx src/components/gamification/reputation-breakdown.tsx src/components/dashboard/user-recent-reviews.tsx
git commit -m "fix(nav): replace broken /dashboard/send links with /dashboard/requests"
```

---

### Task 2.3: Fix `/dashboard/team/[member-id]` Broken Links

**Problem:** `team-management.tsx:469-475` renders `<Link href={"/dashboard/team/" + member.id}>` for regular user members but no `/dashboard/team/[id]` route exists.

**Decision:** Remove the link (or change it to the member analytics page which DOES exist) rather than creating a new route.

**Files:**
- Modify: `src/app/(dashboard)/dashboard/team/team-management.tsx:469-475`

**Fix:** Change the link target to the existing member analytics page:
```typescript
// Before:
<Link href={"/dashboard/team/" + member.id}>
// After:
<Link href={`/dashboard/analytics/member/${member.id}`}>
```

**Step 1:** Apply the fix

**Step 2:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/team/team-management.tsx
git commit -m "fix(team): redirect member detail link to existing analytics page (no team/[id] route exists)"
```

---

### Task 2.4: Remove Orphaned Middleware Routes for Non-Existent `/integrations/*`

**Files:**
- Modify: `src/middleware.ts:52-53`

**Problem:** Middleware protects `/integrations/api` and `/integrations/webhooks` but no such app router paths exist.

**Fix:** Remove those two lines from `roleProtectedRoutes`.

**Step 1:** Delete lines 52-53 from `src/middleware.ts`

**Step 2:** Commit
```bash
git add src/middleware.ts
git commit -m "fix(middleware): remove orphaned protection rules for non-existent /integrations/* routes"
```

---

## PHASE 3 — Mock Data Replacement

### Task 3.1: Fix Review Volume Chart — Replace `Math.random()` With Real Data

**Files:**
- Modify: `src/app/(dashboard)/dashboard/analytics/trends/trends-dashboard.tsx:138-143`
- Modify: `src/app/(dashboard)/dashboard/admin/trends/admin-trends-dashboard.tsx:138-143`

**Problem:** Review Volume chart is generated with random numbers on every render.

**Fix:** Replace the random generation with a real Supabase query. Add `getReviewVolumeTrend` server action.

**Step 1:** Add a `getReviewVolumeTrend` action to `src/lib/dashboard/user-actions.ts` (or wherever appropriate):

```typescript
export async function getReviewVolumeTrend(
  userId?: string,
  months: number = 6
): Promise<ActionResult<TrendDataPoint[]>> {
  try {
    const supabase = createAdminClient();
    const user = await unifiedGetUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { data: userData } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData?.organization_id) return { success: false, error: "No organization" };

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    let query = supabase
      .from("reviews")
      .select("created_at")
      .eq("organization_id", userData.organization_id)
      .gte("created_at", startDate.toISOString());

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };

    // Group by month
    const monthCounts: Record<string, number> = {};
    (data || []).forEach((row) => {
      const month = row.created_at.slice(0, 7); // "YYYY-MM"
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    // Fill in all months including zeros
    const points: TrendDataPoint[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      points.push({ date: key, value: monthCounts[key] || 0 });
    }

    return { success: true, data: points };
  } catch (error) {
    return { success: false, error: "Failed to fetch review volume" };
  }
}
```

**Step 2:** In `trends-dashboard.tsx`, import and call `getReviewVolumeTrend` in the `loadData` function alongside the other trend fetches:
```typescript
// Replace lines 138-143:
// BEFORE (mock):
const volumeData = ratingTrend.map((d, i) => ({
  date: d.date,
  value: Math.floor(Math.random() * 50) + 10 + i * 5,
}));
setReviewVolumeTrend(volumeData);

// AFTER (real):
const volumeResult = await getReviewVolumeTrend(selectedUserId, months);
if (volumeResult.success && volumeResult.data) {
  setReviewVolumeTrend(volumeResult.data);
}
```

**Step 3:** Apply same fix to `admin/trends/admin-trends-dashboard.tsx:138-143`

**Step 4:** Run type check + lint
```bash
npm run type-check && npm run lint
```

**Step 5:** Commit
```bash
git add src/lib/dashboard/user-actions.ts src/app/\(dashboard\)/dashboard/analytics/trends/trends-dashboard.tsx src/app/\(dashboard\)/dashboard/admin/trends/admin-trends-dashboard.tsx
git commit -m "fix(analytics): replace Math.random() review volume chart with real DB query"
```

---

### Task 3.2: Fix Competitor Pages — Replace `generateMockABEvents` With Placeholder State

**Files:**
- Modify: `src/app/(dashboard)/dashboard/analytics/competitor-pages/competitor-pages-dashboard.tsx`

**Problem:** All A/B analytics shown use `generateMockABEvents(3000)` — entirely synthetic.

**Decision:** Remove the mock data display and replace with a "real analytics coming soon" empty state rather than showing fabricated numbers as real data.

**Step 1:** In `competitor-pages-dashboard.tsx`, remove the mock event generation and the analytics tabs/charts that depend on it. Replace the analytics section with a card that says real tracking is in setup:

```tsx
// Replace the section that uses generateMockABEvents with:
<Card>
  <CardHeader>
    <CardTitle>A/B Test Analytics</CardTitle>
    <CardDescription>
      Real-time A/B performance tracking for competitor comparison pages.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
      <ChartBar className="h-10 w-10 opacity-30" />
      <p className="text-sm font-medium">Analytics integration in progress</p>
      <p className="text-xs max-w-sm">
        Real visitor data and conversion tracking will appear here once the analytics pipeline is connected.
      </p>
    </div>
  </CardContent>
</Card>
```

**Step 2:** Remove the import of `generateMockABEvents` and related mock utilities from the file

**Step 3:** Run lint + type check
```bash
npm run lint && npm run type-check
```

**Step 4:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/analytics/competitor-pages/competitor-pages-dashboard.tsx
git commit -m "fix(analytics): replace mock A/B event data with empty state pending real integration"
```

---

### Task 3.3: Fix Campaigns — Replace Mock Data With "Coming Soon" State

**Files:**
- Modify: `src/app/(dashboard)/dashboard/campaigns/campaigns-dashboard.tsx`

**Problem:** Entire Campaigns dashboard uses hardcoded mock data; create/pause/resume all mutate local React state with no server calls.

**Decision:** Show a "Coming Soon" UI that communicates the feature roadmap rather than presenting fake data as real. Keep the component shell so it can be wired up easily.

**Step 1:** Replace the component body with a "coming soon" shell:

```tsx
export function CampaignsDashboard({ userRole: _userRole }: CampaignsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-muted-foreground">
          Automate survey distribution with scheduled and triggered campaigns.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Envelope className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Campaigns Coming Soon</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Automate your review collection with one-time blasts, recurring schedules,
              and event-triggered campaigns. This feature is currently in development.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm text-muted-foreground max-w-lg">
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg border">
              <Send className="h-5 w-5 mb-1" />
              <span className="font-medium text-foreground">One-time</span>
              <span className="text-xs">Send once to a segment</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg border">
              <Clock className="h-5 w-5 mb-1" />
              <span className="font-medium text-foreground">Recurring</span>
              <span className="text-xs">Automatic on a schedule</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg border">
              <Play className="h-5 w-5 mb-1" />
              <span className="font-medium text-foreground">Triggered</span>
              <span className="text-xs">Fire on loan events</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2:** Remove all unused imports (mock data types, Dialog, Input, Select, Tabs, etc.) from the file

**Step 3:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/campaigns/campaigns-dashboard.tsx
git commit -m "fix(campaigns): replace hardcoded mock data with coming-soon state"
```

---

## PHASE 4 — Navigation & Discovery

### Task 4.1: Add Widgets to Nav Config + Search Dialog

**Files:**
- Modify: `src/lib/nav/config.ts`
- Modify: `src/components/dashboard/search-dialog.tsx`
- Check: `src/lib/permissions/index.ts` for `VIEW_WIDGETS` permission

**Step 1:** Check what permission exists for widgets:
```bash
grep -n "WIDGET\|widget" src/lib/permissions/index.ts
```

**Step 2:** In `src/lib/nav/config.ts`, add a Widgets item. It belongs under a new "Tools" section or alongside the existing sections. Add between Organization and bottom items:

```typescript
// Add to the Organization section items (or create a new "Tools" section):
{
  title: "Widgets",
  href: "/dashboard/widgets",
  icon: "Code",  // or "SquaresFour"
  permission: PERMISSIONS.VIEW_WIDGETS,  // use whatever permission exists
},
```

**Step 3:** In `src/components/dashboard/search-dialog.tsx`, add missing pages to `quickLinks`:

```typescript
// Add after the existing entries:
{
  id: "widgets",
  title: "Widgets",
  description: "Embeddable review widgets",
  href: "/dashboard/widgets",
  icon: Code,
  category: "Pages",
},
{
  id: "share-studio",
  title: "Share Studio",
  description: "Create smart links, graphics, and animations",
  href: "/dashboard/share-studio",
  icon: Quotes,
  category: "Pages",
},
{
  id: "insights",
  title: "AI Insights",
  description: "AI-powered analysis of your reviews",
  href: "/dashboard/insights",
  icon: Sparkle,
  category: "Pages",
},
{
  id: "approvals",
  title: "Approvals",
  description: "Review and approve Share Studio edits",
  href: "/dashboard/approvals",
  icon: ClipboardText,
  category: "Pages",
},
{
  id: "messages",
  title: "Messages",
  description: "Two-way SMS conversations",
  href: "/dashboard/messages",
  icon: ChatCircle,
  category: "Pages",
},
{
  id: "organization",
  title: "Organization",
  description: "Organization settings and branding",
  href: "/dashboard/organization",
  icon: Buildings,
  category: "Pages",
},
{
  id: "leaderboard",
  title: "Leaderboard",
  description: "Team performance rankings",
  href: "/dashboard/analytics/leaderboard",
  icon: Trophy,
  category: "Pages",
},
```

Import the needed Phosphor icons at the top of search-dialog.tsx.

**Step 4:** Run lint + type check
```bash
npm run lint && npm run type-check
```

**Step 5:** Commit
```bash
git add src/lib/nav/config.ts src/components/dashboard/search-dialog.tsx
git commit -m "feat(nav): add Widgets to sidebar nav and expand search dialog with missing pages"
```

---

### Task 4.2: Add Website Analytics to Nav

**Files:**
- Modify: `src/lib/nav/config.ts`

**Problem:** `/dashboard/analytics/website` exists and is tier-gated in middleware, but no nav entry exists.

**Fix:** Add under the Insights section:
```typescript
{
  title: "Website Analytics",
  href: "/dashboard/analytics/website",
  icon: "Globe",
  permission: PERMISSIONS.VIEW_WEBSITE_ANALYTICS,
  requiresPro: true,
},
```

**Step 1:** Apply the fix

**Step 2:** Commit
```bash
git add src/lib/nav/config.ts
git commit -m "feat(nav): add Website Analytics to Insights nav section"
```

---

## PHASE 5 — Data Accuracy Fixes

### Task 5.1: Fix NPS Calculation Scale in Analytics Page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/analytics/page.tsx:54-59`

**Problem:** NPS uses 5-star scale mapped directly (5=promoter, 1-3=detractor). Standard NPS uses 0-10. On a 5-star scale, the correct mapping is: 5=promoter, 4=passive, 1-3=detractor — which is actually what's implemented. BUT the calculation formula `((promoters - detractors) / ratings.length) * 100` is correct. The real problem is using `.filter(r => r === 5)` as promoters and `.filter(r => r <= 3)` as detractors — this is a reasonable approximation.

**Actual fix needed:** Add a code comment documenting this is an approximation, and verify the result is labeled as "NPS Score (approx.)" in the UI to avoid misleading users.

```typescript
// Map 5-star rating to NPS promoter/detractor classification:
// 5 stars = promoter, 4 stars = passive, 1-3 stars = detractor
// This is an approximation since true NPS uses a 0-10 scale
const promoters = ratings.filter(r => r === 5).length;
const passives = ratings.filter(r => r === 4).length;
const detractors = ratings.filter(r => r <= 3).length;
const npsScore = ratings.length > 0
  ? Math.round(((promoters - detractors) / ratings.length) * 100)
  : 0;
```

**Step 1:** Apply the fix + add the comment

**Step 2:** Check if the analytics client component labels this as "approx" — if not, update the label:
```bash
grep -n "NPS\|npsScore" src/components/analytics/analytics-page-client.tsx | head -20
```

**Step 3:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/analytics/page.tsx
git commit -m "fix(analytics): document NPS approximation method and fix unused passives variable"
```

---

### Task 5.2: Fix Settings Integrations — `connectedCount` Hardcoded to 0

**Files:**
- Modify: `src/app/(dashboard)/dashboard/settings/components/integrations-tab.tsx`

**Problem:** `connectedCount` is hardcoded to `0`, making the "0 of 5 Connected" summary always wrong.

**Fix:** Derive `connectedCount` from actual integration connection state. The individual cards fetch their own state — we need to either:
- (A) Accept a count prop from the page (server-side)
- (B) Read a computed value from the DB

**Quick fix (B):** Query the `integrations` or `user_integrations` table count directly.

```bash
grep -n "connectedCount\|integrations" src/app/(dashboard)/dashboard/settings/components/integrations-tab.tsx | head -30
```

Look at how the integration cards report their connected state and derive the count from that.

If no clean way exists to aggregate the count without a new query, replace the hardcoded "0 of 5 Connected" with "Manage your connected integrations" to avoid the misleading number.

**Step 1:** Read the integrations tab file fully
**Step 2:** Implement the appropriate fix
**Step 3:** Commit
```bash
git commit -m "fix(settings): remove hardcoded connectedCount=0 in integrations tab"
```

---

### Task 5.3: Fix Notifications Tab — Hardcoded Channels + Persist "Pause All"

**Files:**
- Modify: `src/app/(dashboard)/dashboard/settings/components/notifications-tab.tsx`

**Problem:**
1. `channels` object `{ inApp: true, email: true, slack: false }` is hardcoded — "2 of 3 Active" badge is always wrong
2. "Pause All" toggle uses `useState(false)` — not persisted

**Fix:** Load real notification preferences from DB (the `NotificationPreferencesCard` already does this). The hero summary card duplicates but doesn't sync with the real preferences below it.

**Quick fix:** Either remove the summary card with the hardcoded channels, or read the same data that `NotificationPreferencesCard` uses and pass it down.

**Step 1:** Read `src/components/notifications/notification-preferences.tsx` to understand what data is available

**Step 2:** Either:
- Remove the summary hero card (simplest fix)
- Or wire `channels` to real data from the same source

**Step 3:** For "Pause All" — add a server action call on toggle or remove the toggle if not yet supported

**Step 4:** Commit
```bash
git commit -m "fix(settings): remove hardcoded notification channel summary card"
```

---

### Task 5.4: Fix AI Insights Page — Deduplicate `getAIInsightsData` Calls

**Files:**
- Modify: `src/app/(dashboard)/dashboard/insights/page.tsx`

**Problem:** `getAIInsightsData(userId, 6)` is called 6 separate times (once per section component). Each call fires 7 parallel DB queries. Should fetch once.

**Fix:** Move the `getAIInsightsData` call to the page level and pass the result as props to each section component.

```typescript
// In AIInsightsPage:
const insightsResult = await getAIInsightsData(userId, 6);
const insightsData = insightsResult.success ? insightsResult.data : null;

// Then pass insightsData to each section component:
<SentimentDistributionSection data={insightsData} />
<SentimentTrendSection data={insightsData} />
<ThemeCloudSection data={insightsData} />
// etc.
```

Each section component becomes synchronous (receives props, no longer async server component calling the DB).

**Step 1:** Refactor `insights/page.tsx`:
- Add one `await getAIInsightsData(userId, 6)` at the top of `AIInsightsPage`
- Refactor each inner async component to receive data as a prop and render based on it
- Remove all inner `getAIInsightsData` calls

**Step 2:** Run type check
```bash
npm run type-check
```

**Step 3:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/insights/page.tsx
git commit -m "perf(insights): deduplicate getAIInsightsData — fetch once, pass to all sections"
```

---

### Task 5.5: Fix NPS Queries — Add Org Filter

**Files:**
- Modify: `src/lib/dashboard/user-actions.ts` (NPS query ~lines 171-186)
- Modify: `src/lib/dashboard/manager-actions.ts` (NPS query ~lines 118-133)

**Problem:** NPS queries fetch all `survey_responses` without `organization_id` filter then filter in JS.

**Fix:** Add `.eq("organization_id", organizationId)` to the Supabase query at the DB level.

**Step 1:** Read those sections of both files to understand the full query shape

**Step 2:** Add org filter to both queries

**Step 3:** Commit
```bash
git commit -m "fix(dashboard): add organization_id filter to NPS score queries to prevent data leakage"
```

---

### Task 5.6: Fix LinkedIn/Facebook Share Buttons

**Files:**
- Modify: `src/components/dashboard/user-recent-reviews.tsx:75-108`

**Problem:** `buildReviewPublicUrl()` always returns `null`, so both LinkedIn and Facebook share actions redirect to Smart Link creation instead.

**Fix:** Check if `review.sourceUrl` or equivalent field exists on the review object. If a real URL is available, use it. If not, generate a public profile URL from the user's slug.

**Step 1:** Read the `RecentReview` type to understand available fields:
```bash
grep -n "RecentReview\|sourceUrl\|public_url\|source_url" src/lib/reviews/types.ts src/lib/dashboard/user-actions.ts | head -30
```

**Step 2:** Update `buildReviewPublicUrl`:
```typescript
function buildReviewPublicUrl(review: RecentReview): string | null {
  // Use the review's source URL if available (e.g. Google, Zillow links)
  if (review.sourceUrl && review.sourceUrl.startsWith("http")) {
    return review.sourceUrl;
  }
  // Fall back to the user's public RepWell profile
  if (review.userSlug) {
    return `${window.location.origin}/pro/${review.userSlug}`;
  }
  return null;
}
```

**Step 3:** Update the LinkedIn and Facebook share handlers to use the URL when available, and show "Create Smart Link" as a clear secondary action when not:

For the LinkedIn item when no URL:
```tsx
<DropdownMenuItem onClick={handleCreateSmartLink}>
  <Share className="mr-2 h-4 w-4" />
  Create Shareable Link
</DropdownMenuItem>
```

**Step 4:** Commit
```bash
git commit -m "fix(reviews): fix LinkedIn/Facebook share buttons — use sourceUrl or profile link"
```

---

## PHASE 6 — UX Improvements

### Task 6.1: Fix Duplicate "Profile" and "Settings" in Header Menu

**Files:**
- Modify: `src/components/dashboard/header.tsx:228-247`

**Problem:** Both "Profile" and "Settings" link to `/dashboard/settings`. Remove the duplicate.

**Fix:** Remove the "Profile" menu item (keep "Settings"):
```typescript
// Remove these lines (~228-233):
<DropdownMenuItem asChild ...>
  <Link href="/dashboard/settings" ...>
    <UserIcon className="mr-2 h-4 w-4" />
    <span>Profile</span>
  </Link>
</DropdownMenuItem>
```

**Step 1:** Delete the duplicate "Profile" DropdownMenuItem from `header.tsx`

**Step 2:** Commit
```bash
git add src/components/dashboard/header.tsx
git commit -m "fix(header): remove duplicate Profile menu item (same route as Settings)"
```

---

### Task 6.2: Fix Insights `loading.tsx` — Double Padding + Stale Skeleton

**Files:**
- Modify: `src/app/(dashboard)/dashboard/insights/loading.tsx`

**Problem:**
1. Wrapper div has `p-6` causing double-padding (layout already provides it)
2. Contains an "Industry benchmarks" skeleton card that doesn't exist in the actual page

**Step 1:** Read the full file:
```bash
cat src/app/\(dashboard\)/dashboard/insights/loading.tsx
```

**Step 2:** Remove `p-6` from the wrapper div

**Step 3:** Remove the "Industry benchmarks" skeleton section

**Step 4:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/insights/loading.tsx
git commit -m "fix(insights): remove double padding and stale benchmarks skeleton from loading.tsx"
```

---

### Task 6.3: Fix Sidebar Logo — Replace External URL With Local Asset

**Files:**
- Modify: `src/components/dashboard/sidebar.tsx:78`
- Modify: `src/components/dashboard/mobile-nav.tsx:61`

**Problem:** Both components load the expanded logo from an external Supabase Storage URL. If the bucket changes, logos break. The collapsed icon correctly uses a local public path.

**Step 1:** Check if the logo file exists locally:
```bash
ls public/branding/
```

**Step 2:** If the full logo PNG doesn't exist locally, download it:
```bash
curl -o public/branding/RepWell-Logo-Full-Color.png "https://temwotqafrafajehuiuh.supabase.co/storage/v1/object/public/repwell/branding/RepWell-Logo-Full-Color.png"
```

**Step 3:** Update both files to use the local path:
```typescript
// sidebar.tsx:78 and mobile-nav.tsx:61:
src="/branding/RepWell-Logo-Full-Color.png"
```

**Step 4:** Commit
```bash
git add public/branding/ src/components/dashboard/sidebar.tsx src/components/dashboard/mobile-nav.tsx
git commit -m "fix(branding): replace external Supabase URL with local asset for sidebar/mobile-nav logo"
```

---

### Task 6.4: Fix Sidebar Upgrade CTA Gradient (Both Stops Same Color)

**Files:**
- Modify: `src/components/dashboard/sidebar.tsx:118`

**Problem:** `from-repwell-teal-300 to-repwell-teal-300` — both stops identical, renders flat.

**Fix:** Use a proper gradient:
```typescript
className="rounded-xl bg-gradient-to-br from-repwell-teal-400 to-repwell-teal-300 p-4 text-white shadow-lg"
```

**Step 1:** Apply fix

**Step 2:** Commit
```bash
git add src/components/dashboard/sidebar.tsx
git commit -m "fix(sidebar): fix upgrade CTA gradient (was using identical color for both stops)"
```

---

### Task 6.5: Fix Approvals UX — Toast Instead of Redirect, Add Pagination

**Files:**
- Modify: `src/app/(dashboard)/dashboard/approvals/page.tsx`

**Problem:**
1. Server action `approvalAction` calls `redirect()` after every action — full page reload
2. Throws raw errors instead of returning user-friendly messages
3. Queue capped at 50 items with no pagination

**Fix for redirect:** The cleanest approach is to keep server actions but eliminate the redirect, instead using `revalidatePath` only and showing a success state. Since this is an RSC with server actions, we can't easily add a toast. Instead, after the action the page re-renders via `revalidatePath` without the `redirect` call. The approved item disappears from the list naturally.

**Step 1:** Remove `redirect("/dashboard/approvals")` from `approvalAction` — keep only `revalidatePath` calls:
```typescript
// Remove:
redirect("/dashboard/approvals");
```

**Step 2:** Replace `throw new Error(...)` in `approvalAction` with a returned result pattern. Since it's a form action, errors need to be communicated differently. Add a `useActionState` wrapper or simply redirect with an error query param.

The simplest fix without major refactor: return a `{ error: string }` from the server action and use `useActionState` in the client. However since this is currently a pure RSC server action form, the simplest fix is to redirect with a status param:
```typescript
// At the end of approvalAction (success path):
revalidatePath("/dashboard/approvals");
revalidatePath("/dashboard/share-studio");
// Remove the redirect() — revalidatePath triggers re-render automatically in Next.js 15

// For error cases, replace throw with redirect to error state:
// throw new Error("Authentication required");
// →
if (!user) redirect("/login");
```

**Step 3:** Add pagination — change `page_size: 50` to a higher limit for now, and add a "Load more" button if `pendingResult.total > 50`:
```typescript
// Change:
page_size: 50,
// To:
page_size: 100,  // Increase limit
```

**Step 4:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/approvals/page.tsx
git commit -m "fix(approvals): remove redirect-on-action, replace throws with proper error handling, increase queue limit"
```

---

### Task 6.6: Add Confirmation Dialogs for Destructive Team Actions

**Files:**
- Modify: `src/app/(dashboard)/dashboard/team/team-management.tsx`

**Problem:** Deactivate member and revoke invitation have no confirmation dialogs — fires immediately on click.

**Fix:** Use the existing `AlertDialog` component from shadcn to wrap destructive actions.

```typescript
// Import:
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Wrap deactivate button:
<AlertDialog>
  <AlertDialogTrigger asChild>
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      Deactivate
    </DropdownMenuItem>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Deactivate {member.fullName}?</AlertDialogTitle>
      <AlertDialogDescription>
        This will revoke their access to the dashboard. You can reactivate them later.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={() => handleDeactivateMember(member.id)}>
        Deactivate
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Apply the same pattern to revoke invitation.

**Step 1:** Read the full team-management.tsx file to understand existing structure

**Step 2:** Add AlertDialog wrappers for deactivate and revoke actions

**Step 3:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/team/team-management.tsx
git commit -m "fix(team): add confirmation dialogs for deactivate member and revoke invitation"
```

---

### Task 6.7: Fix "Share Profile" Quick Action Misleading Description

**Files:**
- Modify: `src/components/dashboard/user-quick-actions.tsx:41-45`

**Problem:** "Share Profile" says "Get your review request link" but links to profile settings.

**Fix:** Update the description to match the action:
```typescript
// Change description from:
"Get your review request link"
// To:
"View and share your public profile page"
```

**Step 1:** Apply fix

**Step 2:** Commit
```bash
git add src/components/dashboard/user-quick-actions.tsx
git commit -m "fix(dashboard): correct misleading description on Share Profile quick action"
```

---

### Task 6.8: Fix Empty Nav for Users With No Org Profile

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

**Problem:** When `userContext` is null (user has no `organization_id`), the nav renders completely empty with no redirect or error.

**Fix:** Redirect users with no org profile to the onboarding flow:
```typescript
// After building userContext:
if (!userContext) {
  redirect("/onboarding");
}
```

**Step 1:** Add the redirect after `userContext` is constructed (line ~90 in layout.tsx)

**Step 2:** Verify the onboarding route exists and handles new users
```bash
ls src/app/onboarding/ 2>/dev/null || echo "No onboarding route"
```

**Step 3:** Commit
```bash
git add src/app/\(dashboard\)/layout.tsx
git commit -m "fix(auth): redirect users with no organization to onboarding instead of blank nav"
```

---

## PHASE 7 — Dashboard Home: Manager Role Regression

### Task 7.1: Restore Manager Role-Based View on Dashboard Home

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Problem:** The `/dashboard/manager` route was deleted, but no role-based branching was added to the main dashboard home. Managers see the same view as regular users — no team overview, no performance alerts.

**Fix:** Add role detection and render manager-specific components when the user is a manager/admin.

**Step 1:** Read the deleted manager dashboard client to understand what it showed:
```bash
# It's deleted from filesystem but we can see what components exist:
ls src/components/dashboard/manager/
```

**Step 2:** Add role detection to `dashboard/page.tsx`:
```typescript
// In DashboardPage:
const userResult = await getCurrentUser();
const userName = userResult.success ? userResult.data?.fullName : null;
const userRole = userResult.success ? userResult.data?.role : null;
const isManager = userRole === "admin" || userRole === "manager";
```

**Step 3:** Add manager-specific sections conditionally:
```typescript
{isManager && (
  <section>
    <h2 className="text-heading-sm font-semibold text-repwell-teal-500 mb-4">Team Overview</h2>
    <Suspense fallback={<StatsRowSkeleton />}>
      <ManagerDashboardSection />
    </Suspense>
  </section>
)}
```

**Step 4:** Create the `ManagerDashboardSection` server component using the existing `ManagerDashboardClient` component from `src/components/dashboard/manager/manager-dashboard-client.tsx`

**Step 5:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "fix(dashboard): restore manager role-based view on dashboard home with team overview section"
```

---

## PHASE 8 — Code Quality & Polish

### Task 8.1: Fix Review Detail Role Cast Without Validation

**Files:**
- Modify: `src/app/(dashboard)/dashboard/reviews/[id]/page.tsx:31`

**Problem:** Role cast without runtime validation: `role: userData.role as "admin" | "manager" | "user"`.

**Fix:** Use the same `isValidRole()` guard used in the main reviews page.

**Step 1:** Add `isValidRole` function (or import it if it's exported) and apply it

**Step 2:** Commit
```bash
git commit -m "fix(reviews): add runtime role validation in review detail page"
```

---

### Task 8.2: Add Suspense Boundaries to Gamification Widgets

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx:153-191`

**Problem:** `GamificationStatsCard`, `ReputationBreakdownCard`, `ImprovementTipsCard`, `BadgeShowcase`, `ProfileCompletionCard`, `CompactProfileLeaderboard`, `UserQuickActions` rendered without Suspense boundaries.

**Fix:** Wrap each in `<Suspense fallback={<CardSkeleton />}>` where they might do async work.

**Step 1:** Check which of these are async components:
```bash
grep -l "async function\|await " src/components/gamification/*.tsx
```

**Step 2:** Wrap async ones in Suspense with appropriate skeleton fallbacks

**Step 3:** Commit
```bash
git commit -m "fix(dashboard): add Suspense boundaries to gamification and quick-action widgets"
```

---

### Task 8.3: Remove Dead `UserProfileCompletion` Component

**Files:**
- Check: `src/components/dashboard/user-profile-completion.tsx`
- Modify: `src/components/dashboard/index.ts`

**Problem:** `UserProfileCompletion` is exported and in `index.ts` but unused (replaced by `ProfileCompletionCard` from gamification).

**Step 1:** Verify it's not used anywhere:
```bash
grep -r "UserProfileCompletion" src/ --include="*.tsx" --include="*.ts"
```

**Step 2:** If unused, remove the file and its export from `index.ts`

**Step 3:** Commit
```bash
git commit -m "refactor(dashboard): remove orphaned UserProfileCompletion component"
```

---

### Task 8.4: Fix `initializeDefaultBadges` Called on Every Page Load

**Files:**
- Modify: `src/app/(dashboard)/dashboard/recognition/page.tsx:141`
- Modify: `src/lib/recognition/actions.ts` (find `initializeDefaultBadges`)

**Problem:** `await initializeDefaultBadges()` runs on every recognition page visit.

**Fix:** Add an existence check inside `initializeDefaultBadges` so it's a no-op if badges already exist:
```typescript
export async function initializeDefaultBadges(): Promise<void> {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("badges")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) return; // Already initialized

  // ... rest of initialization
}
```

**Step 1:** Read `initializeDefaultBadges` implementation

**Step 2:** Add the existence check at the top

**Step 3:** Commit
```bash
git commit -m "fix(recognition): make initializeDefaultBadges a no-op if badges already exist"
```

---

### Task 8.5: Remove `console.error` From Production Server Actions

**Files:**
- Modify: `src/lib/dashboard/user-actions.ts` (lines 129, 251, 305, 384, 489)
- Modify: `src/lib/dashboard/manager-actions.ts` (lines 102, 235, 329, 386, 453, 538)

**Problem:** 11 `console.error` calls remain in production server action paths.

**Fix:** Remove them. The functions already return structured `{ success: false, error }` — the error info is captured. In production, console.error pollutes logs and potentially leaks internal info.

**Step 1:** Remove all `console.error(...)` calls from the catch blocks in both files (keep the `return { success: false, error: ... }` returns)

**Step 2:** Run lint
```bash
npm run lint
```

**Step 3:** Commit
```bash
git add src/lib/dashboard/user-actions.ts src/lib/dashboard/manager-actions.ts
git commit -m "fix(server): remove console.error calls from production dashboard server actions"
```

---

### Task 8.6: Fix Mobile Nav Scroll Area Height Calculation

**Files:**
- Modify: `src/components/dashboard/mobile-nav.tsx:69`

**Problem:** `h-[calc(100vh-4rem)]` is hardcoded; actual header height is ~52px not 64px (4rem).

**Fix:** Use `h-[calc(100vh-3.5rem)]` or `h-[calc(100svh-3.25rem)]` to match the actual header:
```typescript
className="h-[calc(100svh-3.25rem)]"
```

The `svh` unit handles mobile browser chrome better than `vh`.

**Step 1:** Apply fix

**Step 2:** Commit
```bash
git add src/components/dashboard/mobile-nav.tsx
git commit -m "fix(mobile-nav): correct scroll area height calculation for actual header height"
```

---

### Task 8.7: Fix Replace `alert()` With Toast for Clipboard Failure

**Files:**
- Modify: `src/components/dashboard/user-recent-reviews.tsx:127-130`

**Problem:** `alert()` called on clipboard API failure — jarring UX.

**Fix:**
```typescript
// Before:
} catch (err) {
  console.error("[handleCopyReview] Failed to copy review text:", err);
  alert("Failed to copy. Please select the text manually.");
}

// After:
} catch {
  toast({
    title: "Copy failed",
    description: "Please select and copy the text manually.",
    variant: "destructive",
  });
}
```

**Step 1:** Apply fix (ensure `useToast` is already imported in this file)

**Step 2:** Commit
```bash
git add src/components/dashboard/user-recent-reviews.tsx
git commit -m "fix(reviews): replace alert() with toast for clipboard failure"
```

---

### Task 8.8: Fix Duplicate EmptyState JSX in Dashboard Page

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx:32-70`

**Problem:** `!result.success` and `isNewUser()` both render identical `<EmptyState>` JSX.

**Fix:** Merge the two conditions:
```typescript
async function DashboardStats() {
  const result = await getUserMetrics();

  const isEmpty = !result.success || (result.data && isNewUser(result.data));

  if (isEmpty) {
    return (
      <EmptyState
        iconName="bar-chart"
        title="Your stats will appear here"
        description="Once you start collecting reviews and survey responses, you'll see your performance metrics displayed here."
        actions={[
          { label: "Send Your First Survey", href: "/dashboard/requests", iconName: "send" },
          { label: "Import Reviews", href: "/dashboard/reviews", variant: "outline" },
        ]}
      />
    );
  }

  return <UserStatsCards metrics={result.data!} />;
}
```

**Step 1:** Apply fix

**Step 2:** Commit
```bash
git add src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "refactor(dashboard): deduplicate identical EmptyState renders in DashboardStats"
```

---

### Task 8.9: Fix `auto_reply_queue` + `ai_response_learnings` Missing From DB Types

**Files:**
- Check: `src/types/database.types.ts`
- Modify: Run `npm run db:types` to regenerate

**Problem:** `auto_reply_queue` (migration exists) and `ai_response_learnings` are not in `database.types.ts`, forcing `supabase as any` casts.

**Step 1:** Run DB type generation
```bash
npm run db:types
```

**Step 2:** Verify the tables now appear in the generated types

**Step 3:** Update `src/lib/reviews/response-actions.ts` to remove the `as any` casts now that types exist

**Step 4:** Run lint + type check
```bash
npm run lint && npm run type-check
```

**Step 5:** Commit
```bash
git add src/types/database.types.ts src/lib/reviews/response-actions.ts
git commit -m "fix(types): regenerate DB types to include auto_reply_queue and ai_response_learnings tables"
```

---

### Task 8.10: Remove Orphaned `_onCollapsedChange` Prop From Sidebar

**Files:**
- Modify: `src/components/dashboard/sidebar.tsx:24-30`

**Problem:** `onCollapsedChange` is in the interface and received as a prop but immediately ignored (renamed `_onCollapsedChange`).

**Fix:** Remove from the interface and destructuring since it's never used:
```typescript
interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  // Remove: onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ className, collapsed = false }: SidebarProps) {
```

**Step 1:** Verify no callers pass this prop:
```bash
grep -r "onCollapsedChange" src/ --include="*.tsx" --include="*.ts"
```

**Step 2:** Remove from interface and destructuring

**Step 3:** Commit
```bash
git add src/components/dashboard/sidebar.tsx
git commit -m "refactor(sidebar): remove dead onCollapsedChange prop"
```

---

## Quality Gates (After Each Phase)

Run before considering a phase complete:
```bash
npm run lint
npm run type-check
npm run build
```

---

## Summary of All Tasks

| Phase | Tasks | Severity |
|---|---|---|
| 1 — Security | 1.1-1.5 (org isolation + middleware) | 🔴 Critical |
| 2 — Broken Routes | 2.1-2.4 (billing links, /send, team/[id], orphaned middleware) | 🔴 Critical / 🟠 High |
| 3 — Mock Data | 3.1-3.3 (review volume, competitor pages, campaigns) | 🔴 Critical / 🟠 High |
| 4 — Navigation | 4.1-4.2 (widgets nav, website analytics nav, search dialog) | 🟡 Medium |
| 5 — Data Accuracy | 5.1-5.6 (NPS calc, integrations, notifications, insights N+1, org filter, share buttons) | 🟡 Medium |
| 6 — UX | 6.1-6.8 (header dupes, loading.tsx, logo URL, gradient, approvals UX, team confirm dialogs) | 🟡 Medium |
| 7 — Manager Home | 7.1 (role branching on dashboard) | 🟠 High |
| 8 — Code Quality | 8.1-8.10 (role cast, Suspense, dead code, console.errors, alerts, etc.) | 🟢 Low |

**Total: ~38 discrete commits across 56 issue fixes.**
