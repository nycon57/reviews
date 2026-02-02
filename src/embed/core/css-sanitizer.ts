/**
 * Sanitizes custom CSS to prevent security issues inside Shadow DOM.
 */

const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /@import\b[^;]*/gi, reason: "External @import rules are not allowed" },
  { pattern: /url\s*\(\s*(['"]?)data:[^)]*\)/gi, reason: "data: URLs are not allowed" },
  { pattern: /url\s*\(\s*(['"]?)javascript:[^)]*\)/gi, reason: "javascript: URLs are not allowed" },
  { pattern: /expression\s*\([^)]*\)/gi, reason: "CSS expressions are not allowed" },
  { pattern: /behavior\s*:[^;]*/gi, reason: "behavior property is not allowed" },
];

export interface CSSValidationResult {
  sanitized: string;
  warnings: string[];
}

export function sanitizeCustomCSS(css: string): CSSValidationResult {
  if (!css || typeof css !== "string") {
    return { sanitized: "", warnings: [] };
  }
  if (css.length > 5000) {
    return { sanitized: "", warnings: ["Custom CSS exceeds 5000 character limit"] };
  }
  const warnings: string[] = [];
  let sanitized = css;
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      warnings.push(reason);
      sanitized = sanitized.replace(pattern, "/* blocked */");
    }
    pattern.lastIndex = 0;
  }
  return { sanitized, warnings };
}

export function validateCustomCSS(css: string): string[] {
  if (!css) return [];
  const warnings: string[] = [];
  if (css.length > 5000) warnings.push("Exceeds 5000 character limit");
  if (/@import\b/gi.test(css)) warnings.push("@import rules are not allowed");
  if (/url\s*\(\s*(['"]?)data:/gi.test(css)) warnings.push("data: URLs are not allowed in CSS");
  if (/expression\s*\(/gi.test(css)) warnings.push("CSS expressions are not allowed");
  if (/behavior\s*:/gi.test(css)) warnings.push("behavior property is not allowed");
  if (/url\s*\(\s*(['"]?)javascript:/gi.test(css)) warnings.push("javascript: URLs are not allowed");
  if (/position\s*:\s*fixed/i.test(css)) warnings.push("position:fixed may cause the widget to overlay the host page");
  if (/z-index\s*:\s*(\d{5,})/i.test(css)) warnings.push("Very high z-index values may interfere with the host page");
  if (/(:host|html|body)\s*\{[^}]*pointer-events\s*:\s*none/i.test(css)) warnings.push("pointer-events:none on :host may make the widget non-interactive");
  return warnings;
}
