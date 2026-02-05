/**
 * Review Carousel Widget styles — injected into Shadow DOM.
 */

export const REVIEW_CAROUSEL_STYLES = /* css */ `
  /* ── Carousel Container ─────────────────────────────────────────── */

  .rw-carousel {
    position: relative;
    overflow: hidden;
    padding: 16px;
  }

  .rw-carousel__header {
    margin-bottom: 16px;
  }

  .rw-carousel__title {
    font-size: 18px;
    font-weight: 700;
    color: var(--rw-text, #1a1a2e);
    line-height: 1.3;
  }

  /* ── Track (slide mode) ─────────────────────────────────────────── */

  .rw-carousel__viewport {
    position: relative;
    overflow: hidden;
  }

  .rw-carousel__track {
    display: flex;
    will-change: transform;
  }

  .rw-carousel__track--slide {
    transition: transform 300ms ease;
  }

  /* ── Fade / Flip wrapper ────────────────────────────────────────── */

  .rw-carousel__track--fade,
  .rw-carousel__track--flip {
    display: grid;
    position: relative;
  }

  /* ── Card ────────────────────────────────────────────────────────── */

  .rw-carousel__card {
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 0 6px;
  }

  .rw-carousel__track--fade .rw-carousel__card,
  .rw-carousel__track--flip .rw-carousel__card {
    grid-area: 1 / 1;
  }

  /* ── Navigation Arrows ──────────────────────────────────────────── */

  .rw-carousel__arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.95);
    border: 1px solid var(--rw-border, #e5e7eb);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: background 0.15s ease, box-shadow 0.15s ease;
    color: var(--rw-text, #1a1a2e);
    padding: 0;
    font-family: inherit;
  }

  .rw-carousel__arrow:hover {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }

  .rw-carousel__arrow:focus-visible {
    outline: 2px solid var(--rw-primary, #52796f);
    outline-offset: 2px;
  }

  .rw-carousel__arrow--prev { left: 4px; }
  .rw-carousel__arrow--next { right: 4px; }

  .rw-carousel__arrow svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* ── Navigation Dots ────────────────────────────────────────────── */

  .rw-carousel__dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    padding-top: 12px;
  }

  .rw-carousel__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d1d5db;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background 0.2s ease, transform 0.2s ease;
  }

  .rw-carousel__dot:hover {
    background: #9ca3af;
  }

  .rw-carousel__dot--active {
    background: var(--rw-primary, #52796f);
    transform: scale(1.2);
  }

  .rw-carousel__dot:focus-visible {
    outline: 2px solid var(--rw-primary, #52796f);
    outline-offset: 2px;
  }

  /* ── CTA ─────────────────────────────────────────────────────────── */

  .rw-carousel__cta-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  /* ── Branding ───────────────────────────────────────────────────── */

  .rw-carousel__branding {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }

  .rw-carousel__branding a {
    color: #6b7280;
    text-decoration: none;
  }

  .rw-carousel__branding a:hover { text-decoration: underline; }

  /* ── Disclaimer ─────────────────────────────────────────────────── */

  .rw-carousel__disclaimer {
    margin-top: 12px;
    padding: 8px 12px;
    font-size: var(--rw-disclaimer-size, 10px);
    line-height: 1.5;
    color: var(--rw-text, #6b7280);
    opacity: 0.8;
    background: var(--rw-bg, #f9fafb);
    border-radius: 4px;
    border: 1px solid var(--rw-border, #f3f4f6);
  }

  .rw-carousel__disclaimer-ehl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    font-weight: 600;
    font-size: 11px;
    color: var(--rw-text, #4b5563);
  }

  .rw-carousel__disclaimer-text {
    font-size: var(--rw-disclaimer-size, 10px);
    line-height: 1.5;
    color: var(--rw-text, #6b7280);
    opacity: 0.8;
    margin-bottom: 4px;
  }

  .rw-carousel__disclaimer-nmls {
    font-size: 10px;
    color: var(--rw-primary, #52796f);
    text-decoration: none;
  }

  .rw-carousel__disclaimer-nmls:hover { text-decoration: underline; }

  /* ── Responsive ─────────────────────────────────────────────────── */

  @media (max-width: 640px) {
    .rw-carousel__arrow { width: 32px; height: 32px; }
    .rw-carousel__arrow svg { width: 14px; height: 14px; }
  }
`;
