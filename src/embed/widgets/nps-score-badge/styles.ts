/**
 * NPS Score Badge Widget styles — injected into Shadow DOM.
 * Supports gauge (semicircular SVG dial) and numeric (large number) display modes.
 * Color zones: red (detractors), yellow (passives), green (promoters).
 */

export const NPS_SCORE_BADGE_STYLES = /* css */ `
  /* ── Container ─────────────────────────────────────────────────────── */

  .rw-nps {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px;
    background: var(--rw-bg, #fff);
    border: 1px solid var(--rw-border, #e5e7eb);
    border-radius: var(--rw-radius, 12px);
    font-family: var(--rw-font, system-ui, -apple-system, sans-serif);
    text-decoration: none;
    color: inherit;
    max-width: 100%;
    box-sizing: border-box;
    line-height: 1;
  }

  a.rw-nps {
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.15s ease;
  }

  a.rw-nps:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .rw-nps:focus-visible {
    outline: 2px solid var(--rw-primary, #52796f);
    outline-offset: 2px;
  }

  /* ── Gauge Mode ────────────────────────────────────────────────────── */

  .rw-nps__gauge {
    position: relative;
    width: 180px;
    height: 100px;
  }

  .rw-nps__gauge svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .rw-nps__gauge-zone {
    fill: none;
    stroke-width: 14;
    stroke-linecap: round;
  }

  .rw-nps__gauge-needle {
    fill: var(--rw-text, #1a1a2e);
    transform-origin: 90px 90px;
    transition: transform 1.5s cubic-bezier(0.25, 0.1, 0.25, 1);
  }

  .rw-nps__gauge-center {
    fill: var(--rw-bg, #fff);
    stroke: var(--rw-border, #e5e7eb);
    stroke-width: 2;
  }

  .rw-nps__gauge-score {
    font-size: 28px;
    font-weight: 700;
    fill: var(--rw-text, #1a1a2e);
    text-anchor: middle;
    dominant-baseline: middle;
  }

  /* Needle animation on first render */
  @keyframes rw-nps-needle-sweep {
    from { transform: rotate(-90deg); }
  }

  .rw-nps__gauge-needle--animated {
    animation: rw-nps-needle-sweep 1.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .rw-nps__gauge-needle--animated {
      animation: none;
    }
  }

  /* ── Numeric Mode ──────────────────────────────────────────────────── */

  .rw-nps__numeric {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .rw-nps__score {
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  /* ── Labels ────────────────────────────────────────────────────────── */

  .rw-nps__label {
    font-size: var(--rw-body-size, 13px);
    font-weight: 600;
    color: var(--rw-text, #1a1a2e);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
  }

  .rw-nps__count {
    font-size: var(--rw-body-size, 12px);
    color: var(--rw-text-muted, #6b7280);
    text-align: center;
  }

  .rw-nps__period {
    font-size: 11px;
    color: var(--rw-text-muted, #6b7280);
    text-align: center;
  }

  /* ── Breakdown Bar ─────────────────────────────────────────────────── */

  .rw-nps__breakdown {
    width: 100%;
    max-width: 240px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .rw-nps__breakdown-bar {
    display: flex;
    width: 100%;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    background: var(--rw-border, #e5e7eb);
  }

  .rw-nps__breakdown-seg {
    height: 100%;
    transition: width 0.6s ease-out;
  }

  .rw-nps__breakdown-seg--promoter {
    background: #22c55e;
  }

  .rw-nps__breakdown-seg--passive {
    background: #eab308;
  }

  .rw-nps__breakdown-seg--detractor {
    background: #ef4444;
  }

  .rw-nps__breakdown-labels {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .rw-nps__breakdown-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: var(--rw-text-muted, #6b7280);
    white-space: nowrap;
  }

  .rw-nps__breakdown-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── NPS Zone Colors ───────────────────────────────────────────────── */

  .rw-nps-zone--red { color: #ef4444; }
  .rw-nps-zone--yellow { color: #eab308; }
  .rw-nps-zone--light-green { color: #22c55e; }
  .rw-nps-zone--dark-green { color: #16a34a; }
`;
