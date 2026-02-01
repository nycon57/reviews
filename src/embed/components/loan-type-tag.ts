/**
 * Shared Loan Type Tag component for embed widgets.
 * Renders color-coded badges for loan types: Purchase, Refinance, VA, FHA,
 * Jumbo, USDA, Conventional.
 *
 * Consistent styling across all widget types via shared CSS class mapping.
 */

import { text } from "../core/dom-helpers";

/** Normalize a loan type string to a safe CSS class suffix. */
function getLoanTagClass(loanType: string): string {
  const normalized = loanType.toLowerCase().replace(/\s+/g, "");
  const m: Record<string, string> = {
    purchase: "purchase",
    refinance: "refinance",
    va: "va",
    fha: "fha",
    jumbo: "jumbo",
    usda: "usda",
    conventional: "conventional",
  };
  return m[normalized] ?? "default";
}

/**
 * Build a loan type tag element.
 * @param loanType - The loan type label (e.g. "Purchase", "VA")
 * @param classPrefix - CSS class prefix (e.g. "rw-lo-review" or "rw-co-review")
 */
export function buildLoanTypeTag(
  loanType: string,
  classPrefix: string,
): HTMLElement {
  return text(
    "span",
    loanType,
    `${classPrefix}__loan-tag ${classPrefix}__loan-tag--${getLoanTagClass(loanType)}`,
  );
}
