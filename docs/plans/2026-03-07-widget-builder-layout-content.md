# Widget Builder Layout And Content Consistency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make widget builder layout controls affect preview and embeds consistently, limit truncate controls to supported widgets, and auto-populate CTA defaults from the selected entity's public RepWell profile.

**Architecture:** Keep `theme.layout` as the single shell-level source of truth, then push those tokens through preview and embed renderers. Add a small CTA-default resolution layer in the builder that derives canonical profile URLs from the selected entity and only overwrites CTA fields while they are still default-driven.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Shadow DOM embed runtime

---

### Task 1: Document supported content behavior in code

**Files:**
- Modify: `src/components/widgets/sidebar/content-tab.tsx`
- Create: `src/components/widgets/sidebar/content-defaults.ts`
- Test: `src/components/widgets/__tests__/content-tab.test.tsx`

**Step 1: Write the failing test**

Create `src/components/widgets/__tests__/content-tab.test.tsx` with cases that assert:

- `Truncate Length` is visible for `lo_review`
- `Truncate Length` is not rendered for `video_testimonial`
- CTA fields start with entity-derived defaults when available

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/widgets/__tests__/content-tab.test.tsx`

Expected: FAIL because `ContentTab` still renders truncate for unsupported widgets and has no CTA default logic.

**Step 3: Write minimal implementation**

- Add small pure helpers in `src/components/widgets/sidebar/content-defaults.ts`:
  - supported widget types for truncation
  - CTA default text
  - helper to detect whether current CTA fields are still default-driven
- Update `ContentTab` to conditionally render the truncate slider only for supported widgets

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/widgets/__tests__/content-tab.test.tsx`

Expected: PASS for truncate visibility assertions, CTA assertions still pending until Task 2.

**Step 5: Commit**

```bash
git add src/components/widgets/sidebar/content-tab.tsx src/components/widgets/sidebar/content-defaults.ts src/components/widgets/__tests__/content-tab.test.tsx
git commit -m "test: define supported content controls"
```

### Task 2: Add entity-aware CTA default resolution

**Files:**
- Modify: `src/lib/widgets/actions.ts`
- Modify: `src/components/widgets/sidebar/content-tab.tsx`
- Modify: `src/components/widgets/widget-builder-sidebar.tsx`
- Test: `src/components/widgets/__tests__/content-tab.test.tsx`

**Step 1: Write the failing test**

Extend `src/components/widgets/__tests__/content-tab.test.tsx` with cases that assert:

- CTA URL defaults to `/pro/{slug-or-id}` for users
- CTA URL defaults to `/branch/{global_slug-or-id}` for branches
- CTA URL defaults to `/org/{slug}` for organizations
- manual edits stop subsequent auto-overwrites
- `Reset to default` restores entity-derived values

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/widgets/__tests__/content-tab.test.tsx`

Expected: FAIL because no entity CTA resolver or reset action exists.

**Step 3: Write minimal implementation**

- Add a server action in `src/lib/widgets/actions.ts` that resolves canonical public profile paths for `user`, `branch`, and `organization`
- Pass `entityType` and `entityId` into `ContentTab`
- In `ContentTab`, fetch CTA defaults on entity changes and auto-apply only while the current fields are blank or still equal to the prior defaults
- Add a `Reset to default` action that reapplies the derived CTA

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/widgets/__tests__/content-tab.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/widgets/actions.ts src/components/widgets/sidebar/content-tab.tsx src/components/widgets/widget-builder-sidebar.tsx src/components/widgets/__tests__/content-tab.test.tsx
git commit -m "feat: add entity-aware CTA defaults"
```

### Task 3: Make preview layout tokens authoritative

**Files:**
- Modify: `src/components/widgets/widget-preview.tsx`
- Modify: `src/components/widgets/preview/pro-review-preview.tsx`
- Modify: `src/components/widgets/preview/company-review-preview.tsx`
- Modify: `src/components/widgets/preview/branch-review-preview.tsx`
- Modify: `src/components/widgets/preview/review-carousel-preview.tsx`
- Modify: `src/components/widgets/preview/review-wall-preview.tsx`
- Modify: `src/components/widgets/preview/social-proof-banner-preview.tsx`
- Create: `src/components/widgets/preview/layout.ts`
- Test: `src/components/widgets/__tests__/widget-preview-layout.test.tsx`

**Step 1: Write the failing test**

Create `src/components/widgets/__tests__/widget-preview-layout.test.tsx` with assertions that:

- preview shell respects `maxWidth`, `padding`, `borderRadius`, and `shadow`
- card-based previews read `theme.layout.cardStyle` instead of `content.cardStyle`

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/widgets/__tests__/widget-preview-layout.test.tsx`

Expected: FAIL because preview components still hardcode shell layout and card styles.

**Step 3: Write minimal implementation**

- Create shared preview layout helpers in `src/components/widgets/preview/layout.ts`
- Thread full layout props through `WidgetPreview`
- Update card-based preview components to consume shared layout helpers and read `theme.layout.cardStyle`
- Keep badges and banners on shell tokens only

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/widgets/__tests__/widget-preview-layout.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/widgets/widget-preview.tsx src/components/widgets/preview/layout.ts src/components/widgets/preview/pro-review-preview.tsx src/components/widgets/preview/company-review-preview.tsx src/components/widgets/preview/branch-review-preview.tsx src/components/widgets/preview/review-carousel-preview.tsx src/components/widgets/preview/review-wall-preview.tsx src/components/widgets/preview/social-proof-banner-preview.tsx src/components/widgets/__tests__/widget-preview-layout.test.tsx
git commit -m "feat: align preview layout tokens"
```

### Task 4: Make embed shell layout match the builder

**Files:**
- Modify: `src/embed/widgets/company-review/styles.ts`
- Modify: `src/embed/widgets/branch-review/styles.ts`
- Modify: `src/embed/widgets/review-carousel/styles.ts`
- Modify: `src/embed/widgets/review-wall/template.ts`
- Modify: `src/embed/widgets/social-proof-banner/template.ts`
- Modify: `src/embed/widgets/social-proof-banner/styles.ts`
- Modify: `src/embed/widgets/video-testimonial/styles.ts`
- Test: `src/embed/__tests__/embed.test.ts`

**Step 1: Write the failing test**

Extend `src/embed/__tests__/embed.test.ts` with assertions that:

- theme layout variables are reflected in the rendered widget shell
- supported widgets use configured truncation
- social proof banner uses configured truncation instead of fixed snippet lengths

**Step 2: Run test to verify it fails**

Run: `npm test -- src/embed/__tests__/embed.test.ts`

Expected: FAIL because several widget styles and banner templates still hardcode layout values or snippet lengths.

**Step 3: Write minimal implementation**

- replace shell-level hardcoded padding/radius/shadow values with `--rw-padding`, `--rw-radius`, and `--rw-shadow`
- update social proof banner snippet truncation to read the configured content truncate value when supported
- leave badges on shell tokens only, without fake card-style branching

**Step 4: Run test to verify it passes**

Run: `npm test -- src/embed/__tests__/embed.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/embed/widgets/company-review/styles.ts src/embed/widgets/branch-review/styles.ts src/embed/widgets/review-carousel/styles.ts src/embed/widgets/review-wall/template.ts src/embed/widgets/social-proof-banner/template.ts src/embed/widgets/social-proof-banner/styles.ts src/embed/widgets/video-testimonial/styles.ts src/embed/__tests__/embed.test.ts
git commit -m "feat: align embed layout tokens"
```

### Task 5: Final verification and embed rebuild

**Files:**
- Modify: `public/embed/v1/*` (generated)
- Verify: `src/components/widgets/__tests__/content-tab.test.tsx`
- Verify: `src/components/widgets/__tests__/widget-preview-layout.test.tsx`
- Verify: `src/embed/__tests__/embed.test.ts`

**Step 1: Run focused tests**

Run:

```bash
npm test -- src/components/widgets/__tests__/content-tab.test.tsx
npm test -- src/components/widgets/__tests__/widget-preview-layout.test.tsx
npm test -- src/embed/__tests__/embed.test.ts
```

Expected: PASS

**Step 2: Rebuild embed assets**

Run:

```bash
npm run build:embed
```

Expected: embed manifest and built assets update without errors.

**Step 3: Sanity-check the worktree**

Run:

```bash
git diff -- src/components/widgets src/embed src/lib/widgets docs/plans
```

Expected: only relevant widget builder, preview, embed, and plan changes are present.

**Step 4: Commit**

```bash
git add docs/plans/2026-03-07-widget-builder-layout-content-design.md docs/plans/2026-03-07-widget-builder-layout-content.md src/components/widgets src/embed src/lib/widgets public/embed/v1
git commit -m "feat: align widget builder layout and CTA defaults"
```
