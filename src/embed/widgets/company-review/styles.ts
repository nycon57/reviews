/**
 * Company Review Widget styles — injected into Shadow DOM alongside BASE_STYLES.
 * Pre-minified to stay within the 15KB gzipped embed budget.
 */

import { disclaimerStyles } from "../../styles/compliance";

export const COMPANY_REVIEW_STYLES = /* css */ `
.rw-co-header{display:flex;align-items:center;gap:16px;padding:var(--rw-padding,16px);margin-bottom:16px;background:var(--rw-bg,#fff);border:1px solid var(--rw-border,#e5e7eb);border-radius:var(--rw-radius,8px)}
.rw-co-header__logo{width:56px;height:56px;border-radius:8px;object-fit:contain;flex-shrink:0;background:var(--rw-surface-muted,#f9fafb)}
.rw-co-header__logo-placeholder{width:56px;height:56px;border-radius:8px;background:var(--rw-primary,#52796f);color:#fff;display:flex;align-items:center;justify-content:center;font-size:calc(var(--rw-heading-size,18px) + 2px);font-weight:600;flex-shrink:0}
.rw-co-header__info{flex:1;min-width:0}
.rw-co-header__name{font-size:var(--rw-heading-size,18px);font-weight:700;color:var(--rw-text,#1a1a2e);margin-bottom:4px;line-height:1.3}
.rw-co-header__nmls{font-size:var(--rw-meta-size,12px);color:var(--rw-text-muted,#6b7280);opacity:0.7;margin-bottom:4px}
.rw-co-header__nmls a{color:var(--rw-primary,#52796f);text-decoration:none}
.rw-co-header__nmls a:hover{text-decoration:underline}
.rw-co-header__rating{display:flex;align-items:center;gap:8px}
.rw-co-header__rating-value{font-size:var(--rw-display-size,24px);font-weight:700;color:var(--rw-text,#1a1a2e);line-height:1}
.rw-co-header__stars{display:flex;gap:2px}
.rw-co-header__rating-count{font-size:var(--rw-body-size-sm,13px);color:var(--rw-text-muted,#6b7280)}
.rw-co-distribution{margin-bottom:16px;padding:var(--rw-padding,16px);background:var(--rw-surface-muted,#f9fafb);border-radius:var(--rw-radius,8px);border:1px solid var(--rw-border,#e5e7eb)}
.rw-co-distribution__row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.rw-co-distribution__row:last-child{margin-bottom:0}
.rw-co-distribution__label{display:flex;align-items:center;gap:2px;font-size:var(--rw-body-size-sm,13px);font-weight:500;color:var(--rw-text,#1a1a2e);min-width:28px;justify-content:flex-end}
.rw-co-distribution__label .rw-star{width:12px;height:12px}
.rw-co-distribution__bar-outer{flex:1;height:8px;background:var(--rw-surface-strong,#e5e7eb);border-radius:4px;overflow:hidden}
.rw-co-distribution__bar-inner{height:100%;background:var(--rw-primary,#52796f);border-radius:4px;transition:width .3s ease;min-width:0}
.rw-co-distribution__count{font-size:var(--rw-meta-size,12px);color:var(--rw-text-muted,#6b7280);min-width:24px;text-align:right}
.rw-co-sources{margin-bottom:16px;padding:var(--rw-padding,16px);border:1px solid var(--rw-border,#e5e7eb);border-radius:var(--rw-radius,8px)}
.rw-co-sources__title{font-size:var(--rw-body-size,14px);font-weight:600;color:var(--rw-text,#1a1a2e);margin-bottom:12px}
.rw-co-sources__list{display:flex;flex-direction:column;gap:10px}
.rw-co-sources__item{display:flex;align-items:center;gap:10px}
.rw-co-sources__icon{width:32px;height:32px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:var(--rw-body-size,14px);font-weight:700;flex-shrink:0;color:#fff}
.rw-co-sources__icon--google{background:#4285f4}
.rw-co-sources__icon--zillow{background:#006aff}
.rw-co-sources__icon--internal{background:var(--rw-primary,#52796f)}
.rw-co-sources__info{flex:1;min-width:0}
.rw-co-sources__name{font-size:var(--rw-body-size-sm,13px);font-weight:600;color:var(--rw-text,#1a1a2e);display:block}
.rw-co-sources__meta{font-size:var(--rw-caption-size,11px);color:var(--rw-text-subtle,#9ca3af)}
.rw-co-sources__stars{display:flex;gap:1px;flex-shrink:0}
.rw-co-sources__stars .rw-star{width:12px;height:12px}
.rw-co-filters-wrapper{margin-bottom:12px}
.rw-co-filters{display:flex;gap:6px;flex-wrap:wrap}
.rw-co-filters__btn{padding:6px 14px;font-size:var(--rw-body-size-sm,13px);font-weight:500;color:var(--rw-text-muted,#6b7280);background:var(--rw-surface-muted,#f3f4f6);border:1px solid var(--rw-border,#e5e7eb);border-radius:20px;cursor:pointer;transition:all .15s ease;white-space:nowrap;font-family:inherit}
.rw-co-filters__btn:hover{color:var(--rw-primary,#52796f);border-color:var(--rw-primary,#52796f)}
.rw-co-filters__btn--active{background:var(--rw-primary,#52796f);color:#fff;border-color:var(--rw-primary,#52796f)}
.rw-co-filters__btn--active:hover{opacity:.9;color:#fff}
.rw-co-filters__btn:focus-visible{outline:2px solid var(--rw-primary,#52796f);outline-offset:2px}
.rw-co-reviews{display:grid;gap:12px;grid-template-columns:1fr}
.rw-co-review{padding:var(--rw-padding,16px);border-radius:var(--rw-radius,8px);transition:box-shadow .15s ease}
.rw-co-review--bordered{border:1px solid var(--rw-border,#e5e7eb);background:var(--rw-surface,#fff)}
.rw-co-review--shadow{background:var(--rw-surface,#fff);box-shadow:var(--rw-shadow,0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.06))}
.rw-co-review--flat{background:var(--rw-surface-muted,#f9fafb)}
.rw-co-review--glass{background:var(--rw-glass-bg,rgba(255,255,255,0.6));-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border:1px solid var(--rw-glass-border,rgba(255,255,255,0.3));box-shadow:0 4px 30px rgba(0,0,0,0.05)}
.rw-co-review--shadow:hover{box-shadow:var(--rw-shadow-hover,0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1))}
.rw-co-review--bordered:hover{box-shadow:0 2px 8px rgba(0,0,0,.06)}
.rw-co-review__header{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.rw-co-review__avatar{width:36px;height:36px;border-radius:50%;background:var(--rw-surface-strong,#e5e7eb);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:var(--rw-body-size,14px);color:var(--rw-text-muted,#6b7280);flex-shrink:0}
.rw-co-review__meta{flex:1;min-width:0}
.rw-co-review__name{font-weight:600;font-size:var(--rw-body-size,14px);color:var(--rw-text,#1a1a2e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rw-co-review__date{font-size:var(--rw-meta-size,12px);color:var(--rw-text-subtle,#9ca3af)}
.rw-co-review__stars{display:flex;gap:2px;margin-bottom:8px}
.rw-co-review__text{font-size:var(--rw-body-size,14px);line-height:1.6;color:var(--rw-text,#374151)}
.rw-co-review__text--truncated{cursor:pointer}
.rw-co-review__text--truncated::after{content:" Read more";color:var(--rw-primary,#52796f);font-weight:500}
.rw-co-review__tags{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px}
.rw-co-review__source{font-size:var(--rw-caption-size,11px);color:var(--rw-text-subtle,#9ca3af);text-transform:capitalize}
.rw-co-review__loan-tag{font-size:var(--rw-caption-size,11px);padding:2px 8px;border-radius:10px;font-weight:500;white-space:nowrap}
.rw-co-review__loan-tag--purchase{background:#dbeafe;color:#1e40af}
.rw-co-review__loan-tag--refinance{background:#fef3c7;color:#92400e}
.rw-co-review__loan-tag--va{background:#d1fae5;color:#065f46}
.rw-co-review__loan-tag--fha{background:#ede9fe;color:#5b21b6}
.rw-co-review__loan-tag--jumbo{background:#fce7f3;color:#9d174d}
.rw-co-review__loan-tag--usda{background:#fef9c3;color:#854d0e}
.rw-co-review__loan-tag--conventional{background:#f0f9ff;color:#075985}
.rw-co-review__loan-tag--default{background:#f3f4f6;color:#4b5563}
.rw-co-review__fthb-badge{display:inline-flex;align-items:center;gap:4px;font-size:var(--rw-caption-size,11px);padding:2px 8px;border-radius:10px;font-weight:500;background:#ecfdf5;color:#047857;white-space:nowrap}
.rw-co-review__lo-attr{font-size:var(--rw-caption-size,11px);padding:2px 8px;border-radius:10px;font-weight:500;background:#eff6ff;color:#1d4ed8;white-space:nowrap}
.rw-co-load-more{display:block;width:100%;margin-top:16px;padding:10px 24px;font-size:var(--rw-body-size,14px);font-weight:500;color:var(--rw-primary,#52796f);background:transparent;border:1px solid var(--rw-primary,#52796f);border-radius:6px;cursor:pointer;transition:background .15s ease,color .15s ease;font-family:inherit}
.rw-co-load-more:hover{background:var(--rw-primary,#52796f);color:#fff}
.rw-co-load-more:focus-visible{outline:2px solid var(--rw-primary,#52796f);outline-offset:2px}
.rw-co-actions{display:flex;gap:12px;margin-top:16px;flex-wrap:wrap}
.rw-co-actions__write-review{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;font-size:var(--rw-body-size,14px);font-weight:500;color:var(--rw-primary,#52796f);background:transparent;border:1px solid var(--rw-primary,#52796f);border-radius:6px;text-decoration:none;cursor:pointer;transition:background .15s ease,color .15s ease}
.rw-co-actions__write-review:hover{background:var(--rw-primary,#52796f);color:#fff}
${disclaimerStyles({ prefix: "rw-co-disclaimer" })}
@media(max-width:480px){.rw-co-header{flex-direction:column;text-align:center}.rw-co-header__rating{justify-content:center}.rw-co-reviews{grid-template-columns:1fr!important}.rw-co-filters{justify-content:center}.rw-co-actions{flex-direction:column}.rw-co-actions__write-review,.rw-cta{width:100%;text-align:center;justify-content:center}.rw-co-sources__item{flex-wrap:wrap}}
`;
