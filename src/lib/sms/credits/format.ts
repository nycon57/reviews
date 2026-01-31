/**
 * Formats a value in cents as a dollar string (e.g. 350 → "$3.50").
 */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
