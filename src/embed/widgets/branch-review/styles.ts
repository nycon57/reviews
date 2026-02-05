/**
 * Branch Review Widget styles — injected into Shadow DOM alongside BASE_STYLES.
 * Only branch-specific styles; shared elements reuse rw-co- classes from company-review.
 */

export const BRANCH_REVIEW_STYLES = /* css */ `
.rw-br-header{display:flex;align-items:flex-start;gap:16px;padding:20px;margin-bottom:16px;background:var(--rw-bg,#fff);border:1px solid var(--rw-border,#e5e7eb);border-radius:var(--rw-radius,8px)}
.rw-br-header__logo{width:56px;height:56px;border-radius:8px;object-fit:contain;flex-shrink:0;background:#f9fafb}
.rw-br-header__logo-placeholder{width:56px;height:56px;border-radius:8px;background:var(--rw-primary,#52796f);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;flex-shrink:0}
.rw-br-header__info{flex:1;min-width:0}
.rw-br-header__name{font-size:18px;font-weight:700;color:var(--rw-text,#1a1a2e);margin:0 0 4px;line-height:1.3}
.rw-br-header__address{font-size:13px;color:#6b7280;margin-bottom:2px;line-height:1.4}
.rw-br-header__phone{font-size:13px;margin-bottom:4px}
.rw-br-header__phone a{color:var(--rw-primary,#52796f);text-decoration:none}
.rw-br-header__phone a:hover{text-decoration:underline}
.rw-br-header__nmls{font-size:12px;color:var(--rw-text,#6b7280);opacity:0.7;margin-bottom:4px}
.rw-br-header__nmls a{color:var(--rw-primary,#52796f);text-decoration:none}
.rw-br-header__nmls a:hover{text-decoration:underline}
.rw-br-header__rating{display:flex;align-items:center;gap:8px;margin-top:4px}
.rw-br-header__rating-value{font-size:24px;font-weight:700;color:var(--rw-text,#1a1a2e);line-height:1}
.rw-br-header__stars{display:flex;gap:2px}
.rw-br-header__rating-count{font-size:13px;color:#6b7280}
.rw-br-team{margin-bottom:16px;padding:16px;border:1px solid var(--rw-border,#e5e7eb);border-radius:var(--rw-radius,8px)}
.rw-br-team__title{font-size:14px;font-weight:600;color:var(--rw-text,#1a1a2e);margin:0 0 12px}
.rw-br-team__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.rw-br-team__card{display:flex;flex-direction:column;align-items:center;text-align:center;padding:12px 8px;background:#f9fafb;border-radius:var(--rw-radius,8px);transition:box-shadow .15s ease}
.rw-br-team__card:hover{box-shadow:0 2px 8px rgba(0,0,0,.06)}
.rw-br-team__photo{width:48px;height:48px;border-radius:50%;object-fit:cover;margin-bottom:8px;background:#e5e7eb}
.rw-br-team__photo-placeholder{width:48px;height:48px;border-radius:50%;background:var(--rw-primary,#52796f);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;margin-bottom:8px}
.rw-br-team__info{min-width:0;width:100%}
.rw-br-team__name{font-size:13px;font-weight:600;color:var(--rw-text,#1a1a2e);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.rw-br-team__role{font-size:11px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px}
.rw-br-team__rating{display:flex;align-items:center;justify-content:center;gap:4px}
.rw-br-team__rating-value{font-size:12px;font-weight:600;color:var(--rw-text,#1a1a2e)}
.rw-br-team__stars{display:flex;gap:1px}
.rw-br-team__stars .rw-star{width:10px;height:10px}
.rw-br-team__rating-count{font-size:11px;color:#9ca3af}
.rw-br-empty{padding:32px 16px;text-align:center}
.rw-br-empty__text{font-size:14px;color:#9ca3af;margin-bottom:12px}
.rw-br-empty__cta{display:inline-block;padding:8px 20px;font-size:14px;font-weight:500;color:#fff;background:var(--rw-primary,#52796f);border-radius:6px;text-decoration:none;transition:opacity .15s ease}
.rw-br-empty__cta:hover{opacity:.9}
@media(max-width:768px){.rw-br-team__grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:480px){.rw-br-header{flex-direction:column;text-align:center}.rw-br-header__rating{justify-content:center}.rw-br-team__grid{grid-template-columns:1fr}}
`;
