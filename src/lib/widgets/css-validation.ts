/**
 * CSS validation for the Widget Builder UI.
 * Returns user-facing warnings for potentially harmful CSS rules.
 */

const BLOCKED_AT_RULES = /@import\b/gi;
const BLOCKED_DATA_URL = /url\s*\(\s*(['"]?)data:/gi;
const BLOCKED_EXPRESSION = /expression\s*\(/gi;
const BLOCKED_BEHAVIOR = /behavior\s*:/gi;
const BLOCKED_JAVASCRIPT_URL = /url\s*\(\s*(['"]?)javascript:/gi;

export function validateCustomCSS(css: string): string[] {
  if (!css) return [];

  const warnings: string[] = [];

  if (css.length > 5000) {
    warnings.push("Exceeds 5,000 character limit");
  }

  BLOCKED_AT_RULES.lastIndex = 0;
  if (BLOCKED_AT_RULES.test(css)) {
    warnings.push("@import rules are blocked — external stylesheets cannot be loaded");
  }
  BLOCKED_AT_RULES.lastIndex = 0;

  BLOCKED_DATA_URL.lastIndex = 0;
  if (BLOCKED_DATA_URL.test(css)) {
    warnings.push("data: URLs are blocked in CSS values");
  }
  BLOCKED_DATA_URL.lastIndex = 0;

  BLOCKED_EXPRESSION.lastIndex = 0;
  if (BLOCKED_EXPRESSION.test(css)) {
    warnings.push("CSS expressions are blocked");
  }
  BLOCKED_EXPRESSION.lastIndex = 0;

  BLOCKED_BEHAVIOR.lastIndex = 0;
  if (BLOCKED_BEHAVIOR.test(css)) {
    warnings.push("behavior property is blocked");
  }
  BLOCKED_BEHAVIOR.lastIndex = 0;

  BLOCKED_JAVASCRIPT_URL.lastIndex = 0;
  if (BLOCKED_JAVASCRIPT_URL.test(css)) {
    warnings.push("javascript: URLs are blocked");
  }
  BLOCKED_JAVASCRIPT_URL.lastIndex = 0;

  if (/position\s*:\s*fixed/i.test(css)) {
    warnings.push("position:fixed may cause the widget to overlay the host page");
  }

  if (/z-index\s*:\s*(\d{5,})/i.test(css)) {
    warnings.push("Very high z-index values may interfere with the host page layout");
  }

  if (/(:host|html|body)\s*\{[^}]*pointer-events\s*:\s*none/i.test(css)) {
    warnings.push("pointer-events:none on :host will make the entire widget non-interactive");
  }

  return warnings;
}
