# Widget Builder Layout And Content Consistency Design

## Goal

Make the widget builder honest and reliable:

- theme layout controls must affect both preview and deployed embeds
- truncate controls must only appear where they actually work
- CTA defaults must be derived from the selected entity's public RepWell profile

## Problems

### Theme layout drift

`ThemeTab` writes to `config.theme.layout`, but preview and embed renderers consume those values inconsistently. The builder currently stores `maxWidth`, `padding`, `borderRadius`, `shadow`, and `cardStyle`, while several preview components and widget styles still hardcode padding, radius, and shadows or use `content.cardStyle` instead of `theme.layout.cardStyle`.

### Misleading truncate control

`ContentTab` exposes `Truncate Length` broadly, but only some widgets actually render review body text with that setting. Video, badges, and some banner modes either ignore it or use fixed snippet lengths, which makes the control look broken.

### CTA defaults are not entity-aware

CTA fields are blank and generic even though the builder already knows the selected entity. Users expect a sensible default call to action that points to the selected RepWell public profile.

## Decisions

### 1. `theme.layout` is the shell source of truth

Use `config.theme.layout` for shell-level layout tokens everywhere:

- `maxWidth`
- `padding`
- `borderRadius`
- `shadow`

These tokens must affect both the dashboard preview and the deployed embed.

`cardStyle` remains a card-level concern, but it should be read from `theme.layout.cardStyle` as the authoritative source. It should apply only to widgets that render review cards. Badges and banners will still consume the shared shell tokens, but they will not be forced into artificial card variants.

### 2. Truncate is only shown for text-bearing widgets

Show `Truncate Length` only for:

- `lo_review`
- `branch_review`
- `company_review`
- `review_carousel`
- `review_wall`
- `social_proof_banner`

Hide it for:

- `video_testimonial`
- `star_rating_badge`
- `nps_score_badge`

For supported widgets, preview and embed must use the same truncation source.

### 3. CTA defaults are derived from canonical public profile URLs

Use the selected entity to compute the default CTA destination:

- `user` -> `/pro/{slug-or-id}`
- `branch` -> `/branch/{global_slug-or-id}`
- `organization` -> `/org/{slug}`

The CTA copy will be generic and industry-agnostic. The default is:

- text: `View Profile`
- URL: the canonical public profile URL for the selected entity

### 4. CTA defaults are auto-managed until customized

CTA text and URL are treated as default-driven when either:

- both fields are blank, or
- both fields match the currently derived default

When the entity changes:

- if CTA is still default-driven, update both fields to the new default
- if the user customized either field, do not overwrite either field

Add a `Reset to default` action so users can restore the derived CTA after customizing it.

This avoids hidden metadata in the saved config while still preserving sensible behavior across sessions.

## Data Flow

### Theme layout

1. `ThemeTab` writes layout values to `config.theme.layout`
2. `WidgetPreview` passes layout tokens into preview components
3. preview components use shared layout helpers instead of hardcoded padding/radius/shadow
4. embed theme application continues to publish CSS variables on the host
5. widget-specific embed styles consume those variables instead of hardcoded shell values

### CTA defaults

1. `ContentTab` receives `entityType` and `entityId`
2. `ContentTab` resolves entity CTA defaults from a server action
3. if current CTA fields are default-driven, the tab writes the derived defaults into config
4. once the user edits either field, auto-updates stop
5. `Reset to default` reapplies the derived text and URL

## Testing Strategy

- component tests for `ContentTab` behavior:
  - truncate control visibility by widget type
  - CTA auto-fill from entity defaults
  - CTA freeze after manual edits
  - CTA reset behavior
- preview tests for shared layout token propagation
- embed tests for layout CSS variable usage and supported truncation behavior

## Non-Goals

- changing the public embed architecture
- adding runtime CTA derivation inside `embed.js`
- forcing card-style variants onto badges or banners
- introducing database migrations
