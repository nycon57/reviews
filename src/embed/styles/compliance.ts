/**
 * Shared compliance disclaimer CSS generator for embed widgets.
 * Each widget uses a unique class prefix (e.g. "rw-lo-disclaimer") but
 * the structure is identical: container, EHL row, text, and NMLS link.
 *
 * Call this in each widget's styles.ts to avoid duplicating ~25 lines of CSS.
 */

export interface DisclaimerStyleOptions {
  /** CSS class prefix (e.g. "rw-lo-disclaimer", "rw-carousel__disclaimer") */
  prefix: string;
  /** Top margin — defaults to "16px" */
  marginTop?: string;
  /** Container padding — defaults to "10px 14px" */
  padding?: string;
}

export function disclaimerStyles(opts: DisclaimerStyleOptions): string {
  const { prefix, marginTop = "16px", padding = "10px 14px" } = opts;

  return `
.${prefix}{margin-top:${marginTop};padding:${padding};font-size:var(--rw-disclaimer-size,10px);line-height:1.5;color:var(--rw-text,#6b7280);opacity:0.8;background:var(--rw-bg,#f9fafb);border-radius:4px;border:1px solid var(--rw-border,#f3f4f6)}
.${prefix}__ehl{display:flex;align-items:center;gap:6px;margin-bottom:4px;font-weight:600;font-size:11px;color:var(--rw-text,#4b5563)}
.${prefix}__text{font-size:var(--rw-disclaimer-size,10px);line-height:1.5;color:var(--rw-text,#6b7280);opacity:0.8;margin-bottom:4px}
.${prefix}__nmls-link{font-size:10px;color:var(--rw-primary,#52796f);text-decoration:none}
.${prefix}__nmls-link:hover{text-decoration:underline}`;
}
