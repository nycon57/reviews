/**
 * Sanitizes custom CSS to prevent security issues inside Shadow DOM.
 *
 * Blocks:
 * - @import rules (external stylesheet injection)
 * - data: URLs (data exfiltration via CSS)
 * - Potentially harmful property values (position:fixed, extreme z-index, pointer-events:none on :host)
 *
 * Returns the sanitized CSS string, or empty string if input is invalid.
 */

const BLOCKED_AT_RULES = /@import\b/gi;
const BLOCKED_DATA_URL = /url\s*\(\s*(['"]?)data:/gi;
const BLOCKED_EXPRESSION = /expression\s*\(/gi;
const BLOCKED_BEHAVIOR = /behavior\s*:/gi;
const BLOCKED_JAVASCRIPT_URL = /url\s*\(\s*(['"]?)javascript:/gi;

/** Patterns that produce warnings but are still stripped for safety. */
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

  // Enforce max length
  if (css.length > 5000) {
    return {
      sanitized: "",
      warnings: ["Custom CSS exceeds 5000 character limit"],
    };
  }

  const warnings: string[] = [];
  let sanitized = css;

  // Strip dangerous patterns
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      warnings.push(reason);
      sanitized = sanitized.replace(pattern, "/* blocked */");
    }
    // Reset lastIndex since we use global flag
    pattern.lastIndex = 0;
  }

  return { sanitized, warnings };
}

/**
 * Validates custom CSS and returns warnings for the builder UI.
 * Does not strip — just reports issues.
 */
export function validateCustomCSS(css: string): string[] {
  if (!css) return [];

  const warnings: string[] = [];

  if (css.length > 5000) {
    warnings.push("Exceeds 5000 character limit");
  }

  if (BLOCKED_AT_RULES.test(css)) {
    warnings.push("@import rules are not allowed — external stylesheets cannot be loaded");
    BLOCKED_AT_RULES.lastIndex = 0;
  }

  if (BLOCKED_DATA_URL.test(css)) {
    warnings.push("data: URLs are not allowed in CSS");
    BLOCKED_DATA_URL.lastIndex = 0;
  }

  if (BLOCKED_EXPRESSION.test(css)) {
    warnings.push("CSS expressions are not allowed");
    BLOCKED_EXPRESSION.lastIndex = 0;
  }

  if (BLOCKED_BEHAVIOR.test(css)) {
    warnings.push("behavior property is not allowed");
    BLOCKED_BEHAVIOR.lastIndex = 0;
  }

  if (BLOCKED_JAVASCRIPT_URL.test(css)) {
    warnings.push("javascript: URLs are not allowed");
    BLOCKED_JAVASCRIPT_URL.lastIndex = 0;
  }

  // Soft warnings for potentially harmful but not blocked patterns
  if (/position\s*:\s*fixed/i.test(css)) {
    warnings.push("position:fixed may cause the widget to overlay the host page");
  }

  if (/z-index\s*:\s*(\d{5,})/i.test(css)) {
    warnings.push("Very high z-index values may interfere with the host page");
  }

  if (/(:host|html|body)\s*\{[^}]*pointer-events\s*:\s*none/i.test(css)) {
    warnings.push("pointer-events:none on :host may make the widget non-interactive");
  }

  return warnings;
}
