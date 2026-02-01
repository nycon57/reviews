/**
 * Review Wall Widget styles — injected into Shadow DOM.
 * Uses CSS columns for masonry layout (zero-JS layout cost).
 * Fallback: flex-wrap grid for browsers without CSS columns.
 */

export const REVIEW_WALL_STYLES = /* css */ `
  /* ── Wall Container ──────────────────────────────────────────── */

  .rw-wall {
    padding: 16px;
  }

  .rw-wall__header {
    margin-bottom: 16px;
  }

  .rw-wall__title {
    font-size: 18px;
    font-weight: 700;
    color: var(--rw-text, #1a1a2e);
    line-height: 1.3;
  }

  /* ── Masonry Grid (CSS columns) ──────────────────────────────── */

  .rw-wall__grid {
    column-count: var(--rw-wall-columns, 3);
    column-gap: var(--rw-wall-gap, 16px);
    column-fill: balance;
  }

  .rw-wall__card {
    break-inside: avoid;
    margin-bottom: var(--rw-wall-gap, 16px);
    display: inline-block;
    width: 100%;
  }

  /* ── Featured Card ───────────────────────────────────────────── */

  .rw-wall__card--featured {
    border-left: 3px solid var(--rw-accent, var(--rw-primary, #52796f));
    transform: scale(1.02);
  }

  .rw-wall__card--featured .rw-co-review {
    background: linear-gradient(
      135deg,
      rgba(82, 121, 111, 0.03) 0%,
      rgba(132, 169, 140, 0.05) 100%
    );
  }

  /* ── Load More ───────────────────────────────────────────────── */

  .rw-wall__load-more {
    display: block;
    width: 100%;
    margin-top: 16px;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 500;
    color: var(--rw-primary, #52796f);
    background: transparent;
    border: 1px solid var(--rw-primary, #52796f);
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
    font-family: inherit;
  }

  .rw-wall__load-more:hover {
    background: var(--rw-primary, #52796f);
    color: #fff;
  }

  .rw-wall__load-more:focus-visible {
    outline: 2px solid var(--rw-primary, #52796f);
    outline-offset: 2px;
  }

  /* ── Scroll Sentinel (invisible, for infinite scroll) ────────── */

  .rw-wall__sentinel {
    height: 1px;
    width: 100%;
    visibility: hidden;
  }

  /* ── Scroll Depth Sentinels ──────────────────────────────────── */

  .rw-wall__depth-sentinel {
    position: absolute;
    left: 0;
    width: 1px;
    height: 1px;
    visibility: hidden;
    pointer-events: none;
  }

  .rw-wall__grid-wrapper {
    position: relative;
  }

  /* ── Branding ────────────────────────────────────────────────── */

  .rw-wall__branding {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }

  .rw-wall__branding a {
    color: #6b7280;
    text-decoration: none;
  }

  .rw-wall__branding a:hover {
    text-decoration: underline;
  }

  /* ── Disclaimer ──────────────────────────────────────────────── */

  .rw-wall__disclaimer {
    margin-top: 12px;
    padding: 8px 12px;
    font-size: 10px;
    line-height: 1.5;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 4px;
    border: 1px solid #f3f4f6;
  }

  .rw-wall__disclaimer-ehl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-weight: 600;
    font-size: 11px;
    color: #4b5563;
  }

  .rw-wall__disclaimer-text {
    font-size: 10px;
    line-height: 1.5;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .rw-wall__disclaimer-nmls {
    font-size: 10px;
    color: var(--rw-primary, #52796f);
    text-decoration: none;
  }

  .rw-wall__disclaimer-nmls:hover {
    text-decoration: underline;
  }

  /* ── CTA ─────────────────────────────────────────────────────── */

  .rw-wall__cta-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  /* ── Responsive ──────────────────────────────────────────────── */

  @media (max-width: 1024px) {
    .rw-wall__grid {
      column-count: var(--rw-wall-columns-tablet, 2);
    }
  }

  @media (max-width: 640px) {
    .rw-wall__grid {
      column-count: var(--rw-wall-columns-mobile, 1);
    }
  }

  /* ── Fallback: flex-wrap grid for browsers without CSS columns ── */

  @supports not (column-count: 2) {
    .rw-wall__grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rw-wall-gap, 16px);
    }

    .rw-wall__card {
      flex: 1 1 calc(33.333% - var(--rw-wall-gap, 16px));
      min-width: 250px;
      margin-bottom: 0;
    }
  }

  /* ── Animation for new cards ─────────────────────────────────── */

  @keyframes rw-wall-fade-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .rw-wall__card--new {
    animation: rw-wall-fade-in 0.3s ease forwards;
  }
`;
