/**
 * Safe JSON-LD structured data component
 * Serializes data to JSON and escapes HTML entities to prevent XSS
 *
 * Security: Uses Unicode escape sequences for <, >, and & characters
 * to prevent script injection attacks. This is the standard approach
 * for safely embedding JSON-LD in HTML pages.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Safely serialize JSON-LD data for script injection
 * Escapes dangerous characters using Unicode escape sequences:
 * - < becomes \u003c (prevents </script> injection)
 * - > becomes \u003e (prevents --> and similar patterns)
 * - & becomes \u0026 (prevents HTML entity attacks)
 */
function safeJsonStringify(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function JsonLd({ data }: JsonLdProps) {
  // Content is safely escaped via safeJsonStringify - XSS-safe
  const safeJson = safeJsonStringify(data);

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson }} />
  );
}
