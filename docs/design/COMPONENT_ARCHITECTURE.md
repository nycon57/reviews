# Component Architecture Guidelines

Rules for placing, building, and maintaining components in the RepWell codebase.

---

## Placement Rules

| Tier | Location | When to Use |
|------|----------|-------------|
| **Primitives** | `components/ui/` | shadcn/ui only. Never modify directly — use `npx shadcn@latest add`. |
| **Shared** | `components/shared/` | Used by **2+ features**, domain-agnostic, no server action imports. |
| **Feature** | `components/{feature}/` | Domain-specific logic. May compose shared components. |

### Decision Tree

```
Is it a shadcn primitive? → components/ui/
Is it used by 2+ features AND domain-agnostic? → components/shared/
Otherwise → components/{feature}/
```

---

## Shared Component API Conventions (Mandatory)

Every component in `components/shared/` **must** follow these rules:

1. **`className?: string`** — always accept for consumer-side styling via `cn()`.
2. **No server action imports** — accept callbacks via props (`onSubmit`, `onUpload`, etc.). This keeps shared components decoupled from any feature's data layer. Enforced by ESLint.
3. **Props interface** — named `{ComponentName}Props`, exported.
4. **Destructured params** — in the function signature, not inside the body.
5. **`"use client"`** — only when the component genuinely uses hooks, event handlers, or browser APIs.
6. **No hardcoded copy** — prefer props with sensible defaults over baked-in strings when the component serves multiple contexts.

```tsx
// ✅ Good
export interface ImageUploadProps {
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<UploadResult>;
  onRemove?: () => Promise<void>;
  className?: string;
}

export function ImageUpload({ currentUrl, onUpload, onRemove, className }: ImageUploadProps) { ... }

// ❌ Bad — hardcodes server action, no className, inline props
import { uploadAvatar } from "@/lib/auth/profile-actions";
export function AvatarUpload({ url }: { url: string }) { ... }
```

---

## New Component Checklist

Before creating a new component, answer these:

| # | Question | If Yes |
|---|----------|--------|
| 1 | Used by 2+ features? | → `components/shared/` |
| 2 | Accepts `className`? | Must, if shared |
| 3 | Imports server actions directly? | Must not, if shared — pass callbacks via props |
| 4 | Duplicates an existing shared component? | Extend the existing one instead |
| 5 | Over 200 lines? | Split into composition (container + presentational) |

---

## Existing Shared Components

Reference for what already exists — **extend before creating new**.

| Component | File | Purpose |
|-----------|------|---------|
| `ImageUpload` | `shared/image-upload.tsx` | Dropzone + crop + upload for avatar, logo, banner, profile photo |
| `CsvImportWizard` | `shared/csv-import-wizard/` | Generic 4-step CSV import (upload → map → validate → complete) |
| `StatusBadge` | `shared/status-badge.tsx` | Renders status with icon + color from a config record |
| `StatCard` | `shared/stat-card.tsx` | Metric card with optional animation, loading skeleton, trend |
| `EmptyState` | `shared/empty-state.tsx` | Empty state illustrations with action buttons |
| `ReviewItem` | `shared/review-item.tsx` | Single review display card |
| `Breadcrumbs` | `shared/breadcrumbs.tsx` | Page breadcrumb navigation |
| `Skeletons` | `shared/skeletons.tsx` | Reusable loading skeleton components |
| `TierBadge` | `shared/tier-badge.tsx` | Gamification tier display badge |

---

## Icon Registry

All icon name → component mappings go through `lib/icons/registry.ts`.

- Single source of truth for all Phosphor icons used in config-driven contexts.
- `getIcon(name)` normalizes keys (lowercase, strip hyphens) to prevent mismatches.
- Feature components can import icons directly from `@phosphor-icons/react` — the registry is for dynamic/config-driven lookups only.

---

## Patterns to Avoid

| Anti-Pattern | Do Instead |
|---|---|
| Copying a shared component into a feature dir to customize | Add a prop/variant to the shared component |
| Server actions imported in shared components | Pass as callback props |
| Giant monolithic components (300+ lines) | Split into container (logic) + presentational (render) |
| Inline `statusConfig` records in every feature | Use `StatusBadge` with a config record |
| Multiple icon lookup maps with different key formats | Use the centralized icon registry |
| Manual `useState` forms | `react-hook-form` + `zodResolver` |

---

## ESLint Enforcement

Shared components have a dedicated ESLint override that warns on server action imports:

```
src/components/shared/**/*.tsx → no-restricted-imports for @/lib/*/actions*
```

This prevents accidental coupling. If you need data in a shared component, accept it via props from the feature component that owns the data fetching.
