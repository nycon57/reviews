/**
 * Sanitizes custom CSS to prevent security issues inside Shadow DOM.
 *
 * Blocks:
 * - @import rules (external stylesheet injection)
 * - data: URLs (data exfiltration via CSS)
 * - javascript: URLs (script execution)
 * - CSS expressions (IE script execution)
 * - behavior property (IE HTC injection)
 *
 * Returns the sanitized CSS string, or empty string if input is invalid.
 */

/** Patterns that produce warnings and are stripped for safety. */
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

/**
 * Normalizes CSS for security scanning by resolving obfuscation techniques.
 * Strips CSS comments and decodes CSS unicode escape sequences so that
 * patterns like `@im\u002Aport` or `@im` followed by a comment cannot
 * bypass the blocklist.
 */
function normalizeCSSForScanning(css: string): string {
  // Remove CSS comments
  let normalized = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Decode CSS unicode escapes (\XX or \XXXXXX followed by optional space)
  normalized = normalized.replace(
    /\\([0-9a-fA-F]{1,6})\s?/g,
    (_match, hex: string) => String.fromCharCode(parseInt(hex, 16)),
  );

  return normalized;
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

  // Normalize to detect obfuscated patterns (unicode escapes, comments)
  const normalized = normalizeCSSForScanning(css);

  // Check normalized version for dangerous patterns — reject entirely if found
  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(normalized)) {
      warnings.push(reason);
    }
    pattern.lastIndex = 0;
  }

  // If any dangerous pattern was detected (even via obfuscation), strip from original too
  if (warnings.length > 0) {
    let sanitized = css;
    // Strip comments that could hide malicious content
    sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, "");
    // Strip dangerous patterns from the de-commented version
    for (const { pattern } of DANGEROUS_PATTERNS) {
      pattern.lastIndex = 0;
      sanitized = sanitized.replace(pattern, "/* blocked */");
      pattern.lastIndex = 0;
    }
    return { sanitized, warnings };
  }

  return { sanitized: css, warnings: [] };
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

  // Normalize before scanning to catch obfuscated patterns
  const normalized = normalizeCSSForScanning(css);

  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(normalized)) {
      warnings.push(reason);
    }
    pattern.lastIndex = 0;
  }

  // Soft warnings for potentially harmful but not blocked patterns
  if (/position\s*:\s*fixed/i.test(normalized)) {
    warnings.push("position:fixed may cause the widget to overlay the host page");
  }

  if (/z-index\s*:\s*(\d{5,})/i.test(normalized)) {
    warnings.push("Very high z-index values may interfere with the host page");
  }

  if (/(:host|html|body)\s*\{[^}]*pointer-events\s*:\s*none/i.test(normalized)) {
    warnings.push("pointer-events:none on :host may make the widget non-interactive");
  }

  return warnings;
}
