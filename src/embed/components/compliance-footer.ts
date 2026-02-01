/**
 * Shared Compliance Footer component for embed widgets.
 * Renders Equal Housing Lender logo/text, disclaimer text, and NMLS Consumer Access link.
 *
 * - Equal Housing Lender SVG is inlined (no external request)
 * - Disclaimer text has a configurable default
 * - Font size enforced at minimum 10px via --rw-disclaimer-size CSS variable
 */

import { el, text } from "../core/dom-helpers";
import { createEqualHousingLenderSVG } from "../assets/equal-housing-lender";

const DEFAULT_DISCLAIMER =
  "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice.";

export interface ComplianceFooterOptions {
  /** CSS class prefix for the disclaimer container (e.g. "rw-lo-disclaimer" or "rw-co-disclaimer") */
  classPrefix: string;
  /** Custom disclaimer text; falls back to default mortgage disclaimer */
  disclaimerText?: string;
}

/**
 * Build the compliance footer element with EHL logo, disclaimer text, and NMLS link.
 */
export function buildComplianceFooter(
  options: ComplianceFooterOptions,
): HTMLElement {
  const { classPrefix, disclaimerText } = options;

  const container = el("div", classPrefix);

  // Equal Housing Lender line
  const ehl = el("div", `${classPrefix}__ehl`);
  ehl.appendChild(createEqualHousingLenderSVG(18));
  ehl.appendChild(document.createTextNode("Equal Housing Lender"));
  container.appendChild(ehl);

  // Disclaimer text
  const disclaimerContent = disclaimerText || DEFAULT_DISCLAIMER;
  container.appendChild(text("div", disclaimerContent, `${classPrefix}__text`));

  // NMLS Consumer Access link
  const nmlsLink = document.createElement("a");
  nmlsLink.className = `${classPrefix}__nmls-link`;
  nmlsLink.href = "https://www.nmlsconsumeraccess.org";
  nmlsLink.target = "_blank";
  nmlsLink.rel = "noopener noreferrer";
  nmlsLink.textContent = "NMLS Consumer Access";
  container.appendChild(nmlsLink);

  return container;
}
