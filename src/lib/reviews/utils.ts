/**
 * Utility functions for review response management
 */

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
