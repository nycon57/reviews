/**
 * Base styles injected into each widget Shadow DOM.
 * Exported as a string constant so esbuild can inline it (no external CSS request).
 */

export const BASE_STYLES = /* css */ `
  :host {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #1a1a2e;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Skeleton shimmer ──────────────────────────────────────────────── */

  .rw-skeleton {
    padding: 16px;
  }

  .rw-skeleton__header {
    margin-bottom: 16px;
  }

  .rw-skeleton__cards {
    display: flex;
    gap: 16px;
  }

  .rw-skeleton__card {
    flex: 1;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .rw-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: rw-shimmer 1.5s ease-in-out infinite;
    border-radius: 4px;
  }

  @keyframes rw-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Widget container ──────────────────────────────────────────────── */

  .rw-widget {
    padding: 16px;
  }

  .rw-widget__header {
    margin-bottom: 16px;
  }

  .rw-widget__title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .rw-widget__subtitle {
    font-size: 13px;
    color: #6b7280;
  }

  /* ── Review cards ──────────────────────────────────────────────────── */

  .rw-reviews {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .rw-review {
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    transition: box-shadow 0.15s ease;
  }

  .rw-review:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .rw-review__top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .rw-review__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #6b7280;
    flex-shrink: 0;
  }

  .rw-review__meta {
    flex: 1;
    min-width: 0;
  }

  .rw-review__name {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rw-review__date {
    font-size: 12px;
    color: #9ca3af;
  }

  .rw-review__stars {
    display: flex;
    gap: 2px;
    margin-bottom: 8px;
  }

  .rw-star {
    width: 16px;
    height: 16px;
  }

  .rw-star--filled {
    color: #f59e0b;
  }

  .rw-star--empty {
    color: #d1d5db;
  }

  .rw-review__text {
    font-size: 14px;
    line-height: 1.6;
    color: #374151;
  }

  .rw-review__source {
    margin-top: 8px;
    font-size: 11px;
    color: #9ca3af;
    text-transform: capitalize;
  }

  /* ── CTA ────────────────────────────────────────────────────────────── */

  .rw-cta {
    display: inline-block;
    margin-top: 16px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    background: #2563eb;
    border: none;
    border-radius: 6px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .rw-cta:hover {
    background: #1d4ed8;
  }

  /* ── Branding ───────────────────────────────────────────────────────── */

  .rw-branding {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
  }

  .rw-branding a {
    color: #6b7280;
    text-decoration: none;
  }

  .rw-branding a:hover {
    text-decoration: underline;
  }

  /* ── Disclaimer (NMLS) ─────────────────────────────────────────────── */

  .rw-disclaimer {
    margin-top: 12px;
    padding: 8px 12px;
    font-size: 11px;
    line-height: 1.4;
    color: #6b7280;
    background: #f9fafb;
    border-radius: 4px;
  }

  /* ── Error fallback ─────────────────────────────────────────────────── */

  .rw-error {
    padding: 24px 16px;
    text-align: center;
    color: #6b7280;
    font-size: 13px;
  }

  /* ── Empty state ────────────────────────────────────────────────────── */

  .rw-empty {
    padding: 32px 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 14px;
  }
`;
