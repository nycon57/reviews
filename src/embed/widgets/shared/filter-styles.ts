/**
 * CSS for interactive filter controls — pre-minified for embed budget.
 */

export const FILTER_STYLES = /* css */ `
.rw-filter-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 0;margin-bottom:12px;border-bottom:1px solid var(--rw-border,#e5e7eb)}
.rw-filter-stars{display:flex;gap:4px}
.rw-filter-star-btn{background:none;border:1px solid var(--rw-border,#e5e7eb);border-radius:6px;padding:4px 10px;font-size:var(--rw-body-size-sm,13px);cursor:pointer;color:var(--rw-text,#374151);transition:background .15s,border-color .15s}
.rw-filter-star-btn:hover{border-color:var(--rw-primary,#52796f)}
.rw-filter-star-btn[aria-pressed="true"]{background:var(--rw-primary,#52796f);color:#fff;border-color:var(--rw-primary,#52796f)}
.rw-filter-select{appearance:none;background:var(--rw-bg,#fff);border:1px solid var(--rw-border,#e5e7eb);border-radius:6px;padding:4px 28px 4px 10px;font-size:var(--rw-body-size-sm,13px);color:var(--rw-text,#374151);cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23666' stroke-width='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center}
.rw-filter-select:focus{outline:2px solid var(--rw-primary,#52796f);outline-offset:-1px}
.rw-filter-pills{display:flex;flex-wrap:wrap;gap:4px}
.rw-filter-pill{background:var(--rw-bg,#fff);border:1px solid var(--rw-border,#e5e7eb);border-radius:16px;padding:3px 12px;font-size:var(--rw-meta-size,12px);cursor:pointer;color:var(--rw-text,#374151);transition:background .15s,border-color .15s}
.rw-filter-pill:hover{border-color:var(--rw-primary,#52796f)}
.rw-filter-pill[aria-pressed="true"]{background:var(--rw-primary,#52796f);color:#fff;border-color:var(--rw-primary,#52796f)}
.rw-filter-search{flex:1 1 120px;min-width:120px;background:var(--rw-bg,#fff);border:1px solid var(--rw-border,#e5e7eb);border-radius:6px;padding:4px 10px;font-size:var(--rw-body-size-sm,13px);color:var(--rw-text,#374151);font-family:inherit}
.rw-filter-search::placeholder{color:#9ca3af}
.rw-filter-search:focus{outline:2px solid var(--rw-primary,#52796f);outline-offset:-1px}
.rw-filter-loading{position:relative;min-height:100px}
.rw-filter-loading::after{content:"";position:absolute;inset:0;background:rgba(255,255,255,.7)}
.rw-filter-empty{text-align:center;padding:32px 16px;color:var(--rw-text,#6b7280)}
.rw-filter-empty p{margin:0 0 12px;font-size:var(--rw-body-size,14px)}
.rw-filter-reset-btn{background:none;border:1px solid var(--rw-primary,#52796f);color:var(--rw-primary,#52796f);border-radius:6px;padding:6px 16px;font-size:var(--rw-body-size-sm,13px);cursor:pointer;transition:background .15s}
.rw-filter-reset-btn:hover{background:var(--rw-primary,#52796f);color:#fff}
`;
