/**
 * Star Rating Badge Widget styles — injected into Shadow DOM alongside BASE_STYLES.
 * Compact trust indicator badge with inline and floating placement modes.
 */

export const STAR_RATING_BADGE_STYLES = /* css */ `
  /* ── Badge Container ──────────────────────────────────────────────── */

  .rw-srb {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--rw-bg, #fff);
    border: 1px solid var(--rw-border, #e5e7eb);
    border-radius: var(--rw-radius, 8px);
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: box-shadow 0.2s ease, transform 0.15s ease;
    max-width: 100%;
    box-sizing: border-box;
    line-height: 1;
  }

  .rw-srb:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .rw-srb:focus-visible {
    outline: 2px solid var(--rw-primary, #52796f);
    outline-offset: 2px;
  }

  /* ── Rating Value ─────────────────────────────────────────────────── */

  .rw-srb__rating {
    font-size: 18px;
    font-weight: 700;
    color: var(--rw-text, #1a1a2e);
    line-height: 1;
    flex-shrink: 0;
  }

  /* ── Stars Row ────────────────────────────────────────────────────── */

  .rw-srb__stars {
    display: flex;
    align-items: center;
    gap: 1px;
    flex-shrink: 0;
  }

  .rw-srb__stars .rw-star {
    width: 16px;
    height: 16px;
  }

  /* ── Partial star via clip-path ────────────────────────────────────── */

  .rw-srb__star-pair {
    position: relative;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .rw-srb__star-pair .rw-star {
    position: absolute;
    inset: 0;
    width: 16px;
    height: 16px;
  }

  .rw-srb__star-pair .rw-star--empty {
    z-index: 0;
  }

  .rw-srb__star-pair .rw-star--partial {
    z-index: 1;
  }

  /* ── Info Section ─────────────────────────────────────────────────── */

  .rw-srb__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .rw-srb__name {
    font-size: 11px;
    font-weight: 600;
    color: var(--rw-text, #1a1a2e);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .rw-srb__count {
    font-size: 11px;
    color: #6b7280;
    white-space: nowrap;
    line-height: 1.2;
  }

  /* ── Floating Mode ────────────────────────────────────────────────── */

  :host(.rw-srb-floating) {
    position: fixed;
    z-index: 9999;
    display: block;
  }

  :host(.rw-srb-floating) .rw-srb {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  /* ── Float Position Classes ───────────────────────────────────────── */

  :host(.rw-srb-float--top-left) { top: 16px; left: 16px; }
  :host(.rw-srb-float--top-right) { top: 16px; right: 16px; }
  :host(.rw-srb-float--bottom-left) { bottom: 16px; left: 16px; }
  :host(.rw-srb-float--bottom-right) { bottom: 16px; right: 16px; }

  /* ── Float Animations ─────────────────────────────────────────────── */

  :host(.rw-srb-anim--fade) {
    animation: rw-srb-fade-in 0.3s ease-out;
  }

  :host(.rw-srb-anim--slide) {
    animation: rw-srb-slide-in 0.3s ease-out;
  }

  @keyframes rw-srb-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes rw-srb-slide-in {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── Inline Mode (default) ────────────────────────────────────────── */

  :host(:not(.rw-srb-floating)) {
    display: inline-block;
  }
`;
