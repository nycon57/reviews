---
name: RepWell
description: Customer experience and reputation management for high-trust sales teams.
colors:
  page-bg: "#f7f8f5"
  card: "#ffffff"
  sage-50: "#f0f4ef"
  sage-100: "#cad2c5"
  sage-200: "#84a98c"
  teal-300: "#52796f"
  teal-400: "#354f52"
  teal-500: "#2f3e46"
  border: "#d9ded4"
  muted-divider: "#e9ece6"
  legacy-print-gray: "#666666"
  shadow-black-10: "rgba(0, 0, 0, 0.1)"
  warning: "#d4a574"
  destructive: "#c47c7c"
  info: "#7c9eb8"
typography:
  display:
    fontFamily: "Erstoria, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Erstoria, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "72px"
components:
  button-primary:
    backgroundColor: "{colors.teal-300}"
    textColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.teal-400}"
    textColor: "{colors.card}"
    rounded: "{rounded.lg}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.teal-400}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.teal-500}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input-default:
    backgroundColor: "{colors.page-bg}"
    textColor: "{colors.teal-500}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  badge-subtle:
    backgroundColor: "{colors.sage-100}"
    textColor: "{colors.teal-300}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

# Design System: RepWell

## 1. Overview

**Creative North Star: "The Reputation Control Room"**

RepWell should feel like a calm operating surface for reputation work: precise enough for managers, warm enough for customer-facing professionals, and polished enough to support public trust. The system uses restrained teal and sage, white and softly tinted surfaces, and a serif display voice only when it adds credibility or editorial warmth.

The product is not a decorative marketing toy. It is a task surface for approvals, review queues, response drafting, video testimonials, surveys, analytics, widgets, and team oversight. Familiar controls are a virtue here: users should recognize what to do, understand what happened, and trust automated steps because state is visible.

**Key Characteristics:**
- Restrained teal and sage palette with deep teal text.
- Editorial display type for marketing and major page titles; Source Sans 3 for dense UI.
- White cards, light sage-tinted backgrounds, visible borders, and small radius.
- Motion is short, stateful, and reduced-motion aware.
- Customer-facing flows are warmer and simpler than dashboard screens, but still use the same tokens.

## 2. Colors

The palette is trust-building and organic: deep teal carries authority, mid teal carries primary actions, sage carries secondary surfaces, and white keeps workflow areas clear.

### Primary
- **RepWell Teal** (#52796f): Primary actions, links, active states, progress highlights, and selected navigation.
- **Deep Reputation Teal** (#2f3e46): Main text, dark sections, and high-contrast brand moments.
- **Structured Teal** (#354f52): Hover states, headings, and strong UI labels.

### Secondary
- **Sage Signal** (#84a98c): Secondary accents, success-adjacent states, visual softening, and brand pairing with teal.
- **Light Sage Surface** (#cad2c5): Muted panels, selected backgrounds, and quiet section fills.

### Tertiary
- **Warm Attention** (#d4a574): Warnings and attention states, never decorative highlights.
- **Muted Coral Error** (#c47c7c): Destructive and error states.
- **Muted Blue Info** (#7c9eb8): Informational states and supporting charts.

### Neutral
- **App Mist** (#f7f8f5): Default page background from `--background`.
- **Card White** (#ffffff): Cards, popovers, dialogs, and content surfaces.
- **Sage Border** (#d9ded4): Borders, dividers, and input strokes.
- **Muted Divider** (#e9ece6): Very quiet dividers in third-party dropdowns and support surfaces.
- **Legacy Print Gray** (#666666): Print-only URL annotations; do not use for new screen UI.

### Named Rules

**The Teal Does Work Rule.** Teal is for primary action, active state, links, charts, and meaningful emphasis. Do not use it as random decoration.

**The No Generic Gray Rule.** Muted UI should stay teal or sage tinted. Avoid generic gray panels unless a third-party embed forces them.

## 3. Typography

**Display Font:** Erstoria with Georgia and serif fallback.
**Body Font:** Source Sans 3 with system-ui and sans-serif fallback.
**Label/Mono Font:** Source Sans 3; no separate mono system is documented.

**Character:** Erstoria gives the brand warmth and establishment in marketing, profile, and page-title moments. Source Sans 3 keeps dashboards, tables, filters, dialogs, and forms readable.

### Hierarchy
- **Display** (700, 48 to 68px, 1.2 line-height): Marketing heroes and major public-facing statements. Keep letter spacing no tighter than -0.02em.
- **Headline** (700, 40px, 1.2 line-height): Page titles and important section headings.
- **Title** (600, 20 to 28px, 1.3 to 1.4 line-height): Dashboard panels, cards, dialogs, and feature sections.
- **Body** (400, 16px, 1.6 line-height): Most product copy. Keep long prose around 65 to 75 characters.
- **Label** (600, 12 to 14px, 1.5 line-height): Navigation groups, chips, metadata, form labels, and table support text.

### Named Rules

**The Serif Has a Job Rule.** Use Erstoria for trust and brand presence, not for buttons, filters, table cells, badges, or dense controls.

## 4. Elevation

RepWell uses a hybrid of tonal layering, thin borders, and restrained shadows. Cards are usually white with a sage-tinted border and low elevation. Hover states can lift slightly, but broad soft shadows should be rare and tied to interactivity.

### Shadow Vocabulary
- **Elevation 1** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Resting low-emphasis surfaces.
- **Card** (`0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)`): Standard cards and panels.
- **Third-party Popup Shadow** (`0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`): Leaflet and Google Places overlays that need to sit above the app surface.
- **Card Hover** (`0 8px 16px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.04)`): Interactive cards only.
- **Button Hover** (`0 4px 12px -2px rgb(82 121 111 / 0.25)`): Primary action hover feedback.

### Named Rules

**The Flat Until Touched Rule.** Surfaces should not look floaty at rest. Elevation appears when the user hovers, focuses, opens, or selects.

## 5. Components

### Buttons

- **Shape:** 8px radius for standard buttons; full-pill only for badges and tiny chips.
- **Primary:** RepWell Teal background, white text, semibold Source Sans 3, 40px default height, 48 to 56px for large CTAs.
- **Hover / Focus:** Darken to Structured Teal, lift by 2px at most, use the documented focus ring.
- **Secondary / Ghost / Link:** Transparent or sage-tinted surfaces with teal text. Keep inactive states quiet.

### Chips

- **Style:** Rounded-full, compact, and semantic. Use sage-tinted fills for subtle badges and teal fills only for active or important state.
- **State:** Selected filters need visible fill or border changes. Do not rely on color alone.

### Cards / Containers

- **Corner Style:** 12px for cards, 8px for controls, 6px and 4px for smaller nested elements.
- **Background:** Card White on App Mist; dark dashboard surfaces use teal-tinted layers.
- **Shadow Strategy:** Border and tonal layering first, low shadow second, hover lift only when interactive.
- **Border:** Sage Border or `border-border/60`.
- **Internal Padding:** 24px default; 16px for dense dashboard cards; larger spacing only for marketing sections.

### Inputs / Fields

- **Style:** 44px height, 8px radius, sage border, app background, deep teal text.
- **Focus:** RepWell Teal border with a soft teal ring.
- **Error / Disabled:** Muted coral for errors, reduced opacity and cursor state for disabled fields.

### Navigation

Dashboard navigation uses a white sidebar, 8px nav item radius, Source Sans 3 labels, Phosphor icons, and a teal active state. The active indicator may use a narrow leading bar in sidebar navigation only; do not turn side stripes into a general card pattern. Marketing navigation stays lighter and public pages remain light mode by default.

### Review And Video Workflows

Review queues, video testimonials, approval panels, and Share Studio surfaces should prioritize source, rating, approval status, publication state, owner, and next action. Media previews should be stable and responsive; customer-facing flows should use simpler cards, clearer steps, and generous spacing.

## 6. Do's and Don'ts

### Do:

- **Do** use `#52796f`, `#84a98c`, `#354f52`, and `#2f3e46` as the main brand vocabulary.
- **Do** use Source Sans 3 for product UI and Erstoria for major brand or page-title moments.
- **Do** keep primary actions visually rare and clearly action-oriented.
- **Do** show workflow state for reviews, videos, AI drafts, approvals, disputes, publishing, and follow-ups.
- **Do** respect reduced motion and keep product transitions around 150 to 250ms.
- **Do** use the existing shadcn primitives and shared components before inventing new controls.

### Don't:

- **Don't** use cluttered dashboards, aggressive CTAs, sterile corporate SaaS, or overly playful startup styling.
- **Don't** use mortgage-specific language in reusable UI unless the surface is explicitly mortgage-only.
- **Don't** use generic gray admin panels when a teal or sage tinted neutral already exists.
- **Don't** use purple gradient SaaS, neon AI tooling, glassmorphism, decorative motion, or gradient text.
- **Don't** use `border-left` or `border-right` greater than 1px as a general accent on cards, list items, callouts, or alerts.
- **Don't** use large-radius cards above 16px unless the element is intentionally a pill or circular avatar.
