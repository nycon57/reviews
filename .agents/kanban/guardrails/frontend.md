# Frontend Guardrails — RepWell

## Design System
- Read `docs/design/REPWELL_DESIGN_SYSTEM` before any UI work
- Palette: earthy teals (#2f3e46–#52796f) + sages (#84a98c–#cad2c5)
- Typography: Erstoria serif (headlines) + Source Sans 3 (UI)
- Light mode default, dark mode supported. Both use teal-tinted surfaces.
- Generous whitespace over density. Purposeful motion only.
- WCAG 2.1 AA accessibility. Keyboard navigable.

## Component Patterns
- ShadCN components first. Only create custom when no ShadCN equivalent exists.
- Icon maps use PascalCase Phosphor icon names. Normalize keys (lowercase + strip hyphens).
- `useScrollReveal` hook with `prefers-reduced-motion` support. Stagger delays capped at 600ms.
- `SectionWrapper` provides background variants including `gradient`.

## Anti-patterns
- No cluttered dashboards, aggressive CTAs, sterile corporate SaaS
- No mortgage-specific terminology — industry-agnostic language only
- No overly playful/startup aesthetics

## Testing
- Feature works on mobile viewport
- Keyboard navigation works
- Error states handled gracefully
