/**
 * Video review widget styles — injected into Shadow DOM alongside BASE_STYLES.
 * Pre-minified to stay within the 15KB gzipped embed budget.
 */

import { disclaimerStyles } from "../../styles/compliance";

export const VIDEO_TESTIMONIAL_STYLES = /* css */ `
.rw-vt{font-family:inherit}
.rw-vt__list{display:flex;flex-direction:column;gap:16px}
.rw-vt__grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.rw-vt__item{border:1px solid var(--rw-border,#e5e7eb);border-radius:var(--rw-radius,8px);overflow:hidden;background:var(--rw-surface,#fff);transition:box-shadow .15s ease}
.rw-vt__item:hover{box-shadow:0 4px 12px rgba(0,0,0,.08)}
.rw-vt__player-wrap{position:relative;width:100%;background:#000;aspect-ratio:16/9;overflow:hidden;cursor:pointer}
.rw-vt__poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .3s ease}
.rw-vt__poster--hidden{opacity:0;pointer-events:none}
.rw-vt__poster-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#1a1a2e;color:var(--rw-text-subtle,#9ca3af);font-size:var(--rw-body-size,14px)}
.rw-vt__play-btn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.35);transition:background .2s ease;z-index:2}
.rw-vt__play-btn:hover{background:rgba(0,0,0,.5)}
.rw-vt__play-btn--hidden{display:none}
.rw-vt__play-icon{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.2);transition:transform .15s ease}
.rw-vt__play-btn:hover .rw-vt__play-icon{transform:scale(1.08)}
.rw-vt__play-icon svg{width:24px;height:24px;fill:var(--rw-primary,#52796f);margin-left:3px}
.rw-vt__video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:1}
.rw-vt__controls{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;gap:8px;padding:8px 12px;background:linear-gradient(transparent,rgba(0,0,0,.7));z-index:3;opacity:0;transition:opacity .2s ease}
.rw-vt__player-wrap:hover .rw-vt__controls,.rw-vt__controls--visible{opacity:1}
.rw-vt__ctrl-btn{background:none;border:none;cursor:pointer;padding:4px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
.rw-vt__ctrl-btn svg{width:18px;height:18px;fill:currentColor}
.rw-vt__ctrl-btn:focus-visible{outline:2px solid var(--rw-primary,#52796f);outline-offset:2px;border-radius:4px}
.rw-vt__progress{flex:1;height:4px;background:rgba(255,255,255,.3);border-radius:2px;cursor:pointer;position:relative;overflow:hidden}
.rw-vt__progress-bar{height:100%;background:var(--rw-primary,#52796f);border-radius:2px;transition:width .1s linear}
.rw-vt__time{font-size:var(--rw-caption-size,11px);color:rgba(255,255,255,.85);white-space:nowrap;min-width:70px;text-align:center;font-variant-numeric:tabular-nums}
.rw-vt__volume-wrap{display:flex;align-items:center;gap:4px}
.rw-vt__volume-slider{width:60px;height:4px;background:rgba(255,255,255,.3);border-radius:2px;cursor:pointer;position:relative;overflow:hidden;-webkit-appearance:none;appearance:none}
.rw-vt__volume-slider::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;cursor:pointer}
.rw-vt__volume-slider::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#fff;cursor:pointer;border:none}
.rw-vt__volume-slider::-webkit-slider-runnable-track{height:4px;background:rgba(255,255,255,.3);border-radius:2px}
.rw-vt__volume-slider::-moz-range-track{height:4px;background:rgba(255,255,255,.3);border-radius:2px}
.rw-vt__info{padding:12px 16px}
.rw-vt__reviewer{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.rw-vt__avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;background:var(--rw-surface-strong,#e5e7eb)}
.rw-vt__avatar-placeholder{width:40px;height:40px;border-radius:50%;background:var(--rw-primary,#52796f);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:calc(var(--rw-body-size,14px) + 2px);flex-shrink:0}
.rw-vt__reviewer-info{flex:1;min-width:0}
.rw-vt__reviewer-name{font-size:var(--rw-body-size,14px);font-weight:600;color:var(--rw-text,#1a1a2e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rw-vt__reviewer-title{font-size:var(--rw-meta-size,12px);color:var(--rw-text-muted,#6b7280)}
.rw-vt__stars{display:flex;gap:2px;margin-bottom:8px}
.rw-vt__lo{display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid var(--rw-border,#e5e7eb);background:var(--rw-surface-muted,#f9fafb)}
.rw-vt__lo-photo{width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;background:var(--rw-surface-strong,#e5e7eb)}
.rw-vt__lo-photo-placeholder{width:32px;height:32px;border-radius:50%;background:var(--rw-primary,#52796f);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:var(--rw-body-size-sm,13px);flex-shrink:0}
.rw-vt__lo-info{flex:1;min-width:0}
.rw-vt__lo-name{font-size:var(--rw-body-size-sm,13px);font-weight:600;color:var(--rw-text,#1a1a2e)}
.rw-vt__lo-nmls{font-size:var(--rw-caption-size,11px);color:var(--rw-text-muted,#6b7280)}
.rw-vt__lo-nmls a{color:var(--rw-primary,#52796f);text-decoration:none}
.rw-vt__lo-nmls a:hover{text-decoration:underline}
.rw-vt__lo-rating{display:flex;align-items:center;gap:4px;font-size:var(--rw-meta-size,12px);font-weight:600;color:var(--rw-text,#1a1a2e)}
.rw-vt__lo-rating .rw-star{width:12px;height:12px}
.rw-vt__transcript{max-height:200px;overflow-y:auto;padding:12px 16px;border-top:1px solid var(--rw-border,#e5e7eb);background:var(--rw-surface-muted,#f9fafb)}
.rw-vt__transcript-title{font-size:var(--rw-meta-size,12px);font-weight:600;color:var(--rw-text,#1a1a2e);margin-bottom:8px}
.rw-vt__transcript-seg{font-size:var(--rw-body-size-sm,13px);line-height:1.6;color:var(--rw-text-muted,#6b7280);padding:2px 4px;border-radius:3px;cursor:pointer;transition:background .15s ease,color .15s ease}
.rw-vt__transcript-seg:hover{background:rgba(82,121,111,.08)}
.rw-vt__transcript-seg--active{background:rgba(82,121,111,.12);color:var(--rw-text,#1a1a2e);font-weight:500}
.rw-vt__item--side .rw-vt__content{display:flex}
.rw-vt__item--side .rw-vt__player-wrap{width:60%;flex-shrink:0}
.rw-vt__item--side .rw-vt__side-panel{width:40%;display:flex;flex-direction:column}
.rw-vt__item--side .rw-vt__transcript{flex:1;border-top:none;border-left:1px solid var(--rw-border,#e5e7eb)}
.rw-vt__error{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a1a2e;color:#fff;gap:12px;z-index:4}
.rw-vt__error-text{font-size:var(--rw-body-size-sm,13px);color:var(--rw-text-subtle,#9ca3af)}
.rw-vt__retry-btn{padding:8px 20px;font-size:var(--rw-body-size-sm,13px);font-weight:500;color:#fff;background:var(--rw-primary,#52796f);border:none;border-radius:6px;cursor:pointer;transition:opacity .15s ease;font-family:inherit}
.rw-vt__retry-btn:hover{opacity:.9}
.rw-vt__retry-btn:focus-visible{outline:2px solid var(--rw-primary,#52796f);outline-offset:2px}
${disclaimerStyles({ prefix: "rw-vt__disclaimer" })}
.rw-branding{margin-top:12px;text-align:center;font-size:var(--rw-caption-size,11px);color:var(--rw-text-subtle,#9ca3af)}
.rw-branding a{color:var(--rw-text-muted,#6b7280);text-decoration:none}
.rw-branding a:hover{text-decoration:underline}
@media(max-width:640px){.rw-vt__grid{grid-template-columns:1fr}.rw-vt__item--side .rw-vt__content{flex-direction:column}.rw-vt__item--side .rw-vt__player-wrap{width:100%}.rw-vt__item--side .rw-vt__side-panel{width:100%}.rw-vt__item--side .rw-vt__transcript{border-left:none;border-top:1px solid var(--rw-border,#e5e7eb)}.rw-vt__play-icon{width:48px;height:48px}.rw-vt__play-icon svg{width:20px;height:20px}.rw-vt__ctrl-btn{padding:6px}.rw-vt__volume-wrap{display:none}}
`;
