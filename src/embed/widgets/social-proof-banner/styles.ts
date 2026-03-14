/**
 * CSS for the Social Proof Banner Widget.
 * Injected into the widget's Shadow DOM host element appended to document.body.
 */

export const SOCIAL_PROOF_BANNER_STYLES = /* css */ `
  :host {
    all: initial;
    font-family: var(--rw-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    color: var(--rw-text, #1a1a2e);
    line-height: 1.5;
    box-sizing: border-box;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Container ─────────────────────────────── */
  .rw-spb {
    position: fixed;
    z-index: var(--rw-spb-z, 99999);
    pointer-events: auto;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
  }

  .rw-spb--visible {
    opacity: 1;
    visibility: visible;
  }

  /* ── Placement ─────────────────────────────── */
  .rw-spb--top-left {
    top: 16px;
    left: 16px;
  }
  .rw-spb--top-right {
    top: 16px;
    right: 16px;
  }
  .rw-spb--bottom-left {
    bottom: 16px;
    left: 16px;
  }
  .rw-spb--bottom-right {
    bottom: 16px;
    right: 16px;
  }
  .rw-spb--top-bar {
    top: 0;
    left: 0;
    right: 0;
  }
  .rw-spb--bottom-bar {
    bottom: 0;
    left: 0;
    right: 0;
  }

  /* ── Animations: slide ─────────────────────── */
  .rw-spb--anim-slide.rw-spb--top-left,
  .rw-spb--anim-slide.rw-spb--top-right,
  .rw-spb--anim-slide.rw-spb--top-bar {
    transform: translateY(-100%);
  }
  .rw-spb--anim-slide.rw-spb--bottom-left,
  .rw-spb--anim-slide.rw-spb--bottom-right,
  .rw-spb--anim-slide.rw-spb--bottom-bar {
    transform: translateY(100%);
  }
  .rw-spb--anim-slide.rw-spb--visible {
    transform: translateY(0);
  }

  /* ── Animations: fade ──────────────────────── */
  .rw-spb--anim-fade {
    transform: none;
  }

  /* ── Animations: bounce ────────────────────── */
  .rw-spb--anim-bounce.rw-spb--visible {
    animation: rw-spb-bounce 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  @keyframes rw-spb-bounce {
    0% { transform: scale(0.9); opacity: 0; }
    50% { transform: scale(1.03); }
    100% { transform: scale(1); opacity: 1; }
  }

  /* ── Notification Popup (toast-style) ──────── */
  .rw-spb-notification {
    background: var(--rw-bg, #ffffff);
    border: 1px solid var(--rw-border, #e5e7eb);
    border-radius: var(--rw-radius, 12px);
    box-shadow: var(--rw-shadow, 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06));
    padding: var(--rw-padding, 14px 16px);
    width: 340px;
    max-width: calc(100vw - 32px);
    display: flex;
    gap: 12px;
    align-items: flex-start;
    cursor: pointer;
  }

  .rw-spb-notification__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--rw-accent, #4f46e5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--rw-body-size, 14px);
    font-weight: 600;
    flex-shrink: 0;
  }

  .rw-spb-notification__body {
    flex: 1;
    min-width: 0;
  }

  .rw-spb-notification__header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .rw-spb-notification__name {
    font-size: var(--rw-body-size-sm, 13px);
    font-weight: 600;
    color: var(--rw-text, #1a1a2e);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rw-spb-notification__lo {
    font-size: var(--rw-caption-size, 11px);
    color: var(--rw-text-secondary, #6b7280);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rw-spb-notification__stars {
    display: flex;
    gap: 1px;
    margin-bottom: 4px;
  }

  .rw-spb-notification__stars svg {
    width: 14px;
    height: 14px;
  }

  .rw-spb-notification__snippet {
    font-size: var(--rw-meta-size, 12px);
    color: var(--rw-text-secondary, #6b7280);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Notification transition for rotating reviews */
  .rw-spb-notification--exit {
    animation: rw-spb-notif-exit 0.25s ease-in forwards;
  }
  .rw-spb-notification--enter {
    animation: rw-spb-notif-enter 0.25s ease-out forwards;
  }

  @keyframes rw-spb-notif-exit {
    to { opacity: 0; transform: translateY(-8px); }
  }
  @keyframes rw-spb-notif-enter {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Counter Bar ───────────────────────────── */
  .rw-spb-counter {
    background: var(--rw-bg, #ffffff);
    border-top: 1px solid var(--rw-border, #e5e7eb);
    border-bottom: 1px solid var(--rw-border, #e5e7eb);
    box-shadow: var(--rw-shadow, 0 2px 12px rgba(0, 0, 0, 0.08));
    padding: var(--rw-padding, 10px 24px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    font-size: var(--rw-body-size, 14px);
    min-height: 48px;
  }

  .rw-spb-counter__rating {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: var(--rw-text, #1a1a2e);
  }

  .rw-spb-counter__rating svg {
    width: 18px;
    height: 18px;
    color: var(--rw-star-filled, #f59e0b);
    flex-shrink: 0;
  }

  .rw-spb-counter__text {
    color: var(--rw-text-secondary, #6b7280);
    font-size: var(--rw-body-size-sm, 13px);
  }

  .rw-spb-counter__cta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 16px;
    border: none;
    border-radius: 6px;
    background: var(--rw-accent, #4f46e5);
    color: #fff;
    font-size: var(--rw-body-size-sm, 13px);
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s ease;
    white-space: nowrap;
  }

  .rw-spb-counter__cta:hover {
    filter: brightness(1.1);
  }

  /* ── Floating Badge ────────────────────────── */
  .rw-spb-badge {
    background: var(--rw-bg, #ffffff);
    border: 1px solid var(--rw-border, #e5e7eb);
    border-radius: var(--rw-radius, 12px);
    box-shadow: var(--rw-shadow, 0 4px 16px rgba(0, 0, 0, 0.1));
    padding: var(--rw-padding, 10px 14px);
    width: 220px;
    max-width: calc(100vw - 32px);
    cursor: pointer;
    transition: width 0.25s ease, box-shadow 0.2s ease;
    overflow: hidden;
  }

  .rw-spb-badge__collapsed {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rw-spb-badge__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--rw-accent, #4f46e5);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--rw-meta-size, 12px);
    font-weight: 600;
    flex-shrink: 0;
  }

  .rw-spb-badge__info {
    flex: 1;
    min-width: 0;
  }

  .rw-spb-badge__name {
    font-size: var(--rw-meta-size, 12px);
    font-weight: 600;
    color: var(--rw-text, #1a1a2e);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .rw-spb-badge__rating {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .rw-spb-badge__rating svg {
    width: 12px;
    height: 12px;
  }

  .rw-spb-badge__expanded {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: max-height 0.25s ease, opacity 0.2s ease, margin 0.25s ease;
    margin-top: 0;
  }

  .rw-spb-badge--hover .rw-spb-badge__expanded {
    max-height: 120px;
    opacity: 1;
    margin-top: 8px;
  }

  .rw-spb-badge--hover {
    width: 280px;
    box-shadow: var(--rw-shadow, 0 8px 24px rgba(0, 0, 0, 0.14));
  }

  .rw-spb-badge__snippet {
    font-size: var(--rw-meta-size, 12px);
    color: var(--rw-text-secondary, #6b7280);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── Close Button (shared) ─────────────────── */
  .rw-spb-close {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--rw-text-secondary, #9ca3af);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease;
    padding: 0;
  }

  .rw-spb-close:hover {
    background: rgba(0, 0, 0, 0.06);
    color: var(--rw-text, #1a1a2e);
  }

  .rw-spb-close svg {
    width: 14px;
    height: 14px;
  }

  /* Counter bar close is positioned differently */
  .rw-spb-counter .rw-spb-close {
    position: static;
    flex-shrink: 0;
  }

  /* ── Mobile Responsive ─────────────────────── */
  @media (max-width: 480px) {
    .rw-spb-notification {
      width: calc(100vw - 16px);
      border-radius: 8px;
    }

    /* On mobile, notification becomes full-width bottom toast */
    .rw-spb--top-left .rw-spb-notification,
    .rw-spb--top-right .rw-spb-notification,
    .rw-spb--bottom-left .rw-spb-notification,
    .rw-spb--bottom-right .rw-spb-notification {
      width: calc(100vw - 16px);
    }

    :host .rw-spb--top-left,
    :host .rw-spb--top-right {
      left: 8px;
      right: 8px;
      top: 8px;
    }

    :host .rw-spb--bottom-left,
    :host .rw-spb--bottom-right {
      left: 8px;
      right: 8px;
      bottom: 8px;
    }

    .rw-spb-badge {
      width: 200px;
    }

    .rw-spb-badge--hover {
      width: 260px;
    }

    .rw-spb-counter {
      padding: 8px 12px;
      gap: 8px;
      flex-wrap: wrap;
      font-size: var(--rw-body-size-sm, 13px);
    }
  }

  /* ── Reduced Motion ────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .rw-spb,
    .rw-spb-notification,
    .rw-spb-badge,
    .rw-spb-badge__expanded {
      transition: none;
    }
    .rw-spb--anim-bounce.rw-spb--visible {
      animation: none;
    }
    .rw-spb-notification--exit,
    .rw-spb-notification--enter {
      animation: none;
    }
  }
`;
