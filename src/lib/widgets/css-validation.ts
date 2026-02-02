/**
 * CSS validation for the Widget Builder UI.
 * Returns user-facing warnings for potentially harmful CSS rules.
 *
 * NOTE: This module is used by the Next.js app. The embed script has its own
 * sanitizer at src/embed/core/css-sanitizer.ts — they must remain separate.
 */

/** Blocked patterns: matched against input and reported as warnings. */
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; warning: string }> = [
  { pattern: /@import\b/gi, warning: "@import rules are blocked — external stylesheets cannot be loaded" },
  { pattern: /url\s*\(\s*(['"]?)data:/gi, warning: "data: URLs are blocked in CSS values" },
  { pattern: /url\s*\(\s*(['"]?)javascript:/gi, warning: "javascript: URLs are blocked" },
  { pattern: /expression\s*\(/gi, warning: "CSS expressions are blocked" },
  { pattern: /behavior\s*:/gi, warning: "behavior property is blocked" },
];

/** Soft warnings: potentially harmful but not blocked outright. */
const SOFT_WARNINGS: Array<{ pattern: RegExp; warning: string }> = [
  { pattern: /position\s*:\s*fixed/i, warning: "position:fixed may cause the widget to overlay the host page" },
  { pattern: /z-index\s*:\s*(\d{5,})/i, warning: "Very high z-index values may interfere with the host page layout" },
  { pattern: /(:host|html|body)\s*\{[^}]*pointer-events\s*:\s*none/i, warning: "pointer-events:none on :host will make the entire widget non-interactive" },
];

export function validateCustomCSS(css: string): string[] {
  if (!css) return [];

  const warnings: string[] = [];

  if (css.length > 5000) {
    warnings.push("Exceeds 5,000 character limit");
  }

  for (const { pattern, warning } of BLOCKED_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(css)) {
      warnings.push(warning);
    }
    pattern.lastIndex = 0;
  }

  for (const { pattern, warning } of SOFT_WARNINGS) {
    if (pattern.test(css)) {
      warnings.push(warning);
    }
  }

  return warnings;
}
