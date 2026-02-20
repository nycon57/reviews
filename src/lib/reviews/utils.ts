/**
 * Utility functions for review response management
 */

/**
 * Sanitize external text to prevent prompt injection.
 * Strips null bytes and control characters, truncates to a safe length.
 */
export function sanitizeExternalText(text: string, maxLength = 2000): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, maxLength);
}

/**
 * Replace template variables with actual values
 * Variables are in the format {{variable_name}}
 */
export function applyTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
